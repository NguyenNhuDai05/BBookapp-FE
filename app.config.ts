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
  return configureAdvisor({ config: baseConfig } as ConfigContext);
};
