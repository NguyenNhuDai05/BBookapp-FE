import React, { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { WorkLocationFields } from '../WorkLocationFields';
import { DeviceLocationError, getCurrentLocationCandidate, reverseLocation } from '../../../services/locationService';
import type { LocationCandidate, OperatingArea } from '../../../types/location';
import { validateWorkLocation } from '../../../utils/workLocation';
jest.mock('../../ui/AppBottomSheet', () => ({ AppBottomSheet: ({ visible, children }: any) => visible ? children : null }));
jest.mock('../../../services/locationService', () => ({ ...jest.requireActual('../../../services/locationService'), getCurrentLocationCandidate: jest.fn(), reverseLocation: jest.fn() }));
jest.mock('../../../services/api', () => ({ api: { get: jest.fn() } }));
const changed = jest.fn();
const candidate: LocationCandidate = { latitude: 10.7, longitude: 106, accuracyQuality: 'normal', quality: 'specific', formattedAddress: '123 Nguyễn Trãi, TP.HCM', source: 'gps' };
function Form({ initial = { city: 'City' } }: { initial?: OperatingArea }) { const [value, setValue] = useState(initial); return <WorkLocationFields value={value} onChange={next => { setValue(next); changed(next); }} />; }
beforeEach(() => { jest.clearAllMocks(); (getCurrentLocationCandidate as jest.Mock).mockResolvedValue(candidate); });
const open = () => fireEvent.press(screen.getByRole('button', { name: /Chọn vị trí hoạt động|Thay đổi vị trí/ }));
const gps = async () => { await fireEvent.press(screen.getAllByText('Sử dụng vị trí hiện tại')[0]); await waitFor(() => expect(screen.getByRole('button', { name: 'Xác nhận vị trí' }).props.accessibilityState.disabled).toBe(false)); };
const confirm = () => fireEvent.press(screen.getByRole('button', { name: 'Xác nhận vị trí' }));
it('does not request GPS on mount and supports manual address-only consent', async () => {
  await render(<Form />); await open(); expect(getCurrentLocationCandidate).not.toHaveBeenCalled(); expect(validateWorkLocation({})).toBeUndefined();
  expect(screen.getByRole('button', { name: 'Xác nhận vị trí' }).props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(screen.getAllByText('Nhập vị trí thủ công')[0]);
  await fireEvent.changeText(screen.getByLabelText('Địa chỉ hoạt động'), 'Manual address');
  await fireEvent(screen.getByLabelText('Cho phép khách đến địa điểm này'), 'valueChange', true);
  expect(changed).not.toHaveBeenCalled(); await confirm();
  expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ workLocationAddress: 'Manual address', allowCustomerVisit: true, latitude: undefined }));
});
it.each(['123 Nguyễn Trãi, TP.HCM', 'Phường Bến Thành, TP.HCM', undefined])('confirms private operating GPS with label %s without workplace fields', async formattedAddress => {
  (getCurrentLocationCandidate as jest.Mock).mockResolvedValue({ ...candidate, formattedAddress, quality: formattedAddress ? 'area' : 'unknown' });
  await render(<Form />); await open(); await gps(); expect(changed).not.toHaveBeenCalled(); await confirm();
  const result = changed.mock.calls.at(-1)[0];
  expect(result).toMatchObject({ latitude: 10.7, longitude: 106, operatingLocationConfirmed: true, allowCustomerVisit: false });
  expect(result.workLocationAddress).toBeUndefined(); expect(result.workLocationName).toBeUndefined(); expect(validateWorkLocation(result)).toBeUndefined();
});
it('public full reverse address needs no retyping', async () => {
  await render(<Form />); await open(); await gps(); await fireEvent(screen.getByLabelText('Cho phép khách đến địa điểm này'), 'valueChange', true); await confirm();
  expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ workLocationAddress: candidate.formattedAddress, allowCustomerVisit: true, latitude: 10.7 }));
});
it('public partial reverse address allows optional details and preserves GPS', async () => {
  (getCurrentLocationCandidate as jest.Mock).mockResolvedValue({ ...candidate, formattedAddress: 'Phường Bến Thành', quality: 'area' });
  await render(<Form />); await open(); await gps(); await fireEvent(screen.getByLabelText('Cho phép khách đến địa điểm này'), 'valueChange', true);
  expect(screen.getByRole('button', { name: 'Xác nhận vị trí' }).props.accessibilityState.disabled).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'Thêm chi tiết địa điểm' }));
  await fireEvent.changeText(screen.getByLabelText('Chi tiết địa điểm MUA'), '123 Nguyễn Trãi'); await confirm();
  expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ workLocationAddress: 'Phường Bến Thành — 123 Nguyễn Trãi', latitude: 10.7, allowCustomerVisit: true }));
});
it('GPS to manual invalidates coordinates and does not attach the old point', async () => {
  await render(<Form />); await open(); await gps(); await fireEvent.press(screen.getAllByText('Nhập vị trí thủ công').at(-1)!);
  await fireEvent.changeText(screen.getByLabelText('Địa chỉ hoạt động'), 'Thủ Đức'); await confirm();
  expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ workLocationAddress: 'Thủ Đức', latitude: undefined, operatingLocationConfirmed: false }));
});
it('new private GPS replaces a public workplace only after confirmation and marks the required clear', async () => {
  await render(<Form initial={{ city: 'City', workLocationName: 'Old studio', workLocationAddress: 'Old address', allowCustomerVisit: true, latitude: 20, longitude: 100, operatingLocationConfirmed: true }} />);
  await open(); await gps(); expect(changed).not.toHaveBeenCalled(); await fireEvent(screen.getByLabelText('Cho phép khách đến địa điểm này'), 'valueChange', false); await confirm();
  expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ latitude: 10.7, longitude: 106, allowCustomerVisit: false, clearWorkLocation: true, workLocationAddress: undefined, workLocationName: undefined }));
});
it('cancel/late completion cannot update a confirmed profile', async () => {
  let complete!: (value: LocationCandidate) => void;
  (getCurrentLocationCandidate as jest.Mock).mockReturnValue(new Promise(resolve => { complete = resolve; }));
  await render(<Form initial={{ city: 'City', latitude: 20, longitude: 100, operatingLocationConfirmed: true }} />);
  await open(); await fireEvent.press(screen.getAllByText('Sử dụng vị trí hiện tại')[0]); await fireEvent.press(screen.getByText('Hủy'));
  await act(async () => complete(candidate)); expect(changed).not.toHaveBeenCalled(); expect(screen.queryByText(candidate.formattedAddress!)).toBeNull();
});
it('denied GPS permits manual location without a second permission request', async () => {
  (getCurrentLocationCandidate as jest.Mock).mockRejectedValue(new DeviceLocationError('DENIED', 'GPS denied'));
  await render(<Form />); await open(); await fireEvent.press(screen.getAllByText('Sử dụng vị trí hiện tại')[0]); await screen.findByText('BBook cần quyền vị trí để xác định nơi làm việc của bạn.');
  await fireEvent.press(screen.getAllByText('Nhập vị trí thủ công').at(-1)!); await fireEvent.changeText(screen.getByLabelText('Địa chỉ hoạt động'), 'Manual'); await confirm();
  expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ workLocationAddress: 'Manual', allowCustomerVisit: false })); expect(getCurrentLocationCandidate).toHaveBeenCalledTimes(1);
});
it.each([{ latitude: 10 }, { latitude: 0, longitude: 0 }, { latitude: 100, longitude: 106 }])('rejects invalid coordinates %o', coordinate => {
  expect(validateWorkLocation(coordinate)).toBeTruthy();
});
it('clears the location without deleting operating areas', async () => {
  await render(<Form initial={{ city: 'City', operatingProvinceCode: 79, operatingAreaIds: ['area'], workLocationAddress: 'Address' }} />);
  await fireEvent.press(screen.getByText('Xóa vị trí hoạt động'));
  expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ operatingAreaIds: ['area'], operatingProvinceCode: 79, clearWorkLocation: true, latitude: undefined }));
});
it.each([false, true])('confirms GPS during reverse loading with consent %s and empty optional details', async allowVisit => {
  let finish!: (value: LocationCandidate) => void;
  (getCurrentLocationCandidate as jest.Mock).mockImplementation((phase, _active, publish) => {
    publish({ ...candidate, formattedAddress: undefined, quality: 'unknown' }); phase('resolving');
    return new Promise(resolve => { finish = resolve; });
  });
  await render(<Form />); await open(); await gps();
  expect(screen.getByText('Đang tải tên địa chỉ...')).toBeTruthy();
  expect(screen.getByText('Đã xác định vị trí GPS')).toBeTruthy();
  await fireEvent(screen.getByLabelText('Cho phép khách đến địa điểm này'), 'valueChange', allowVisit);
  await confirm();
  const result = changed.mock.calls.at(-1)[0];
  expect(result).toMatchObject({ latitude: candidate.latitude, allowCustomerVisit: allowVisit });
  expect(validateWorkLocation(result)).toBeUndefined();
  if (allowVisit) expect(result.workLocationAddress).toBe('Vị trí hoạt động đã xác nhận bằng GPS');
  await act(async () => finish(candidate)); expect(changed).toHaveBeenCalledTimes(1);
});
it('retry address does not request GPS again', async () => {
  (getCurrentLocationCandidate as jest.Mock).mockResolvedValue({ ...candidate, formattedAddress: undefined });
  (reverseLocation as jest.Mock).mockResolvedValue(candidate);
  await render(<Form />); await open(); await gps(); await fireEvent.press(screen.getByText('Thử lại địa chỉ'));
  await screen.findByText(candidate.formattedAddress!);
  expect(getCurrentLocationCandidate).toHaveBeenCalledTimes(1); expect(reverseLocation).toHaveBeenCalledTimes(1);
});
it('manual to GPS commits only the new confirmed point', async () => {
  await render(<Form />); await open(); await fireEvent.press(screen.getByText('Nhập vị trí thủ công'));
  await fireEvent.changeText(screen.getByLabelText('Địa chỉ hoạt động'), 'Other address');
  await fireEvent.press(screen.getByText('Quay lại dùng GPS')); await screen.findByText(candidate.formattedAddress!);
  expect(changed).not.toHaveBeenCalled(); await confirm();
  expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ latitude: candidate.latitude, operatingLocationLabel: candidate.formattedAddress }));
});
it('GPS timeout retries GPS and enables confirmation after recovery', async () => {
  (getCurrentLocationCandidate as jest.Mock).mockRejectedValueOnce(new DeviceLocationError('TIMEOUT', 'Timeout'));
  await render(<Form />); await open(); await fireEvent.press(screen.getByText('Sử dụng vị trí hiện tại'));
  await screen.findByText('Chưa thể xác định vị trí.');
  expect(screen.getByRole('button', { name: 'Xác nhận vị trí' }).props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(screen.getByText('Thử lại')); await screen.findByText(candidate.formattedAddress!);
  await confirm(); expect(getCurrentLocationCandidate).toHaveBeenCalledTimes(2); expect(changed).toHaveBeenCalledTimes(1);
});
it.each(['BLOCKED', 'DISABLED'])('shows the correct settings action for %s', async code => {
  (getCurrentLocationCandidate as jest.Mock).mockRejectedValue(new DeviceLocationError(code as any, 'Unavailable'));
  await render(<Form />); await open(); await fireEvent.press(screen.getByText('Sử dụng vị trí hiện tại'));
  await screen.findByText(code === 'BLOCKED' ? 'Mở cài đặt' : 'Bật vị trí');
  expect(screen.getByRole('button', { name: 'Xác nhận vị trí' }).props.accessibilityState.disabled).toBe(true);
});
it('public GPS with failed reverse does not require optional details', async () => {
  (getCurrentLocationCandidate as jest.Mock).mockResolvedValue({ ...candidate, formattedAddress: undefined, quality: 'unknown' });
  await render(<Form />); await open(); await gps();
  await fireEvent(screen.getByLabelText('Cho phép khách đến địa điểm này'), 'valueChange', true);
  expect(screen.queryByText('Bổ sung địa điểm để khách tìm đến')).toBeNull(); await confirm();
  expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ workLocationAddress: 'Vị trí hoạt động đã xác nhận bằng GPS', latitude: candidate.latitude, allowCustomerVisit: true }));
});
it('a generic GPS snapshot cannot become a usable manual address when its point is removed', async () => {
  await render(<Form initial={{ city: 'City', latitude: 10.7, longitude: 106, operatingLocationConfirmed: true, workLocationAddress: 'Vị trí hoạt động đã xác nhận bằng GPS', allowCustomerVisit: true }} />);
  expect(screen.queryByText('Bỏ vị trí GPS')).toBeNull();
  await open(); await fireEvent.press(screen.getByText('Nhập vị trí thủ công'));
  expect(screen.getByLabelText('Địa chỉ hoạt động').props.value).toBe('');
  expect(screen.getByRole('button', { name: 'Xác nhận vị trí' }).props.accessibilityState.disabled).toBe(true);
});
