import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AddressPickerSheet } from '../AddressPickerSheet';
import { DeviceLocationError, getCurrentLocationCandidate, reverseLocation } from '../../../services/locationService';
import type { LocationCandidate } from '../../../types/location';
jest.mock('../../ui/AppBottomSheet', () => ({ AppBottomSheet: ({ visible, children }: any) => visible ? children : null }));
jest.mock('../../../services/locationService', () => ({ ...jest.requireActual('../../../services/locationService'), getCurrentLocationCandidate: jest.fn(), reverseLocation: jest.fn() }));
jest.mock('../../../services/api', () => ({ api: { get: jest.fn(), post: jest.fn() } }));
const coords = { latitude: 10.78, longitude: 106.7 };
const candidate: LocationCandidate = { ...coords, formattedAddress: '123 Nguyễn Trãi, TP.HCM', accuracyQuality: 'normal', quality: 'specific', source: 'gps' };
beforeEach(() => { jest.clearAllMocks(); (getCurrentLocationCandidate as jest.Mock).mockResolvedValue(candidate); });
const confirm = () => screen.getByRole('button', { name: 'Xác nhận địa điểm' });
it('does not request GPS on mount and confirms a manual destination without coordinates', async () => {
  const select = jest.fn(); await render(<AddressPickerSheet visible value="" onClose={jest.fn()} onSelectAddress={select} />);
  expect(getCurrentLocationCandidate).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Nhập địa chỉ khác'));
  await fireEvent.changeText(screen.getByLabelText('Địa chỉ thực hiện'), ' 25 Nguyễn Văn A ');
  await fireEvent.press(confirm()); expect(select).toHaveBeenCalledWith('25 Nguyễn Văn A', undefined, '');
});
it.each(['123 Nguyễn Trãi, TP.HCM', 'Phường Bến Thành, TP.HCM'])('autofills %s and allows GPS confirmation with no details', async formattedAddress => {
  (getCurrentLocationCandidate as jest.Mock).mockResolvedValue({ ...candidate, formattedAddress });
  const select = jest.fn(); await render(<AddressPickerSheet visible value="" onClose={jest.fn()} onSelectAddress={select} />);
  await fireEvent.press(screen.getByText('Sử dụng vị trí hiện tại')); await screen.findByText(formattedAddress);
  expect(select).not.toHaveBeenCalled(); expect(screen.queryByLabelText('Địa chỉ thực hiện')).toBeNull();
  await fireEvent.press(confirm()); expect(select).toHaveBeenCalledWith(formattedAddress, coords, '');
});
it('optional details preserve GPS, while changing main address drops it', async () => {
  const select = jest.fn(); await render(<AddressPickerSheet visible value="" onClose={jest.fn()} onSelectAddress={select} />);
  await fireEvent.press(screen.getByText('Sử dụng vị trí hiện tại')); await screen.findByText(candidate.formattedAddress!);
  await fireEvent.changeText(screen.getByLabelText('Chi tiết địa điểm'), 'Tầng 12');
  await fireEvent.press(confirm()); expect(select).toHaveBeenLastCalledWith(candidate.formattedAddress, coords, 'Tầng 12');
  await fireEvent.press(screen.getByText('Chỉnh sửa'));
  await fireEvent.changeText(screen.getByLabelText('Địa chỉ thực hiện'), 'Thủ Đức');
  await fireEvent.press(confirm()); expect(select).toHaveBeenLastCalledWith('Thủ Đức', undefined, 'Tầng 12');
});
it('GPS to manual clears coordinates even if the label is unchanged', async () => {
  const select = jest.fn(); await render(<AddressPickerSheet visible value="Existing" coordinates={coords} onClose={jest.fn()} onSelectAddress={select} />);
  await fireEvent.press(screen.getByText('Nhập địa chỉ khác')); await fireEvent.press(confirm()); expect(select).toHaveBeenCalledWith('Existing', undefined, '');
});
it('manual to GPS does not save before confirmation', async () => {
  const select = jest.fn(); await render(<AddressPickerSheet visible value="Manual" onClose={jest.fn()} onSelectAddress={select} />);
  await fireEvent.press(screen.getByText('Sử dụng vị trí hiện tại')); await screen.findByText(candidate.formattedAddress!);
  expect(select).not.toHaveBeenCalled(); await fireEvent.press(confirm()); expect(select).toHaveBeenCalledWith(candidate.formattedAddress, coords, '');
});
it('reverse failure retains the candidate for a reverse-only retry', async () => {
  (getCurrentLocationCandidate as jest.Mock).mockResolvedValue({ ...candidate, formattedAddress: undefined, quality: 'unknown' });
  (reverseLocation as jest.Mock).mockResolvedValue(candidate);
  const select = jest.fn(); await render(<AddressPickerSheet visible value="" onClose={jest.fn()} onSelectAddress={select} />);
  await fireEvent.press(screen.getByText('Sử dụng vị trí hiện tại')); await screen.findByText(/chưa tìm được địa chỉ/);
  expect(confirm().props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(screen.getByText('Thử tìm địa chỉ lại')); await screen.findByText(candidate.formattedAddress!);
  expect(getCurrentLocationCandidate).toHaveBeenCalledTimes(1);
  await fireEvent.press(confirm()); expect(select).toHaveBeenCalledWith(candidate.formattedAddress, coords, '');
});
it.each(['DENIED', 'BLOCKED', 'DISABLED', 'TIMEOUT'])('%s leaves the previous confirmed draft intact and permits manual entry', async code => {
  (getCurrentLocationCandidate as jest.Mock).mockRejectedValue(new DeviceLocationError(code as any, 'GPS unavailable'));
  const select = jest.fn(); await render(<AddressPickerSheet visible value="Existing" coordinates={coords} onClose={jest.fn()} onSelectAddress={select} />);
  await fireEvent.press(screen.getByText('Sử dụng vị trí hiện tại')); await screen.findByText('GPS unavailable'); expect(select).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Nhập địa chỉ khác')); await fireEvent.press(confirm()); expect(select).toHaveBeenCalledWith('Existing', undefined, '');
});
it.each(['normal', 'approximate', 'unreliable'])('uses %s accuracy without exposing numbers', async accuracyQuality => {
  (getCurrentLocationCandidate as jest.Mock).mockResolvedValue({ ...candidate, accuracyQuality, accuracyMeters: 600 });
  await render(<AddressPickerSheet visible value="" onClose={jest.fn()} onSelectAddress={jest.fn()} />);
  await fireEvent.press(screen.getByText('Sử dụng vị trí hiện tại')); await screen.findByText(candidate.formattedAddress!);
  expect(confirm().props.accessibilityState.disabled).toBe(accuracyQuality === 'unreliable'); expect(screen.queryByText(/600/)).toBeNull();
});
it('late GPS/reverse completion after closing cannot commit or affect a reopened sheet', async () => {
  let complete!: (value: LocationCandidate) => void;
  (getCurrentLocationCandidate as jest.Mock).mockReturnValue(new Promise(resolve => { complete = resolve; }));
  const select = jest.fn(); const props = { value: 'Existing', onClose: jest.fn(), onSelectAddress: select };
  const view = await render(<AddressPickerSheet visible {...props} />);
  await fireEvent.press(screen.getByText('Sử dụng vị trí hiện tại'));
  await view.rerender(<AddressPickerSheet visible={false} {...props} />);
  await act(async () => complete(candidate)); await view.rerender(<AddressPickerSheet visible {...props} />);
  expect(screen.getByText('Existing')).toBeTruthy(); expect(screen.queryByText(candidate.formattedAddress!)).toBeNull(); expect(select).not.toHaveBeenCalled();
});
it('switching to manual invalidates an in-flight result', async () => {
  let complete!: (value: LocationCandidate) => void;
  (getCurrentLocationCandidate as jest.Mock).mockReturnValue(new Promise(resolve => { complete = resolve; }));
  const select = jest.fn(); await render(<AddressPickerSheet visible value="Manual" onClose={jest.fn()} onSelectAddress={select} />);
  await fireEvent.press(screen.getByText('Sử dụng vị trí hiện tại')); await fireEvent.press(screen.getByText('Nhập địa chỉ khác'));
  await act(async () => complete(candidate)); await fireEvent.press(confirm()); expect(select).toHaveBeenCalledWith('Manual', undefined, '');
});
it('blocks a composed address exceeding the backend limit', async () => {
  await render(<AddressPickerSheet visible value={'A'.repeat(499)} onClose={jest.fn()} onSelectAddress={jest.fn()} />);
  await fireEvent.changeText(screen.getByLabelText('Chi tiết địa điểm'), 'Apartment'); expect(confirm().props.accessibilityState.disabled).toBe(true);
});
