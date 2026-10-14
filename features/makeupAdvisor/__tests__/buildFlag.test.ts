import config from '../../../app.config';
const old={...process.env};
const context={config:{name:'BBook',slug:'BBook-app',android:{package:'com.bbook.app',googleServicesFile:'./google-services.json'},scheme:'bbookapp',plugins:['expo-notifications'],extra:{eas:{projectId:'existing'}}}} as unknown as Parameters<typeof config>[0];
beforeEach(()=>{for(const key of Object.keys(process.env))if(key.startsWith('BBOOK_ADVISOR'))delete process.env[key];delete process.env.EAS_BUILD_PROFILE;});
afterEach(()=>{process.env={...old};});
function env(profile:string,cloud=false){process.env.EAS_BUILD_PROFILE=profile;process.env.BBOOK_ADVISOR_ENABLED='1';process.env.BBOOK_ADVISOR_CLOUD_ENABLED=cloud?'1':'0';process.env.BBOOK_ADVISOR_BACKEND_URL='https://advisor.example/api';}
test('reviewed experimental mapping remains explicit in development and blocked for release',()=>{
 env('advisor-development');process.env.BBOOK_ADVISOR_FACE_AWARE_EXPERIMENTAL='1';expect(config(context).extra?.advisorFaceAwareExperimental).toBe(true);
 process.env.BBOOK_ADVISOR_FACE_AWARE_EXPERIMENTAL='0';expect(config(context).extra?.advisorFaceAwareExperimental).toBe(false);
 env('advisor-closed-test');process.env.BBOOK_ADVISOR_FACE_AWARE_EXPERIMENTAL='1';expect(()=>config(context)).toThrow('rollout is not approved');
 env('production');process.env.BBOOK_ADVISOR_PRODUCTION_APPROVED='1';expect(()=>config(context)).toThrow('rollout is not approved');
});
test('production default remains off and identity/Firebase/push preserved',()=>{process.env.EAS_BUILD_PROFILE='production';const c=config(context);expect(c.extra?.advisorEnabled).toBe(false);expect(c.extra?.advisorCloudEnabled).toBe(false);expect(c.android).toEqual(context.config.android);expect(c.scheme).toBe('bbookapp');expect(c.extra?.eas).toEqual(context.config.extra?.eas);expect(c.plugins).toContain('expo-notifications');});
test('production native requires separate release approval',()=>{env('production');expect(()=>config(context)).toThrow('release approval');process.env.BBOOK_ADVISOR_PRODUCTION_APPROVED='1';expect(()=>config(context)).toThrow('rollout is not approved');});
test.each(['advisor-preview','advisor-closed-test'])('%s strips nonce/localhost even from inherited config',profile=>{env(profile);process.env.BBOOK_ADVISOR_ENABLED='0';process.env.BBOOK_ADVISOR_LOCAL_URL='http://127.0.0.1:5088/api';process.env.BBOOK_ADVISOR_LOCAL_NONCE='A'.repeat(48);const c=config({...context,config:{...context.config,extra:{...context.config.extra,advisorLocalNonce:'stale',advisorLocalUrl:'stale',advisorApiKey:'stale'}}});expect(c.extra).not.toHaveProperty('advisorLocalNonce');expect(c.extra).not.toHaveProperty('advisorLocalUrl');expect(c.extra).not.toHaveProperty('advisorApiKey');expect(c.extra).not.toHaveProperty('advisorBackendUrl');expect(c.extra?.advisorCloudEnabled).toBe(false);expect(c.extra?.advisorDiagnosticMode).toBe(false);});
test('cloud permission requires native, data approval and configured HTTPS',()=>{env('advisor-preview',true);expect(()=>config(context)).toThrow('reviewed data');process.env.BBOOK_ADVISOR_DATA_PROCESSING_APPROVAL='approved';expect(()=>config(context)).toThrow('rollout is not approved');delete process.env.BBOOK_ADVISOR_BACKEND_URL;expect(()=>config(context)).toThrow('configuration missing');});
test.each(['http://advisor.example/api','http://127.0.0.1:5088/api','https://localhost/api','https://user:password@advisor.example/api','https://advisor.example/api?key=secret'])('release rejects unsafe URL %s',url=>{env('advisor-closed-test');process.env.BBOOK_ADVISOR_BACKEND_URL=url;expect(()=>config(context)).toThrow('public HTTPS');});
test('local mode still requires loopback and nonce and separate review',()=>{env('advisor-development',true);process.env.BBOOK_ADVISOR_DATA_PROCESSING_APPROVAL='approved';process.env.BBOOK_ADVISOR_LOCAL_URL='http://127.0.0.1:5088/api';expect(()=>config(context)).toThrow('configuration missing');process.env.BBOOK_ADVISOR_LOCAL_NONCE='A'.repeat(48);const c=config(context);expect(c.extra?.advisorTransport).toBe('local');expect(c.extra?.advisorLocalNonce).toBe('A'.repeat(48));});
test('legacy consent flag cannot bypass new review gates',()=>{env('advisor-preview');process.env.BBOOK_ADVISOR_GEMINI_APPROVED='1';expect(()=>config(context)).toThrow('retired');});
test('actual EAS preview/closed profiles are bundled release formats, pending cloud and existing remote credentials',()=>{const eas=require('../../../eas.json');expect(eas.build['advisor-preview'].android.buildType).toBe('apk');expect(eas.build['advisor-preview'].developmentClient).toBe(false);const closed=eas.build['advisor-closed-test'];expect(closed.android.buildType).toBe('app-bundle');expect(closed.distribution).toBe('store');expect(closed.credentialsSource).toBe('remote');expect(closed.autoIncrement).toBe(true);for(const p of ['advisor-preview','advisor-closed-test']){expect(eas.build[p].env.BBOOK_ADVISOR_CLOUD_ENABLED).toBe('0');expect(eas.build[p].env.BBOOK_ADVISOR_DATA_PROCESSING_APPROVAL).toBe('pending');}});

