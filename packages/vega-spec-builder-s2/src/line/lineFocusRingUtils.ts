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
import { LineMark, NumericValueRef, ProductionRule, SymbolMark } from 'vega';

import {
  BACKGROUND_COLOR,
  FILTERED_TABLE,
  FOCUSED_DIMENSION,
  FOCUSED_ITEM,
  INTERACTION_MODALITY,
  NAVIGATION_ID_SEPARATOR,
  NAVIGATION_INDEX_FIELD,
  SINGLE_LINE_NODE_ID,
} from '@spectrum-charts/core-s2/constants';
import { getS2ColorValue } from '@spectrum-charts/core-s2/tokens';

import { FOCUS_RING_STROKE_WIDTH } from '../marks/chartFocusRingUtils.js';
import { getFocusedGroupOrItemMatchExpr } from '../marks/focusMatchUtils.js';
import { getXProductionRule } from '../marks/markUtils.js';
import { LineSpecOptions } from '../types/index.js';
import { getLineYEncoding } from './lineEncodingUtils.js';
import { LineMarkOptions, getLineSeriesIdExpr } from './lineUtils.js';

export { getChartFocusRing } from '../marks/chartFocusRingUtils.js';

const LINE_FOCUS_RING_OUTER_STROKE_WIDTH = 12;
const LINE_FOCUS_RING_GAP_STROKE_WIDTH = 8;
const POINT_FOCUS_RING_SIZE = 500;

const getLineFocusRingStrokeWidth = (
  options: LineSpecOptions,
  width: number
): ProductionRule<NumericValueRef> => {
  // Static encodings use the implicit single-line division.
  const seriesId = getLineSeriesIdExpr(options);
  const isFocused = seriesId ? `${FOCUSED_DIMENSION} === ${seriesId}` : `${FOCUSED_DIMENSION} === '${SINGLE_LINE_NODE_ID}'`;
  // Pointer hover suppresses keyboard halos until keyboard modality is restored.
  return [
    { test: `${INTERACTION_MODALITY} === 'keyboard' && (${isFocused})`, value: width },
    { value: 0 },
  ];
};

/** Gets the outer accent layer of the focused line's halo. */
export const getLineFocusRingOuter = (options: LineSpecOptions, dataSource: string): LineMark => {
  const { colorScheme, dimension, interpolate, metric, name, scaleType } = options;
  return {
    name: `${name}_focusRingOuter`,
    type: 'line',
    from: { data: dataSource },
    interactive: false,
    aria: false,
    encode: {
      enter: {
        y: getLineYEncoding(options, metric),
        stroke: { value: getS2ColorValue('blue-800', colorScheme) },
        strokeCap: { value: 'round' },
        strokeJoin: { value: 'round' },
      },
      update: {
        x: getXProductionRule(scaleType, dimension),
        ...(interpolate ? { interpolate: { value: interpolate } } : {}),
        strokeWidth: getLineFocusRingStrokeWidth(options, LINE_FOCUS_RING_OUTER_STROKE_WIDTH),
      },
    },
  };
};

/** Gets the background-colored gap between the line and its focus halo. */
export const getLineFocusRingGap = (options: LineSpecOptions, dataSource: string): LineMark => {
  const { dimension, interpolate, metric, name, scaleType } = options;
  return {
    name: `${name}_focusRingGap`,
    type: 'line',
    from: { data: dataSource },
    interactive: false,
    aria: false,
    encode: {
      enter: {
        y: getLineYEncoding(options, metric),
        stroke: { signal: BACKGROUND_COLOR },
        strokeCap: { value: 'round' },
        strokeJoin: { value: 'round' },
      },
      update: {
        x: getXProductionRule(scaleType, dimension),
        ...(interpolate ? { interpolate: { value: interpolate } } : {}),
        strokeWidth: getLineFocusRingStrokeWidth(options, LINE_FOCUS_RING_GAP_STROKE_WIDTH),
      },
    },
  };
};

/** Raises the focused line's facet group above the other lines. */
export const getLineGroupZIndexEncoding = (
  options: Pick<LineMarkOptions, 'color' | 'lineType' | 'opacity'>
): ProductionRule<NumericValueRef> => {
  // With no field-backed facets, any focused point belongs to the only line.
  const seriesId = getLineSeriesIdExpr(options);
  const test =
    seriesId
      ? getFocusedGroupOrItemMatchExpr(seriesId, 'prefix')
      : `${FOCUSED_DIMENSION} === '${SINGLE_LINE_NODE_ID}' || isValid(${FOCUSED_ITEM})`;
  return [
    { test, value: 1 },
    { value: 0 },
  ];
};

/** A ring drawn around the focused point, on top of (and independent from) the reused hover-highlight point. */
export const getPointFocusRing = (options: LineSpecOptions): SymbolMark => {
  const { colorScheme, dimension, metric, name, scaleType } = options;
  const seriesId = getLineSeriesIdExpr(options);
  const focusedItemId =
    seriesId
      ? `${seriesId} + "${NAVIGATION_ID_SEPARATOR}" + datum.${name}_${NAVIGATION_INDEX_FIELD}`
      : `'' + datum.${name}_${NAVIGATION_INDEX_FIELD}`;
  return {
    name: `${name}_pointFocusRing`,
    type: 'symbol',
    from: { data: FILTERED_TABLE },
    interactive: false,
    aria: false,
    encode: {
      enter: {
        size: { value: POINT_FOCUS_RING_SIZE },
        fill: { value: 'transparent' },
        strokeWidth: { value: FOCUS_RING_STROKE_WIDTH },
        stroke: { value: getS2ColorValue('blue-800', colorScheme) },
        y: getLineYEncoding(options, metric),
      },
      update: {
        x: getXProductionRule(scaleType, dimension),
        // Same reasoning as getLineFocusRingStrokeWidth: hide the ring while a real hover elsewhere
        // has dimmed this point, rather than showing it at full opacity over a dimmed target.
        opacity: [{ test: `${INTERACTION_MODALITY} === 'keyboard' && ${FOCUSED_ITEM} === ${focusedItemId}`, value: 1 }, { value: 0 }],
      },
    },
  };
};
