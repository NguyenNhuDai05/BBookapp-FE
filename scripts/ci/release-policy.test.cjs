// Configuration-only tests. Approval values below are isolated test fixtures,
// never a record of real device acceptance or authorization to publish.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { Buffer } = require('node:buffer');
const { getConfig } = require('expo/config');
const eas = require('../../eas.json');
const workflow = fs.readFileSync('.github/workflows/android-apk.yml', 'utf8');
const fixtureApproval = {
  BBOOK_ADVISOR_TESTER_APPROVED: '1', BBOOK_ADVISOR_DEVICE_ACCEPTANCE: 'approved'
};
function config(profile, policy = {}) {
  const saved = process.env;
  process.env = { ...saved };
  try {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('BBOOK_') || key.startsWith('EXPO_PUBLIC_') ||
          ['EAS_BUILD_PROFILE', 'RELEASE_ACCEPTANCE_REFERENCE'].includes(key)) delete process.env[key];
    }
    Object.assign(process.env, eas.build[profile].env, {
      EAS_BUILD_PROFILE: profile, EXPO_NO_DOTENV: '1', NODE_ENV: 'production'
    }, policy);
    return getConfig(process.cwd(), { skipSDKVersionRequirement: true }).exp;
  } finally {
    process.env = saved;
  }
}
const candidate = () => config('tester-apk', { BBOOK_APK_RELEASE_CANDIDATE: '1' });
test('resolved APK configuration enables both runtime gates for local measurement ranking', () => {
  const vm = require('node:vm');
  const ts = require('typescript');
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('features/makeupAdvisor/flags.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true }
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require(name) {
      assert.equal(name, 'expo-constants');
      return { expoConfig: candidate() };
    }
  });
  assert.equal(module.exports.faceAwareExperimental, true);
  assert.equal(module.exports.measurementRankingEnabled, true);
});
test('APK candidate resolves without device acceptance or tester approval', () => {
  const result = candidate();
  assert.equal(result.android.package, 'com.bbook.app');
  assert.equal(result.android.googleServicesFile, './google-services.json');
  assert.equal(result.extra.advisorReleaseEnvironment, 'closed-test');
  assert.equal(result.extra.advisorTransport, 'https');
  assert.equal(result.extra.advisorEnabled, true);
  assert.equal(result.extra.advisorCloudEnabled, false);
  assert.equal(result.extra.advisorFaceAwareExperimental, true);
  assert.equal(result.extra.advisorMeasurementRanking, true);
  assert.equal(result.extra.advisorDiagnosticMode, false);
  assert.equal(result.extra.pushNotificationsEnabled, true);
  assert.equal(result.extra.advisorRemotePushEnabled, true);
  assert(!JSON.stringify(result).includes('BBOOK_APK_RELEASE_CANDIDATE'));
  assert(result.plugins.some(p => Array.isArray(p) && p[0] === './plugins/withAdvisor' && p[1].enabled));
  assert.equal(eas.build['tester-apk'].env.EXPO_PUBLIC_API_URL, 'https://beautybook-v3bi.onrender.com/api');
});
test('candidate and approved release fixture have identical complete resolved app configuration', () => {
  assert.deepEqual(candidate(), config('tester-apk', fixtureApproval));
});
test('existing Closed Testing packaging configuration has the same business env and runtime', () => {
  // Read/resolve existing configuration only: no store build or workflow is created.
  assert.deepEqual(eas.build['tester-apk'].env, eas.build['tester-aab'].env);
  assert.deepEqual(candidate(), config('tester-aab', fixtureApproval));
});
test('actual tester release policy still requires both acceptance and approval', () => {
  for (const profile of ['tester-apk', 'tester-aab']) {
    assert.throws(() => config(profile), /device acceptance/);
    assert.throws(() => config(profile, { BBOOK_ADVISOR_TESTER_APPROVED: '1' }), /device acceptance/);
    assert.throws(() => config(profile, { BBOOK_ADVISOR_DEVICE_ACCEPTANCE: 'approved' }), /device acceptance/);
  }
});
test('candidate permission is rejected for every other existing profile', () => {
  for (const profile of Object.keys(eas.build).filter(p => p !== 'tester-apk')) {
    const policy = { BBOOK_APK_RELEASE_CANDIDATE: '1', ...(profile === 'ai-test' ? { BBOOK_BUILD_VARIANT: 'ai-test' } : {}) };
    assert.throws(() => config(profile, policy), /only valid for tester-apk/);
  }
});
test('candidate cannot claim that acceptance or tester approval is completed', () => {
  for (const approval of [{ BBOOK_ADVISOR_TESTER_APPROVED: '1' }, { BBOOK_ADVISOR_DEVICE_ACCEPTANCE: 'approved' }]) {
    assert.throws(() => config('tester-apk', { BBOOK_APK_RELEASE_CANDIDATE: '1', ...approval }), /must not claim/);
  }
});
test('APK workflow is manual, repository-secret compatible and invokes only APK Gradle task', () => {
  const parsed = require('js-yaml').load(workflow);
  assert.deepEqual(Object.keys(parsed.on), ['workflow_dispatch']);
  assert.equal(parsed.jobs.apk.environment, undefined);
  assert.equal(parsed.jobs.apk.env.NODE_ENV, 'production');
  assert.equal(parsed.jobs.apk['runs-on'], 'ubuntu-24.04');
  assert.equal((workflow.match(/\.\/gradlew /g) || []).length, 1);
  assert(workflow.includes(':app:assembleRelease'));
  for (const forbidden of ['bundleRelease', 'eas build', '.aab', 'app-bundle', 'vars.BBOOK_ADVISOR_TESTER_APPROVED', 'vars.BBOOK_ADVISOR_DEVICE_ACCEPTANCE']) {
    assert(!workflow.includes(forbidden), forbidden);
  }
  assert(workflow.includes('apk-release-provenance.json'));
  assert(workflow.includes('expo-public-config.json'));
  assert(workflow.includes('manifest.sha256'));
});
test('provenance records candidate commit/config and detects input drift without claiming acceptance', () => {
  // In-memory provenance fixture: no Git commit, filesystem artifact or build is created.
  const path = require('node:path');
  const vm = require('node:vm');
  const outputs = new Map();
  const publicConfig = candidate();
  let tamper = false;
  const fakeFs = {
    ...fs,
    readFileSync(file, encoding) {
      if (file === 'fixture-public-config.json') return JSON.stringify(publicConfig);
      if (outputs.has(file)) return outputs.get(file);
      const original = fs.readFileSync(file, encoding);
      return tamper && file === 'features/makeupAdvisor/flags.ts' ? Buffer.from(`${original}\n// drift`) : original;
    },
    writeFileSync(file, content) { outputs.set(file, content); }
  };
  const fakeGit = {
    execFileSync(command, args) {
      assert.equal(command, 'git');
      if (args[0] === 'status') return '';
      return args[1] === 'HEAD^{tree}' ? 'fixture-tree' : 'fixture-commit';
    }
  };
  const env = {
    ...eas.build['tester-apk'].env, EAS_BUILD_PROFILE: 'tester-apk', NODE_ENV: 'production',
    BBOOK_APK_RELEASE_CANDIDATE: '1', GITHUB_SHA: 'fixture-commit', RUNNER_TEMP: '/fixture',
    APK_VERSION_CODE: '1', APK_ARCHITECTURES: 'universal'
  };
  const source = fs.readFileSync('scripts/ci/release-apk-config.cjs', 'utf8');
  const run = mode => vm.runInNewContext(source, {
    require(name) { return name === 'node:fs' ? fakeFs : name === 'node:child_process' ? fakeGit : require(name); },
    process: { argv: ['node', 'fixture-script', mode, 'fixture-public-config.json'], env, version: process.version },
    structuredClone, console: { log() {} }
  });
  run('snapshot');
  const evidence = JSON.parse(outputs.get(path.join('/fixture', 'apk-release-provenance.json')));
  assert.equal(evidence.sourceCommit, 'fixture-commit');
  assert.equal(evidence.sourceTree, 'fixture-tree');
  assert.deepEqual(evidence.resolvedPublicConfig, JSON.parse(JSON.stringify(publicConfig)));
  assert.deepEqual(evidence.buildPolicy, { intent: 'device-acceptance-candidate', releaseAuthorized: false, deviceAcceptance: 'pending' });
  assert.match(evidence.businessConfigSha256, /^[a-f0-9]{64}$/);
  assert(evidence.inputSha256['features/makeupAdvisor/flags.ts']);
  assert.equal(evidence.businessEnvironment.BBOOK_APK_RELEASE_CANDIDATE, undefined);
  run('verify');
  tamper = true;
  assert.throws(() => run('verify'), /changed a release input/);
});
