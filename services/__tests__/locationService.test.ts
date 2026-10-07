import * as Location from 'expo-location';
import { DeviceLocationError, getDeviceLocation, getCurrentLocationCandidate, reverseLocation, locationService } from '../locationService';
import { api } from '../api';
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(), requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(), getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(), geocodeAsync: jest.fn(), Accuracy: { Balanced: 3 },
}));
jest.mock('../api', () => ({ api: { get: jest.fn(), post: jest.fn() } }));
beforeEach(() => {
  jest.clearAllMocks();
  (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted', granted: true });
  (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);
  (Location.getLastKnownPositionAsync as jest.Mock).mockResolvedValue(null);
  (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({ coords: { latitude: 10.78, longitude: 106.7 } });
});
afterEach(() => jest.useRealTimers());
it('uses recent accurate last-known GPS without waiting for fresh GPS and publishes before reverse', async () => {
  jest.mocked(Location.getLastKnownPositionAsync).mockResolvedValue({ timestamp: Date.now(), coords: { latitude: 10.78, longitude: 106.7, accuracy: 40 } } as any);
  let finish!: (value: any) => void;
  jest.mocked(Location.reverseGeocodeAsync).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const publish = jest.fn();
  const pending = getCurrentLocationCandidate(undefined, () => true, publish);
  for (let i = 0; i < 10; i++) await Promise.resolve();
  expect(publish).toHaveBeenCalledWith(expect.objectContaining({ latitude: 10.78, accuracyQuality: 'normal' }));
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  finish([]); await pending;
});
it.each([
  { timestamp: Date.now() - 120000, accuracy: 30 },
  { timestamp: Date.now(), accuracy: 300 },
  { timestamp: Date.now() + 120000, accuracy: 30 },
])('falls back to fresh GPS for stale, inaccurate or future cache %o', async cached => {
  jest.mocked(Location.getLastKnownPositionAsync).mockResolvedValue({ timestamp: cached.timestamp, coords: { latitude: 20, longitude: 100, accuracy: cached.accuracy } } as any);
  await getCurrentLocationCandidate(); expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
});
it('bounds an unresponsive cache read before fresh GPS', async () => {
  jest.useFakeTimers(); jest.mocked(Location.getLastKnownPositionAsync).mockReturnValue(new Promise(() => {}));
  const pending = getCurrentLocationCandidate(); await jest.advanceTimersByTimeAsync(1001); await pending;
  expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
});
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

it('builds a native reverse candidate without replacing device coordinates', async () => {
  const phases: string[] = [];
  jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue({ timestamp: 123, coords: { latitude: 10.78, longitude: 106.7, accuracy: 20 } } as any);
  jest.mocked(Location.reverseGeocodeAsync).mockResolvedValue([{ latitude: 20, longitude: 100, streetNumber: '123', street: 'Nguyễn Trãi', city: 'TP.HCM' }] as any);
  expect(await getCurrentLocationCandidate(phase => phases.push(phase))).toMatchObject({ latitude: 10.78, longitude: 106.7, accuracyMeters: 20, capturedAt: 123, formattedAddress: '123 Nguyễn Trãi, TP.HCM', quality: 'specific', accuracyQuality: 'normal' });
  expect(phases).toEqual(['requestingPermission', 'locating', 'resolving']);
  expect(Location.reverseGeocodeAsync).toHaveBeenCalledWith({ latitude: 10.78, longitude: 106.7 }); expect(api.post).not.toHaveBeenCalled();
});
it.each([{ results: [] }, { results: [{ district: 'Phường Bến Thành', city: 'TP.HCM' }] }])('retains GPS for empty or area-only geocoding %o', async ({ results }) => {
  jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue({ coords: { latitude: 10.78, longitude: 106.7, accuracy: 50 } } as any);
  jest.mocked(Location.reverseGeocodeAsync).mockResolvedValue(results as any);
  const result = await getCurrentLocationCandidate(); expect(result).toMatchObject({ latitude: 10.78, longitude: 106.7, accuracyQuality: 'normal' });
  expect(result.formattedAddress).toBe(results.length ? 'Phường Bến Thành, TP.HCM' : undefined);
});
it('native geocoder error is a recoverable candidate, not a GPS failure', async () => {
  jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue({ coords: { latitude: 10.78, longitude: 106.7, accuracy: 150 } } as any);
  jest.mocked(Location.reverseGeocodeAsync).mockRejectedValue(new Error('offline'));
  expect(await getCurrentLocationCandidate()).toMatchObject({ latitude: 10.78, longitude: 106.7, quality: 'unknown', accuracyQuality: 'approximate' });
});
it.each([501, null, NaN, -1])('does not reverse an unreliable accuracy %s', async accuracy => {
  jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue({ coords: { latitude: 10.78, longitude: 106.7, accuracy } } as any);
  expect(await getCurrentLocationCandidate()).toMatchObject({ accuracyQuality: 'unreliable' }); expect(Location.reverseGeocodeAsync).not.toHaveBeenCalled();
});
it('does not start geocoding when the selection was cancelled during GPS', async () => {
  jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue({ coords: { latitude: 10.78, longitude: 106.7, accuracy: 20 } } as any);
  await getCurrentLocationCandidate(undefined, () => false); expect(Location.reverseGeocodeAsync).not.toHaveBeenCalled();
});
it('bounds native reverse time and ignores its late response', async () => {
  jest.useFakeTimers(); let complete!: (value: unknown) => void;
  jest.mocked(Location.reverseGeocodeAsync).mockReturnValue(new Promise(resolve => { complete = resolve; }) as any);
  const promise = reverseLocation({ latitude: 10.78, longitude: 106.7, accuracyQuality: 'normal', quality: 'unknown', source: 'gps' });
  await jest.advanceTimersByTimeAsync(8001); expect(await promise).toMatchObject({ quality: 'unknown', formattedAddress: undefined });
  complete([{ formattedAddress: 'Late address' }]); expect(await promise).toMatchObject({ formattedAddress: undefined });
});
