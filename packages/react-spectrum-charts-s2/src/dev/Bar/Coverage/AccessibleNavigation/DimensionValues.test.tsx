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
import { ComponentType, ReactElement } from 'react';

import { fireEvent } from '@testing-library/react';

import { Chart } from '../../../../Chart.js';
import { Bar, ChartInspect } from '../../../../components/index.js';
import { findAllMarksByGroupName, findChart, render, waitFor } from '../../../../test-utils/index.js';
import {
  EmptyCategoryBarNavigation,
  NonInteractiveBarNavigation,
  NumberDimensionBarNavigation,
  StackedNumberDimensionBarNavigation,
  TimeDimensionBarNavigation,
  UnfacetedEmptyCategoryBarNavigation,
} from './BarNavigation.story.js';
import { TimeComparisonBar } from './MultiFieldSeries.story.js';

const focusedNode = () => document.activeElement as HTMLElement;
const focusedLabel = () => focusedNode()?.querySelector('.dn-node-text')?.getAttribute('aria-label');
const press = (key: string) => fireEvent.keyDown(focusedNode(), { key, code: key });

const enterChartRoot = async (chart: ReactElement) => {
  render(chart);
  const svg = await findChart();
  const container = svg.closest('.rsc-container') as HTMLElement;
  await waitFor(() => expect(container.querySelector('.dn-entry-button')).toBeTruthy());
  (container.querySelector('.dn-entry-button') as HTMLButtonElement).click();
  await waitFor(() => expect(container.querySelector('.dn-node')).toBeTruthy());
  return svg;
};

const shownRings = async (svg: HTMLElement, name: string) =>
  (await findAllMarksByGroupName(svg, name)).filter((ring) => ring.getAttribute('opacity') === '1').length;

