// Read-only deployment smoke check. No credentials, OTPs or writes are sent.
const eas = require('../../eas.json');

async function checkReleaseApi(profile = 'production', request = fetch) {
  const configured = eas.build[profile]?.env?.EXPO_PUBLIC_API_URL;
  if (!configured) throw new Error(`Missing API URL for EAS profile: ${profile}`);
  const base = new URL(configured);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) {
    throw new Error('Release API must use HTTPS without credentials, query or fragment');
  }
  if (!/\/api\/?$/.test(base.pathname)) throw new Error('Release API URL must end in /api');
  const root = configured.replace(/\/api\/?$/, '');
  for (const [url, expected] of [[`${root}/health`, 200], [`${root}/api/User/profile`, 401]]) {
    const response = await request(url, { signal: AbortSignal.timeout(25000), redirect: 'error' });
    if (response.headers.get('x-render-routing') === 'suspend-by-user') {
      throw new Error('Render service is suspended by its owner. Resume it before release.');
    }
    if (response.status !== expected) throw new Error(`${new URL(url).pathname}: expected HTTP ${expected}, received ${response.status}`);
    if (expected === 200) {
      const body = await response.json();
      if ((body.status ?? body.Status) !== 'Healthy') throw new Error('/health did not report Healthy');
    }
  }
  return { profile, api: configured, health: 'Healthy', anonymousProfile: 401 };
}

module.exports = { checkReleaseApi };
if (require.main === module) {
  checkReleaseApi(process.argv[2]).then(result => {
    console.log(JSON.stringify(result, null, 2));
    console.log('PASS: HTTP routing only. Authenticated flows and device acceptance are still required.');
  }).catch(error => { console.error(`RELEASE API CHECK FAILED: ${error.message}`); process.exitCode = 1; });
}
