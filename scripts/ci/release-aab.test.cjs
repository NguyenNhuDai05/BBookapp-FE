const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {equivalent,authorize}=require('./release-aab-config.cjs');
const eas=require('../../eas.json');
test('actual resolved AAB configuration equals tested APK, including all runtime flags',()=>{
 const config=equivalent();
 assert.equal(config.android.package,'com.bbook.app');assert.equal(config.extra.advisorEnabled,true);
 assert.equal(config.extra.advisorMeasurementRanking,true);assert.equal(config.extra.advisorCloudEnabled,false);
 assert.equal(config.extra.advisorDiagnosticMode,false);assert.equal(config.extra.pushNotificationsEnabled,true);
});
test('environment drift fails rather than silently building a different app',()=>{
 const original=eas.build['tester-aab'].env.EXPO_PUBLIC_API_URL;
 try{eas.build['tester-aab'].env.EXPO_PUBLIC_API_URL='https://example.invalid/api';assert.throws(equivalent,/environment differs/);}
 finally{eas.build['tester-aab'].env.EXPO_PUBLIC_API_URL=original;}
});
test('AAB authorization requires explicit device test declaration, reference and valid version',()=>{
 const saved=process.env;process.env={};
 try{
  assert.throws(authorize,/actual APK/);
  process.env.DEVICE_ACCEPTANCE_CONFIRMED='true';assert.throws(authorize,/reference/);
  process.env.DEVICE_ACCEPTANCE_REFERENCE='fixture-only-run-123';process.env.APK_VERSION_CODE='0';assert.throws(authorize,/versionCode/);
  process.env.APK_VERSION_CODE='34';assert.equal(authorize(),'fixture-only-run-123');
  process.env.BBOOK_APK_RELEASE_CANDIDATE='1';assert.throws(authorize,/APK-only/);
 }finally{process.env=saved;}
});
test('shared preparation validates AAB config only in explicit AAB mode',()=>{
 const source=fs.readFileSync('scripts/ci/prepare-apk.cjs','utf8'),resolved=equivalent();
 function run(env){vm.runInNewContext(source,{require(name){if(name!=='node:fs')return require(name);return {...fs,readFileSync(file,encoding){return file==='fixture.json'?JSON.stringify(resolved):fs.readFileSync(file,encoding);}};},process:{argv:['node','prepare-apk.cjs','config','fixture.json'],env},console:{log(){}}});}
 run({CI_ANDROID_ARTIFACT:'aab',EAS_BUILD_PROFILE:'tester-aab'});
 assert.throws(()=>run({EAS_BUILD_PROFILE:'tester-aab'}));
});
test('AAB workflow uses bundleRelease/JAR signing, existing secrets, universal ABI and manual-only download',()=>{
 const yaml=require('yaml');
 const text=fs.readFileSync('.github/workflows/android-aab.yml','utf8'),workflow=yaml.parse(text);
 assert.deepEqual(Object.keys(workflow.on),['workflow_dispatch']);
 assert.equal(workflow.on.workflow_dispatch.inputs.device_acceptance_confirmed.default,false);
 assert.equal(workflow.jobs.aab.env.CI_ANDROID_ARTIFACT,'aab');assert.equal(workflow.jobs.aab.env.APK_ARCHITECTURES,'universal');
 assert(text.includes(':app:bundleRelease'));assert(text.includes('jarsigner -verify'));assert(text.includes('PLAY_UPLOAD_SHA256'));
 assert(!text.includes(':app:assembleRelease'));assert(!text.includes('eas submit'));assert(!text.includes('BBOOK_APK_RELEASE_CANDIDATE:'));
 assert(text.includes('persist-credentials: false'));assert(text.includes('if: always()'));assert(text.includes('BBook-release.aab'));
});
test('native preparation removes template debug signing and sets the requested AAB versionCode',()=>{
 const source=fs.readFileSync('scripts/ci/prepare-apk.cjs','utf8');let output;
 const gradle="applicationId 'com.bbook.app'\nversionCode 1\n// com.google.gms.google-services export:embed\nrelease {\n signingConfig signingConfigs.debug\n}\n";
 vm.runInNewContext(source,{
  require(name){if(name!=='node:fs')return require(name);return {
   readFileSync(file,encoding){if(file==='fixture-link.json')return 'expo.modules.bbookfaceanalysis.BBookFaceAnalysisModule';if(file.endsWith('AndroidManifest.xml'))return 'android:name="com.bbook.advisor.enabled" android:value="true"';if(file.endsWith('build.gradle'))return gradle;return fs.readFileSync(file,encoding);},
   writeFileSync(file,content){assert.equal(file,'android/app/build.gradle');output=content;},
  };},process:{argv:['node','prepare-apk.cjs','native','fixture-link.json'],env:{CI_ANDROID_ARTIFACT:'aab',EAS_BUILD_PROFILE:'tester-aab',APK_VERSION_CODE:'42'}},console:{log(){}},
 });
 assert(output.includes('signingConfig null'));assert(!output.includes('signingConfig signingConfigs.debug'));assert(output.includes('versionCode 42'));
});
