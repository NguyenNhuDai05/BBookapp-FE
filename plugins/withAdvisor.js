const { withAndroidManifest } = require('expo/config-plugins');
module.exports = (config, { enabled = false } = {}) => withAndroidManifest(config, config => {
  const app = config.modResults.manifest.application[0];
  app['meta-data'] = (app['meta-data'] || []).filter(item => item.$['android:name'] !== 'com.bbook.advisor.enabled');
  app['meta-data'].push({ $: {'android:name':'com.bbook.advisor.enabled','android:value':String(enabled)} });
  return config;
});
