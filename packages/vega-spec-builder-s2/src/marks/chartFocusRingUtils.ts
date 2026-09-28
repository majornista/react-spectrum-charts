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
import { Mark, RectMark } from 'vega';

import { FOCUSED_REGION } from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { ColorScheme } from '../types';

export const FOCUS_RING_STROKE_WIDTH = 2;
export const FOCUS_RING_ROUNDED_RADIUS = 6;

export const CHART_FOCUS_RING_NAME = 'chartFocusRing';

/** Whole-chart focus ring shown while FOCUSED_REGION === 'chart'. Identical for every navigable mark type. */
export const getChartFocusRing = ({ colorScheme }: { colorScheme: ColorScheme }): RectMark => ({
  name: CHART_FOCUS_RING_NAME,
  type: 'rect',
  interactive: false,
  encode: {
    enter: {
      fill: { value: 'transparent' },
      strokeWidth: { value: FOCUS_RING_STROKE_WIDTH },
      stroke: { value: getS2ColorValue('blue-800', colorScheme) },
      cornerRadius: { value: FOCUS_RING_ROUNDED_RADIUS },
    },
    update: {
      x: { value: 0 },
      x2: { signal: 'width' },
      y: { value: 0 },
      y2: { signal: 'height' },
      opacity: [{ test: `${FOCUSED_REGION} === 'chart'`, value: 1 }, { value: 0 }],
    },
  },
});

/**
 * Adds the chart-wide focus ring mark, guarded so a chart with more than one accessibly-navigable
 * mark (e.g. a Bar and a Line) doesn't produce duplicate Vega mark declarations.
 */
export const addChartFocusRing = (marks: Mark[], options: { colorScheme: ColorScheme }): void => {
  if (marks.some((mark) => mark.name === CHART_FOCUS_RING_NAME)) return;
  marks.push(getChartFocusRing(options));
};
