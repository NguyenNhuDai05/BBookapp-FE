import type { ConfigContext, ExpoConfig } from 'expo/config';
export default ({config}: ConfigContext): ExpoConfig => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const enabled = process.env.BBOOK_ADVISOR_ENABLED === '1';
  if (enabled && profile && !['advisor-development','advisor-preview'].includes(profile)) throw new Error('Advisor is not approved for this build profile');
  return {...config, name:config.name || 'BBook',slug:config.slug || 'BBook-app', extra:{...config.extra,advisorEnabled:enabled}, plugins:[...(config.plugins || []),
    ['./plugins/withAdvisor', {enabled}]]};
};