describe('Dimension values the chart parses or holds as numbers', () => {
  test.each([
    ['non-interactive', NonInteractiveBarNavigation],
    ['number dimension', NumberDimensionBarNavigation],
    ['stacked number dimension', StackedNumberDimensionBarNavigation],
    ['empty category', EmptyCategoryBarNavigation],
    ['unfaceted empty category', UnfacetedEmptyCategoryBarNavigation],
  ] as const)('clicking a %s bar focuses its navigation node without a popover', async (_name, Story) => {
    const StoryComponent = Story as ComponentType<{ orientation: 'vertical'; stacked?: boolean }>;
    render(<StoryComponent {...Story.args} orientation="vertical" />);
    const svg = await findChart();
    const container = svg.closest('.rsc-container') as HTMLElement;
    await waitFor(() => expect(container.querySelector('.dn-entry-button')).toBeTruthy());
    const bars = await findAllMarksByGroupName(svg, 'bar0');
    fireEvent.mouseDown(bars[0]);
    await waitFor(() => expect(focusedNode().classList.contains('dn-node')).toBe(true));
    expect(focusedLabel()).toBeTruthy();
    const firstId = focusedNode().id;
    fireEvent.mouseDown(bars[bars.length - 1]);
    await waitFor(() => expect(focusedNode().id).not.toBe(firstId));
    expect(focusedNode().classList.contains('dn-node')).toBe(true);
  });

  test.each([false, true])('the focused segment ring returns when no segment is hovered (inspect=%s)', async (inspect) => {
    const data = [0, 1].flatMap((hour) => ['a', 'b'].map((series) => ({ hour, series, value: hour + 2 })));
    const svg = await enterChartRoot(
      <Chart data={data} accessibleNavigation animations={false} width={400} height={300}>
        <Bar dimension="hour" color="series">
          {inspect && <ChartInspect />}
        </Bar>
      </Chart>
    );
    press('Enter');
    press('Enter');
    await waitFor(async () => expect(await shownRings(svg, 'bar0_focusRing')).toBe(1));
    const node = focusedNode();
    const label = focusedLabel();
    const bars = await findAllMarksByGroupName(svg, 'bar0');
    fireEvent.mouseOver(bars[1]);
    await waitFor(async () => expect(await shownRings(svg, 'bar0_focusRing')).toBe(1));
    fireEvent.mouseOut(bars[1]);
    fireEvent.mouseOver(bars[bars.length - 1]);
    await waitFor(async () => expect(await shownRings(svg, 'bar0_focusRing')).toBe(0));
    expect(focusedNode()).toBe(node);
    expect(focusedLabel()).toBe(label);
    fireEvent.mouseOut(bars[bars.length - 1]);
    await waitFor(async () => expect(await shownRings(svg, 'bar0_focusRing')).toBe(1));
    fireEvent.mouseOver(bars[0]);
    await waitFor(async () => expect(await shownRings(svg, 'bar0_focusRing')).toBe(0));
    fireEvent.mouseOut(bars[0]);
    await waitFor(async () => expect(await shownRings(svg, 'bar0_focusRing')).toBe(1));
    expect(focusedNode()).toBe(node);
  });

  test.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ])('keyboard navigation restores the ring and tooltip after hover (stacked=%s inspect=%s)', async (stacked, inspect) => {
    const data = [0, 1, 2].flatMap((hour) =>
      (stacked ? ['a', 'b'] : ['a']).map((series) => ({ hour, series, value: hour + 10 }))
    );
    const svg = await enterChartRoot(
      <Chart data={data} accessibleNavigation animations={false} width={400} height={300}>
        <Bar dimension="hour" color={stacked ? 'series' : undefined}>
          {inspect && <ChartInspect />}
        </Bar>
      </Chart>
    );
    press('Enter');
    if (stacked) press('Enter');
    await waitFor(async () => expect(await shownRings(svg, 'bar0_focusRing')).toBe(1));
    const node = focusedNode();
    const bars = await findAllMarksByGroupName(svg, 'bar0');
    fireEvent.mouseOver(bars[bars.length - 1]);
    await waitFor(async () => expect(await shownRings(svg, 'bar0_focusRing')).toBe(0));
    press(stacked ? 'ArrowDown' : 'ArrowRight');
    await waitFor(() => expect(focusedNode()).not.toBe(node));
    await waitFor(async () => expect(await shownRings(svg, 'bar0_focusRing')).toBe(1));
    await waitFor(() => {
      const tooltip = document.getElementById('vg-tooltip-element');
      expect(tooltip).toHaveClass('visible');
      expect(tooltip?.querySelector('.value')?.textContent).toBe(stacked ? '0' : '1');
      if (stacked) expect(tooltip?.querySelectorAll('.value')[1]?.textContent).toBe('a');
    });
    const keyboardNode = focusedNode();
    fireEvent.mouseMove(bars[bars.length - 1]);
    await waitFor(async () => expect(await shownRings(svg, 'bar0_focusRing')).toBe(0));
    expect(focusedNode()).toBe(keyboardNode);
  });

  test('a time dimension from date strings shows stack and segment rings and reads the original dates', async () => {
    const svg = await enterChartRoot(<TimeDimensionBarNavigation {...TimeDimensionBarNavigation.args} />);
    press('Enter');
    expect(focusedLabel()).toMatch(/^Day: 2024-01-01 00:00:00\.0\. /);
    await waitFor(async () => expect(await shownRings(svg, 'bar0_stackFocusRing')).toBe(1));
    press('Enter');
    expect(focusedLabel()).toMatch(/^Day: 2024-01-01 00:00:00\.0\. Dataset: /);
    await waitFor(async () => expect(await shownRings(svg, 'bar0_focusRing')).toBe(1));
  });

  test('a number dimension shows the group ring', async () => {
    const svg = await enterChartRoot(<TimeComparisonBar {...TimeComparisonBar.args} />);
    press('Enter');
    expect(focusedLabel()).toMatch(/^datetime: 1679810400000\. /);
    await waitFor(async () => expect(await shownRings(svg, 'bar0_stackFocusRing')).toBe(1));
  });

  test('a number dimension without a series, including 0, is navigable with item rings', async () => {
    const data = [0, 1].map((hour) => ({ hour, value: hour + 3 }));
    const svg = await enterChartRoot(
      <Chart data={data} accessibleNavigation width={400} height={300}>
        <Bar dimension="hour" metric="value" />
      </Chart>
    );
    press('Enter');
    expect(focusedLabel()).toBe('hour: 0. value: 3.');
    await waitFor(async () => expect(await shownRings(svg, 'bar0_focusRing')).toBe(1));
    press('ArrowRight');
    expect(focusedLabel()).toBe('hour: 1. value: 4.');
  });

  test('a stack whose dimension is 0 shows its stack ring', async () => {
    const data = [0, 1].flatMap((hour) => ['a', 'b'].map((series) => ({ hour, series, value: hour + 2 })));
    const svg = await enterChartRoot(
      <Chart data={data} accessibleNavigation width={400} height={300}>
        <Bar dimension="hour" color="series" />
      </Chart>
    );
    press('Enter');
    expect(focusedLabel()).toMatch(/^hour: 0\. /);
    await waitFor(async () => expect(await shownRings(svg, 'bar0_stackFocusRing')).toBe(1));
  });

  test('an empty-string category has no stack ring while nothing is focused', async () => {
    const data = [
      { category: '', series: 'a', value: 3 },
      { category: 'x', series: 'a', value: 4 },
    ];
    const svg = await enterChartRoot(
      <Chart data={data} accessibleNavigation width={400} height={300}>
        <Bar dimension="category" color="series" />
      </Chart>
    );
    await waitFor(async () => expect(await shownRings(svg, 'chartFocusRing')).toBe(1));
    expect(await shownRings(svg, 'bar0_stackFocusRing')).toBe(0);
  });

  test('an empty-string category without a series is navigable with its item ring', async () => {
    const data = [
      { category: '', value: 3 },
      { category: 'x', value: 4 },
    ];
    const svg = await enterChartRoot(
      <Chart data={data} accessibleNavigation width={400} height={300}>
        <Bar dimension="category" metric="value" />
      </Chart>
    );
    press('Enter');
    expect(focusedLabel()).toBe('category: . value: 3.');
    await waitFor(async () => expect(await shownRings(svg, 'bar0_focusRing')).toBe(1));
    press('ArrowRight');
    expect(focusedLabel()).toBe('category: x. value: 4.');
  });
});
