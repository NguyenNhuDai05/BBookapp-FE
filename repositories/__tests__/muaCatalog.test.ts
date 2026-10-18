import { ApiMuaStyleRepository } from '../ApiMuaStyleRepository';
import { api } from '../../services/api';
import { catalogFixture } from '../../test-utils/portfolioFixture';
import { supportsPortfolioTagging } from '../../utils/portfolioTagging';
jest.mock('../../services/api', () => ({ api: { get: jest.fn(), post: jest.fn() }, getApiError: (error: any) => ({ status: error.status, isNetworkError: error.network }) }));
const row = { styleId: 1, key: 'natural', name: 'Tự nhiên', isActive: true };
const snapshot = { version: 'hash', styles: [row], terms: [] };
beforeEach(() => jest.clearAllMocks());
it('uses real catalog identities, nullable legacy keys and backend order', async () => {
  jest.mocked(api.get).mockResolvedValue({ data: { ...snapshot, styles: [{ ...row, styleId: 2, key: null }, row, { ...row, styleId: 3, isActive: false }, { ...row, styleId: 4, archivedAt: 'now' }] } });
  const result = await new ApiMuaStyleRepository().getCatalog();
  expect(api.get).toHaveBeenCalledWith('/makeup-catalog', { signal: undefined });
  expect(result).toEqual(expect.objectContaining({ version: 'hash', source: 'catalog', styles: [{ ...row, styleId: 2, key: null }, row], terms: [] }));
});
it.each([404, 405, 500, 501, 503, undefined])('falls back safely on unavailable catalog (%s) with an explicit source warning', async status => {
  jest.mocked(api.get).mockRejectedValueOnce({ status, network: status === undefined }).mockResolvedValueOnce({ data: [row] });
  const result = await new ApiMuaStyleRepository().getCatalog();
  expect(result.source).toBe('legacy'); expect(result.styles).toEqual([row]); expect(result.fallbackReason).toBeTruthy();
  expect(api.get).toHaveBeenLastCalledWith('/Mua/styles', { signal: undefined });
});
it.each([401, 403, 400, 429])('does not bypass authorization, validation or throttling (%s)', async status => {
  const error = { status }; jest.mocked(api.get).mockRejectedValue(error);
  await expect(new ApiMuaStyleRepository().getCatalog()).rejects.toBe(error); expect(api.get).toHaveBeenCalledTimes(1);
});
it('keeps successful empty catalog empty rather than substituting a second source', async () => {
  jest.mocked(api.get).mockResolvedValue({ data: { ...snapshot, styles: [] } });
  expect((await new ApiMuaStyleRepository().getCatalog()).styles).toEqual([]); expect(api.get).toHaveBeenCalledTimes(1);
});
it('reports both endpoint failure and invalid data without inventing rows', async () => {
  jest.mocked(api.get).mockRejectedValueOnce({ status: 404 }).mockRejectedValueOnce(new Error('offline'));
  await expect(new ApiMuaStyleRepository().getCatalog()).rejects.toThrow('offline');
  jest.mocked(api.get).mockResolvedValue({ data: { ...snapshot, styles: [{ ...row, styleId: '1' }] } });
  await expect(new ApiMuaStyleRepository().getCatalog()).rejects.toThrow('không đúng định dạng');
});
it('does not start legacy fallback after cancellation', async () => {
  const controller = new AbortController(); controller.abort(); jest.mocked(api.get).mockRejectedValue(new Error('cancelled'));
  await expect(new ApiMuaStyleRepository().getCatalog(controller.signal)).rejects.toThrow('cancelled'); expect(api.get).toHaveBeenCalledTimes(1);
});
it('retains select-or-create contract without changing profile in the repository', async () => {
  jest.mocked(api.post).mockResolvedValue({ data: row });
  expect(await new ApiMuaStyleRepository().selectOrCreate('Tự nhiên')).toEqual(row);
  expect(api.post).toHaveBeenCalledWith('/Mua/styles/select-or-create', { name: 'Tự nhiên' }); expect(api.get).not.toHaveBeenCalled();
});
it('exposes typed groups/terms and capability through the same catalog request', async () => {
  jest.mocked(api.get).mockResolvedValue({ data: { ...catalogFixture() } });
  const result = await new ApiMuaStyleRepository().getCatalog();
  expect(supportsPortfolioTagging(result)).toBe(true); expect(result.terms).toEqual(catalogFixture().terms);
  expect(api.get).toHaveBeenCalledTimes(1); expect(api.post).not.toHaveBeenCalled();
});
it.each([
  { terms: [{ id: 1, kind: 'effect-group', key: 'base', label: 'Base', isActive: true }, { id: 2, kind: 'occasion', key: 'date', label: 'Date', groupId: 1, isActive: true }] },
  { terms: [{ id: 1, kind: 'intensity', key: 'extreme', label: 'Extreme', isActive: true }] },
  { capabilities: undefined },
  { terms: [{ id: '1', kind: 'effect', key: 'dewy', label: 'Dewy', isActive: true }] },
])('disables tagging for unsupported/malformed taxonomy without breaking Phase D style consumers (%j)', async invalid => {
  jest.mocked(api.get).mockResolvedValue({ data: { ...catalogFixture(), ...invalid } });
  const result = await new ApiMuaStyleRepository().getCatalog(); expect(result.styles).toEqual(catalogFixture().styles); expect(supportsPortfolioTagging(result)).toBe(false);
});
