const {isHttpsAdvisorUrl} = require('./backendUrl');
const {readFileSync} = require('node:fs');
module.exports = ({config}) => {
 const profile=process.env.EAS_BUILD_PROFILE || (process.env.BBOOK_BUILD_VARIANT==='unified-qa' ? 'unified-qa' : process.env.BBOOK_ADVISOR_QA_ONLY==='1' ? 'advisor-qa' : 'local');

 const preview=profile==='advisor-preview';
 const qa=profile==='advisor-qa'||profile==='unified-qa';
 const tester=['tester-apk','tester-aab'].includes(profile);
 // Build authorization only: never exposed in runtime config or treated as release approval.
 const releaseCandidate=process.env.BBOOK_APK_RELEASE_CANDIDATE==='1';
 if(releaseCandidate&&profile!=='tester-apk')throw new Error('Release Candidate authorization is only valid for tester-apk');
 if(releaseCandidate&&(process.env.BBOOK_ADVISOR_TESTER_APPROVED==='1'||process.env.BBOOK_ADVISOR_DEVICE_ACCEPTANCE==='approved'))throw new Error('Release Candidate must not claim tester approval or device acceptance');
 if(tester && !releaseCandidate && (process.env.BBOOK_ADVISOR_TESTER_APPROVED!=='1'||process.env.BBOOK_ADVISOR_DEVICE_ACCEPTANCE!=='approved'))throw new Error('Tester Advisor requires device acceptance and explicit tester release approval');
 const isolated=preview||qa;
 const firebaseFile=preview?process.env.BBOOK_ADVISOR_GOOGLE_SERVICES_FILE:undefined;
 if(firebaseFile){
  const clients=JSON.parse(readFileSync(firebaseFile,'utf8')).client;
  if(!Array.isArray(clients)||!clients.some(c=>c.client_info?.android_client_info?.package_name==='com.bbook.advisor'))throw new Error('Advisor Firebase config must include com.bbook.advisor');
 }
 const android={...config.android};
 if(preview){android.package='com.bbook.advisor';delete android.googleServicesFile;if(firebaseFile)android.googleServicesFile=firebaseFile;}
 if(qa){android.package=profile==='unified-qa'?'com.bbook.app.qa':'com.bbook.advisor.qa';delete android.googleServicesFile;}
 const enabled=process.env.BBOOK_ADVISOR_ENABLED==='1';
 const cloudEnabled=process.env.BBOOK_ADVISOR_CLOUD_ENABLED==='1';
 const dataApproved=process.env.BBOOK_ADVISOR_DATA_PROCESSING_APPROVAL==='approved';
 const diagnostic=enabled&&['local','advisor-development','advisor-preview','advisor-qa','unified-qa'].includes(profile)&&process.env.BBOOK_ADVISOR_DIAGNOSTICS==='1';
 const environment=isolated?'manual-test':(profile==='advisor-closed-test'||tester)?'closed-test':profile==='production'?'production':'local';
 const local=environment==='local';

 if(qa&&(process.env.BBOOK_ADVISOR_QA_ONLY!=='1'||!enabled||cloudEnabled))throw new Error('Advisor QA requires QA-only approval, native enabled and cloud disabled');
 if(!qa&&process.env.BBOOK_ADVISOR_QA_ONLY==='1')throw new Error('QA-only approval cannot be used by another build profile');
 if(enabled&&!['local','advisor-development','advisor-local-test','advisor-preview','advisor-qa','advisor-closed-test','production','unified-qa','tester-apk','tester-aab'].includes(profile))throw new Error('Advisor is not approved for this build profile');
 if(enabled&&environment==='production'&&process.env.BBOOK_ADVISOR_PRODUCTION_APPROVED!=='1')throw new Error('Production Advisor requires explicit release approval');
 if(process.env.BBOOK_ADVISOR_GEMINI_APPROVED==='1')throw new Error('Legacy Gemini approval flag is retired; use cloud enabled plus reviewed data processing approval');
 const localUrl=process.env.BBOOK_ADVISOR_LOCAL_URL;
 const localNonce=process.env.BBOOK_ADVISOR_LOCAL_NONCE;
 const backendUrl=local?localUrl:process.env.BBOOK_ADVISOR_BACKEND_URL;
 if(enabled&&local&&localUrl&&localUrl!=='http://127.0.0.1:5088/api')throw new Error('Local Advisor requires loopback port 5088');
 if(enabled&&local&&localNonce&&!/^[a-f0-9]{48}$/i.test(localNonce))throw new Error('Invalid local Advisor nonce');
 if(enabled&&!local&&backendUrl&&!isHttpsAdvisorUrl(backendUrl))throw new Error('Online Advisor requires a public HTTPS URL ending in /api');
 if(cloudEnabled&&(!enabled||!dataApproved))throw new Error('Cloud Advisor requires native enabled and reviewed data processing approval');
 if(cloudEnabled&&(!backendUrl||(local&&!localNonce)))throw new Error('Cloud Advisor backend configuration missing');
 // Consolidated engine stays in development or explicitly isolated internal QA.
 // Previously approved preview/store profiles still fail rather than change engines.
 if(enabled&&!tester&&!['local','advisor-development','advisor-local-test','advisor-qa','unified-qa'].includes(profile))throw new Error('Consolidated Advisor engine20 requires development; closed-test/production rollout is not approved');
 const extra={...config.extra};
 for(const key of Object.keys(extra))if(key.startsWith('advisor'))delete extra[key];
 return {...config,name:qa?(profile==='unified-qa'?'BBook QA':'BBook Advisor QA'):preview?'BBook Advisor':config.name||'BBook',slug:config.slug||'BBook-app',android,
  ...(isolated?{scheme:qa?(profile==='unified-qa'?'bbookqa':'bbookadvisorqa'):'bbookadvisor'}:{}),extra:{...extra,
  advisorEnabled:enabled,advisorCloudEnabled:enabled&&cloudEnabled,advisorDataProcessingApproved:enabled&&dataApproved,
  advisorGeminiApproved:enabled&&cloudEnabled&&dataApproved,advisorReleaseEnvironment:environment,advisorDiagnosticMode:diagnostic,
  advisorTransport:local?'local':'https',
  advisorFaceAwareExperimental:enabled&&(qa?process.env.BBOOK_ADVISOR_FACE_AWARE_EXPERIMENTAL==='1':preview?process.env.BBOOK_ADVISOR_FACE_AWARE_EXPERIMENTAL!=='0':local&&process.env.BBOOK_ADVISOR_FACE_AWARE_EXPERIMENTAL==='1'),
  advisorRemotePushEnabled:!isolated||(preview&&!!firebaseFile),
  ...(enabled&&backendUrl?{advisorBackendUrl:backendUrl}:{}),
  ...(enabled&&local&&localUrl&&localNonce?{advisorLocalUrl:localUrl,advisorLocalNonce:localNonce}:{}),
 },plugins:[...(config.plugins||[]).filter(p=>(typeof p==='string'?p:p[0])!=='expo-camera' && (!isolated||(typeof p==='string'?p:p[0])!=='expo-dev-client')),
  ...(isolated?[['expo-dev-client',{addGeneratedScheme:false}]]:[]),
  ['expo-camera',{cameraPermission:'Cho phép BBook dùng camera khi bạn chụp selfie tư vấn makeup hoặc xác minh danh tính.',microphonePermission:false,recordAudioAndroid:false,barcodeScannerEnabled:false}],
  ['./plugins/withAdvisor',{enabled,diagnostic}]]};
};
