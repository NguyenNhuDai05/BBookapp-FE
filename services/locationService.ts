import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { api } from './api';
import type { Coordinate, OperatingCatalog, NearbyPage, LocationCandidate, LocationSelectionPhase } from '../types/location';
import { accuracyQuality, formatLocationAddress, LOCATION_LIMITS } from '../utils/locationAddress';
import { isValidCoordinate } from '../utils/locationCoordinates';
export { isValidCoordinate } from '../utils/locationCoordinates';

export class DeviceLocationError extends Error {
  constructor(public code: 'DENIED' | 'BLOCKED' | 'DISABLED' | 'TIMEOUT' | 'UNAVAILABLE', message: string) { super(message); }
}
// Call only from an explicit GPS action. No geocoder or location provider.
async function readDeviceLocation(onPhase?: (phase: LocationSelectionPhase) => void, preferCached = false): Promise<Location.LocationObject> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && !window.isSecureContext)
    throw new DeviceLocationError('UNAVAILABLE', 'Trình duyệt cần HTTPS hoặc localhost để lấy vị trí.');
  try {
    onPhase?.('requestingPermission');
    const current = await Location.getForegroundPermissionsAsync();
    const permission = current.granted || current.status === 'granted' || current.canAskAgain === false
      ? current : await Location.requestForegroundPermissionsAsync();
    if (!permission.granted && permission.status !== 'granted')
      throw new DeviceLocationError(permission.canAskAgain === false ? 'BLOCKED' : 'DENIED', 'Chưa có quyền vị trí. Bạn vẫn có thể nhập địa chỉ hoặc chọn khu vực thủ công.');
    if (!await Location.hasServicesEnabledAsync())
      throw new DeviceLocationError('DISABLED', 'Dịch vụ vị trí đang tắt. Bạn vẫn có thể nhập địa chỉ hoặc chọn khu vực thủ công.');
    onPhase?.('locating');
    if (preferCached) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const cached = await Promise.race([
          Location.getLastKnownPositionAsync({ maxAge: LOCATION_LIMITS.cachedPositionMaxAgeMs, requiredAccuracy: LOCATION_LIMITS.normalAccuracyMeters }),
          new Promise<null>(resolve => { timer = setTimeout(() => resolve(null), LOCATION_LIMITS.cachedPositionTimeoutMs); }),
        ]);
        const age = cached ? Date.now() - cached.timestamp : Infinity;
        if (cached && age >= 0 && age <= LOCATION_LIMITS.cachedPositionMaxAgeMs && accuracyQuality(cached.coords.accuracy) === 'normal' && isValidCoordinate(cached.coords)) return cached;
      } catch { /* Cache is optional; fresh GPS remains available. */ }
      finally { if (timer) clearTimeout(timer); }
    }
    return await new Promise<Location.LocationObject>((resolve, reject) => {
      const timer = setTimeout(() => reject(new DeviceLocationError('TIMEOUT', 'Lấy vị trí quá 15 giây. Bạn có thể thử lại hoặc nhập địa chỉ thủ công.')), LOCATION_LIMITS.positionTimeoutMs);
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then(p => {
        clearTimeout(timer);
        const point = { latitude: p.coords.latitude, longitude: p.coords.longitude };
        if (!isValidCoordinate(point)) reject(new DeviceLocationError('UNAVAILABLE', 'Thiết bị chưa xác định được vị trí hợp lệ. Bạn vẫn có thể nhập địa chỉ thủ công.'));
        else resolve(p);
      }, () => { clearTimeout(timer); reject(new DeviceLocationError('UNAVAILABLE', 'Không thể lấy vị trí hiện tại. Bạn vẫn có thể nhập địa chỉ thủ công.')); });
    });
  } catch (error) {
    if (error instanceof DeviceLocationError) throw error;
    throw new DeviceLocationError('UNAVAILABLE', 'Không thể lấy vị trí hiện tại. Bạn vẫn có thể nhập địa chỉ thủ công.');
  }
}
// Existing Nearby callers still receive only coordinates and never geocode.
export async function getDeviceLocation(): Promise<Coordinate> {
  const position = await readDeviceLocation();
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

export async function reverseLocation(candidate: LocationCandidate): Promise<LocationCandidate> {
  if (Platform.OS === 'web') return { ...candidate, formattedAddress: undefined, quality: 'unknown' };
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const results = await Promise.race([
      Location.reverseGeocodeAsync({ latitude: candidate.latitude, longitude: candidate.longitude }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Reverse timeout')), LOCATION_LIMITS.reverseTimeoutMs); }),
    ]);
    return { ...candidate, ...formatLocationAddress(results[0]) };
  } catch {
    // Retain device coordinates on empty/error/offline native geocoder results.
    return { ...candidate, formattedAddress: undefined, quality: 'unknown' };
  } finally { if (timer) clearTimeout(timer); }
}

export async function getCurrentLocationCandidate(onPhase?: (phase: LocationSelectionPhase) => void, isActive: () => boolean = () => true, onCandidate?: (candidate: LocationCandidate) => void): Promise<LocationCandidate> {
  const position = await readDeviceLocation(onPhase, true);
  const candidate: LocationCandidate = {
    latitude: position.coords.latitude, longitude: position.coords.longitude,
    accuracyMeters: position.coords.accuracy ?? undefined, capturedAt: position.timestamp,
    accuracyQuality: accuracyQuality(position.coords.accuracy), quality: 'unknown', source: 'gps',
  };
  if (!isActive() || candidate.accuracyQuality === 'unreliable') return candidate;
  onCandidate?.(candidate);
  onPhase?.('resolving');
  return reverseLocation(candidate);
}
export const locationService = {
  catalog: async (signal?: AbortSignal) => (await api.get<OperatingCatalog>('/locations/areas', { signal })).data,
  nearby: async (params: { latitude?: number; longitude?: number; radiusKm?: number; provinceCode?: number; areaId?: string; page: number; q?: string }, signal?: AbortSignal) =>
    (await api.get<NearbyPage>('/Mua/nearby', { params, signal })).data,
};
