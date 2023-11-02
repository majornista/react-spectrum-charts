/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import React, { FC, MutableRefObject, forwardRef, useEffect, useMemo, useRef, useState } from 'react';

import { EmptyState } from '@components/EmptyState';
import { LoadingState } from '@components/LoadingState';
import { DEFAULT_COLOR_SCHEME, DEFAULT_LINE_TYPES, MARK_ID } from '@constants';
import useChartImperativeHandle from '@hooks/useChartImperativeHandle';
import useChartWidth from '@hooks/useChartWidth';
import { useDebugSpec } from '@hooks/useDebugSpec';
import useElementSize from '@hooks/useElementSize';
import useLegend from '@hooks/useLegend';
import usePopoverAnchorStyle from '@hooks/usePopoverAnchorStyle';
import usePopovers, { PopoverDetail } from '@hooks/usePopovers';
import useSpec from '@hooks/useSpec';
import useSpecProps from '@hooks/useSpecProps';
import useTooltips from '@hooks/useTooltips';
import { getColorValue } from '@specBuilder/specUtils';
import { getChartConfig } from '@themes/spectrumTheme';
import {
	debugLog,
	getOnMarkClickCallback,
	getOnMouseInputCallback,
	sanitizeChartChildren,
	setSelectedSignals,
} from '@utils';
import { renderToStaticMarkup } from 'react-dom/server';
import { Vega } from 'react-vega';
import { v4 as uuid } from 'uuid';
import { View } from 'vega';
import { Options as TooltipOptions } from 'vega-tooltip';

import {
	ActionButton,
	Dialog,
	DialogTrigger,
	Provider,
	View as SpectrumView,
	defaultTheme,
} from '@adobe/react-spectrum';
import { Theme } from '@react-types/provider';

import './Chart.css';
import { TABLE } from './constants';
import { expressionFunctions } from './expressionFunctions';
import { extractValues, isVegaData } from './specBuilder/specUtils';
import { ChartData, ChartHandle, ChartProps, Datum, LegendDescription, MarkBounds } from './types';

interface ChartDialogProps {
	datum: Datum | null;
	itemName?: string;
	targetElement: MutableRefObject<HTMLElement | null>;
	setPopoverState: (isOpen: boolean) => void;
	popovers: PopoverDetail[];
}

interface LegendTooltipProps {
	value: { index: number };
	descriptions: LegendDescription[];
	domain: string[];
}

interface PlaceholderContentProps {
	data: ChartData[];
	loading?: boolean;
	height?: number;
}

