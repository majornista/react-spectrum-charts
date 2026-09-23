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
import { Bar } from '../components/Bar';
import { Line } from '../components/Line';
import { getNavigableChartType } from './navigableMarks';

describe('getNavigableChartType()', () => {
  test('recognizes Bar', () => {
    expect(getNavigableChartType(Bar.displayName)).toBe('bar');
  });

  test('recognizes Line', () => {
    expect(getNavigableChartType(Line.displayName)).toBe('line');
  });

  test('returns undefined for an unrecognized mark', () => {
    expect(getNavigableChartType('Area')).toBeUndefined();
  });

  test('returns undefined for a non-string displayName', () => {
    expect(getNavigableChartType(undefined)).toBeUndefined();
  });
});
