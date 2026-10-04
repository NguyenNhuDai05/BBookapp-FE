import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../useAuthStore';
import { useBookingStore } from '../useBookingStore';
import { authService } from '../../services/authService';
import { queryClient } from '../../lib/queryClient';
import { UserRole } from '../../types/auth';

jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('../../services/authService', () => ({ authService: { login: jest.fn(), getMe: jest.fn(), logout: jest.fn(), deleteAccount: jest.fn() } }));
jest.mock('../../services/NotificationService', () => ({ NotificationService: { unregisterDevice: jest.fn() } }));
jest.mock('../../services/signalRService', () => ({ signalRService: { disconnect: jest.fn() } }));
jest.mock('../../lib/queryClient', () => ({ queryClient: { clear: jest.fn() } }));
const reviewer = { id: 'review', name: 'Review', email: 'test@example.test', role: UserRole.MUA, hasMuaProfile: true, isDemoAccount: true, demoCounterpartMuaId: 'counterpart', createdAt: '' };
beforeEach(async () => { jest.clearAllMocks(); await AsyncStorage.clear(); useAuthStore.setState({ user: null, isAuthenticated: false, activeMode: 'CUSTOMER', isLoading: false }); useBookingStore.getState().resetDraft(); });
it('hydrates server review profile after normal login and switches modes with the same token', async () => {
  (authService.login as jest.Mock).mockResolvedValue({ accessToken: 'same-token', user: { ...reviewer, demoCounterpartMuaId: null } });
  (authService.getMe as jest.Mock).mockResolvedValue(reviewer);
  expect(await useAuthStore.getState().login('test@example.test', 'input')).toBe(true);
  expect(useAuthStore.getState().user?.demoCounterpartMuaId).toBe('counterpart');
  useAuthStore.getState().switchMode('MUA'); expect(useAuthStore.getState().activeMode).toBe('MUA');
  useAuthStore.getState().switchMode('CUSTOMER'); expect(useAuthStore.getState().activeMode).toBe('CUSTOMER');
  expect(await AsyncStorage.getItem('user_jwt_token')).toBe('same-token');
  expect(authService.login).toHaveBeenCalledTimes(1);
});
it('preserves normal MUA capability without granting customer-only accounts MUA access', () => {
  useAuthStore.setState({ user: { ...reviewer, isDemoAccount: false } });
  useAuthStore.getState().switchMode('MUA'); expect(useAuthStore.getState().activeMode).toBe('MUA');
  useAuthStore.setState({ user: { ...reviewer, isDemoAccount: false, role: UserRole.Customer, hasMuaProfile: false } });
  useAuthStore.getState().switchMode('MUA'); expect(useAuthStore.getState().activeMode).toBe('CUSTOMER');
});
it('clears review state, query cache and booking draft before normal login', async () => {
  useAuthStore.setState({ user: reviewer, isAuthenticated: true, activeMode: 'MUA' });
  await AsyncStorage.setItem('user_jwt_token', 'review-token'); useBookingStore.getState().setAddress('sample-address');
  await useAuthStore.getState().logout();
  expect(useAuthStore.getState().user).toBeNull(); expect(useBookingStore.getState().draft.address).toBe(''); expect(queryClient.clear).toHaveBeenCalled();
  const normal = { ...reviewer, id: 'normal', isDemoAccount: false, demoCounterpartMuaId: null };
  (authService.login as jest.Mock).mockResolvedValue({ accessToken: 'normal-token', user: normal });
  await useAuthStore.getState().login('normal@example.test', 'input');
  expect(useAuthStore.getState().user?.isDemoAccount).toBe(false); expect(useAuthStore.getState().user?.demoCounterpartMuaId).toBeNull(); expect(useAuthStore.getState().activeMode).toBe('CUSTOMER');
});
it('revalidates persisted sessions from server and clears capabilities on expiration', async () => {
  await AsyncStorage.setItem('user_jwt_token', 'existing-jwt'); await AsyncStorage.setItem('bbook_active_mode', 'MUA');
  (authService.getMe as jest.Mock).mockResolvedValue(reviewer);
  expect(await useAuthStore.getState().initialize()).toBe(true); expect(useAuthStore.getState().activeMode).toBe('MUA');
  await useAuthStore.getState().expireSession(); expect(useAuthStore.getState().user).toBeNull(); expect(await AsyncStorage.getItem('bbook_active_mode')).toBeNull();
});
it('keeps the current account when server refuses account deletion', async () => {
  useAuthStore.setState({ user: reviewer, isAuthenticated: true });
  (authService.deleteAccount as jest.Mock).mockRejectedValue(new Error('PLAY_REVIEW_ACCOUNT_PROTECTED'));
  await expect(useAuthStore.getState().deleteAccount()).rejects.toThrow();
  expect(useAuthStore.getState().user).toEqual(reviewer); expect(useAuthStore.getState().isAuthenticated).toBe(true);
});
