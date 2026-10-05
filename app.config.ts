import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'BBook', slug: config.slug || 'BBook-app',
  plugins: [
    ...(config.plugins || []),
  ],
});
