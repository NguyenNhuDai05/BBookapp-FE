import configure from '../../app.config';
import app from '../../app.json';
import eas from '../../eas.json';
import type { ConfigContext, ExpoConfig } from 'expo/config';

const variant = process.env.BBOOK_BUILD_VARIANT;
const profile = process.env.EAS_BUILD_PROFILE;
afterEach(() => {
  if (variant === undefined) delete process.env.BBOOK_BUILD_VARIANT; else process.env.BBOOK_BUILD_VARIANT = variant;
  if (profile === undefined) delete process.env.EAS_BUILD_PROFILE; else process.env.EAS_BUILD_PROFILE = profile;
});
const context = { config: app.expo as ExpoConfig } as ConfigContext;
it('isolates standalone AI APK package, scheme and push without changing production config', () => {
  delete process.env.BBOOK_BUILD_VARIANT; delete process.env.EAS_BUILD_PROFILE;
  const production = configure(context);
  expect(production.android?.package).toBe('com.bbook.app');
  expect(production.android?.googleServicesFile).toBe('./google-services.json');
  expect(production.scheme).toBe('bbookapp');
  process.env.BBOOK_BUILD_VARIANT = 'ai-test'; process.env.EAS_BUILD_PROFILE = 'ai-test';
  const test = configure(context);
  expect(test.name).toBe('BBook AI Test');
  expect(test.android?.package).toBe('com.bbook.app.aitest');
  expect(test.android?.googleServicesFile).toBeUndefined();
  expect(test.scheme).toBe('bbookaitest');
  expect(test.extra?.pushNotificationsEnabled).toBe(false);
  expect(test.plugins).toContainEqual(['expo-dev-client', { addGeneratedScheme: false }]);
  expect(app.expo.android.package).toBe('com.bbook.app');
  expect(eas.build.production.android.buildType).toBe('app-bundle');
  expect(eas.build.production.autoIncrement).toBe(true);
  expect(eas.build['ai-test'].developmentClient).toBe(false);
  expect(eas.build['ai-test'].android.buildType).toBe('apk');
  expect(eas.build['ai-test'].env.EXPO_PUBLIC_API_URL).toBe('https://beautybook-v3bi.onrender.com/api');
});
it('fails closed if variant and EAS profile disagree', () => {
  process.env.BBOOK_BUILD_VARIANT = 'ai-test'; process.env.EAS_BUILD_PROFILE = 'production';
  expect(() => configure(context)).toThrow();
  delete process.env.BBOOK_BUILD_VARIANT; process.env.EAS_BUILD_PROFILE = 'ai-test';
  expect(() => configure(context)).toThrow();
});
