const { withAndroidManifest,withProjectBuildGradle } = require('expo/config-plugins');
module.exports = (config, { enabled = false, diagnostic = false } = {}) => {
 config=withAndroidManifest(config, config => {
  const app = config.modResults.manifest.application[0];
  app['meta-data'] = (app['meta-data'] || []).filter(item => !['com.bbook.advisor.enabled','com.bbook.advisor.diagnostics'].includes(item.$['android:name']));
  app['meta-data'].push({ $: {'android:name':'com.bbook.advisor.enabled','android:value':String(enabled)} });
  app['meta-data'].push({ $: {'android:name':'com.bbook.advisor.diagnostics','android:value':String(enabled&&diagnostic)} });
  return config;
 });
 return withProjectBuildGradle(config,config=>{
  const start='// BBOOK_ADVISOR_16K_START',end='// BBOOK_ADVISOR_16K_END';
  config.modResults.contents=config.modResults.contents.replace(/\n\/\/ BBOOK_ADVISOR_16K_START[\s\S]*?\/\/ BBOOK_ADVISOR_16K_END\n?/g,'\n');
  if(enabled)config.modResults.contents+=`\n${start}
// Source-built CMake libraries only. Prebuilt SDK ELF/RELRO still needs audit.
subprojects { p ->
  ['com.android.application', 'com.android.library'].each { pluginId ->
    p.plugins.withId(pluginId) {
      p.extensions.getByName('androidComponents').finalizeDsl { android ->
        android.defaultConfig.externalNativeBuild.cmake.arguments.addAll([
          '-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON',
          '-DCMAKE_SHARED_LINKER_FLAGS=-Wl,-z,max-page-size=16384 -Wl,-z,common-page-size=16384'
        ])
      }
    }
  }
}
${end}\n`;
  return config;
 });
};
