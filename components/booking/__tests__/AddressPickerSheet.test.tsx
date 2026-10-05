import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AddressPickerSheet } from '../AddressPickerSheet';
import { DeviceLocationError, getDeviceLocation } from '../../../services/locationService';
jest.mock('../../ui/AppBottomSheet', () => ({ AppBottomSheet: ({ visible, children }: any) => visible ? children : null }));
jest.mock('../../../services/locationService', () => {
  const actual = jest.requireActual('../../../services/locationService');
  return { ...actual, getDeviceLocation: jest.fn() };
});
jest.mock('../../../services/api', () => ({ api: { get: jest.fn(), post: jest.fn() } }));
const coords = { latitude: 10.78, longitude: 106.7 };
beforeEach(() => { jest.clearAllMocks(); (getDeviceLocation as jest.Mock).mockResolvedValue(coords); });
it('does not request GPS on mount and accepts a manual address without coordinates', async () => {
  const select = jest.fn();
  await render(<AddressPickerSheet visible value="" onClose={jest.fn()} onSelectAddress={select} />);
  expect(getDeviceLocation).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Địa chỉ thực hiện'), '  25 Nguyễn Văn A  ');
  await fireEvent.press(screen.getByText('Xác nhận địa chỉ'));
  expect(select).toHaveBeenCalledWith('25 Nguyễn Văn A', undefined);
});
it('GPS does not replace the address and coordinates survive manual edits and confirmation', async () => {
  const select = jest.fn();
  await render(<AddressPickerSheet visible value="Địa chỉ đã nhập" onClose={jest.fn()} onSelectAddress={select} />);
  await fireEvent.press(screen.getByText('Dùng vị trí hiện tại'));
  expect(screen.getByDisplayValue('Địa chỉ đã nhập')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Địa chỉ thực hiện'), 'Địa chỉ đã kiểm tra');
  await fireEvent.press(screen.getByText('Xác nhận địa chỉ'));
  expect(select).toHaveBeenCalledWith('Địa chỉ đã kiểm tra', coords);
});
it('GPS alone cannot confirm an empty address', async () => {
  await render(<AddressPickerSheet visible value="" onClose={jest.fn()} onSelectAddress={jest.fn()} />);
  await fireEvent.press(screen.getByText('Dùng vị trí hiện tại'));
  expect(screen.getByRole('button', { name: 'Xác nhận địa chỉ' }).props.accessibilityState.disabled).toBe(true);
});
it('GPS denied does not block manual confirmation', async () => {
  (getDeviceLocation as jest.Mock).mockRejectedValue(new DeviceLocationError('DENIED', 'Chưa có quyền vị trí'));
  const select = jest.fn();
  await render(<AddressPickerSheet visible value="Địa chỉ thủ công" onClose={jest.fn()} onSelectAddress={select} />);
  await fireEvent.press(screen.getByText('Dùng vị trí hiện tại'));
  expect(screen.getByText('Chưa có quyền vị trí')).toBeTruthy();
  await fireEvent.press(screen.getByText('Xác nhận địa chỉ'));
  expect(select).toHaveBeenCalledWith('Địa chỉ thủ công', undefined);
});
it('clears optional GPS without clearing the address', async () => {
  const select = jest.fn();
  await render(<AddressPickerSheet visible value="Địa chỉ thủ công" coordinates={coords} onClose={jest.fn()} onSelectAddress={select} />);
  await fireEvent.press(screen.getByText('Bỏ vị trí GPS'));
  await fireEvent.press(screen.getByText('Xác nhận địa chỉ'));
  expect(select).toHaveBeenCalledWith('Địa chỉ thủ công', undefined);
});
it('closing without confirmation never saves pending GPS', async () => {
  const select = jest.fn();
  const close = jest.fn();
  await render(<AddressPickerSheet visible value="Địa chỉ thủ công" onClose={close} onSelectAddress={select} />);
  await fireEvent.press(screen.getByText('Dùng vị trí hiện tại'));
  expect(select).not.toHaveBeenCalled();
});
