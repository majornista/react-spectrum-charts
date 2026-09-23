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
import { Mark } from 'vega';

import { FOCUSED_REGION } from '@spectrum-charts/constants';

import { addChartFocusRing, CHART_FOCUS_RING_NAME, getChartFocusRing } from './chartFocusRingUtils';

const options = { colorScheme: 'light' as const };

describe('getChartFocusRing()', () => {
  test('covers the full plot area and keys opacity on the chart region', () => {
    const ring = getChartFocusRing(options);
    expect(ring).toHaveProperty('name', CHART_FOCUS_RING_NAME);
    expect(ring.encode?.update?.x).toEqual({ value: 0 });
    expect(ring.encode?.update?.x2).toEqual({ signal: 'width' });
    expect(ring.encode?.update?.opacity).toEqual([
      { test: `${FOCUSED_REGION} === 'chart'`, value: 1 },
      { value: 0 },
    ]);
  });
});

describe('addChartFocusRing()', () => {
  test('adds the ring mark when absent', () => {
    const marks: Mark[] = [];
    addChartFocusRing(marks, options);
    expect(marks).toHaveLength(1);
    expect(marks[0].name).toBe(CHART_FOCUS_RING_NAME);
  });

  test('does not add a duplicate when a chart has more than one navigable mark', () => {
    const marks: Mark[] = [];
    addChartFocusRing(marks, options);
    addChartFocusRing(marks, options);
    expect(marks).toHaveLength(1);
  });
});
