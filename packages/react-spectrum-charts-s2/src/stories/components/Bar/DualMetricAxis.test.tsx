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

import { findAllMarksByGroupName, findChart, render, screen } from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { AccessibleNavigation, Basic, WithSublabels, WithThreeSeries } from './DualMetricAxis.story';

describe('AccessibleNavigation', () => {
  test('keyboard navigation drills from group to segment and moves the focus ring', async () => {
    render(<AccessibleNavigation {...AccessibleNavigation.args} />);
    const chart = await findChart();
    const container = chart.closest('.rsc-container') as HTMLElement;

    const entryButton = container.querySelector('button') as HTMLButtonElement;
    expect(entryButton).toBeTruthy();
    entryButton.click();

    const dnNode = () => container.querySelector('.dn-node') as HTMLElement;
    expect(dnNode()).toBeTruthy();

    // drill root -> group (dimension level) -> first bar within the group (leaf)
    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' });
    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' });
    const segmentRings = await findAllMarksByGroupName(chart, 'bar0_focusRing');
    expect(segmentRings.some((ring) => ring.getAttribute('opacity') === '1')).toBe(true);

    // arrow key moves focus to a sibling node
    const focusedIdBefore = dnNode().id;
    fireEvent.keyDown(dnNode(), { key: 'ArrowRight', code: 'ArrowRight' });
    expect(dnNode().id).not.toBe(focusedIdBefore);
  });

  // Each leaf reads the metric axis its own series is plotted against (Windows -> primary, Mac -> secondary).
  test("labels a leaf's value with the metric axis for that bar's own series", async () => {
    render(<AccessibleNavigation {...AccessibleNavigation.args} />);
    const chart = await findChart();
    const container = chart.closest('.rsc-container') as HTMLElement;

    const entryButton = container.querySelector('button') as HTMLButtonElement;
    entryButton.click();
    const dnNode = () => container.querySelector('.dn-node') as HTMLElement;
    // data-navigator sets aria-label on a nested `.dn-node-text` child, not on `.dn-node` itself.
    const label = () => dnNode().querySelector('.dn-node-text')?.getAttribute('aria-label') ?? '';

    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // root -> first group (Chrome)
    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // group -> first segment (Chrome/Windows)
    expect(label()).toContain('Windows Downloads:');
    expect(label()).not.toContain('Mac Downloads');

    // up/down moves through every segment; the next one is Chrome/Mac (the secondary-axis series).
    fireEvent.keyDown(dnNode(), { key: 'ArrowDown', code: 'ArrowDown' });
    expect(label()).toContain('Mac Downloads:');
    expect(label()).not.toContain('Windows Downloads');
  });

  // Titles come from metric-axis declaration order, not side (horizontal puts both metric axes on 'bottom').
  test('resolves per-series titles by axis declaration order (horizontal: both metric axes on bottom)', async () => {
    render(<AccessibleNavigation {...AccessibleNavigation.args} orientation="horizontal" />);
    const chart = await findChart();
    const container = chart.closest('.rsc-container') as HTMLElement;

    const entryButton = container.querySelector('button') as HTMLButtonElement;
    entryButton.click();
    const dnNode = () => container.querySelector('.dn-node') as HTMLElement;
    const label = () => dnNode().querySelector('.dn-node-text')?.getAttribute('aria-label') ?? '';

    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // root -> first group (Chrome)
    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // group -> first segment (Chrome/Windows)
    expect(label()).toContain('Windows Downloads:');

    // horizontal stacked-nav maps the cross-chart "down" move to ArrowLeft; next segment is Chrome/Mac.
    fireEvent.keyDown(dnNode(), { key: 'ArrowLeft', code: 'ArrowLeft' });
    expect(label()).toContain('Mac Downloads:');
    expect(label()).not.toContain('Windows Downloads');
  });

  // Per-series titles apply only to a real (dodged) dual-metric-axis bar, not a stacked one on the shared primary scale.
  test('does not assign per-series titles when the bar is stacked (not an eligible dual-metric axis)', async () => {
    render(<AccessibleNavigation {...AccessibleNavigation.args} type="stacked" />);
    const chart = await findChart();
    const container = chart.closest('.rsc-container') as HTMLElement;

    const entryButton = container.querySelector('button') as HTMLButtonElement;
    entryButton.click();
    const dnNode = () => container.querySelector('.dn-node') as HTMLElement;
    const label = () => dnNode().querySelector('.dn-node-text')?.getAttribute('aria-label') ?? '';

    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // root -> group
    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // group -> first segment
    fireEvent.keyDown(dnNode(), { key: 'ArrowDown', code: 'ArrowDown' }); // move to the Mac segment
    // Every bar uses the primary scale, so the Mac segment must not be announced as "Mac Downloads".
    expect(label()).not.toContain('Mac Downloads');
  });
});

describe('Dual metric axis bar axis styling', () => {
  describe('Two series', () => {
    test('axis title should have fill color based on series', async () => {
      render(<Basic {...Basic.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // set timeout
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // first axis uses first series color.
      expect(screen.getByText('Windows Downloads')).toHaveAttribute('fill', '#5424DB'); // S2 categorical-100
      // second axis uses second series color.
      expect(screen.getByText('Mac Downloads')).toHaveAttribute('fill', '#D92361'); // S2 categorical-200
    });
    test('axis label should have fill color based on series', async () => {
      render(<Basic {...Basic.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // first axis
      expect(screen.getAllByText('0')[0]).toHaveAttribute('fill', '#5424DB'); // S2 categorical-100
      // second axis uses second series color.
      expect(screen.getAllByText('0')[1]).toHaveAttribute('fill', '#D92361'); // S2 categorical-200
    });
  });

  describe('Three series', () => {
    test('axis title should have fill color based on series', async () => {
      render(<WithThreeSeries {...WithThreeSeries.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // first axis has more than one series. Use default color.
      expect(screen.getByText('Downloads')).toHaveAttribute('fill', '#292929'); // S2 gray-800 light
      // second axis uses third series color.
      expect(screen.getByText('Other Downloads')).toHaveAttribute('fill', '#E86A00'); // S2 categorical-300
    });
    test('axis label should have fill color based on series', async () => {
      render(<WithThreeSeries {...WithThreeSeries.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const axisLabels = screen.getAllByText('0');

      // first axis has more than one series. Use default color.
      expect(axisLabels[0]).toHaveAttribute('fill', '#292929'); // S2 gray-800 light
      // second axis uses third series color.
      expect(axisLabels[1]).toHaveAttribute('fill', '#E86A00'); // S2 categorical-300
    });
  });

  describe('Sublabels', () => {
    test('should render sublabels', async () => {
      render(<WithSublabels {...WithSublabels.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const subLabels = screen.getAllByText('Low');
      // first axis has more than one series. Use default color.
      expect(subLabels[0]).toHaveAttribute('fill', '#5424DB'); // S2 categorical-100
      // second axis uses third series color.
      expect(subLabels[1]).toHaveAttribute('fill', '#D92361'); // S2 categorical-200
    });
  });
});
