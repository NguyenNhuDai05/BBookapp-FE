import { ApiPortfolioRepository } from '../ApiPortfolioRepository';
import { api } from '../../services/api';
import { normalizePortfolio } from '../../utils/portfolio';
import { getFeed, getFeedPage } from '../../services/feedService';
import { portfolioFixture } from '../../test-utils/portfolioFixture';
jest.mock('../../services/api', () => ({ api: { get: jest.fn(), post: jest.fn(), put: jest.fn() }, getApiError: () => ({}) }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: { getState: () => ({ user: { id: 'artist' } }) } }));
beforeEach(() => jest.resetAllMocks());
it('uses write acknowledgements, unchanged routes and a partial payload without inventing a portfolio', async () => {
  const repo = new ApiPortfolioRepository(); const patch = { expectedVersion: 7, tagging: { occasionKeys: [] } };
  jest.mocked(api.put).mockResolvedValue({ data: { message: 'OK' } });
  expect(await repo.updateItem('p1', patch)).toEqual({ message: 'OK' }); expect(api.put).toHaveBeenCalledWith('/mua/portfolio/p1', patch);
  jest.mocked(api.post).mockResolvedValue({ data: { message: 'Created' } });
  expect(await repo.createItem('me', { imageUrls: ['https://media.test/1'] })).toEqual({ message: 'Created' });
  jest.mocked(api.post).mockResolvedValue({ data: {} }); await expect(repo.createItem('me', {})).rejects.toThrow('Chưa xác định');
});
it('normalizes owner/favorites/feed/cursor identically while preserving album, status, references and rank order', async () => {
  const raw = { ...portfolioFixture(), id: undefined, imageUrl: undefined, isPinned: true };
  const repo = new ApiPortfolioRepository();
  jest.mocked(api.get).mockResolvedValue({ data: [raw] });
  const owner = (await repo.getPortfolio('me'))[0]; const favorites = (await repo.getFavorites('saved'))[0]; const feed = (await getFeed())[0];
  expect(owner).toEqual(favorites); expect(owner.id).toBe('p1'); expect(owner.isCover).toBe(true); expect(feed.tagging).toEqual(owner.tagging); expect(feed.version).toBe(7);
  jest.mocked(api.get).mockResolvedValue({ data: { items: [raw, { ...raw, portfolioId: 'p2' }], nextCursor: 'next' } });
  const page = await getFeedPage(); expect(page.items.map(p => p.portfolioId)).toEqual(['p1', 'p2']); expect(page.nextCursor).toBe('next');
});
it('preserves missing tagging/version as unknown on old DTOs instead of confirmed empty data', () => {
  const item = normalizePortfolio({ portfolioId: 'old', imageUrls: ['https://media.test/1'], tags: ['Cô dâu'], service: { serviceId: 's1' } });
  expect(item.tagging).toBeUndefined(); expect(item.version).toBeUndefined(); expect(item.serviceId).toBe('s1'); expect(item.tags).toEqual(['Cô dâu']);
  expect(() => normalizePortfolio({ tagging: {} })).toThrow('không hợp lệ');
});
