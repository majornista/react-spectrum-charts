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
import { ReactElement, useCallback, useRef } from 'react';

import { render, waitFor } from '@testing-library/react';
import { View } from 'vega';

import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { Navigator } from './Navigator.js';

const data: SimpleData[] = [
  { browser: 'Chrome', downloads: 27000 },
  { browser: 'Firefox', downloads: 8000 },
];

const getView = () =>
  ({ signal: jest.fn(), runAsync: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn() }) as unknown as View;

const Harness = ({ chartData, chartView }: { chartData: SimpleData[]; chartView?: View }): ReactElement => {
  const ref = useRef<HTMLDivElement>(null);
  const viewRef = useRef(chartView);
  viewRef.current = chartView;
  const readView = useCallback(() => viewRef.current ?? getView(), []);
  return (
    <div ref={ref} data-testid="dn-container" style={{ position: 'relative' }}>
      <Navigator
        chartType="bar"
        data={chartData}
        dimension="browser"
        chartId="navigator-test"
        containerRef={ref}
        getView={readView}
        view={chartView}
      />
    </div>
  );
};

describe('Navigator', () => {
  test('transfers hidden-series observation to a replacement view with a stable getter', async () => {
    const makeView = () => ({
      signal: jest.fn(),
      data: jest.fn().mockReturnValue([]),
      addSignalListener: jest.fn(),
      removeSignalListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
    const first = makeView();
    const second = makeView();
    const { rerender, unmount } = render(<Harness chartData={data} chartView={first as unknown as View} />);
    await waitFor(() => expect(first.addSignalListener).toHaveBeenCalledWith('hiddenSeries', expect.any(Function)));
    const firstHandler = first.addSignalListener.mock.calls[0][1];
    rerender(<Harness chartData={data} chartView={second as unknown as View} />);
    await waitFor(() => expect(second.addSignalListener).toHaveBeenCalledWith('hiddenSeries', expect.any(Function)));
    expect(first.removeSignalListener).toHaveBeenCalledWith('hiddenSeries', firstHandler);
    expect(second.data).toHaveBeenCalled();
    const secondHandler = second.addSignalListener.mock.calls[0][1];
    const readsBeforeChange = second.data.mock.calls.length;
    secondHandler('hiddenSeries', ['Chrome']);
    await waitFor(() => expect(second.data.mock.calls.length).toBeGreaterThan(readsBeforeChange));
    unmount();
    expect(second.removeSignalListener).toHaveBeenCalledWith('hiddenSeries', secondHandler);
  });

  test('rebuilds on hidden-series changes and removes its listener on unmount', async () => {
    const readData = jest.fn().mockReturnValue([]);
    const addSignalListener = jest.fn();
    const removeSignalListener = jest.fn();
    const chartView = {
      signal: jest.fn(), data: readData, addSignalListener, removeSignalListener,
      addEventListener: jest.fn(), removeEventListener: jest.fn(),
    } as unknown as View;
    const { unmount } = render(<Harness chartData={data} chartView={chartView} />);
    await waitFor(() => expect(addSignalListener).toHaveBeenCalledWith('hiddenSeries', expect.any(Function)));
    const handler = addSignalListener.mock.calls.find(([name]) => name === 'hiddenSeries')?.[1];
    const readsBeforeChange = readData.mock.calls.length;
    handler('hiddenSeries', ['Chrome']);
    await waitFor(() => expect(readData.mock.calls.length).toBeGreaterThan(readsBeforeChange));
    unmount();
    expect(removeSignalListener).toHaveBeenCalledWith('hiddenSeries', handler);
  });

  test('renders no DOM of its own', () => {
    const { container } = render(<Navigator chartType="bar" data={data} dimension="browser" chartId="t" containerRef={{ current: null }} getView={getView} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('attaches the data-navigator entry button into the container', async () => {
    const { getByTestId } = render(<Harness chartData={data} />);
    await waitFor(() => expect(getByTestId('dn-container').querySelector('button')).toBeTruthy());
  });

  test('does not attach navigation when there is no data', () => {
    const { getByTestId } = render(<Harness chartData={[]} />);
    expect(getByTestId('dn-container').querySelector('button')).toBeFalsy();
  });
});
