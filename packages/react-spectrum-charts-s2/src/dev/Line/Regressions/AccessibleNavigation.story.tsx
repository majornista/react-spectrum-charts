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
import { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart.js';
import { Axis, ChartInspect, ChartPopover, Legend, Line } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../test-utils/index.js';

export default {
  title: 'React Spectrum Charts 2/Line/Regressions/Accessible Navigation',
  component: Line,
};

const data = [0, 0, 86400000].flatMap((datetime, index) =>
  [7, 8].flatMap((series) =>
    ['Current', 'Previous'].map((period) => ({
      datetime,
      series,
      period,
      value: 10 + index * 5 + series + (period === 'Current' ? 10 : 0),
    }))
  )
);

const FacetedNavigationStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ data, accessibleNavigation: true, height: 400, minWidth: 300, maxWidth: 800 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" labelFormat="time" title="Date" />
      <Axis position="left" title="Value" />
      <Line {...args}>
        <ChartInspect />
        <ChartPopover>{(datum) => <div>{String(datum.value)}</div>}</ChartPopover>
      </Line>
      <Line opacity={{ value: 0.3 }} showHoverLabel={false} />
      <Legend keys={['series']} />
    </Chart>
  );
};

const FacetedNavigation = bindWithProps(FacetedNavigationStory);
FacetedNavigation.args = { color: 'series', lineType: 'period' };
FacetedNavigation.parameters = {
  regression: {
    description: 'Default Line fields, numeric facets, duplicate x values, and multiple marks retain consistent keyboard focus and legend emphasis.',
    pr: 4,
  },
};

export { FacetedNavigation };