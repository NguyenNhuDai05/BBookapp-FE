import { Linking, Platform } from 'react-native';
import { externalMapUri, openExternalMap } from '../externalNavigation';

const address = '208 Nguyễn Hữu Cảnh, tầng 12/căn #5 & cửa bên trái';
beforeEach(() => { jest.clearAllMocks(); jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined); });
afterEach(() => jest.restoreAllMocks());

it('Android prefers snapshot coordinates over an address query', () => {
  expect(externalMapUri({ address, latitude: 10.78, longitude: 106.7 }, 'android')).toBe('geo:10.78,106.7?q=10.78%2C106.7');
});
it('Android encodes Vietnamese, spaces, slashes, # and & for address-only bookings', () => {
  const uri = externalMapUri({ address }, 'android')!;
  expect(uri).toBe(`geo:0,0?q=${encodeURIComponent(address)}`);
  expect(decodeURIComponent(uri.split('?q=')[1])).toBe(address);
});
it.each([
  { latitude: 10, longitude: null }, { latitude: null, longitude: 106 },
  { latitude: 91, longitude: 106 }, { latitude: 10, longitude: -181 },
  { latitude: 0, longitude: 0 }, { latitude: NaN, longitude: 106 },
  { latitude: Infinity, longitude: 106 },
])('invalid coordinate pair falls back to address: %j', point => {
  expect(externalMapUri({ address, ...point }, 'android')).toBe(`geo:0,0?q=${encodeURIComponent(address)}`);
  expect(externalMapUri({ address: '', ...point }, 'android')).toBeNull();
});
it('rejects string coordinates rather than interpolating a URI payload', () => {
  expect(externalMapUri({ latitude: 'intent://attack' as unknown as number, longitude: 106 }, 'android')).toBeNull();
});
it('keeps the scheme fixed when the address contains a scheme', () => {
  const text = 'intent://evil/#Intent;scheme=evil;end &q=elsewhere';
  expect(externalMapUri({ address: text }, 'android')).toBe(`geo:0,0?q=${encodeURIComponent(text)}`);
});
it('sanitizes control characters and malformed Unicode without crashing', () => {
  expect(externalMapUri({ address: ' A\nB\u0000C\ud800 ' }, 'android')).toBe(`geo:0,0?q=${encodeURIComponent('A B C\ufffd')}`);
});
it('iOS opens a snapshot pin without searching the address', () => {
  const uri = externalMapUri({ address, latitude: 10.78, longitude: 106.7, label: 'Daisy & Studio' }, 'ios');
  expect(uri).toBe('https://maps.apple.com/?ll=10.78%2C106.7&q=Daisy%20%26%20Studio');
  expect(uri).not.toContain(encodeURIComponent(address));
});
it('iOS supports encoded address-only hand-off', () => {
  expect(externalMapUri({ address }, 'ios')).toBe(`https://maps.apple.com/?q=${encodeURIComponent(address)}`);
});
it('allows valid GPS-only legacy snapshots but not missing destinations', () => {
  expect(externalMapUri({ latitude: 10, longitude: 106 }, 'android')).toBeTruthy();
  expect(externalMapUri({ address: '  ' }, 'android')).toBeNull();
});
it('web and unsupported platforms retain copy-only behavior', () => {
  expect(externalMapUri({ address }, 'web')).toBeNull();
  expect(externalMapUri({ address }, 'windows')).toBeNull();
});
it('constructing a destination never opens another app', () => {
  externalMapUri({ address }, 'android');
  expect(Linking.openURL).not.toHaveBeenCalled();
});
it('uses ACTION_VIEW through Linking only when explicitly invoked', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  await expect(openExternalMap({ address, latitude: 10.78, longitude: 106.7 })).resolves.toBe(true);
  expect(Linking.openURL).toHaveBeenCalledWith('geo:10.78,106.7?q=10.78%2C106.7');
});
it('a missing handler/openURL error is handled without logging the private URI', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  jest.mocked(Linking.openURL).mockRejectedValue(new Error(address));
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  await expect(openExternalMap({ address })).resolves.toBe(false);
  expect(log).not.toHaveBeenCalled();
});
it('does not query canOpenURL or introduce package-visibility false negatives', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  const canOpen = jest.spyOn(Linking, 'canOpenURL').mockRejectedValue(new Error('visibility'));
  await expect(openExternalMap({ address })).resolves.toBe(true);
  expect(canOpen).not.toHaveBeenCalled();
});
it('does not open an empty legacy destination', async () => {
  await expect(openExternalMap({ address: '' })).resolves.toBe(false);
  expect(Linking.openURL).not.toHaveBeenCalled();
});
