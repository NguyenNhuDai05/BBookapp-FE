import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { api } from './api';
import type { Coordinate, OperatingCatalog, NearbyPage } from '../types/location';
import { isValidCoordinate } from '../utils/locationCoordinates';
export { isValidCoordinate } from '../utils/locationCoordinates';

export class DeviceLocationError extends Error {
  constructor(public code: 'DENIED' | 'BLOCKED' | 'DISABLED' | 'TIMEOUT' | 'UNAVAILABLE', message: string) { super(message); }
}
// Call only from an explicit GPS action. No geocoder or location provider.
export async function getDeviceLocation(): Promise<Coordinate> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && !window.isSecureContext)
    throw new DeviceLocationError('UNAVAILABLE', 'Trình duyệt cần HTTPS hoặc localhost để lấy vị trí.');
  try {
    const current = await Location.getForegroundPermissionsAsync();
    const permission = current.granted || current.status === 'granted' || current.canAskAgain === false
      ? current : await Location.requestForegroundPermissionsAsync();
    if (!permission.granted && permission.status !== 'granted')
      throw new DeviceLocationError(permission.canAskAgain === false ? 'BLOCKED' : 'DENIED', 'Chưa có quyền vị trí. Bạn vẫn có thể nhập địa chỉ hoặc chọn khu vực thủ công.');
    if (!await Location.hasServicesEnabledAsync())
      throw new DeviceLocationError('DISABLED', 'Dịch vụ vị trí đang tắt. Bạn vẫn có thể nhập địa chỉ hoặc chọn khu vực thủ công.');
    return await new Promise<Coordinate>((resolve, reject) => {
      const timer = setTimeout(() => reject(new DeviceLocationError('TIMEOUT', 'Lấy vị trí quá 15 giây. Bạn có thể thử lại hoặc nhập địa chỉ thủ công.')), 15000);
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then(p => {
        clearTimeout(timer);
        const point = { latitude: p.coords.latitude, longitude: p.coords.longitude };
        if (!isValidCoordinate(point)) reject(new DeviceLocationError('UNAVAILABLE', 'Thiết bị chưa xác định được vị trí hợp lệ. Bạn vẫn có thể nhập địa chỉ thủ công.'));
        else resolve(point);
      }, () => { clearTimeout(timer); reject(new DeviceLocationError('UNAVAILABLE', 'Không thể lấy vị trí hiện tại. Bạn vẫn có thể nhập địa chỉ thủ công.')); });
    });
  } catch (error) {
    if (error instanceof DeviceLocationError) throw error;
    throw new DeviceLocationError('UNAVAILABLE', 'Không thể lấy vị trí hiện tại. Bạn vẫn có thể nhập địa chỉ thủ công.');
  }
}
export const locationService = {
  catalog: async (signal?: AbortSignal) => (await api.get<OperatingCatalog>('/locations/areas', { signal })).data,
  nearby: async (params: { latitude?: number; longitude?: number; radiusKm?: number; provinceCode?: number; areaId?: string; page: number; q?: string }, signal?: AbortSignal) =>
    (await api.get<NearbyPage>('/Mua/nearby', { params, signal })).data,
};
