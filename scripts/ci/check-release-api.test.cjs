const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkReleaseApi } = require('./check-release-api.cjs');

test('accepts a healthy deployment with protected profile routing', async () => {
  const urls = [];
  const result = await checkReleaseApi('production', async url => {
    urls.push(url);
    return url.endsWith('/health') ? Response.json({ status: 'Healthy' }) : new Response(null, { status: 401 });
  });
  assert.equal(result.health, 'Healthy'); assert.equal(urls.length, 2);
});
test('fails immediately for suspended Render without testing profile', async () => {
  let count = 0;
  await assert.rejects(checkReleaseApi('production', async () => {
    count++;
    return new Response('Service Suspended', { status: 503, headers: { 'x-render-routing': 'suspend-by-user' } });
  }), /suspended/);
  assert.equal(count, 1);
});
test('rejects a successful HTML page masquerading as API health', async () => {
  await assert.rejects(checkReleaseApi('production', async () => new Response('<html>Welcome</html>')));
});
test('rejects a deployment exposing profile without authentication', async () => {
  await assert.rejects(checkReleaseApi('production', async () => Response.json({ status: 'Healthy' })), /expected HTTP 401/);
});
test('rejects profiles without an explicit API configuration', async () => {
  await assert.rejects(checkReleaseApi('nonexistent', async () => { throw new Error('Must not send request'); }), /Missing API URL/);
});
