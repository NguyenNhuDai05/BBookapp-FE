import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { MonthYearPicker } from '../MonthYearPicker';
jest.mock('../../ui/AppBottomSheet', () => {
  const { View } = require('react-native');
  return { AppBottomSheet: ({ children }: any) => <View>{children}</View> };
});
it('selects another month and year before confirming', async () => {
  const select = jest.fn(); const close = jest.fn();
  await render(<MonthYearPicker month={new Date(2026, 9, 1)} onSelect={select} onClose={close} />);
  await fireEvent.changeText(screen.getByLabelText('Năm'), '2028');
  await fireEvent.press(screen.getByText('Tháng 2'));
  expect(select).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Xem lịch'));
  expect(select).toHaveBeenCalledWith(new Date(2028, 1, 1));
  expect(close).toHaveBeenCalledTimes(1);
});
it('rejects incomplete years', async () => {
  const select = jest.fn();
  await render(<MonthYearPicker month={new Date(2026, 9, 1)} onSelect={select} onClose={jest.fn()} />);
  await fireEvent.changeText(screen.getByLabelText('Năm'), '20');
  await fireEvent.press(screen.getByText('Xem lịch'));
  expect(select).not.toHaveBeenCalled();
});
