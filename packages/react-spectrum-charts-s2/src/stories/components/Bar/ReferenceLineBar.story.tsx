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
import React, { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartInspect, ChartPopover } from '../../../components';
import { ReferenceLine } from '../../../components/ReferenceLine';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';

export default {
  title: 'React Spectrum Charts 2/Bar/Features/Reference Line',
  component: ReferenceLine,
};

// S2 reference lines are horizontal-only (left/right axes only).
const data = [
  { x: 1, y: 1, series: 0 },
  { x: 2, y: 2, series: 0 },
  { x: 3, y: 3, series: 0 },
  { x: 4, y: 4, series: 0 },
  { x: 5, y: 5, series: 0 },
];

const ReferenceLineStory: StoryFn<typeof ReferenceLine> = (args): ReactElement => {
  const chartProps = useChartProps({ data, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" baseline ticks>
        <ReferenceLine {...args} />
      </Axis>
      <Axis position="bottom" baseline ticks />
      <Bar dimension="y" metric="x" />
    </Chart>
  );
};

const Basic = bindWithProps(ReferenceLineStory);
Basic.args = {
  value: 3,
};

const Label = bindWithProps(ReferenceLineStory);
Label.args = {
  value: 3,
  label: 'Target',
};

// Categorical dimension so keyboard-nav node ids match the bars' values (numeric wouldn't strict-equal the string id).
const accessibleNavData = [
  { browser: 'Chrome', downloads: 27 },
  { browser: 'Firefox', downloads: 8 },
  { browser: 'Safari', downloads: 12 },
  { browser: 'Edge', downloads: 4 },
];

const dialogContent = (datum) => (
  <div>
    <div>Browser: {datum.browser}</div>
    <div>Downloads: {datum.downloads}</div>
  </div>
);

// Reference line drawn over a keyboard-navigable single-series bar (`accessibleNavigation`).
const AccessibleNavigationStory: StoryFn<typeof ReferenceLine> = (args): ReactElement => {
  const chartProps = useChartProps({ data: accessibleNavData, width: 600, accessibleNavigation: true });
  return (
    <Chart {...chartProps}>
      <Axis position="left" baseline ticks grid title="Downloads">
        <ReferenceLine {...args} />
      </Axis>
      <Axis position="bottom" baseline title="Browser" />
      <Bar dimension="browser" metric="downloads">
        <ChartInspect>{dialogContent}</ChartInspect>
        <ChartPopover width={200}>{dialogContent}</ChartPopover>
      </Bar>
    </Chart>
  );
};

const AccessibleNavigation = bindWithProps(AccessibleNavigationStory);
AccessibleNavigation.args = {
  value: 20,
  label: 'Target',
};

export { AccessibleNavigation, Basic, Label };
