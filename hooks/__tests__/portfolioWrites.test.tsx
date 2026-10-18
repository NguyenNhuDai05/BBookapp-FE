import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMuaPortfolio } from '../useMuaPortfolio';
import { portfolioService } from '../../services/portfolioService';
import { PortfolioSavedRefreshError } from '../../utils/portfolioWrite';
import { portfolioFixture } from '../../test-utils/portfolioFixture';
jest.mock('../../services/portfolioService', () => ({ portfolioService: { getPortfolio: jest.fn(), createItem: jest.fn(), updateItem: jest.fn() } }));
jest.mock('../useMuaEligibility', () => ({ MUA_ELIGIBILITY_QUERY_KEY: ['mua-eligibility'] }));
jest.mock('../../services/api', () => ({ getApiError: (e: any) => ({ message: e.message, status: e.status, code: e.code }) }));
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  return { client, wrapper: ({ children }: React.PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider> };
}
beforeEach(() => { jest.resetAllMocks(); jest.mocked(portfolioService.getPortfolio).mockResolvedValue([portfolioFixture()]); jest.mocked(portfolioService.createItem).mockResolvedValue({ message: 'Created' }); jest.mocked(portfolioService.updateItem).mockResolvedValue({ message: 'Updated' }); });
it('awaits a real owner GET after ack and updates query data from that response', async () => {
  const { client, wrapper } = setup(); const hook = await renderHook(() => useMuaPortfolio('me'), { wrapper });
  await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
  jest.mocked(portfolioService.getPortfolio).mockResolvedValue([{ ...portfolioFixture(), description: 'From real GET' }]);
  await act(async () => { expect(await hook.result.current.createItem({ description: 'draft' })).toEqual({ message: 'Created' }); });
  expect(portfolioService.getPortfolio).toHaveBeenCalledTimes(2); expect(client.getQueryData(['mua-portfolio', 'me'])).toEqual([expect.objectContaining({ description: 'From real GET' })]);
  await hook.unmount(); client.clear();
});
it('reports committed/refetch failure distinctly and retryRefresh only calls GET', async () => {
  const { client, wrapper } = setup(); const hook = await renderHook(() => useMuaPortfolio('me'), { wrapper }); await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
  jest.mocked(portfolioService.getPortfolio).mockRejectedValueOnce(new Error('GET offline'));
  let failure: unknown;
  await act(async () => { try { await hook.result.current.createItem({ imageUrls: ['https://media.test/1'] }); } catch (error) { failure = error; } });
  expect(failure).toBeInstanceOf(PortfolioSavedRefreshError);
  jest.mocked(portfolioService.getPortfolio).mockResolvedValue([portfolioFixture()]);
  await act(async () => { await (failure as PortfolioSavedRefreshError).retryRefresh(); });
  expect(portfolioService.createItem).toHaveBeenCalledTimes(1); expect(portfolioService.getPortfolio).toHaveBeenCalledTimes(3);
  await hook.unmount(); client.clear();
});
it('does not retry or refetch after a definite write error and does not mutate specialties', async () => {
  const { client, wrapper } = setup(); const hook = await renderHook(() => useMuaPortfolio('me'), { wrapper }); await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
  const conflict = { code: 'PORTFOLIO_VERSION_CONFLICT', status: 409 }; jest.mocked(portfolioService.updateItem).mockRejectedValue(conflict);
  await act(async () => { await expect(hook.result.current.updateItem({ id: 'p1', updates: { expectedVersion: 7, tagging: { primaryStyleId: 94 } } })).rejects.toBe(conflict); });
  expect(portfolioService.updateItem).toHaveBeenCalledTimes(1); expect(portfolioService.getPortfolio).toHaveBeenCalledTimes(1);
  expect(client.getQueryData(['mua-styles'])).toBeUndefined();
  await hook.unmount(); client.clear();
});
