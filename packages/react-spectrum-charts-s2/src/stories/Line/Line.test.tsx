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
import { View } from 'vega';

import { Chart } from '../../Chart.js';
import { Axis, Legend, Line, LineForecast, LinePointAnnotation } from '../../components/index.js';
import { findAllMarksByGroupName, findChart, render, waitFor } from '../../test-utils/index.js';
import '../../test-utils/__mocks__/matchMedia.mock.js';
import { Basic } from './Features/Line.story.js';
import { LineType, Opacity } from './Features/Styling/LineStyling.story.js';

describe('LinePointAnnotation', () => {
  // LinePointAnnotation is not a real React component. This test provides coverage for sonarqube
  test('LinePointAnnotation pseudo element', () => {
    render(<LinePointAnnotation />);
  });
});

describe('Line', () => {
  test('anchors forecast navigation to the rendered time and effective metric without changing callback data', async () => {
    let view: View | undefined;
    const onClick = jest.fn();
    render(
      <Chart
        data={[
          { datetime: 1500, value: 10, forecastValue: null },
          { datetime: 2500, value: null, forecastValue: 42 },
          { datetime: 3500, value: null, forecastValue: 50 },
        ]}
        accessibleNavigation animations={false} width={400} height={300}
        onVegaViewReady={(nextView) => { view = nextView; }}
      >
        <Line name="Sales Trend" onClick={onClick}>
          <LineForecast metric="forecastValue" start={2000} />
        </Line>
      </Chart>
    );
    const svg = await findChart();
    const container = svg.closest('.rsc-container') as HTMLElement;
    await waitFor(() => {
      expect(view).toBeDefined();
      expect(container.querySelector('.dn-entry-button')).toBeTruthy();
    });
    if (!view) throw new Error('Expected a rendered Vega view');
    fireEvent.click(container.querySelector('.dn-entry-button') as HTMLElement);
    const press = (key: string) => fireEvent.keyDown(document.activeElement as HTMLElement, { key, code: key });
    press('Enter');
    press('Enter');
    press('ArrowRight');
    const [originX, originY] = view.origin();
    const x = view.scale('xTime')(2000);
    const y = view.scale('yLinear')(42);
    await waitFor(() => {
      const overlay = document.activeElement as HTMLElement;
      expect(Number.parseFloat(overlay.style.left)).toBeCloseTo(originX + x - 4);
      expect(Number.parseFloat(overlay.style.top)).toBeCloseTo(originY + y - 4);
    });
    press('Enter');
    expect(onClick).toHaveBeenLastCalledWith(expect.objectContaining({
      datetime: 2500, value: null, forecastValue: 42, salesTrend_effectiveValue: 42,
    }));
  });

  test.each([
    { scaleType: undefined, name: undefined, markName: 'line0' },
    { scaleType: 'linear', name: undefined, markName: 'line0' },
    { scaleType: 'linear', name: 'Sales Trend', markName: 'salesTrend' },
    { scaleType: 'linear', name: '', markName: 'line0' },
  ] as const)('navigates and activates default fields with scaleType=$scaleType, name=$name and duplicate x values', async ({ scaleType, name, markName }) => {
    const onClick = jest.fn();
    const data = [
      { datetime: 0, value: 10 },
      { datetime: 0, value: 20 },
      { datetime: 1000, value: 30 },
    ];
    render(
      <Chart data={data} accessibleNavigation animations={false} width={400} height={300}>
        <Axis position="bottom" title="Time" />
        <Axis position="left" title="Amount" />
        <Line name={name} scaleType={scaleType} onClick={onClick} />
      </Chart>
    );
    const svg = await findChart();
    const container = svg.closest('.rsc-container') as HTMLElement;
    await waitFor(() => expect(container.querySelector('.dn-entry-button')).toBeTruthy());
    fireEvent.click(container.querySelector('.dn-entry-button') as HTMLElement);
    const press = (key: string) => fireEvent.keyDown(document.activeElement as HTMLElement, { key, code: key });
    press('Enter');
    press('Enter');
    press('ArrowRight');
    await waitFor(async () => {
      const rings = await findAllMarksByGroupName(svg, `${markName}_pointFocusRing`);
      expect(rings.filter((ring) => ring.getAttribute('opacity') === '1')).toHaveLength(1);
    });
    expect(document.activeElement?.querySelector('.dn-node-text')?.getAttribute('aria-label')).toContain('Amount: 20');
    press('Enter');
    expect(onClick).toHaveBeenLastCalledWith(expect.objectContaining({ datetime: 0, value: 20 }));
  });

  test.each([7, '', null, undefined])('renders line and point focus rings for series=%s', async (series) => {
    const onClick = jest.fn();
    render(
      <Chart data={[
        { datetime: 0, value: 10, series },
        { datetime: 1000, value: 20, series },
        { datetime: 0, value: 30, series: 8 },
      ]} accessibleNavigation animations={false} width={400} height={300}>
        <Line color="series" onClick={onClick} />
        <Legend keys={['series']} />
      </Chart>
    );
    const svg = await findChart();
    const container = svg.closest('.rsc-container') as HTMLElement;
    await waitFor(() => expect(container.querySelector('.dn-entry-button')).toBeTruthy());
    fireEvent.click(container.querySelector('.dn-entry-button') as HTMLElement);
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter', code: 'Enter' });
    await waitFor(async () => {
      const rings = await findAllMarksByGroupName(svg, 'line0_focusRingOuter');
      expect(rings.some((ring) => Number(ring.getAttribute('stroke-width')) > 0)).toBe(true);
    });
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter', code: 'Enter' });
    await waitFor(async () => {
      const rings = await findAllMarksByGroupName(svg, 'line0_pointFocusRing');
      expect(rings.filter((ring) => ring.getAttribute('opacity') === '1')).toHaveLength(1);
    });
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter', code: 'Enter' });
    expect(onClick).toHaveBeenLastCalledWith(expect.objectContaining({ datetime: 0, value: 10 }));
  });

  // Line is not a real React component. This is test just provides test coverage for sonarqube
  test('Line pseudo element', () => {
    render(<Line />);
  });

  test('Basic renders', async () => {
    render(<Basic {...Basic.args} name="line0" />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get lines
    const lines = await findAllMarksByGroupName(chart, 'line0');
    expect(lines.length).toEqual(4);
  });

  test('LineType renders', async () => {
    render(<LineType {...LineType.args} name="line0" />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get lines
    const lines = await findAllMarksByGroupName(chart, 'line0');
    expect(lines.length).toEqual(4);
    expect(lines[0].getAttribute('stroke-dasharray')).toEqual('');
    expect(lines[1].getAttribute('stroke-dasharray')).toEqual('7,4');
    expect(lines[2].getAttribute('stroke-dasharray')).toEqual('0,4');
    expect(lines[3].getAttribute('stroke-dasharray')).toEqual('2,3,7,4');
  });

  test('Opacity renders', async () => {
    render(<Opacity {...Opacity.args} name="line0" />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get lines
    const lines = await findAllMarksByGroupName(chart, 'line0');
    expect(lines.length).toEqual(4);
    expect(lines[0].getAttribute('stroke-opacity')).toEqual('0.6');
  });
});
