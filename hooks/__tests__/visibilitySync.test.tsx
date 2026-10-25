import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMuaPortfolio } from '../useMuaPortfolio';
import { useMuaServices, useSetServiceActive } from '../useMuaServices';
import { portfolioService } from '../../services/portfolioService';
import { muaServicesService } from '../../services/muaServicesService';
import { portfolioFixture } from '../../test-utils/portfolioFixture';

jest.mock('../../services/portfolioService', () => ({ portfolioService: { getPortfolio: jest.fn(), setVisibility: jest.fn() } }));
jest.mock('../../services/muaServicesService', () => ({ muaServicesService: { getServices: jest.fn(), setActive: jest.fn() } }));
jest.mock('../useMuaEligibility', () => ({ MUA_ELIGIBILITY_QUERY_KEY: ['mua-eligibility'] }));
jest.mock('../../services/api', () => ({ getApiError: (error: Error) => ({ message: error.message }) }));
const projections = [['feed', 'customer'], ['customer-explore', 'home'], ['portfolio-favorites', 'saved'], ['mua', 'artist'], ['mua-profile', 'me'], ['mua-eligibility']];
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: 0 } } });
  projections.forEach(key => client.setQueryData(key, ['cached']));
  const wrapper = ({ children }: React.PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}
beforeEach(() => jest.resetAllMocks());
it.each([false, true])('refreshes both owner and public portfolio after visibility changes to hidden=%s', async isHidden => {
  const { client, wrapper } = setup();
  const item = { ...portfolioFixture(), isHidden: !isHidden };
  jest.mocked(portfolioService.getPortfolio).mockResolvedValue([item]);
  jest.mocked(portfolioService.setVisibility).mockImplementation(async () => {
    jest.mocked(portfolioService.getPortfolio).mockImplementation(async id => id === 'me' || !isHidden ? [{ ...item, isHidden }] : []);
  });
  const hook = await renderHook(() => ({ owner: useMuaPortfolio('me'), public: useMuaPortfolio('artist') }), { wrapper });
  await waitFor(() => expect(hook.result.current.public.isSuccess).toBe(true));
  await act(async () => { await hook.result.current.owner.setVisibility({ itemId: item.id, isHidden }); });
  await waitFor(() => expect(hook.result.current.owner.data?.[0].isHidden).toBe(isHidden));
  expect(hook.result.current.public.data).toHaveLength(isHidden ? 0 : 1);
  projections.forEach(key => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  expect(portfolioService.setVisibility).toHaveBeenCalledTimes(1);
  await hook.unmount(); client.clear();
});
it.each([false, true])('refreshes owner and buyer service lists after active changes to %s', async isActive => {
  const { client, wrapper } = setup();
  const service = { id: 's1', name: 'Makeup', price: 100, durationMinutes: 60, status: 'ACTIVE' as const };
  jest.mocked(muaServicesService.getServices).mockResolvedValue([service]);
  jest.mocked(muaServicesService.setActive).mockImplementation(async () => {
    jest.mocked(muaServicesService.getServices).mockImplementation(async id => id === 'me' || isActive ? [{ ...service, status: isActive ? 'ACTIVE' : 'INACTIVE' }] : []);
  });
  client.setQueryData(['mua-portfolio', 'artist'], ['cached']);
  const hook = await renderHook(() => ({ owner: useMuaServices('me'), public: useMuaServices('artist'), active: useSetServiceActive('me') }), { wrapper });
  await waitFor(() => expect(hook.result.current.public.isSuccess).toBe(true));
  await act(async () => { await hook.result.current.active.mutateAsync({ serviceId: 's1', isActive }); });
  await waitFor(() => expect(hook.result.current.owner.data?.[0].status).toBe(isActive ? 'ACTIVE' : 'INACTIVE'));
  expect(hook.result.current.public.data).toHaveLength(isActive ? 1 : 0);
  expect(client.getQueryState(['mua', 'artist'])?.isInvalidated).toBe(true);
  expect(client.getQueryState(['mua-portfolio', 'artist'])?.isInvalidated).toBe(true);
  expect(muaServicesService.setActive).toHaveBeenCalledTimes(1);
  await hook.unmount(); client.clear();
});
it('preserves cached visibility and does not retry a rejected status change', async () => {
  const { client, wrapper } = setup();
  jest.mocked(portfolioService.getPortfolio).mockResolvedValue([{ ...portfolioFixture(), isHidden: false }]);
  jest.mocked(portfolioService.setVisibility).mockRejectedValue(new Error('offline'));
  const hook = await renderHook(() => useMuaPortfolio('me'), { wrapper });
  await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
  await act(async () => { await expect(hook.result.current.setVisibility({ itemId: 'p1', isHidden: true })).rejects.toThrow('offline'); });
  expect(hook.result.current.data?.[0].isHidden).toBe(false);
  expect(portfolioService.setVisibility).toHaveBeenCalledTimes(1);
  expect(client.getQueryState(['feed', 'customer'])?.isInvalidated).toBe(false);
  await hook.unmount(); client.clear();
});
