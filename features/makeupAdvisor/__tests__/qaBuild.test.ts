import { expectProductionProfileLinkAndroid } from '../../../test-utils/profileLinkConfig';
import config from '../../../app.config';
import {readFileSync} from 'node:fs';
const original={...process.env};
const context={config:{name:'BBook',slug:'BBook-app',scheme:'bbookapp',android:{package:'com.bbook.app',googleServicesFile:'./google-services.json'},extra:{eas:{projectId:'existing'},advisorApiKey:'stale',advisorLocalNonce:'stale',advisorLocalUrl:'stale'},plugins:['expo-notifications','expo-dev-client']}} as unknown as Parameters<typeof config>[0];
beforeEach(()=>{
 for(const key of Object.keys(process.env))if(key.startsWith('BBOOK_ADVISOR'))delete process.env[key];
 process.env.EAS_BUILD_PROFILE='advisor-qa';
 process.env.BBOOK_ADVISOR_QA_ONLY='1';process.env.BBOOK_ADVISOR_ENABLED='1';
 process.env.BBOOK_ADVISOR_CLOUD_ENABLED='0';process.env.BBOOK_ADVISOR_DIAGNOSTICS='1';
 process.env.BBOOK_ADVISOR_FACE_AWARE_EXPERIMENTAL='1';
 process.env.BBOOK_ADVISOR_BACKEND_URL='https://advisor.example/api';
});
afterEach(()=>{process.env={...original};});
test('standalone QA isolates package/scheme/Firebase and cannot send cloud data',()=>{
 const c=config(context);expect(c.name).toBe('BBook Advisor QA');expect(c.android?.package).toBe('com.bbook.advisor.qa');expect(c.android).not.toHaveProperty('googleServicesFile');expect(c.scheme).toBe('bbookadvisorqa');
 expect(c.extra).toMatchObject({advisorEnabled:true,advisorCloudEnabled:false,advisorGeminiApproved:false,advisorRemotePushEnabled:false,advisorDiagnosticMode:true,advisorFaceAwareExperimental:true,advisorReleaseEnvironment:'manual-test',advisorTransport:'https',eas:{projectId:'existing'}});
 for(const key of ['advisorLocalNonce','advisorLocalUrl','advisorApiKey'])expect(c.extra).not.toHaveProperty(key);
 expect(c.plugins).toContainEqual(['./plugins/withAdvisor',{enabled:true,diagnostic:true}]);
});
test.each(['approval','native','cloud'])('QA fails closed for incorrect %s configuration',part=>{
 if(part==='approval')delete process.env.BBOOK_ADVISOR_QA_ONLY;
 if(part==='native')process.env.BBOOK_ADVISOR_ENABLED='0';
 if(part==='cloud')process.env.BBOOK_ADVISOR_CLOUD_ENABLED='1';
 expect(()=>config(context)).toThrow('QA requires');
});
test.each(['production','advisor-closed-test','advisor-preview'])('QA approval cannot leak into %s',profile=>{
 process.env.EAS_BUILD_PROFILE=profile;expect(()=>config(context)).toThrow('QA-only approval cannot');
 delete process.env.BBOOK_ADVISOR_QA_ONLY;process.env.BBOOK_ADVISOR_PRODUCTION_APPROVED='1';
 expect(()=>config(context)).toThrow('rollout is not approved');
});
test('production without Advisor keeps identity and has no diagnostics even with stale QA inputs',()=>{
 process.env.EAS_BUILD_PROFILE='production';delete process.env.BBOOK_ADVISOR_QA_ONLY;process.env.BBOOK_ADVISOR_ENABLED='0';
 const c=config(context);expectProductionProfileLinkAndroid(c.android,context.config.android);expect(c.scheme).toBe('bbookapp');expect(c.extra?.advisorDiagnosticMode).toBe(false);expect(c.extra?.advisorFaceAwareExperimental).toBe(false);expect(c.extra?.advisorRemotePushEnabled).toBe(true);
});
test('EAS QA produces internal standalone APK with explicit local-only scope',()=>{
 const eas=JSON.parse(readFileSync('eas.json','utf8'));const qa=eas.build['advisor-qa'];
 expect(qa).toMatchObject({distribution:'internal',developmentClient:false,autoIncrement:false,android:{buildType:'apk',gradleCommand:':app:assembleRelease'},env:{BBOOK_ADVISOR_QA_ONLY:'1',BBOOK_ADVISOR_ENABLED:'1',BBOOK_ADVISOR_CLOUD_ENABLED:'0',BBOOK_ADVISOR_FACE_AWARE_EXPERIMENTAL:'1'}});
 expect(eas.build.production.env).not.toHaveProperty('BBOOK_ADVISOR_QA_ONLY');expect(eas.build['advisor-closed-test'].env).not.toHaveProperty('BBOOK_ADVISOR_QA_ONLY');
});
test('local EAS config resolution works with profile env alone before cloud built-ins exist',()=>{
 for(const key of Object.keys(process.env))if(key.startsWith('BBOOK_ADVISOR')||key==='EAS_BUILD_PROFILE')delete process.env[key];
 const eas=JSON.parse(readFileSync('eas.json','utf8'));
 Object.assign(process.env,eas.build['advisor-qa'].env);
 const c=config(context);
 expect(c.android?.package).toBe('com.bbook.advisor.qa');
 expect(c.extra?.advisorCloudEnabled).toBe(false);
 expect(c.extra?.advisorFaceAwareExperimental).toBe(true);
});
