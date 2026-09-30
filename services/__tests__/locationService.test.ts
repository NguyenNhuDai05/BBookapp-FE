import * as Location from 'expo-location';
import { DeviceLocationError, directionsUrl, getDeviceLocation, resolveDeviceLocation } from '../locationService';
jest.mock('expo-location', () => ({ requestForegroundPermissionsAsync: jest.fn(), hasServicesEnabledAsync: jest.fn(), getCurrentPositionAsync: jest.fn(), reverseGeocodeAsync: jest.fn(), enableNetworkProviderAsync: jest.fn(), Accuracy: { Balanced: 3 } }));
jest.mock('../api', () => ({ api: { post: jest.fn().mockRejectedValue(new Error('unconfigured')) } }));
beforeEach(() => { jest.clearAllMocks(); (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted', granted: true }); (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true); });
it('does not attempt GPS after permission is permanently denied', async () => {
  (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied', canAskAgain: false });
  await expect(getDeviceLocation()).rejects.toMatchObject({ code: 'BLOCKED' });
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
});
it('times out without accepting a late GPS result', async () => {
  jest.useFakeTimers(); (Location.getCurrentPositionAsync as jest.Mock).mockReturnValue(new Promise(() => {}));
  const promise = getDeviceLocation(); const assertion = expect(promise).rejects.toBeInstanceOf(DeviceLocationError);
  await jest.advanceTimersByTimeAsync(15001); await assertion; jest.useRealTimers();
});
it('keeps GPS coordinates when reverse geocoding is unavailable', async () => {
  (Location.reverseGeocodeAsync as jest.Mock).mockRejectedValue(new Error('offline'));
  expect(await resolveDeviceLocation({ latitude: 10.78, longitude: 106.7 })).toMatchObject({ latitude: 10.78, longitude: 106.7 });
});
it('directions use the chosen origin and confirmed destination', () => {
  expect(directionsUrl({ latitude: 10, longitude: 106 }, { latitude: 11, longitude: 107 })).toContain('origin=10,106&destination=11,107');
});
