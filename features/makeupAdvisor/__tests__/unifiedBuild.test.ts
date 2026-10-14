import configure from '../../../app.config';
import app from '../../../app.json';
import eas from '../../../eas.json';
import type { ConfigContext, ExpoConfig } from 'expo/config';
const original = { ...process.env };
const context = { config: app.expo as ExpoConfig } as ConfigContext;
beforeEach(() => { for (const key of Object.keys(process.env)) if (key.startsWith('BBOOK_') || key === 'EAS_BUILD_PROFILE') delete process.env[key]; });
afterEach(() => { process.env = { ...original }; });
test('unified QA is standalone and native-only, without production Firebase or duplicate camera plugins', () => {
  Object.assign(process.env, eas.build['unified-qa'].env);
  const config = configure(context);
  expect(config.android?.package).toBe('com.bbook.app.qa');
  expect(config.extra).toMatchObject({ advisorEnabled: true, advisorCloudEnabled: false, advisorDiagnosticMode: true, advisorRemotePushEnabled: false });
  expect(config.android?.googleServicesFile).toBeUndefined();
  expect(config.plugins?.filter(plugin => (typeof plugin === 'string' ? plugin : plugin[0]) === 'expo-camera')).toHaveLength(1);
  expect(eas.build['unified-qa'].developmentClient).toBe(false);
});
test.each(['tester-apk', 'tester-aab'] as const)('%s requires explicit device acceptance and preserves the Play identity', profile => {
  Object.assign(process.env, eas.build[profile].env); process.env.EAS_BUILD_PROFILE = profile;
  expect(() => configure(context)).toThrow('device acceptance');
  process.env.BBOOK_ADVISOR_TESTER_APPROVED = '1';
  expect(() => configure(context)).toThrow('device acceptance');
  process.env.BBOOK_ADVISOR_DEVICE_ACCEPTANCE = 'approved';
  const config = configure(context);
  expect(config.android?.package).toBe('com.bbook.app');
  expect(config.android?.googleServicesFile).toBe(app.expo.android.googleServicesFile);
  expect(config.extra).toMatchObject({ advisorEnabled: true, advisorCloudEnabled: false, advisorDiagnosticMode: false, advisorRemotePushEnabled: true });
  expect(config.extra).not.toHaveProperty('advisorLocalNonce');
  expect(config.extra?.eas).toEqual(app.expo.extra.eas);
});
test('AI-test cannot accidentally enable Advisor and production remains blocked for engine20', () => {
  process.env.BBOOK_BUILD_VARIANT = 'ai-test'; process.env.EAS_BUILD_PROFILE = 'ai-test'; process.env.BBOOK_ADVISOR_ENABLED = '1';
  expect(() => configure(context)).toThrow('AI test cannot enable');
  delete process.env.BBOOK_BUILD_VARIANT; process.env.EAS_BUILD_PROFILE = 'production'; process.env.BBOOK_ADVISOR_PRODUCTION_APPROVED = '1';
  process.env.BBOOK_ADVISOR_TESTER_APPROVED = '1'; process.env.BBOOK_ADVISOR_DEVICE_ACCEPTANCE = 'approved';
  expect(() => configure(context)).toThrow('rollout is not approved');
});
