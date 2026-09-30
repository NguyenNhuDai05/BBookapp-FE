import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { api } from './api';
import type { Coordinate, SelectedLocation, OperatingCatalog, NearbyPage } from '../types/location';
import { matchOperatingArea } from '../utils/operatingAreas';

export class DeviceLocationError extends Error {
  constructor(public code: 'DENIED' | 'BLOCKED' | 'DISABLED' | 'TIMEOUT' | 'UNAVAILABLE', message: string) { super(message); }
}
export async function getDeviceLocation(): Promise<Coordinate> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && !window.isSecureContext)
    throw new DeviceLocationError('UNAVAILABLE', 'Trình duyệt cần HTTPS hoặc localhost để lấy vị trí.');
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted && permission.status !== 'granted') throw new DeviceLocationError(permission.canAskAgain === false ? 'BLOCKED' : 'DENIED', 'Chưa có quyền vị trí. Bạn có thể mở cài đặt hoặc chọn địa điểm thủ công.');
  if (!await Location.hasServicesEnabledAsync()) {
    if (Platform.OS === 'android') {
      try { await Location.enableNetworkProviderAsync(); } catch { throw new DeviceLocationError('DISABLED', 'Hãy bật dịch vụ vị trí trên điện thoại rồi thử lại.'); }
    } else throw new DeviceLocationError('DISABLED', 'Hãy bật dịch vụ vị trí trong cài đặt thiết bị.');
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new DeviceLocationError('TIMEOUT', 'Lấy vị trí quá 15 giây. Hãy thử ở nơi thoáng hơn hoặc chọn trên bản đồ.')), 15000);
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then(p => {
      clearTimeout(timer); resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude });
    }, () => { clearTimeout(timer); reject(new DeviceLocationError('UNAVAILABLE', 'Không thể lấy tọa độ lúc này. Bạn vẫn có thể chọn thủ công.')); });
  });
}
export async function resolveDeviceLocation(coords: Coordinate): Promise<SelectedLocation> {
  if (Platform.OS !== 'web') {
    try {
      const rows = await new Promise<Location.LocationGeocodedAddress[]>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('geocoding timeout')), 8000);
        Location.reverseGeocodeAsync(coords).then(result => { clearTimeout(timer); resolve(result); }, error => { clearTimeout(timer); reject(error); });
      });
      const address = rows[0];
      const match = matchOperatingArea(rows.flatMap(a => [a.region, a.city, a.district, a.subregion, a.name]));
      if (match.province) return { ...coords, label: [match.area?.name, match.province.name].filter(Boolean).join(', '), provinceCode: match.province.code, areaId: match.area?.id };
      if (address) return { ...coords, label: [address.district, address.city, address.region].filter(Boolean).join(', ') || 'Vị trí hiện tại' };
    } catch { /* Coordinates remain usable even without a geocoding provider. */ }
  }
  try { return (await api.post<SelectedLocation>('/locations/reverse', coords)).data; }
  catch { return { ...coords, label: 'Vị trí hiện tại (chưa xác định tên khu vực)' }; }
}
export const locationService = {
  catalog: async (signal?: AbortSignal) => (await api.get<OperatingCatalog>('/locations/areas', { signal })).data,
  search: async (q: string, sessionToken: string, signal?: AbortSignal) => (await api.get<{ id: string; label: string }[]>('/locations/search', { params: { q, sessionToken }, signal })).data,
  select: async (id: string, sessionToken: string) => (await api.get<SelectedLocation>('/locations/place', { params: { id, sessionToken } })).data,
  nearby: async (params: { latitude?: number; longitude?: number; radiusKm?: number; provinceCode?: number; areaId?: string; page: number; q?: string }, signal?: AbortSignal) =>
    (await api.get<NearbyPage>('/Mua/nearby', { params, signal })).data,
};
export function directionsUrl(origin: Coordinate, destination: Coordinate) {
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
}
