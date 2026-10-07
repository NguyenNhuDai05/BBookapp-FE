export interface Coordinate { latitude: number; longitude: number }
export type LocationSelectionPhase = 'idle' | 'requestingPermission' | 'locating' | 'resolving' | 'ready' | 'error';
export interface LocationCandidate extends Coordinate {
  accuracyMeters?: number;
  capturedAt?: number;
  formattedAddress?: string;
  quality: 'specific' | 'street' | 'area' | 'unknown';
  accuracyQuality: 'normal' | 'approximate' | 'unreliable';
  source: 'gps';
}
export interface SelectedLocation extends Coordinate { label: string; provinceCode?: number; areaId?: string }
export interface AreaOption { id: string; name: string; kind: string; legacyProvinceName?: string }
export interface OperatingProvince { code: number; name: string; legacyProvinceCodes: number[]; areas: AreaOption[] }
export interface OperatingCatalog { version: string; provinces: OperatingProvince[] }
export interface OperatingArea {
  city: string; district?: string; provinceCode?: number; districtCode?: number;
  operatingProvinceCode?: number; operatingAreaIds?: string[];
  latitude?: number; longitude?: number; operatingLocationConfirmed?: boolean;
  publicMeetingPoint?: boolean; operatingLocationLabel?: string; clearOperatingLocation?: boolean;
  workLocationName?: string; workLocationAddress?: string; allowCustomerVisit?: boolean; clearWorkLocation?: boolean;
}
export interface NearbyArtist {
  muaId: string; fullName: string; avatarUrl?: string; portfolioCoverUrl?: string;
  city?: string; averageRating: number; reviewCount: number; minPrice?: number;
  latitude?: number; longitude?: number; distanceKm?: number;
  canGetDirections: boolean; locationPrecision: 'PUBLIC_POINT' | 'APPROXIMATE'; locationLabel?: string;
}
export interface NearbyPage { items: NearbyArtist[]; total: number; page: number; pageSize: number }
