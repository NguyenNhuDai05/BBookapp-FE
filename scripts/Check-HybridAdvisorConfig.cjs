// Expo config only; never prebuild, Gradle, EAS build or signing commands.
const fs=require('fs'),cp=require('child_process'),path=require('path');
const output=process.argv[2]||'D:/EXE/artifacts/advisor-release-readiness-20261013';fs.mkdirSync(output,{recursive:true});
const eas=JSON.parse(fs.readFileSync('eas.json','utf8'));
for(const profile of ['production','advisor-preview','advisor-closed-test','advisor-development']){
 const env={...process.env};for(const key of Object.keys(env))if(key.startsWith('BBOOK_ADVISOR'))delete env[key];
 Object.assign(env,eas.build[profile].env||{},{EAS_BUILD_PROFILE:profile});
 // Inject stale local vars: standalone/release MUST strip these.
 env.BBOOK_ADVISOR_LOCAL_URL='http://127.0.0.1:5088/api';env.BBOOK_ADVISOR_LOCAL_NONCE='A'.repeat(48);
 const r=cp.spawnSync(process.execPath,['node_modules/expo/bin/cli','config','--type','public','--json'],{cwd:process.cwd(),env,encoding:'utf8',timeout:90000});
 if(r.status!==0)throw Error('Expo config failed '+profile);
 const c=JSON.parse(r.stdout),e=c.extra;
 if(c.android.package!==(profile==='advisor-preview'?'com.bbook.advisor':'com.bbook.app')||(profile==='advisor-preview'?!!c.android.googleServicesFile:c.android.googleServicesFile!=='./google-services.json')||e.eas.projectId!=='eea1bcb1-6a0f-4a5d-9b53-cb6fc0250ecd')throw Error('Identity changed');
 if(e.advisorEnabled!==(profile!=='production')||e.advisorCloudEnabled!==false||e.advisorDataProcessingApproved!==false||e.advisorDiagnosticMode!==(profile==='advisor-preview'))throw Error('Unsafe default flags');
 if(e.advisorFaceAwareExperimental!==(profile==='advisor-preview'))throw Error('Experimental ranking must default to preview only');
 if(profile!=='advisor-development'&&(e.advisorLocalUrl||e.advisorLocalNonce))throw Error('Local config leaked into release');
 if(profile.startsWith('advisor-')&&profile!=='advisor-development'&&!String(e.advisorBackendUrl).startsWith('https://'))throw Error('HTTPS missing');
 const audit={profile,package:c.android.package,easProjectId:e.eas.projectId,scheme:c.scheme,remotePush:e.advisorRemotePushEnabled,native:e.advisorEnabled,cloud:e.advisorCloudEnabled,dataApproved:e.advisorDataProcessingApproved,diagnostic:e.advisorDiagnosticMode,faceAwareExperimental:e.advisorFaceAwareExperimental,environment:e.advisorReleaseEnvironment,transport:e.advisorTransport,backendUrl:e.advisorBackendUrl||null,localNonceIncluded:!!e.advisorLocalNonce,format:eas.build[profile].android?.buildType||null,developmentClient:!!eas.build[profile].developmentClient};
 fs.writeFileSync(path.join(output,'config-'+profile+'.json'),JSON.stringify(audit,null,2));console.log(JSON.stringify(audit));
}