export const Chart = forwardRef<ChartHandle, ChartProps>(
	(
		{
			backgroundColor = 'transparent',
			data,
			colors = 'categorical12',
			colorScheme = DEFAULT_COLOR_SCHEME,
			config,
			dataTestId,
			description,
			debug = false,
			height = 300,
			hiddenSeries = [],
			highlightedSeries,
			lineTypes = DEFAULT_LINE_TYPES,
			lineWidths = ['M'],
			loading,
			minWidth = 100,
			maxWidth = Infinity,
			opacities,
			padding = 0,
			renderer = 'svg',
			symbolShapes,
			theme = defaultTheme,
			title,
			width = 'auto',
			UNSAFE_vegaSpec,
			...props
		},
		forwardedRef
	) => {
		// uuid is used to make a unique id so there aren't duplicate ids if there is more than one Chart component in the document
		const chartId = useRef<string>(`rsc-${uuid()}`);
		const chartView = useRef<View>(); // view returned by vega
		const selectedData = useRef<Datum | null>(null); // data that is currently selected, get's set on click if a popover exists
		const selectedDataName = useRef<string>();
		const selectedDataBounds = useRef<MarkBounds>();
		const containerRef = useRef<HTMLDivElement>(null);
		const popoverAnchorRef = useRef<HTMLDivElement>(null);
		const [popoverIsOpen, setPopoverIsOpen] = useState<boolean>(false); // tracks the open/close state of the popover

		const sanitizedChildren = sanitizeChartChildren(props.children);

		// THE MAGIC, builds our spec
		const spec = useSpec({
			children: sanitizedChildren,
			colors,
			data,
			description,
			hiddenSeries,
			highlightedSeries,
			symbolShapes,
			lineTypes,
			lineWidths,
			opacities,
			colorScheme,
			title,
			UNSAFE_vegaSpec,
		});

		const { controlledHoverSignal, selectedIdSignalName, selectedSeriesSignalName } = useSpecProps(spec);
		const chartConfig = useMemo(() => getChartConfig(config, colorScheme), [config, colorScheme]);

		// Need to de a deep copy of the data because vega tries to transform the data
		const chartData = useMemo(() => {
			const clonedData = JSON.parse(JSON.stringify(data));

			// We received a full Vega data array with potentially multiple dataset objects
			if (isVegaData(clonedData)) {
				return extractValues(clonedData);
			}

			// We received a simple array of data and we'll set a default key of 'table' to reference internally
			return { [TABLE]: clonedData };
		}, [data]);

		useEffect(() => {
			const tooltipElement = document.getElementById('vg-tooltip-element');
			if (!tooltipElement) return;
			// Hide tooltips on all charts when a popover is open
			tooltipElement.hidden = popoverIsOpen;

			// if the popover is closed, reset the selected data
			if (!popoverIsOpen) {
				selectedData.current = null;
			}
		}, [popoverIsOpen]);

		useChartImperativeHandle(forwardedRef, { chartView, title });

		const [containerWidth] = useElementSize(containerRef); // gets the width of the container that wraps vega
		const chartWidth = useChartWidth(containerWidth, maxWidth, minWidth, width); // calculates the width the vega chart should be
		useDebugSpec(debug, spec, chartData, chartWidth, height, chartConfig);

		const {
			hiddenSeriesState,
			setHiddenSeries,
			descriptions: legendDescriptions,
			isToggleable: legendIsToggleable,
			onClick: onLegendClick,
			onMouseOut: onLegendMouseOut,
			onMouseOver: onLegendMouseOver,
		} = useLegend(sanitizedChildren); // gets props from the legend if it exists

		const tooltips = useTooltips(sanitizedChildren);
		const popovers = usePopovers(sanitizedChildren);

		// gets the correct css style to display the anchor in the correct position
		const targetStyle = usePopoverAnchorStyle(
			popoverIsOpen,
			chartView.current,
			selectedDataBounds.current,
			padding
		);
		const showPlaceholderContent = useMemo(() => Boolean(loading ?? !data.length), [loading, data]);
		useEffect(() => {
			// if placeholder content is displayed, clear out the chartview so it can't be downloaded or copied to clipboard
			if (showPlaceholderContent) {
				chartView.current = undefined;
			}
		}, [showPlaceholderContent]);

		const tooltipConfig: TooltipOptions = { theme: colorScheme };

		if (tooltips.length || legendDescriptions) {
			tooltipConfig.formatTooltip = (value) => {
				debugLog(debug, { title: 'Tooltip datum', contents: value });
				if (legendDescriptions && 'index' in value) {
					debugLog(debug, {
						title: 'Legend descriptions',
						contents: legendDescriptions,
					});
					return renderToStaticMarkup(
						<LegendTooltip
							value={value}
							descriptions={legendDescriptions}
							domain={chartView.current?.scale('color').domain()}
						/>
					);
				}
				// get the correct tooltip to render based on the hovered item
				const tooltip = tooltips.find((t) => t.name === value.rscComponentName)?.callback;
				if (tooltip && !('index' in value)) {
					if (controlledHoverSignal) {
						chartView.current?.signal(controlledHoverSignal.name, value?.[MARK_ID] ?? null);
					}
					return renderToStaticMarkup(
						<div className="rsc-tooltip" data-testid="rsc-tooltip">
							{tooltip(value)}
						</div>
					);
				}
				return '';
			};
		}

		if (props.children && UNSAFE_vegaSpec) {
			throw new Error(
				'Chart cannot accept both children and `UNSAFE_vegaSpec` prop. Please choose one or the other.'
			);
		}

		// Chart requires children or a Vega spec to configure what is drawn. If there aren't any children or a Vega spec, throw an error and return a fragment.
		if (!props.children && !UNSAFE_vegaSpec) {
			throw new Error(
				'No children in the <Chart/> component. Chart is a collection components and requires children to draw correctly.'
			);
		}

		return (
			<Provider colorScheme={colorScheme} theme={isValidTheme(theme) ? theme : defaultTheme}>
				<div
					ref={containerRef}
					id={chartId.current}
					data-testid={dataTestId}
					className="rsc-container"
					style={{ backgroundColor: getColorValue(backgroundColor, colorScheme) }}
				>
					<div
						id={`${chartId.current}-popover-anchor`}
						data-testid="rsc-popover-anchor"
						ref={popoverAnchorRef}
						style={targetStyle}
					/>
					{showPlaceholderContent ? (
						<PlaceholderContent loading={loading} data={data} height={height} />
					) : (
						<Vega
							mode="vega"
							className="rsc"
							spec={spec}
							config={chartConfig}
							data={chartData}
							actions={false}
							renderer={renderer}
							width={chartWidth}
							height={height}
							padding={padding}
							expressionFunctions={expressionFunctions}
							tooltip={tooltipConfig}
							onNewView={(view) => {
								chartView.current = view;
								// this sets the signal value for the background color used behind bars
								view.signal('backgroundColor', getColorValue('gray-50', colorScheme));
								if (popovers.length || legendIsToggleable || onLegendClick) {
									if (legendIsToggleable) {
										view.signal('hiddenSeries', hiddenSeriesState);
									}
									setSelectedSignals({
										selectedData: selectedData.current,
										selectedIdSignalName,
										selectedSeriesSignalName,
										view,
									});
									view.addEventListener(
										'click',
										getOnMarkClickCallback(
											chartView,
											hiddenSeriesState,
											chartId,
											selectedData,
											selectedDataBounds,
											selectedDataName,
											setHiddenSeries,
											legendIsToggleable,
											onLegendClick
										)
									);
								}
								view.addEventListener('mouseover', getOnMouseInputCallback(onLegendMouseOver));
								view.addEventListener('mouseout', getOnMouseInputCallback(onLegendMouseOut));
								// this will trigger the autosize calculation making sure that everything is correct size
								setTimeout(() => {
									view.resize();
									view.runAsync();
								}, 0);
							}}
						/>
					)}
					<ChartDialog
						datum={selectedData.current}
						targetElement={popoverAnchorRef}
						setPopoverState={setPopoverIsOpen}
						popovers={popovers}
						itemName={selectedDataName.current}
					/>
				</div>
			</Provider>
		);
	}
);
Chart.displayName = 'Chart';

