import { catalogFixture, tagsFixture } from '../../test-utils/portfolioFixture';
import { emptyPortfolioTags, portfolioTagDraft, portfolioTagPatch, supportsPortfolioTagging, validatePortfolioTags } from '../portfolioTagging';
import { uploadPortfolioAlbum, uncertainPortfolioWrite } from '../portfolioWrite';
jest.mock('../../services/api', () => ({ getApiError: (e: any) => ({ code: e.code, status: e.status, isNetworkError: e.network }) }));

it('keeps all groups optional and sends only a changed group with explicit clearing', () => {
  const empty = emptyPortfolioTags();
  expect(validatePortfolioTags(empty, empty, catalogFixture())).toBeUndefined();
  expect(portfolioTagPatch(empty, empty)).toBeUndefined();
  const initial = portfolioTagDraft(tagsFixture());
  expect(portfolioTagPatch({ ...initial, occasionKeys: [] }, initial)).toEqual({ occasionKeys: [] });
  expect(portfolioTagPatch({ ...initial, intensityKey: null }, initial)).toEqual({ intensityKey: null });
});
it('validates exactly all five groups at their limits using catalog identities', () => {
  const draft = { primaryStyleId: 73, secondaryStyleIds: [94, 105], occasionKeys: ['date', 'work', 'daily'], intensityKey: 'medium', colorToneKeys: ['peach', 'rose-pink', 'beige'], effectKeys: ['base-dewy', 'lip-glossy', 'eye-shimmer', 'base-matte'] };
  expect(validatePortfolioTags(draft, emptyPortfolioTags(), catalogFixture())).toBeUndefined();
  for (const overflow of [{ secondaryStyleIds: [94, 105, 106] }, { occasionKeys: [...draft.occasionKeys, 'photoshoot'] }, { colorToneKeys: [...draft.colorToneKeys, 'nude'] }, { effectKeys: [...draft.effectKeys, 'lip-red'] }]) expect(validatePortfolioTags({ ...draft, ...overflow }, emptyPortfolioTags(), catalogFixture())).toMatch('giới hạn');
});
it('rejects duplicate styles/terms, missing primary, invalid keys and unsupported intensity', () => {
  const baseline = emptyPortfolioTags();
  for (const patch of [{ primaryStyleId: 73, secondaryStyleIds: [73] }, { primaryStyleId: 73, secondaryStyleIds: [94, 94] }, { occasionKeys: ['date', 'date'] }]) expect(validatePortfolioTags({ ...baseline, ...patch }, baseline, catalogFixture())).toMatch('trùng');
  expect(validatePortfolioTags({ ...baseline, secondaryStyleIds: [94] }, baseline, catalogFixture())).toMatch('chính');
  expect(validatePortfolioTags({ ...baseline, occasionKeys: ['social'] }, baseline, catalogFixture())).toMatch('không còn');
  expect(validatePortfolioTags({ ...baseline, intensityKey: 'extreme' }, baseline, catalogFixture())).toMatch('không hợp lệ');
});
it('retains/removes historical inactive terms/styles without promotion or metadata inference', () => {
  const baseline = portfolioTagDraft(tagsFixture());
  const catalog = catalogFixture(); catalog.styles = catalog.styles.filter(s => s.styleId !== 73); catalog.terms = catalog.terms!.filter(t => t.key !== 'date');
  expect(validatePortfolioTags(baseline, baseline, catalog)).toBeUndefined();
  expect(validatePortfolioTags({ ...baseline, primaryStyleId: null, occasionKeys: [] }, baseline, catalog)).toBeUndefined();
  expect(validatePortfolioTags({ ...baseline, primaryStyleId: 94, secondaryStyleIds: [73] }, baseline, catalog)).toMatch('vai trò');
  const custom = { ...emptyPortfolioTags(), primaryStyleId: 94 };
  expect(validatePortfolioTags(custom, emptyPortfolioTags(), catalog)).toBeUndefined(); expect(custom.effectKeys).toEqual([]);
});
it('requires real taxonomy and capability and never treats legacy fallback as tagging support', () => {
  expect(supportsPortfolioTagging(catalogFixture())).toBe(true);
  expect(supportsPortfolioTagging({ ...catalogFixture(), capabilities: undefined })).toBe(false);
  expect(supportsPortfolioTagging({ ...catalogFixture(), source: 'legacy' })).toBe(false);
  expect(supportsPortfolioTagging({ ...catalogFixture(), terms: undefined })).toBe(false);
});
it('retains each successful upload after partial failure and retries only the missing image in album order', async () => {
  const cache = new Map<string, string>();
  let fail = true;
  const upload = jest.fn(async (uri: string) => { if (uri === 'file:///b' && fail) throw new Error('upload failed'); return `https://media.test/${uri.split('/').pop()}`; });
  const album = ['https://media.test/old', 'file:///a', 'file:///b'];
  await expect(uploadPortfolioAlbum(album, cache, upload)).rejects.toThrow('upload failed');
  expect(cache.get('file:///a')).toBe('https://media.test/a');
  fail = false;
  expect(await uploadPortfolioAlbum(album, cache, upload)).toEqual(['https://media.test/old', 'https://media.test/a', 'https://media.test/b']);
  expect(upload.mock.calls.filter(([uri]) => uri === 'file:///a')).toHaveLength(1);
  expect(upload.mock.calls.filter(([uri]) => uri === 'file:///b')).toHaveLength(2);
  expect(upload).not.toHaveBeenCalledWith('https://media.test/old', 'portfolio');
});
it('treats ambiguous network/server failures as uncertain but keeps validation/conflict errors definite', () => {
  expect(uncertainPortfolioWrite({ network: true })).toBe(true);
  expect(uncertainPortfolioWrite({ status: 503 })).toBe(true);
  expect(uncertainPortfolioWrite({ status: 409, code: 'PORTFOLIO_VERSION_CONFLICT' })).toBe(false);
  expect(uncertainPortfolioWrite({ status: 400, code: 'PORTFOLIO_TAG_LIMIT' })).toBe(false);
});
