import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useFollow } from '../useFollow';
import { followService } from '../../services/followService';
import { AppAlert } from '../../components/ui/dialogStore';
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: { id: 'user-1' } }) }));
jest.mock('../../services/followService', () => ({ followService: { status: jest.fn(), set: jest.fn() } }));
jest.mock('../../components/ui/dialogStore', () => ({ AppAlert: { alert: jest.fn() } }));
function Button({ name }: { name: string }) {
  const follow = useFollow('mua-1');
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={name} onPress={() => { void follow.toggle(); }}><Text>{name}:{String(follow.status?.isFollowing)}:{follow.status?.followersCount}</Text></TouchableOpacity>;
}
async function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  await render(<QueryClientProvider client={client}><Button name="one" /><Button name="two" /></QueryClientProvider>);
  await waitFor(() => expect(screen.getByText('one:false:4')).toBeTruthy());
  return client;
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(followService.status).mockResolvedValue({ muaId: 'mua-1', isFollowing: false, followersCount: 4 });
});
it('shares optimistic status across two controls and prevents duplicate requests', async () => {
  let finish!: (value: { muaId: string; isFollowing: boolean; followersCount: number }) => void;
  jest.mocked(followService.set).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const client = await setup();
  await fireEvent.press(screen.getByRole('button', { name: 'one' }));
  await waitFor(() => expect(screen.getByText('two:true:5')).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: 'two' }));
  expect(followService.set).toHaveBeenCalledTimes(1);
  jest.mocked(followService.status).mockResolvedValue({ muaId: 'mua-1', isFollowing: true, followersCount: 5 });
  await act(async () => finish({ muaId: 'mua-1', isFollowing: true, followersCount: 5 }));
  await waitFor(() => expect(screen.getByText('one:true:5')).toBeTruthy());
  await cleanup();
  client.clear();
});
it('rolls back both controls when the server rejects a follow', async () => {
  jest.mocked(followService.set).mockRejectedValue(new Error('offline'));
  const client = await setup();
  await fireEvent.press(screen.getByRole('button', { name: 'one' }));
  await waitFor(() => expect(AppAlert.alert).toHaveBeenCalledWith('Không thể cập nhật theo dõi', expect.any(String)));
  expect(screen.getByText('one:false:4')).toBeTruthy();
  expect(screen.getByText('two:false:4')).toBeTruthy();
  client.clear();
});

it('requires confirmation before unfollow and invalidates the unified feed', async () => {
  const client = await setup();
  await act(async () => { client.setQueryData(['follow', 'user-1', 'mua-1'], { muaId: 'mua-1', isFollowing: true, followersCount: 5 }); });
  await waitFor(() => expect(screen.getByText('one:true:5')).toBeTruthy());
  client.setQueryDefaults(['feed'], { gcTime: Infinity });
  client.setQueryData(['feed', 'user-1'], { pages: [], pageParams: [] });
  await fireEvent.press(screen.getByRole('button', { name: 'one' }));
  expect(followService.set).not.toHaveBeenCalled();
  const buttons = jest.mocked(AppAlert.alert).mock.calls[0][2]!;
  jest.mocked(followService.set).mockResolvedValue({ muaId: 'mua-1', isFollowing: false, followersCount: 4 });
  await act(async () => { await buttons.find(button => button.text === 'Bỏ theo dõi')!.onPress!(); });
  expect(followService.set).toHaveBeenCalledWith('mua-1', false);
  expect(client.getQueryState(['feed', 'user-1'])!.isInvalidated).toBe(true);
  await cleanup();
  client.clear();
});
