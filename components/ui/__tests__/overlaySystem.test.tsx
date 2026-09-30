import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { OverlayProvider } from '../OverlayProvider';
import { AppModal } from '../AppModal';
import { AppBottomSheet } from '../AppBottomSheet';
import { DialogHost } from '../DialogHost';
import { AppAlert, dialogStore } from '../dialogStore';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } };
const Wrapper = ({ children }: React.PropsWithChildren) => <SafeAreaProvider initialMetrics={metrics}><OverlayProvider>{children}</OverlayProvider></SafeAreaProvider>;
beforeEach(() => { while (dialogStore.getSnapshot()) dialogStore.dismiss(dialogStore.getSnapshot()!.id); });

it('blocks double submit and Back while an async confirmation is pending', async () => {
  let finish!: () => void;
  const onClose = jest.fn();
  const onPress = jest.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  await render(<AppModal visible variant="destructive" title="Xóa bài viết?" onClose={onClose}
    primaryAction={{ label: 'Xóa', onPress }} secondaryAction={{ label: 'Hủy', onPress: onClose }} />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Xóa' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Xóa' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Hủy' }));
  await fireEvent(screen.getByTestId('app-overlay-host'), 'requestClose', {});
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
  await act(async () => { finish(); });
});

it('shows a queued alert above an open sheet using one native modal, then restores the sheet', async () => {
  await render(<><AppBottomSheet visible title="Biểu mẫu" onClose={jest.fn()}><Text>Nội dung form</Text></AppBottomSheet><DialogHost /></>, { wrapper: Wrapper });
  await act(async () => { AppAlert.alert('Mất kết nối', 'Network Error'); });
  expect(screen.getByText('Mất kết nối')).toBeTruthy();
  expect(screen.queryByText('Biểu mẫu')).toBeNull();
  expect(screen.getAllByTestId('app-overlay-host')).toHaveLength(1);
  await fireEvent.press(screen.getByRole('button', { name: 'Đã hiểu' }));
  expect(screen.getByText('Biểu mẫu')).toBeTruthy();
});

it('Back cancels a queued destructive dialog without invoking its confirmation callback', async () => {
  const confirm = jest.fn(); const cancel = jest.fn();
  await render(<DialogHost />, { wrapper: Wrapper });
  await act(async () => { AppAlert.alert('Xóa tài khoản', 'Xác nhận?', [{ text: 'Hủy', style: 'cancel', onPress: cancel }, { text: 'Xóa', style: 'destructive', onPress: confirm }]); });
  await fireEvent(screen.getByTestId('app-overlay-host'), 'requestClose', {});
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(confirm).not.toHaveBeenCalled();
});

it('keeps notification order and original navigation callbacks', async () => {
  const navigate = jest.fn();
  await render(<DialogHost />, { wrapper: Wrapper });
  await act(async () => {
    AppAlert.alert('Thành công', 'Đã cập nhật.', [{ text: 'Xem lịch hẹn', onPress: navigate }]);
    AppAlert.alert('Thông báo tiếp theo', 'Nội dung');
  });
  await fireEvent.press(screen.getByRole('button', { name: 'Xem lịch hẹn' }));
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Thông báo tiếp theo')).toBeTruthy();
});
