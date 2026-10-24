// Packaging-only companion to the APK workflow. No submission or fabricated acceptance.
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {getConfig}=require('expo/config');
const eas=require('../../eas.json');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const git=(...args)=>cp.execFileSync('git',args,{encoding:'utf8'}).trim();
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
function resolved(profile,policy){
 const saved=process.env;process.env={...saved};
 try{
  for(const key of Object.keys(process.env))if(key.startsWith('BBOOK_')||key.startsWith('EXPO_PUBLIC_')||key==='EAS_BUILD_PROFILE')delete process.env[key];
  Object.assign(process.env,eas.build[profile].env,{EAS_BUILD_PROFILE:profile,NODE_ENV:'production',EXPO_NO_DOTENV:'1'},policy);
  return getConfig(process.cwd(),{skipSDKVersionRequirement:true}).exp;
 }finally{process.env=saved;}
}
function equivalent(){
 const apk=eas.build['tester-apk'],aab=eas.build['tester-aab'];
 assert.equal(apk.android.buildType,'apk');assert.equal(aab.android.buildType,'app-bundle');
 assert.equal(aab.distribution,'store');assert.equal(aab.developmentClient,false);
 assert.deepEqual(aab.env,apk.env,'AAB and tested APK business environment differs');
 // Policy values in this comparison are configuration fixtures, not acceptance evidence.
 const candidate=resolved('tester-apk',{BBOOK_APK_RELEASE_CANDIDATE:'1'});
 const store=resolved('tester-aab',{BBOOK_ADVISOR_TESTER_APPROVED:'1',BBOOK_ADVISOR_DEVICE_ACCEPTANCE:'approved'});
 assert.deepEqual(store,candidate,'AAB and APK resolved Expo configuration differs');
 return store;
}
function authorize(){
 assert.equal(process.env.DEVICE_ACCEPTANCE_CONFIRMED,'true','Confirm actual APK device testing before building a store artifact');
 const reference=process.env.DEVICE_ACCEPTANCE_REFERENCE||'';
 assert(reference.trim().length>=8&&reference.length<=300&&!/[\r\n\0]/.test(reference),'Supply an APK test reference (run URL/build ID/date and result)');
 assert(!process.env.BBOOK_APK_RELEASE_CANDIDATE,'APK-only candidate permission cannot authorize an AAB');
 assert(/^[1-9]\d{0,9}$/.test(process.env.APK_VERSION_CODE||'')&&Number(process.env.APK_VERSION_CODE)<=2100000000,'Invalid versionCode');
 return reference;
}
const hashes=()=>Object.fromEntries(git('ls-files','-z').split('\0').filter(Boolean).map(p=>[p,sha(fs.readFileSync(p))]));
function main(mode,input){
 if(mode==='environment'){
  authorize();equivalent();
  const business={...eas.build['tester-aab'].env,EAS_BUILD_PROFILE:'tester-aab',NODE_ENV:'production'};
  for(const key of Object.keys(process.env))if((key.startsWith('BBOOK_')||key.startsWith('EXPO_PUBLIC_'))&&!Object.hasOwn(business,key))throw new Error(`Unexpected business environment: ${key}`);
  const exported={...business,BBOOK_ADVISOR_TESTER_APPROVED:'1',BBOOK_ADVISOR_DEVICE_ACCEPTANCE:'approved'};
  const lines=Object.entries(exported).map(([key,value])=>{assert(typeof value==='string'&&!/[\r\n\0]/.test(value));return `${key}=${value}`;});
  fs.appendFileSync(process.env.GITHUB_ENV,lines.join('\n')+'\n');
  console.log('AAB runtime matches APK; device acceptance is the operator declaration. No Play submission is authorized.');
 }else if(mode==='snapshot'){
  const reference=authorize(),expected=equivalent();
  for(const [key,value] of Object.entries(eas.build['tester-aab'].env))assert.equal(process.env[key],value,`Environment drift: ${key}`);
  assert.equal(process.env.EAS_BUILD_PROFILE,'tester-aab');
  assert.equal(process.env.BBOOK_ADVISOR_TESTER_APPROVED,'1');assert.equal(process.env.BBOOK_ADVISOR_DEVICE_ACCEPTANCE,'approved');
  const config=JSON.parse(fs.readFileSync(input,'utf8'));
  assert.deepEqual(config.extra,expected.extra,'Resolved public runtime configuration drift');
  assert.equal(git('rev-parse','HEAD'),process.env.GITHUB_SHA);
  assert.equal(git('status','--porcelain','--untracked-files=no'),'','Tracked checkout changed before prebuild');
  fs.writeFileSync(path.join(process.env.RUNNER_TEMP,'aab-release-provenance.json'),JSON.stringify({
   schemaVersion:1,sourceCommit:process.env.GITHUB_SHA,profile:'tester-aab',format:'aab',
   package:'com.bbook.app',versionCode:process.env.APK_VERSION_CODE,architectures:'armeabi-v7a,arm64-v8a,x86,x86_64',
   acceptance:{kind:'operator-declaration',reference,automaticallyVerified:false},playSubmission:false,
   businessEnvironment:eas.build['tester-aab'].env,resolvedPublicConfig:config,
   runtimeConfigSha256:sha(JSON.stringify(canonical(config))),inputSha256:hashes(),
  },null,2)+'\n');
 }else if(mode==='verify'){
  const evidence=JSON.parse(fs.readFileSync(path.join(process.env.RUNNER_TEMP,'aab-release-provenance.json'),'utf8'));
  assert.equal(evidence.sourceCommit,git('rev-parse','HEAD'));assert.deepEqual(hashes(),evidence.inputSha256,'Build changed tracked inputs');
 }else throw new Error('Expected environment, snapshot or verify');
}
module.exports={equivalent,authorize};
if(require.main===module)main(...process.argv.slice(2));
