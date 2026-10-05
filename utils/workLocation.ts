import type { OperatingArea } from '../types/location';
import { isValidCoordinate } from './locationCoordinates';
export function validateWorkLocation(value: Partial<OperatingArea>): string | undefined {
  if (value.clearWorkLocation) return;
  const address = value.workLocationAddress?.trim() || '';
  const name = value.workLocationName?.trim() || '';
  const hasLatitude = value.latitude != null; const hasLongitude = value.longitude != null;
  if (name.length > 100 || address.length > 500) return 'Tên tối đa 100 ký tự và địa chỉ tối đa 500 ký tự.';
  if (hasLatitude !== hasLongitude || (hasLatitude && !isValidCoordinate({ latitude: value.latitude!, longitude: value.longitude! }))) return 'Vị trí GPS không hợp lệ. Hãy lấy lại hoặc bỏ GPS.';
  if (value.operatingLocationConfirmed && !hasLatitude) return 'Vị trí GPS chưa đầy đủ. Hãy lấy lại hoặc bỏ GPS.';
  if (value.workLocationName == null && value.workLocationAddress == null && !value.allowCustomerVisit) return;
  if ((name || hasLatitude || value.allowCustomerVisit) && !address) return 'Vui lòng nhập địa chỉ nơi làm việc hoặc xóa nơi làm việc để bỏ qua.';
}