const ChartDialog = ({ datum, itemName, targetElement, setPopoverState, popovers }: ChartDialogProps) => {
	if (!popovers.length) {
		return <></>;
	}
	const popoverDetail = popovers.find((p) => p.name === itemName);
	const popover = popoverDetail?.callback;
	const width = popoverDetail?.width;
	return (
		<DialogTrigger
			type="popover"
			mobileType="tray"
			targetRef={targetElement}
			onOpenChange={setPopoverState}
			placement="top"
			hideArrow
		>
			<ActionButton UNSAFE_style={{ display: 'none' }}>launch chart popover</ActionButton>
			{(close) => (
				<Dialog data-testid="rsc-popover" UNSAFE_className="rsc-popover" minWidth="size-1000" width={width}>
					<SpectrumView gridColumn="1/-1" gridRow="1/-1" margin={12}>
						{popover && datum && popover(datum, close)}
					</SpectrumView>
				</Dialog>
			)}
		</DialogTrigger>
	);
};

const LegendTooltip: FC<LegendTooltipProps> = ({ value, descriptions, domain }) => {
	const series = domain[value.index];
	const description = descriptions.find((d) => d.seriesName === series);
	if (!description) {
		return <></>;
	}
	return (
		<div className="rsc-tooltip legend-tooltip" data-testid="rsc-tooltip">
			<div className="series">{description.title ?? series}</div>
			<p className="series-description">{description.description}</p>
		</div>
	);
};

const PlaceholderContent: FC<PlaceholderContentProps> = ({ loading, data, ...layoutProps }) => {
	if (loading) {
		//show a spinner while data is loading
		return <LoadingState {...layoutProps} />;
	} else if (!data.length) {
		//if it is no longer loading but there is not data, show the empty state
		return <EmptyState {...layoutProps} />;
	}
	return <></>;
};

const isValidTheme = (theme: unknown): theme is Theme => {
	return typeof theme === 'object' && theme !== null && 'light' in theme && 'dark' in theme;
};