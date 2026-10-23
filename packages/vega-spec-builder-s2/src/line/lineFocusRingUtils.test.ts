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
import {
  BACKGROUND_COLOR,
  FILTERED_TABLE,
  FOCUSED_DIMENSION,
  FOCUSED_ITEM,
  FOCUSED_REGION,
  INTERACTION_MODALITY,
  NAVIGATION_ID_SEPARATOR,
  NAVIGATION_INDEX_FIELD,
  SINGLE_LINE_NODE_ID,
} from '@spectrum-charts/core-s2/constants';

import { getFocusedGroupOrItemMatchExpr } from '../marks/focusMatchUtils.js';
import { defaultLineOptions } from './lineTestUtils.js';
import {
  getChartFocusRing,
  getLineFocusRingGap,
  getLineFocusRingOuter,
  getLineGroupZIndexEncoding,
  getPointFocusRing,
} from './lineFocusRingUtils.js';

// defaultLineOptions.color is the string field 'series' → a multi-line chart.
// singleLineOptions' static { value } color is what a single-series line actually has — ColorFacet
// is only ever a field-reference string or a static value (never an array), and { value: ... } is
// also addLine's own default when no color prop is given at all.
const singleLineOptions = { ...defaultLineOptions, color: { value: 'categorical-100' } };

describe('getLineFocusRingOuter()', () => {
  test('sources the ring from the provided data and keys strokeWidth on the focused dimension', () => {
    const ring = getLineFocusRingOuter(defaultLineOptions, 'line0_facet');
    expect(ring).toHaveProperty('name', 'line0_focusRingOuter');
    expect(ring.from).toEqual({ data: 'line0_facet' });
    expect(ring.interactive).toBe(false);
    expect(ring.encode?.update?.strokeWidth).toEqual([
      { test: `${INTERACTION_MODALITY} === 'keyboard' && (${FOCUSED_DIMENSION} === ('' + (datum.series)))`, value: 12 },
      { value: 0 },
    ]);
  });

  // Regression: a single-series line's color is a static { value }, not a field, so `datum.${color}`
  // would resolve to `datum.undefined` — an invalid Vega expression that fails the whole chart's spec.
  test('keys a single-series (static color) line on the fixed single-line division id, not a color field', () => {
    const ring = getLineFocusRingOuter(singleLineOptions, 'line0_facet');
    expect(ring.encode?.update?.strokeWidth).toEqual([
      { test: `${INTERACTION_MODALITY} === 'keyboard' && (${FOCUSED_DIMENSION} === '${SINGLE_LINE_NODE_ID}')`, value: 12 },
      { value: 0 },
    ]);
  });
});

describe('getLineFocusRingGap()', () => {
  test('sources the ring from the provided data, uses the background color, and is narrower than the outer ring', () => {
    const ring = getLineFocusRingGap(defaultLineOptions, 'line0_facet');
    expect(ring).toHaveProperty('name', 'line0_focusRingGap');
    expect(ring.from).toEqual({ data: 'line0_facet' });
    expect(ring.encode?.enter?.stroke).toEqual({ signal: BACKGROUND_COLOR });
    expect(ring.encode?.update?.strokeWidth).toEqual([
      { test: `${INTERACTION_MODALITY} === 'keyboard' && (${FOCUSED_DIMENSION} === ('' + (datum.series)))`, value: 8 },
      { value: 0 },
    ]);
  });

  test('keys a single-series (static color) line on the fixed single-line division id, not a color field', () => {
    const ring = getLineFocusRingGap(singleLineOptions, 'line0_facet');
    expect(ring.encode?.update?.strokeWidth).toEqual([
      { test: `${INTERACTION_MODALITY} === 'keyboard' && (${FOCUSED_DIMENSION} === '${SINGLE_LINE_NODE_ID}')`, value: 8 },
      { value: 0 },
    ]);
  });
});

describe('getLineGroupZIndexEncoding()', () => {
  test('raises the focused line above every other line, whether the line or one of its points is focused', () => {
    expect(getLineGroupZIndexEncoding(defaultLineOptions)).toEqual([
      { test: getFocusedGroupOrItemMatchExpr("('' + (datum.series))", 'prefix'), value: 1 },
      { value: 0 },
    ]);
  });

  test('for a single-series (static color) line, raises the group when the line itself or any point is focused', () => {
    expect(getLineGroupZIndexEncoding(singleLineOptions)).toEqual([
      { test: `${FOCUSED_DIMENSION} === '${SINGLE_LINE_NODE_ID}' || isValid(${FOCUSED_ITEM})`, value: 1 },
      { value: 0 },
    ]);
  });
});

