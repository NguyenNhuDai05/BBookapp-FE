import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'BBook', slug: config.slug || 'BBook-app',
  plugins: [
    ...(config.plugins || []),
    ...(process.env.GOOGLE_MAPS_ANDROID_KEY || process.env.GOOGLE_MAPS_IOS_KEY ? [['react-native-maps', {
      ...(process.env.GOOGLE_MAPS_ANDROID_KEY ? { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_KEY } : {}),
      ...(process.env.GOOGLE_MAPS_IOS_KEY ? { iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_KEY } : {}),
    }] as [string, Record<string, string>]] : []),
  ],
});
