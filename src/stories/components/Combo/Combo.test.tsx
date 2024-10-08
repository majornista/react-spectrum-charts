/*
 * Copyright 2024 Adobe. All rights reserved.
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

import '@matchMediaMock';
import { Combo } from '@rsc/alpha';
import { findAllMarksByGroupName, findChart, render } from '@test-utils';

import { Basic } from './Combo.story';

describe('Combo', () => {
	// Combo is not a real React component. This test just provides test coverage for sonarqube
	test('Combo pseudo element', () => {
		render(<Combo />);
	});

	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// get bars
		const bars = await findAllMarksByGroupName(chart, 'combo0Bar0');
		expect(bars.length).toEqual(7);

		// get lines
		const lines = await findAllMarksByGroupName(chart, 'combo0Line0');
		expect(lines.length).toEqual(1);
	});
});
