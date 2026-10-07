import type { OperatingArea } from '../types/location';
import { isValidCoordinate } from './locationCoordinates';

export function isPrivateOperatingPoint(value: Partial<OperatingArea>): boolean {
  return !value.allowCustomerVisit && value.workLocationAddress == null && value.workLocationName == null && value.operatingLocationConfirmed === true && value.latitude != null && value.longitude != null && isValidCoordinate({ latitude: value.latitude, longitude: value.longitude });
}

// Do not send empty workplace fields: the server distinguishes their presence.
export function muaLocationPayload<T extends Partial<OperatingArea>>(value: T): T {
  const payload = { ...value };
  if (isPrivateOperatingPoint(value)) {
    delete payload.workLocationAddress; delete payload.workLocationName; delete payload.allowCustomerVisit;
    delete payload.clearWorkLocation; delete payload.clearOperatingLocation;
    payload.publicMeetingPoint = false;
  } else if (value.workLocationName == null && value.workLocationAddress == null && !value.clearWorkLocation && !value.allowCustomerVisit) {
    delete payload.allowCustomerVisit;
  }
  return payload;
}