test('diagnostic opt-in is limited to local/dev/manual preview and does not approve Gemini',()=>{
 process.env.BBOOK_ADVISOR_DIAGNOSTICS='1';env('advisor-development');expect(config(context).extra?.advisorDiagnosticMode).toBe(true);expect(config(context).extra?.advisorCloudEnabled).toBe(false);
 env('advisor-closed-test');process.env.BBOOK_ADVISOR_ENABLED='0';expect(config(context).extra?.advisorDiagnosticMode).toBe(false);
 env('production');process.env.BBOOK_ADVISOR_ENABLED='0';expect(config(context).extra?.advisorDiagnosticMode).toBe(false);
});
test('only manual preview EAS profile opts into memory diagnostics',()=>{
 const eas=jest.requireActual('../../../eas.json');
 expect(eas.build['advisor-preview'].env.BBOOK_ADVISOR_DIAGNOSTICS).toBe('1');
 expect(eas.build['advisor-closed-test'].env.BBOOK_ADVISOR_DIAGNOSTICS).toBeUndefined();
 expect(eas.build.production.env.BBOOK_ADVISOR_DIAGNOSTICS).toBeUndefined();
});

test('preview package and deep link are isolated while production/closed keep BBook identity',()=>{
 env('advisor-preview');process.env.BBOOK_ADVISOR_ENABLED='0';const c=config(context);expect(c.android?.package).toBe('com.bbook.advisor');expect(c.name).toBe('BBook Advisor');expect(c.scheme).toBe('bbookadvisor');expect(c.android?.googleServicesFile).toBeUndefined();expect(c.extra?.advisorRemotePushEnabled).toBe(false);expect(c.plugins).toContainEqual(['expo-dev-client',{addGeneratedScheme:false}]);
 env('advisor-closed-test');process.env.BBOOK_ADVISOR_ENABLED='0';const closed=config(context);expect(closed.android).toEqual(context.config.android);expect(closed.scheme).toBe('bbookapp');expect(closed.extra?.advisorRemotePushEnabled).toBe(true);
});
test('missing separate Firebase file fails explicitly, never reuses production client',()=>{
 env('advisor-preview');process.env.BBOOK_ADVISOR_GOOGLE_SERVICES_FILE='missing-advisor-firebase-file.json';expect(()=>config(context)).toThrow();
});

test('camera config enables photos without introducing microphone permission or changing app identity',()=>{
 process.env.EAS_BUILD_PROFILE='production';const c=config(context);
 expect(c.plugins).toContainEqual(['expo-camera',{cameraPermission:'Cho phép BBook dùng camera khi bạn chụp selfie tư vấn makeup hoặc xác minh danh tính.',microphonePermission:false,recordAudioAndroid:false,barcodeScannerEnabled:false}]);
 expect(c.android?.package).toBe(context.config.android?.package);expect(c.scheme).toBe(context.config.scheme);
});


