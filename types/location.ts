export interface Coordinate { latitude: number; longitude: number }
export interface SelectedLocation extends Coordinate { label: string; provinceCode?: number; areaId?: string }
export interface AreaOption { id: string; name: string; kind: string; legacyProvinceName?: string }
export interface OperatingProvince { code: number; name: string; legacyProvinceCodes: number[]; areas: AreaOption[] }
export interface OperatingCatalog { version: string; provinces: OperatingProvince[] }
export interface OperatingArea {
  city: string; district?: string; provinceCode?: number; districtCode?: number;
  operatingProvinceCode?: number; operatingAreaIds?: string[];
  latitude?: number; longitude?: number; operatingLocationConfirmed?: boolean;
  publicMeetingPoint?: boolean; operatingLocationLabel?: string; clearOperatingLocation?: boolean;
}
export interface NearbyArtist {
  muaId: string; fullName: string; avatarUrl?: string; portfolioCoverUrl?: string;
  city?: string; averageRating: number; reviewCount: number; minPrice?: number;
  latitude?: number; longitude?: number; distanceKm?: number;
  canGetDirections: boolean; locationPrecision: 'PUBLIC_POINT' | 'APPROXIMATE'; locationLabel?: string;
}
export interface NearbyPage { items: NearbyArtist[]; total: number; page: number; pageSize: number }
