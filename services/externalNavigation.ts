import { Linking, Platform } from 'react-native';
import { isValidCoordinate } from '../utils/locationCoordinates';

export interface ExternalDestination {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  label?: string | null;
}

function cleanText(value?: string | null): string {
  if (typeof value !== 'string') return '';
  const text = value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  // Preserve Vietnamese/emoji while replacing malformed Unicode before encoding.
  return Array.from(text, char => char.length === 1 && char.charCodeAt(0) >= 0xd800 && char.charCodeAt(0) <= 0xdfff ? '\ufffd' : char).join('');
}

export function externalMapUri(destination: ExternalDestination, platform: string = Platform.OS): string | null {
  const { latitude, longitude } = destination;
  const hasCoordinates = typeof latitude === 'number' && typeof longitude === 'number'
    && isValidCoordinate({ latitude, longitude });
  const address = cleanText(destination.address);
  if (!hasCoordinates && !address) return null;

  if (platform === 'android') {
    if (hasCoordinates) {
      const coordinates = `${latitude},${longitude}`;
      return `geo:${coordinates}?q=${encodeURIComponent(coordinates)}`;
    }
    // 0,0 is the OS address-query syntax, NOT a stored/fabricated destination.
    return `geo:0,0?q=${encodeURIComponent(address)}`;
  }
  if (platform === 'ios') {
    if (hasCoordinates) {
      const label = cleanText(destination.label) || 'Địa điểm booking';
      return `https://maps.apple.com/?ll=${encodeURIComponent(`${latitude},${longitude}`)}&q=${encodeURIComponent(label)}`;
    }
    return `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
  }
  return null; // Web/unsupported platforms retain Copy Address.
}

export async function openExternalMap(destination: ExternalDestination): Promise<boolean> {
  const uri = externalMapUri(destination);
  if (!uri) return false;
  try {
    // Attempt only on a user tap. openURL uses ACTION_VIEW on Android and
    // rejects if there is no handler. Avoid canOpenURL package-visibility
    // false negatives and additional manifest queries/dependencies.
    await Linking.openURL(uri);
    return true;
  } catch {
    // Do not log rejected native errors: they can include the destination URI.
    return false;
  }
}
