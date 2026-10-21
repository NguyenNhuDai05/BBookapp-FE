// APK workflow configuration/provenance only. No compilation or release commands.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const profile = readJson('eas.json').build['tester-apk'];
const businessEnv = { ...profile.env, EAS_BUILD_PROFILE: 'tester-apk', NODE_ENV: 'production' };
const [mode, input] = process.argv.slice(2);
const candidatePolicy = (loaded = false) => {
  assert(!process.env.BBOOK_ADVISOR_TESTER_APPROVED, 'APK candidate job must not receive tester release approval.');
  assert(!process.env.BBOOK_ADVISOR_DEVICE_ACCEPTANCE, 'APK candidate job must not claim device acceptance.');
  assert(!process.env.RELEASE_ACCEPTANCE_REFERENCE, 'Candidate has no completed acceptance reference.');
  if (loaded) assert.equal(process.env.BBOOK_APK_RELEASE_CANDIDATE, '1');
};
const git = (...args) => cp.execFileSync('git', args, { encoding: 'utf8' }).trim();
const inputs = () => {
  const files = ['app.json', 'app.config.ts', 'eas.json', 'package.json', 'package-lock.json',
    'google-services.json', 'features/makeupAdvisor/buildConfig.js', 'features/makeupAdvisor/flags.ts',
    'features/makeupAdvisor/measurementRanking.ts', 'features/makeupAdvisor/recommendationCore.ts',
    'features/makeupAdvisor/localEngine.ts', 'features/makeupAdvisor/bbook-makeup-catalog-20-vi-v1.2.json',
    '.github/workflows/android-apk.yml', ...fs.readdirSync('scripts/ci').map(f => `scripts/ci/${f}`)];
  return Object.fromEntries(files.sort().map(f => [f, hash(fs.readFileSync(f))]));
};
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
if (mode === 'environment') {
  candidatePolicy();
  assert.equal(profile.developmentClient, false);
  assert.equal(profile.android.buildType, 'apk');
  assert.equal(businessEnv.BBOOK_ADVISOR_ENABLED, '1');
  assert.equal(businessEnv.BBOOK_ADVISOR_FACE_AWARE_EXPERIMENTAL, '1');
  assert.equal(businessEnv.BBOOK_ADVISOR_MEASUREMENT_RANKING, '1');
  assert.equal(businessEnv.BBOOK_ADVISOR_CLOUD_ENABLED, '0', 'Cloud changes require a separate configuration review.');
  assert.equal(businessEnv.BBOOK_ADVISOR_DATA_PROCESSING_APPROVAL, 'pending');
  // Avoid runner/repository variables silently adding local, QA or experimental flags.
  for (const key of Object.keys(process.env)) {
    if ((key.startsWith('BBOOK_') || key.startsWith('EXPO_PUBLIC_')) &&
        !Object.hasOwn(businessEnv, key) && key !== 'BBOOK_APK_RELEASE_CANDIDATE') {
      throw new Error(`Unreviewed business environment: ${key}`);
    }
  }
  const exported = { ...businessEnv, BBOOK_APK_RELEASE_CANDIDATE: '1' };
  const lines = Object.entries(exported).map(([key, value]) => {
    assert(typeof value === 'string' && !/[\r\n\0]/.test(value), `Unsafe environment value: ${key}`);
    return `${key}=${value}`;
  });
  fs.appendFileSync(process.env.GITHUB_ENV, `${lines.join('\n')}\n`);
  console.log('Loaded tester-apk runtime configuration with APK-only candidate build permission; release is not approved.');
} else if (mode === 'snapshot') {
  candidatePolicy(true);
  for (const [key, value] of Object.entries(businessEnv)) assert.equal(process.env[key], value, `Environment drift: ${key}`);
  const resolved = readJson(input);
  const normalized = structuredClone(resolved);
  if (normalized.android) delete normalized.android.versionCode;
  if (normalized.ios) delete normalized.ios.buildNumber;
  const commit = git('rev-parse', 'HEAD');
  assert.equal(commit, process.env.GITHUB_SHA, 'Checkout does not match workflow commit');
  assert.equal(git('status', '--porcelain', '--untracked-files=no'), '', 'Tracked source is modified before prebuild');
  const evidence = {
    schemaVersion: 1, sourceCommit: commit, sourceTree: git('rev-parse', 'HEAD^{tree}'),
    releaseTarget: 'closed-test', profile: 'tester-apk', businessEnvironment: businessEnv,
    buildPolicy: { intent: 'device-acceptance-candidate', releaseAuthorized: false, deviceAcceptance: 'pending' },
    resolvedPublicConfig: resolved,
    // Profile name identifies packaging; resolved environment/flags must still match.
    businessConfigSha256: hash(JSON.stringify(canonical({
      environment: Object.fromEntries(Object.entries(businessEnv).filter(([key]) => key !== 'EAS_BUILD_PROFILE')),
      config: normalized
    }))),
    inputSha256: inputs(),
    toolchain: { node: process.version, java: '17', runner: process.env.ImageOS,
      runnerImageVersion: process.env.ImageVersion, buildTools: '36.0.0', ndk: '27.1.12297006' },
    packaging: { format: 'apk', mode: 'release', versionCode: process.env.APK_VERSION_CODE,
      architectures: process.env.APK_ARCHITECTURES },
    externalState: 'Backend capabilities, Firebase/FCM credentials, account data and server flags are not frozen by this manifest.'
  };
  fs.writeFileSync(path.join(process.env.RUNNER_TEMP, 'apk-release-provenance.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log('Recorded source commit and resolved release configuration before prebuild.');
} else if (mode === 'verify') {
  const evidence = readJson(path.join(process.env.RUNNER_TEMP, 'apk-release-provenance.json'));
  assert.deepEqual(inputs(), evidence.inputSha256, 'Build/prebuild changed a release input; review instead of claiming reproducibility.');
  assert.equal(git('rev-parse', 'HEAD'), evidence.sourceCommit);
  console.log('Release input hashes remain unchanged.');
} else {
  throw new Error('Expected environment, snapshot or verify mode');
}
