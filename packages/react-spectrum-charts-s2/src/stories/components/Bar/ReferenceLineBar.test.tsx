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
import React from 'react';

import { fireEvent } from '@testing-library/react';

import { findAllMarksByGroupName, findChart, findMarksByGroupName, render } from '../../../test-utils';
import { AccessibleNavigation, Basic, Label } from './ReferenceLineBar.story';

describe('AccessibleNavigation', () => {
  test('keyboard navigation drills into a bar and moves the focus ring', async () => {
    render(<AccessibleNavigation {...AccessibleNavigation.args} />);
    const chart = await findChart();
    const container = chart.closest('.rsc-container') as HTMLElement;

    const entryButton = container.querySelector('button') as HTMLButtonElement;
    expect(entryButton).toBeTruthy();
    entryButton.click();

    const dnNode = () => container.querySelector('.dn-node') as HTMLElement;
    expect(dnNode()).toBeTruthy();

    // single-series bar: drilling once from the chart root lands on the first bar (leaf)
    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' });
    const barRings = await findAllMarksByGroupName(chart, 'bar0_focusRing');
    expect(barRings.some((ring) => ring.getAttribute('opacity') === '1')).toBe(true);

    // arrow key moves focus to a sibling bar
    const focusedIdBefore = dnNode().id;
    fireEvent.keyDown(dnNode(), { key: 'ArrowRight', code: 'ArrowRight' });
    expect(dnNode().id).not.toBe(focusedIdBefore);
  });
});

describe('ReferenceLineBar', () => {
  test('Reference line renders', async () => {
    render(<Basic {...Basic.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars.length).toEqual(5);

    const axisReferenceLine = await findMarksByGroupName(chart, 'axis0ReferenceLine0', 'line');
    expect(axisReferenceLine).toBeInTheDocument();
  });

  test('Label renders', async () => {
    render(<Label {...Label.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const labelMark = await findMarksByGroupName(chart, 'axis0ReferenceLine0_label', 'text');
    expect(labelMark).toBeInTheDocument();
  });

  test('position before shifts the reference line', async () => {
    render(<Basic {...{ ...Basic.args, position: 'before' }} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const axisReferenceLine = await findMarksByGroupName(chart, 'axis0ReferenceLine0', 'line');
    expect(axisReferenceLine).toBeInTheDocument();
  });

  test('position after shifts the reference line', async () => {
    render(<Basic {...{ ...Basic.args, position: 'after' }} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const axisReferenceLine = await findMarksByGroupName(chart, 'axis0ReferenceLine0', 'line');
    expect(axisReferenceLine).toBeInTheDocument();
  });
});