describe('getPointFocusRing()', () => {
  test.each(['lineType', 'opacity'] as const)('includes the field-backed %s in focus identity', (facet) => {
    const options = { ...defaultLineOptions, [facet]: 'period' };
    const seriesId = 'datum.series + " | " + datum.period';
    expect(getPointFocusRing(options)).toHaveProperty('encode.update.opacity', [
      {
        test: `${INTERACTION_MODALITY} === 'keyboard' && ${FOCUSED_ITEM} === ${seriesId} + "${NAVIGATION_ID_SEPARATOR}" + datum.line0_${NAVIGATION_INDEX_FIELD}`,
        value: 1,
      },
      { value: 0 },
    ]);
    expect(getLineFocusRingOuter(options, 'line0_facet')).toHaveProperty('encode.update.strokeWidth', [
      { test: `${INTERACTION_MODALITY} === 'keyboard' && (${FOCUSED_DIMENSION} === ${seriesId})`, value: 12 },
      { value: 0 },
    ]);
    expect(getLineFocusRingGap(options, 'line0_facet')).toHaveProperty('encode.update.strokeWidth', [
      { test: `${INTERACTION_MODALITY} === 'keyboard' && (${FOCUSED_DIMENSION} === ${seriesId})`, value: 8 },
      { value: 0 },
    ]);
    expect(getLineGroupZIndexEncoding(options)).toEqual([
      { test: getFocusedGroupOrItemMatchExpr(seriesId, 'prefix'), value: 1 },
      { value: 0 },
    ]);
  });

  test('uses the lineType field even when color is static', () => {
    expect(getPointFocusRing({ ...singleLineOptions, lineType: 'period' })).toHaveProperty(
      'encode.update.opacity',
      [
        {
          test: `${INTERACTION_MODALITY} === 'keyboard' && ${FOCUSED_ITEM} === ('' + (datum.period)) + "${NAVIGATION_ID_SEPARATOR}" + datum.line0_${NAVIGATION_INDEX_FIELD}`,
          value: 1,
        },
        { value: 0 },
      ]
    );
  });

  test('sources the ring from the filtered table', () => {
    const ring = getPointFocusRing(defaultLineOptions);
    expect(ring).toHaveProperty('name', 'line0_pointFocusRing');
    expect(ring.from).toEqual({ data: FILTERED_TABLE });
    expect(ring.interactive).toBe(false);
  });

  test('keys a multi-line chart on the series + per-line index composite', () => {
    const ring = getPointFocusRing(defaultLineOptions);
    expect(ring.encode?.update?.opacity).toEqual([
      {
        test: `${INTERACTION_MODALITY} === 'keyboard' && ${FOCUSED_ITEM} === ('' + (datum.series)) + "${NAVIGATION_ID_SEPARATOR}" + datum.line0_${NAVIGATION_INDEX_FIELD}`,
        value: 1,
      },
      { value: 0 },
    ]);
  });

  test('keys a single-line chart on the per-line index only', () => {
    const ring = getPointFocusRing(singleLineOptions);
    expect(ring.encode?.update?.opacity).toEqual([
      { test: `${INTERACTION_MODALITY} === 'keyboard' && ${FOCUSED_ITEM} === '' + datum.line0_${NAVIGATION_INDEX_FIELD}`, value: 1 },
      { value: 0 },
    ]);
  });
});

describe('getChartFocusRing()', () => {
  test('covers the full plot area and keys opacity on the chart region', () => {
    const ring = getChartFocusRing(defaultLineOptions);
    expect(ring).toHaveProperty('name', 'chartFocusRing');
    expect(ring.encode?.update?.x).toEqual({ value: 0 });
    expect(ring.encode?.update?.x2).toEqual({ signal: 'width' });
    expect(ring.encode?.update?.opacity).toEqual([
      { test: `${FOCUSED_REGION} === 'chart'`, value: 1 },
      { value: 0 },
    ]);
  });
});
