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
import React, { ReactElement } from 'react';

import { BigNumber } from '@rsc';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from 'test-utils/bindWithProps';

import Calendar from '@spectrum-icons/workflow/Calendar';
import Amusementpark from '@spectrum-icons/workflow/Amusementpark';
import { Icon } from '@adobe/react-spectrum';

export default {
	title: 'RSC/BigNumber',
	component: BigNumber,
};

const BigNumberStory: StoryFn<typeof BigNumber> = (args): ReactElement => {
	return <BigNumber {...args} />;
};

const BasicHorizonal = bindWithProps(BigNumberStory);
BasicHorizonal.args = {
	orientation: 'horizontal',
	value: 2555,
	label: 'Visitors',
};

const BasicVertical = bindWithProps(BigNumberStory);
BasicVertical.args = {
	orientation: 'vertical',
	value: 2555,
	label: 'Visitors',
};

const IconHorizonal = bindWithProps(BigNumberStory);
IconHorizonal.args = {
	icon: <Icon><Calendar/></Icon>,
	orientation: 'horizontal',
	value: 2555,
	label: 'Visitors',
};

const IconVertical = bindWithProps(BigNumberStory);
IconVertical.args = {
	icon: (<Icon><Amusementpark size="L"></Amusementpark></Icon>),
	orientation: 'vertical',
	value: 2555,
	label: 'Visitors',
};

const NullData = bindWithProps(BigNumberStory);
NullData.args = {
	value: null,
	orientation: 'horizontal',
	label: 'Visitors'
}

const UndefinedData = bindWithProps(BigNumberStory);
UndefinedData.args = {
	value: undefined,
	orientation: 'horizontal',
	label: 'Visitors'
}

const compactNumberFormat = () => {
	return new Intl.NumberFormat('en-US', { style: 'decimal', notation: 'compact', compactDisplay: 'short' });
};

const CompactNumberHorizontal = bindWithProps(BigNumberStory);
CompactNumberHorizontal.args = {
	orientation: 'horizontal',
	value: 2555,
	label: 'Visitors',
	numberFormat: compactNumberFormat(),
};

const CompactNumberVertical = bindWithProps(BigNumberStory);
CompactNumberVertical.args = {
	orientation: 'vertical',
	value: 2555,
	label: 'Visitors',
	numberFormat: compactNumberFormat(),
};

const percentNumberFormat = () => {
	return new Intl.NumberFormat('en-US', { style: 'percent' });
};

const PercentNumberHorizontal = bindWithProps(BigNumberStory);
PercentNumberHorizontal.args = {
	orientation: 'horizontal',
	value: 0.2555,
	label: 'Capacity',
	numberFormat: percentNumberFormat(),
};

const PercentNumberVertical = bindWithProps(BigNumberStory);
PercentNumberVertical.args = {
	orientation: 'vertical',
	value: 0.2555,
	label: 'Capacity',
	numberFormat: percentNumberFormat(),
};

const currencyNumberFormat = () => {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
};

const CurrencyNumberHorizontal = bindWithProps(BigNumberStory);
CurrencyNumberHorizontal.args = {
	orientation: 'horizontal',
	value: 25.55,
	label: 'Sales',
	numberFormat: currencyNumberFormat(),
};

const CurrencyNumberVertical = bindWithProps(BigNumberStory);
CurrencyNumberVertical.args = {
	orientation: 'vertical',
	value: 25.55,
	label: 'Sales',
	numberFormat: currencyNumberFormat(),
};

const groupedNumberFormat = () => {
	return new Intl.NumberFormat('en-US', { style: 'decimal', useGrouping: true });
};

const GroupedNumberHorizontal = bindWithProps(BigNumberStory);
GroupedNumberHorizontal.args = {
	orientation: 'horizontal',
	value: 2555,
	label: 'Visitors',
	numberFormat: groupedNumberFormat(),
};

const GroupedNumberVertical = bindWithProps(BigNumberStory);
GroupedNumberVertical.args = {
	orientation: 'vertical',
	value: 2555,
	label: 'Visitor',
	numberFormat: groupedNumberFormat(),
};

export {
	BasicHorizonal,
	BasicVertical,
	IconHorizonal,
	IconVertical,
	CompactNumberHorizontal,
	CompactNumberVertical,
	PercentNumberHorizontal,
	PercentNumberVertical,
	CurrencyNumberHorizontal,
	CurrencyNumberVertical,
	GroupedNumberHorizontal,
	GroupedNumberVertical,
	NullData,
	UndefinedData
};
