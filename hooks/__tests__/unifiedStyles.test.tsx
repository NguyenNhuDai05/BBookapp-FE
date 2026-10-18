import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateService } from '../useMuaServices';
import { useMuaProfile, useUpdateMuaProfile } from '../useMuaProfile';
import { useSubmitApplication } from '../useMuaOnboarding';
import { muaServicesService } from '../../services/muaServicesService';
import { muaProfileService } from '../../services/muaProfileService';
const mockBecomeMua = jest.fn().mockResolvedValue(true);
jest.mock('../../services/muaServicesService', () => ({ muaServicesService: { createService: jest.fn() } }));
jest.mock('../../services/muaProfileService', () => ({ muaProfileService: { updateProfile: jest.fn(), getProfile: jest.fn() } }));
jest.mock('../../services/api', () => ({ getApiError: () => ({ status: 409 }) }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: { getState: () => ({ becomeMUA: mockBecomeMua }) } }));
beforeEach(() => jest.clearAllMocks());
const keys = [['mua-profile', 'me'], ['mua-services', 'me'], ['mua-styles']];
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity }, mutations: { retry: false, gcTime: 0 } } });
  keys.forEach(key => client.setQueryData(key, ['old']));
  const wrapper = ({ children }: React.PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}
it('invalidates profile specialties, service projections and catalog after service create', async () => {
  jest.mocked(muaServicesService.createService).mockResolvedValue({ id: 's', name: 'S', durationMinutes: 60, price: 100 });
  const { client, wrapper } = setup();
  const { result, unmount } = await renderHook(() => useCreateService('me'), { wrapper });
  await act(async () => { await result.current.mutateAsync({ serviceName: 'S', durationMinutes: 60, price: 100, styleIds: [], newStyleNames: ['New'], requestId: 'id' }); });
  keys.forEach(key => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  await unmount();
  client.clear();
});
it('refreshes catalog and service choices after adding profile styles', async () => {
  jest.mocked(muaProfileService.updateProfile).mockResolvedValue(undefined);
  const { client, wrapper } = setup();
  const { result, unmount } = await renderHook(() => useUpdateMuaProfile(), { wrapper });
  await act(async () => { await result.current.mutateAsync({ styleIds: [1], newStyleNames: ['New'] }); });
  await waitFor(() => expect(client.getQueryState(['mua-styles'])?.isInvalidated).toBe(true));
  expect(client.getQueryState(['mua-services', 'me'])?.isInvalidated).toBe(true);
  await unmount();
  client.clear();
});
it('refreshes choices after onboarding saved local draft names', async () => {
  const { client, wrapper } = setup();
  const { result, unmount } = await renderHook(() => useSubmitApplication(), { wrapper });
  const payload = { displayName: 'MUA', city: 'HCM', bio: '', avatarUrl: 'https://example.com/a', styleIds: [], newStyleNames: ['New'] };
  await act(async () => { await result.current.mutateAsync(payload); });
  expect(mockBecomeMua).toHaveBeenCalledWith(payload);
  keys.forEach(key => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  await unmount();
  client.clear();
});

it('does not invalidate successful caches or mutate profile on failed service save', async () => {
  jest.mocked(muaServicesService.createService).mockRejectedValueOnce(new Error('limit exceeded'));
  const { client, wrapper } = setup();
  const { result, unmount } = await renderHook(() => useCreateService('me'), { wrapper });
  await act(async () => { await expect(result.current.mutateAsync({ serviceName: 'S', durationMinutes: 60, price: 100, styleIds: [21] })).rejects.toThrow('limit exceeded'); });
  keys.forEach(key => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  expect(client.getQueryData(['mua-profile', 'me'])).toEqual(['old']);
  await unmount(); client.clear();
});


it('refetches an active profile after service success without a separate profile write', async () => {
  const oldProfile = { id: 'm', name: 'M', verificationStatus: 'DRAFT' as const, specialties: [{ styleId: 1, name: 'One', isActive: true }] };
  const newProfile = { ...oldProfile, specialties: [...oldProfile.specialties, { styleId: 2, name: 'Two', isActive: true }] };
  jest.mocked(muaProfileService.getProfile).mockResolvedValueOnce(oldProfile).mockResolvedValue(newProfile);
  jest.mocked(muaServicesService.createService).mockResolvedValue({ id: 's', name: 'S', durationMinutes: 60, price: 100, styleIds: [2] });
  const { client, wrapper } = setup();
  client.removeQueries({ queryKey: ['mua-profile'] });
  const { result, unmount } = await renderHook(() => ({ profile: useMuaProfile('me'), save: useCreateService('me') }), { wrapper });
  await waitFor(() => expect(result.current.profile.data?.specialties).toHaveLength(1));
  await act(async () => { await result.current.save.mutateAsync({ serviceName: 'S', durationMinutes: 60, price: 100, styleIds: [2] }); });
  await waitFor(() => expect(result.current.profile.data?.specialties).toHaveLength(2));
  expect(muaProfileService.updateProfile).not.toHaveBeenCalled();
  await unmount(); client.clear();
});
