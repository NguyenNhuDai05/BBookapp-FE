import * as Location from 'expo-location';
import { DeviceLocationError, getDeviceLocation, locationService } from '../locationService';
import { api } from '../api';
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(), requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(), getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(), geocodeAsync: jest.fn(), Accuracy: { Balanced: 3 },
}));
jest.mock('../api', () => ({ api: { get: jest.fn(), post: jest.fn() } }));
beforeEach(() => {
  jest.clearAllMocks();
  (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted', granted: true });
  (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);
  (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({ coords: { latitude: 10.78, longitude: 106.7 } });
});
afterEach(() => jest.useRealTimers());
it('uses device coordinates without requesting permission again, geocoding or a provider', async () => {
  expect(await getDeviceLocation()).toEqual({ latitude: 10.78, longitude: 106.7 });
  expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  expect(Location.reverseGeocodeAsync).not.toHaveBeenCalled();
  expect(Location.geocodeAsync).not.toHaveBeenCalled();
  expect(api.get).not.toHaveBeenCalled();
  expect(api.post).not.toHaveBeenCalled();
});
it('requests foreground permission only when an explicit GPS action needs it', async () => {
  (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined', canAskAgain: true });
  (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  await getDeviceLocation();
  expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
});
it.each([['DENIED', true], ['BLOCKED', false]])('stops GPS when permission is %s', async (code, canAskAgain) => {
  (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied', canAskAgain });
  (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied', canAskAgain });
  await expect(getDeviceLocation()).rejects.toMatchObject({ code });
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  if (!canAskAgain) expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
});
it('reports disabled GPS without forcing a settings prompt', async () => {
  (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(false);
  await expect(getDeviceLocation()).rejects.toMatchObject({ code: 'DISABLED' });
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
});
it('times out and rejects a late device result', async () => {
  jest.useFakeTimers();
  let complete!: (value: unknown) => void;
  (Location.getCurrentPositionAsync as jest.Mock).mockReturnValue(new Promise(resolve => { complete = resolve; }));
  const promise = getDeviceLocation();
  const assertion = expect(promise).rejects.toMatchObject({ code: 'TIMEOUT' });
  await jest.advanceTimersByTimeAsync(15001);
  await assertion;
  complete({ coords: { latitude: 10.78, longitude: 106.7 } });
  await expect(promise).rejects.toBeInstanceOf(DeviceLocationError);
});
it.each([[0, 0], [91, 106], [10, 181], [NaN, 106], [10, undefined]])('rejects invalid device coordinates %s,%s', async (latitude, longitude) => {
  (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({ coords: { latitude, longitude } });
  await expect(getDeviceLocation()).rejects.toMatchObject({ code: 'UNAVAILABLE' });
});
it.each([
  ['permission', Location.getForegroundPermissionsAsync],
  ['services', Location.hasServicesEnabledAsync],
  ['position', Location.getCurrentPositionAsync],
])('handles native failure in %s', async (_method, action) => {
  (action as jest.Mock).mockRejectedValue(new Error('native failure'));
  await expect(getDeviceLocation()).rejects.toMatchObject({ code: 'UNAVAILABLE' });
});
it('keeps internal catalog and backend Nearby as the only location HTTP calls', async () => {
  (api.get as jest.Mock).mockResolvedValue({ data: { items: [] } });
  await locationService.catalog();
  await locationService.nearby({ provinceCode: 79, page: 1 });
  expect((api.get as jest.Mock).mock.calls.map(call => call[0])).toEqual(['/locations/areas', '/Mua/nearby']);
});
