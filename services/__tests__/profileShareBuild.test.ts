import config from '../../app.config';
const original = { ...process.env };
beforeEach(() => { for (const key of Object.keys(process.env)) if (key.startsWith('BBOOK_') || key === 'EAS_BUILD_PROFILE') delete process.env[key]; });
afterEach(() => { process.env = { ...original }; });
const context = { config: { name: 'BBook', slug: 'BBook-app', scheme: 'bbookapp', android: { package: 'com.bbook.app', googleServicesFile: './google-services.json' }, plugins: [] } } as unknown as Parameters<typeof config>[0];
it('restricts production App Links to HTTPS profile paths and retains signing/package/Firebase identity', () => {
  const result = config(context);
  expect(result.android?.package).toBe('com.bbook.app'); expect(result.android?.googleServicesFile).toBe('./google-services.json'); expect(result.scheme).toBe('bbookapp');
  const filter = result.android!.intentFilters![0]; expect(filter.autoVerify).toBe(true);
  expect(filter.data).toEqual(['/mua/', '/posts/'].map(pathPrefix => ({ scheme: 'https', host: 'bbookmakeup.com', pathPrefix })));
});
it.each(['ai-test', 'advisor-preview'])('does not let %s hijack production profile links', variant => {
  if (variant === 'ai-test') process.env.BBOOK_BUILD_VARIANT = 'ai-test';
  process.env.EAS_BUILD_PROFILE = variant;
  const result = config(context); expect(result.android?.package).not.toBe('com.bbook.app'); expect(result.android?.intentFilters).toBeUndefined();
});
