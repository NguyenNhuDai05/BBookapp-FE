import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { BookingLocationCard } from '../BookingLocationCard';
import { openExternalMap } from '../../../services/externalNavigation';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
jest.mock('../../../services/externalNavigation', () => ({
  ...jest.requireActual('../../../services/externalNavigation'), openExternalMap: jest.fn(),
}));
const booking = { address: '25 Nguyễn Văn A', serviceLatitude: 10.78, serviceLongitude: 106.7, note: 'Tầng 12, căn 12.05' };
beforeEach(() => {
  jest.clearAllMocks(); jest.replaceProperty(Platform, 'OS', 'android');
  jest.mocked(Clipboard.setStringAsync).mockResolvedValue(true);
  jest.mocked(openExternalMap).mockResolvedValue(true);
});
afterEach(() => jest.restoreAllMocks());
it('shows an authorized snapshot and notes but never opens/copies on mount', async () => {
  await render(<BookingLocationCard authorized booking={booking} />);
  expect(screen.getByText(booking.address)).toBeTruthy();
  expect(screen.getByText(booking.note)).toBeTruthy();
  expect(openExternalMap).not.toHaveBeenCalled();
  expect(Clipboard.setStringAsync).not.toHaveBeenCalled();
});
it('copies only the human-readable address with feedback', async () => {
  await render(<BookingLocationCard authorized booking={booking} />);
  await fireEvent.press(screen.getByText('Sao chép địa chỉ'));
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(booking.address);
  expect(screen.getByText('Đã sao chép địa chỉ')).toBeTruthy();
});
it('hands only the booking snapshot to the external map', async () => {
  await render(<BookingLocationCard authorized booking={booking} />);
  await fireEvent.press(screen.getByText('Mở bản đồ'));
  expect(openExternalMap).toHaveBeenCalledWith({ address: booking.address, latitude: booking.serviceLatitude, longitude: booking.serviceLongitude, label: undefined });
});
it('keeps copy available when there is no map handler', async () => {
  jest.mocked(openExternalMap).mockResolvedValue(false);
  await render(<BookingLocationCard authorized booking={booking} />);
  await fireEvent.press(screen.getByText('Mở bản đồ'));
  expect(screen.getByText('Không mở được ứng dụng bản đồ. Bạn có thể sao chép địa chỉ.')).toBeTruthy();
  await fireEvent.press(screen.getByText('Sao chép địa chỉ'));
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(booking.address);
});
it.each([false, 'reject'])('handles clipboard failure %s', async failure => {
  if (failure === false) jest.mocked(Clipboard.setStringAsync).mockResolvedValue(false);
  else jest.mocked(Clipboard.setStringAsync).mockRejectedValue(new Error('permission'));
  await render(<BookingLocationCard authorized booking={booking} />);
  await fireEvent.press(screen.getByText('Sao chép địa chỉ'));
  expect(screen.getByText('Không thể sao chép địa chỉ. Vui lòng thử lại.')).toBeTruthy();
});
it('hides address, GPS, notes and actions from a non-participant', async () => {
  await render(<BookingLocationCard authorized={false} booking={booking} />);
  expect(screen.queryByText(booking.address)).toBeNull();
  expect(screen.queryByText(booking.note)).toBeNull();
  expect(screen.queryByText('Mở bản đồ')).toBeNull();
  expect(screen.queryByText('Sao chép địa chỉ')).toBeNull();
});
it('supports an address-only snapshot without forcing GPS', async () => {
  await render(<BookingLocationCard authorized booking={{ address: booking.address }} />);
  await fireEvent.press(screen.getByText('Mở bản đồ'));
  expect(openExternalMap).toHaveBeenCalledWith({ address: booking.address, latitude: undefined, longitude: undefined, label: undefined });
});
it('keeps legacy GPS-only navigation but hides copy for an empty address', async () => {
  await render(<BookingLocationCard authorized booking={{ ...booking, address: '' }} />);
  expect(screen.getByText('Mở bản đồ')).toBeTruthy();
  expect(screen.queryByText('Sao chép địa chỉ')).toBeNull();
});
it('empty legacy data renders a fallback without map or copy', async () => {
  await render(<BookingLocationCard authorized booking={{ address: '' }} />);
  expect(screen.getByText('Chưa có địa chỉ trong lịch đặt này.')).toBeTruthy();
  expect(screen.queryByText('Mở bản đồ')).toBeNull();
  expect(screen.queryByText('Sao chép địa chỉ')).toBeNull();
});
it('renders an explicit workplace snapshot without reading a live MUA profile', async () => {
  await render(<BookingLocationCard authorized booking={{ ...booking, serviceLocationType: 'MUA_WORK_LOCATION', serviceLocationName: 'Daisy Makeup Studio' }} />);
  expect(screen.getByText('Nơi làm việc của MUA')).toBeTruthy();
  expect(screen.getByText('Daisy Makeup Studio')).toBeTruthy();
  await fireEvent.press(screen.getByText('Mở bản đồ'));
  expect(openExternalMap).toHaveBeenCalledWith(expect.objectContaining({ address: booking.address, latitude: booking.serviceLatitude, label: 'Daisy Makeup Studio' }));
});
it('web retains copy without forcing a provider URL', async () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  await render(<BookingLocationCard authorized booking={booking} />);
  expect(screen.getByText('Sao chép địa chỉ')).toBeTruthy();
  expect(screen.queryByText('Mở bản đồ')).toBeNull();
});
