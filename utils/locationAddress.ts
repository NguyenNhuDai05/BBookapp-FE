import type { LocationCandidate } from '../types/location';

export const LOCATION_LIMITS = { normalAccuracyMeters: 100, maximumAccuracyMeters: 500, positionTimeoutMs: 15000, reverseTimeoutMs: 8000, cachedPositionTimeoutMs: 1000, cachedPositionMaxAgeMs: 60000, addressLength: 500 } as const;

export function accuracyQuality(accuracy?: number | null): LocationCandidate['accuracyQuality'] {
  if (accuracy == null || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > LOCATION_LIMITS.maximumAccuracyMeters) return 'unreliable';
  return accuracy <= LOCATION_LIMITS.normalAccuracyMeters ? 'normal' : 'approximate';
}

type NativeAddress = { formattedAddress?: string | null; name?: string | null; streetNumber?: string | null; street?: string | null; district?: string | null; city?: string | null; subregion?: string | null; region?: string | null; country?: string | null };
export function formatLocationAddress(address?: NativeAddress): Pick<LocationCandidate, 'formattedAddress' | 'quality'> {
  if (!address) return { quality: 'unknown' };
  const clean = (value?: string | null) => value?.trim().replace(/\s+/g, ' ') || '';
  const street = [clean(address.streetNumber), clean(address.street)].filter(Boolean).join(' ');
  const parts = [street || clean(address.name), clean(address.district), clean(address.city), clean(address.subregion), clean(address.region)];
  const seen = new Set<string>();
  const composed = parts.filter(part => {
    const key = part.toLocaleLowerCase();
    if (!part || seen.has(key)) return false;
    seen.add(key); return true;
  }).join(', ');
  const formattedAddress = clean(address.formattedAddress) || composed;
  if (!formattedAddress) return { quality: 'unknown' }; // Country alone is not a destination label.
  return { formattedAddress, quality: address.streetNumber && address.street ? 'specific' : address.street ? 'street' : 'area' };
}

export function composeLocationAddress(main: string, details = ''): string {
  return [main.trim(), details.trim()].filter(Boolean).join(' — ');
}
