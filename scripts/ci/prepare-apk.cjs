// CI-only validation and changes to the disposable prebuild output.
// Never changes app.config.ts, app.json, Firebase, or an existing keystore.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const [mode, input] = process.argv.slice(2);
const read = path => fs.readFileSync(path, 'utf8');
const firebase = JSON.parse(read('google-services.json'));
assert(firebase.client?.some(c => c.client_info?.android_client_info?.package_name === 'com.bbook.app'), 'Firebase must include unchanged com.bbook.app');
if (mode === 'config') {
  const config = JSON.parse(read(input));
  assert.equal(config.android.package, 'com.bbook.app');
  assert.equal(config.android.googleServicesFile, './google-services.json');
  assert.equal(config.extra.advisorEnabled, true);
  assert.equal(config.extra.advisorCloudEnabled, false);
  assert.equal(config.extra.advisorFaceAwareExperimental, true);
  assert.equal(config.extra.advisorMeasurementRanking, true);
  assert.equal(process.env.EAS_BUILD_PROFILE, 'tester-apk');
  assert.equal(config.extra.advisorReleaseEnvironment, 'closed-test');
  assert.equal(config.extra.advisorTransport, 'https');
  assert.equal(config.extra.advisorFaceAwareExperimental, false);
  assert.equal(config.extra.advisorDiagnosticMode, false);
  assert.equal(config.extra.advisorDataProcessingApproved, false);
  assert.equal(config.extra.aiTestBuild, false);
  assert.equal(config.extra.pushNotificationsEnabled, true);
  assert.equal(config.extra.advisorRemotePushEnabled, true);
  assert.equal(config.updates.enabled, false);
  assert(config.plugins.some(p => Array.isArray(p) && p[0] === './plugins/withAdvisor' && p[1].enabled));
  console.log('Release config validated: tester-apk/closed-test, existing package/Firebase, native Advisor enabled, cloud disabled.');
} else if (mode === 'native') {
  assert(read(input).includes('expo.modules.bbookfaceanalysis.BBookFaceAnalysisModule'), 'Custom ML Kit module not resolved by Expo autolinking');
  const manifest = read('android/app/src/main/AndroidManifest.xml');
  assert(/android:name="com.bbook.advisor.enabled"\s+android:value="true"/.test(manifest), 'Native Advisor metadata missing');
  const file = 'android/app/build.gradle';
  let gradle = read(file);
  assert(gradle.includes("applicationId 'com.bbook.app'") || gradle.includes('applicationId "com.bbook.app"'));
  assert(gradle.includes('com.google.gms.google-services'), 'Firebase Gradle plugin missing');
  assert(gradle.includes('export:embed'), 'Expo release bundling missing');
  assert(!/^\s*debuggableVariants\s*=/m.test(gradle), 'Custom debuggable variants need review');
  // Remove ONLY the template debug signing from the generated release block.
  // Existing key is supplied later to apksigner; no key is generated here.
  const release = /(\n\s*release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
  assert.equal((gradle.match(/\n\s*release\s*\{/g) || []).length, 1, 'Unexpected release template');
  assert(release.test(gradle), 'Unexpected template signing: review instead of overwriting');
  gradle = gradle.replace(release, '$1signingConfig null');
  assert.equal((gradle.match(/versionCode \d+/g) || []).length, 1);
  const version = process.env.APK_VERSION_CODE;
  assert(/^[1-9]\d*$/.test(version) && Number(version) <= 2100000000, 'Invalid versionCode');
  gradle = gradle.replace(/versionCode \d+/, `versionCode ${version}`);
  fs.writeFileSync(file, gradle);
  console.log('Disposable Android project validated; release APK will be signed separately.');
} else {
  throw new Error('Expected config or native validation mode');
}
