import { renderHook, waitFor } from '@testing-library/react-native';
import { useProtectedRoute } from '../useProtectedRoute';
const mockReplace = jest.fn();
const mockInitialize = jest.fn(async () => false);
const mockSwitch = jest.fn();
let mockSegments = ['mua-detail'];
let mockParams: Record<string, string> = {};
let mockState: any;
jest.mock('expo-router', () => ({ useGlobalSearchParams: () => mockParams, useSegments: () => mockSegments, useRouter: () => ({ replace: mockReplace }), useRootNavigationState: () => ({ key: 'root' }) }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: () => mockState }));
jest.mock('../../components/ui/dialogStore', () => ({ AppAlert: { alert: jest.fn() } }));
beforeEach(() => { jest.clearAllMocks(); mockSegments = ['mua-detail']; mockParams = {}; mockState = { user: null, isAuthenticated: false, activeMode: 'CUSTOMER', initialize: mockInitialize, switchMode: mockSwitch, isModeSwitching: false, sessionError: null }; });
it.each(['mua-detail', 'mua', 'shared-post', 'posts', 'profile-unavailable'])('permits anonymous read-only profile route %s after startup', async route => {
  mockSegments = [route]; const hook = await renderHook(() => useProtectedRoute());
  await waitFor(() => expect(hook.result.current).toBe(true)); expect(mockReplace).not.toHaveBeenCalled();
});
it('still protects checkout and follower identities for guests', async () => {
  mockSegments = ['followers']; const hook = await renderHook(() => useProtectedRoute());
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(auth)/login')); expect(hook.result.current).toBe(false);
});
it('returns a signed-in customer to the shared MUA rather than losing the destination to Home', async () => {
  const returnTo = '/mua-detail?id=10000000-0000-0000-0000-000000000001&intent=chat';
  mockSegments = ['(auth)', 'login']; mockParams = { returnTo }; mockState = { ...mockState, isAuthenticated: true, user: { id: 'customer', role: 'CUSTOMER' } };
  await renderHook(() => useProtectedRoute()); await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(returnTo));
});
it('does not let a profile return parameter bypass Admin isolation', async () => {
  mockSegments = ['(auth)', 'login']; mockParams = { returnTo: '/mua-detail?id=10000000-0000-0000-0000-000000000001' }; mockState = { ...mockState, isAuthenticated: true, user: { id: 'admin', role: 'ADMIN' } };
  await renderHook(() => useProtectedRoute()); await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(admin)/dashboard'));
  expect(mockReplace).not.toHaveBeenCalledWith(expect.stringContaining('mua-detail'));
});
it('does not redirect an authenticated MUA away from another public profile', async () => {
  mockState = { ...mockState, isAuthenticated: true, activeMode: 'MUA', user: { id: 'artist', role: 'MUA', hasMuaProfile: true } };
  const hook = await renderHook(() => useProtectedRoute()); await waitFor(() => expect(hook.result.current).toBe(true)); expect(mockReplace).not.toHaveBeenCalled();
});
