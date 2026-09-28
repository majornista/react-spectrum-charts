/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, ChartInspect, ChartPopover, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { workspaceTrendsData, workspaceTrendsSixSeriesData } from '../../data/data';
import { formatTimestamp } from '../../storyUtils';

export default {
  title: 'React Spectrum Charts 2/Accessible Navigation/Line Navigation',
};

const dialogContent = (datum: Datum): ReactElement => (
  <div>
    <div>{formatTimestamp(datum.datetime as number)}</div>
    <div>Event: {datum.series}</div>
    <div>Users: {Number(datum.value).toLocaleString()}</div>
  </div>
);

// workspaceTrendsData bundles several series together — filtered to one so this renders as a single line, not color-grouped.
const singleSeriesData = workspaceTrendsData.filter((d) => d.series === 'Add Freeform table');

// Tab into the chart to enter data-navigator keyboard navigation; Left/Right move between points, wrapping at the ends.
const SingleLineNavigationStory: StoryFn = (): ReactElement => {
  const chartProps = useChartProps({ data: singleSeriesData, minWidth: 400, maxWidth: 800, height: 400, accessibleNavigation: true });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" labelFormat="time" />
      <Axis position="left" grid />
      <Line dimension="datetime" metric="value" scaleType="time">
        <ChartInspect>{dialogContent}</ChartInspect>
      </Line>
    </Chart>
  );
};

// Up/Down move between lines at the top level; Enter drills into a line, then Enter or Right steps to its points (Left/Right within the line), and Up/Down jump to the same-position point in the adjacent line. Enter on a point opens its ChartPopover.
const MultiSeriesLineNavigationStory: StoryFn = (): ReactElement => {
  const chartProps = useChartProps({
    data: workspaceTrendsSixSeriesData,
    minWidth: 400,
    maxWidth: 800,
    height: 400,
    accessibleNavigation: true,
  });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" labelFormat="time" />
      <Axis position="left" grid />
      <Line dimension="datetime" metric="value" scaleType="time" color="series">
        <ChartInspect>{dialogContent}</ChartInspect>
        <ChartPopover width="auto">{dialogContent}</ChartPopover>
      </Line>
      <Legend lineWidth={{ value: 0 }} />
    </Chart>
  );
};

export const SingleLineNavigation = SingleLineNavigationStory.bind({});

export const MultiSeriesLineNavigation = MultiSeriesLineNavigationStory.bind({});
