import configureAdvisor from './features/makeupAdvisor/buildConfig';
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const aiTest = process.env.BBOOK_BUILD_VARIANT === 'ai-test';
  if (aiTest && process.env.EAS_BUILD_PROFILE && process.env.EAS_BUILD_PROFILE !== 'ai-test') {
    throw new Error('AI test variant cannot be used by another EAS build profile');
  }
  if (process.env.EAS_BUILD_PROFILE === 'ai-test' && !aiTest) {
    throw new Error('ai-test build requires BBOOK_BUILD_VARIANT=ai-test');
  }
  const android = { ...config.android };
  if (aiTest) {
    android.package = 'com.bbook.app.aitest';
    android.versionCode = 1;
    // Isolated test app deliberately has no FCM identity or push registration.
    delete android.googleServicesFile;
    delete android.intentFilters;
  } else {
    android.intentFilters = [...(android.intentFilters || []), {
      action: 'VIEW', autoVerify: true, category: ['BROWSABLE', 'DEFAULT'],
      // Only advertise the host serving assetlinks.json. Extra unconfigured
      // hosts can break verification on Android 11 and earlier.
      data: ['/mua/', '/posts/'].map(pathPrefix => ({ scheme: 'https', host: 'bbookmakeup.com', pathPrefix })),
    }];
  }
  const baseConfig: ExpoConfig = {
    ...config,
    name: aiTest ? 'BBook AI Test' : 'BBook',
    slug: config.slug || 'BBook-app',
    scheme: aiTest ? 'bbookaitest' : config.scheme,
    android,
    extra: { ...config.extra, aiTestBuild: aiTest, pushNotificationsEnabled: !aiTest },
    plugins: aiTest
      ? [...(config.plugins || []).filter(plugin => (typeof plugin === 'string' ? plugin : plugin[0]) !== 'expo-dev-client'), ['expo-dev-client', { addGeneratedScheme: false }]]
      : [...(config.plugins || [])],
  };
  if (aiTest && process.env.BBOOK_ADVISOR_ENABLED === '1') throw new Error('AI test cannot enable native Advisor');
  const resolved = configureAdvisor({ config: baseConfig } as ConfigContext);
  // Test/Advisor packages must never claim production profile links.
  if (resolved.android && resolved.android.package !== 'com.bbook.app') {
    resolved.android.intentFilters = resolved.android.intentFilters?.filter(filter =>
      !JSON.stringify(filter.data).includes('bbookmakeup.com'));
    if (!resolved.android.intentFilters?.length) delete resolved.android.intentFilters;
  }
  return resolved;
};
