import type { ExpoConfig } from 'expo/config';
export function expectProductionProfileLinkAndroid(actual: ExpoConfig['android'], expected: ExpoConfig['android']) {
  const { intentFilters, ...identity } = actual!;
  expect(identity).toEqual(expected);
  expect(intentFilters).toEqual([{ action: 'VIEW', autoVerify: true, category: ['BROWSABLE', 'DEFAULT'],
    data: ['/mua/', '/posts/'].map(pathPrefix => ({ scheme: 'https', host: 'bbookmakeup.com', pathPrefix })),
  }]);
}
