/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Scatter, spectrumColors } from '@rsc';
import { findAllMarksByGroupName, findChart, getAllLegendEntries, render } from '@test-utils';

import { Basic, Color, Opacity, Size } from './Scatter.story';

const colors = spectrumColors.light;

describe('Scatter', () => {
	// Scatter is not a real React component. This is test just provides test coverage for sonarqube
	test('Scatter pseudo element', () => {
		render(<Scatter />);
	});

	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'scatter0');
		expect(points).toHaveLength(16);
	});

	test('Color renders properly', async () => {
		render(<Color {...Color.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'scatter0');
		expect(points).toHaveLength(16);
		expect(points[0]).toHaveAttribute('fill', colors['categorical-100']);
		expect(points[6]).toHaveAttribute('fill', colors['categorical-200']);
		expect(points[11]).toHaveAttribute('fill', colors['categorical-300']);

		const legendEntries = getAllLegendEntries(chart);
		expect(legendEntries).toHaveLength(3);
	});

	test('Opacity renders properly', async () => {
		render(<Opacity {...Opacity.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'scatter0');
		expect(points[0]).toHaveAttribute('fill-opacity', '0.5');
	});

	test('Size renders properly', async () => {
		render(<Size {...Size.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'scatter0');

		// small circle (radius 3)
		expect(points[0]).toHaveAttribute('d', 'M3,0A3,3,0,1,1,-3,0A3,3,0,1,1,3,0');
		// big circle (radius 8)
		expect(points[15]).toHaveAttribute('d', 'M8,0A8,8,0,1,1,-8,0A8,8,0,1,1,8,0');

		const legendEntries = getAllLegendEntries(chart);
		expect(legendEntries).toHaveLength(6);
	});
});