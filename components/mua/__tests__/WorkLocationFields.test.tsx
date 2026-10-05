import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { WorkLocationFields } from '../WorkLocationFields';
import { DeviceLocationError, getDeviceLocation } from '../../../services/locationService';
import type { OperatingArea } from '../../../types/location';
import { validateWorkLocation } from '../../../utils/workLocation';
jest.mock('../../../services/locationService', () => ({ ...jest.requireActual('../../../services/locationService'), getDeviceLocation: jest.fn() }));
jest.mock('../../../services/api', () => ({ api: { get: jest.fn() } }));
const changed = jest.fn();
function Form({ initial = { city: 'City' } }: { initial?: OperatingArea }) { const [value, setValue] = useState(initial); return <WorkLocationFields value={value} onChange={next => { setValue(next); changed(next); }} />; }
beforeEach(() => { jest.clearAllMocks(); (getDeviceLocation as jest.Mock).mockResolvedValue({ latitude: 10.7, longitude: 106 }); });
it('does not request GPS on mount and supports optional address-only consent', async () => {
  await render(<Form />); expect(getDeviceLocation).not.toHaveBeenCalled();
  expect(validateWorkLocation({})).toBeUndefined();
  await fireEvent.changeText(screen.getByLabelText('Địa chỉ nơi làm việc'), 'Studio address');
  await fireEvent(screen.getByLabelText('Cho phép khách đến nơi làm việc'), 'valueChange', true);
  expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ workLocationAddress: 'Studio address', allowCustomerVisit: true }));
  expect(validateWorkLocation(changed.mock.calls.at(-1)[0])).toBeUndefined();
});
it('GPS is independent of address and name, and never enables consent automatically', async () => {
  await render(<Form />); await fireEvent.changeText(screen.getByLabelText('Địa chỉ nơi làm việc'), 'Original address');
  await fireEvent.press(screen.getByText('Dùng vị trí hiện tại')); await waitFor(() => expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ latitude: 10.7, longitude: 106, workLocationAddress: 'Original address' })));
  await fireEvent.changeText(screen.getByLabelText('Địa chỉ nơi làm việc'), 'Edited address');
  expect(changed.mock.calls.at(-1)[0].latitude).toBe(10.7); expect(changed.mock.calls.at(-1)[0].allowCustomerVisit).not.toBe(true);
});
it('denied GPS still permits manual address', async () => {
  (getDeviceLocation as jest.Mock).mockRejectedValue(new DeviceLocationError('DENIED', 'GPS denied; manual address is available'));
  await render(<Form />); await fireEvent.press(screen.getByText('Dùng vị trí hiện tại')); await screen.findByText('GPS denied; manual address is available');
  await fireEvent.changeText(screen.getByLabelText('Địa chỉ nơi làm việc'), 'Manual address'); expect(validateWorkLocation(changed.mock.calls.at(-1)[0])).toBeUndefined();
});
it('clears workplace atomically without deleting operating areas', async () => {
  await render(<Form initial={{ city: 'City', operatingProvinceCode: 79, operatingAreaIds: ['area'], workLocationName: 'Studio', workLocationAddress: 'Address', allowCustomerVisit: true, latitude: 10.7, longitude: 106, operatingLocationConfirmed: true }} />);
  await fireEvent.press(screen.getByText('Xóa nơi làm việc'));
  expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ operatingAreaIds: ['area'], operatingProvinceCode: 79, workLocationName: '', workLocationAddress: '', latitude: undefined, longitude: undefined, operatingLocationConfirmed: false, allowCustomerVisit: false, clearWorkLocation: true }));
});
it('requires address for new GPS and rejects partial, zero or invalid GPS', () => {
  expect(validateWorkLocation({ workLocationAddress: '', latitude: 10, longitude: 106 })).toBeTruthy();
  for (const coordinate of [{ latitude: 10 }, { latitude: 0, longitude: 0 }, { latitude: 100, longitude: 106 }]) expect(validateWorkLocation({ workLocationAddress: 'Address', ...coordinate })).toBeTruthy();
});
