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
import { fireEvent } from '@testing-library/react';

import { findAllMarksByGroupName, findChart, render } from '../../../test-utils';
import { AccessibleNavigation } from './Diverging.story';

describe('AccessibleNavigation', () => {
  test('keyboard navigation drills into a bar and moves the focus ring across the zero baseline', async () => {
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

    // horizontal bar: siblings run top-to-bottom, so ArrowDown moves focus to the next bar
    const focusedIdBefore = dnNode().id;
    fireEvent.keyDown(dnNode(), { key: 'ArrowDown', code: 'ArrowDown' });
    expect(dnNode().id).not.toBe(focusedIdBefore);
  });

  // The colorOverride (barColor) label should read a human color name, not the raw hex value.
  test("the focused bar's accessible label names the override color instead of its hex value", async () => {
    render(<AccessibleNavigation {...AccessibleNavigation.args} />);
    const chart = await findChart();
    const container = chart.closest('.rsc-container') as HTMLElement;

    const entryButton = container.querySelector('button') as HTMLButtonElement;
    entryButton.click();
    const dnNode = () => container.querySelector('.dn-node') as HTMLElement;

    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // root -> first bar (leaf)
    // data-navigator sets aria-label on a nested `.dn-node-text` child, not on `.dn-node` itself.
    const label = dnNode().querySelector('.dn-node-text')?.getAttribute('aria-label') ?? '';
    expect(label).toContain('Color: dark green');
    expect(label).not.toContain('#2d7d46');
  });
});
