import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/useAuthStore';
import { useBookingStore } from '../../store/useBookingStore';
import { authService } from '../authService';
import { muaEligibilityService } from '../muaEligibilityService';
import { changeAppMode } from '../appModeService';
import { hasMuaAccess } from '../../utils/appMode';
import { UserRole } from '../../types/auth';
import { queryClient } from '../../lib/queryClient';

jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('../authService', () => ({ authService: { login: jest.fn(), getMe: jest.fn(), logout: jest.fn() } }));
jest.mock('../muaEligibilityService', () => ({ muaEligibilityService: { get: jest.fn() } }));
jest.mock('../NotificationService', () => ({ NotificationService: { unregisterDevice: jest.fn() } }));
jest.mock('../signalRService', () => ({ signalRService: { disconnect: jest.fn() } }));
jest.mock('../../lib/queryClient', () => ({ queryClient: { clear: jest.fn() } }));

const mua = { id: 'a', name: 'A', email: 'a@test.local', role: UserRole.MUA, hasMuaProfile: true, createdAt: '' };
const customer = { ...mua, id: 'b', role: UserRole.Customer, hasMuaProfile: false };
const navigate = jest.fn();
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  useAuthStore.setState({ user: mua, isAuthenticated: true, activeMode: 'CUSTOMER', isModeSwitching: false });
  useBookingStore.getState().resetDraft();
  await AsyncStorage.setItem('user_jwt_token', 'unchanged-token');
  (muaEligibilityService.get as jest.Mock).mockResolvedValue({ profileStatus: 'LISTED' });
});

it('rejects Customer-only and explicitly revoked profiles, including a legacy MUA role', async () => {
  for (const user of [customer, { ...mua, hasMuaProfile: false }]) {
    useAuthStore.setState({ user });
    await expect(changeAppMode('MUA', navigate)).rejects.toThrow();
    expect(useAuthStore.getState().activeMode).toBe('CUSTOMER');
  }
  expect(navigate).not.toHaveBeenCalled();
  expect(muaEligibilityService.get).not.toHaveBeenCalled();
  expect(hasMuaAccess({ ...mua, role: UserRole.Customer })).toBe(true);
  expect(hasMuaAccess({ ...mua, role: UserRole.Admin })).toBe(false);
});

it('switches both directions without changing identity, JWT, customer draft or query data', async () => {
  useBookingStore.getState().setAddress('Customer booking destination');
  const draft = useBookingStore.getState().draft;
  await expect(changeAppMode('MUA', navigate)).resolves.toBe(true);
  expect(navigate).toHaveBeenLastCalledWith('MUA');
  await expect(changeAppMode('CUSTOMER', navigate)).resolves.toBe(true);
  expect(navigate).toHaveBeenLastCalledWith('CUSTOMER');
  expect(useAuthStore.getState().user).toEqual(mua);
  expect(await AsyncStorage.getItem('user_jwt_token')).toBe('unchanged-token');
  expect(useBookingStore.getState().draft).toBe(draft);
  expect(queryClient.clear).not.toHaveBeenCalled();
  expect(authService.login).not.toHaveBeenCalled();
});

it.each(['CUSTOMER', 'MUA'] as const)('restores %s on cold start with current server capability', async mode => {
  await AsyncStorage.setItem('bbook_active_mode', mode);
  (authService.getMe as jest.Mock).mockResolvedValue(mua);
  await expect(useAuthStore.getState().initialize()).resolves.toBe(true);
  expect(useAuthStore.getState().activeMode).toBe(mode);
});

it('falls back safely for suspended, removed or unavailable MUA access on startup', async () => {
  await AsyncStorage.setItem('bbook_active_mode', 'MUA');
  (authService.getMe as jest.Mock).mockResolvedValue(mua);
  (muaEligibilityService.get as jest.Mock).mockResolvedValue({ profileStatus: 'SUSPENDED' });
  await expect(useAuthStore.getState().initialize()).resolves.toBe(true);
  expect(useAuthStore.getState().activeMode).toBe('CUSTOMER');
  expect(await AsyncStorage.getItem('bbook_active_mode')).toBe('CUSTOMER');
  await AsyncStorage.setItem('bbook_active_mode', 'MUA');
  (muaEligibilityService.get as jest.Mock).mockRejectedValue(new Error('offline'));
  await expect(useAuthStore.getState().initialize()).resolves.toBe(true);
  expect(useAuthStore.getState().activeMode).toBe('CUSTOMER');
  await AsyncStorage.setItem('bbook_active_mode', 'MUA');
  (authService.getMe as jest.Mock).mockResolvedValue({ ...mua, hasMuaProfile: false });
  await useAuthStore.getState().initialize();
  expect(useAuthStore.getState().activeMode).toBe('CUSTOMER');
  expect(await AsyncStorage.getItem('user_jwt_token')).toBe('unchanged-token');
});

it('rejects suspended entry without logout or navigation', async () => {
  (muaEligibilityService.get as jest.Mock).mockResolvedValue({ profileStatus: 'SUSPENDED' });
  await expect(changeAppMode('MUA', navigate)).rejects.toThrow();
  expect(useAuthStore.getState().activeMode).toBe('CUSTOMER');
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
  expect(navigate).not.toHaveBeenCalled();
});

it('blocks repeated taps while eligibility is loading', async () => {
  let finish!: (value: { profileStatus: string }) => void;
  (muaEligibilityService.get as jest.Mock).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const first = changeAppMode('MUA', navigate);
  await expect(changeAppMode('MUA', navigate)).resolves.toBe(false);
  await expect(changeAppMode('CUSTOMER', navigate)).resolves.toBe(false);
  finish({ profileStatus: 'LISTED' });
  await first;
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(useAuthStore.getState().isModeSwitching).toBe(false);
});

it('keeps the old mode and JWT when storage or navigation fails', async () => {
  (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disk full'));
  await expect(changeAppMode('MUA', navigate)).rejects.toThrow('disk full');
  expect(navigate).not.toHaveBeenCalled();
  expect(useAuthStore.getState().activeMode).toBe('CUSTOMER');
  await expect(changeAppMode('MUA', () => { throw new Error('navigation failed'); })).rejects.toThrow();
  expect(useAuthStore.getState().activeMode).toBe('CUSTOMER');
  expect(await AsyncStorage.getItem('bbook_active_mode')).toBe('CUSTOMER');
  expect(await AsyncStorage.getItem('user_jwt_token')).toBe('unchanged-token');
});

it('resets MUA persistence on logout and login as another Customer', async () => {
  await changeAppMode('MUA', navigate);
  await useAuthStore.getState().logout();
  expect(await AsyncStorage.getItem('bbook_active_mode')).toBeNull();
  (authService.login as jest.Mock).mockResolvedValue({ accessToken: 'b-token', user: customer });
  await useAuthStore.getState().login(customer.email, 'password');
  expect(useAuthStore.getState().activeMode).toBe('CUSTOMER');
  await expect(changeAppMode('MUA', navigate)).rejects.toThrow();
  expect(await AsyncStorage.getItem('user_jwt_token')).toBe('b-token');
});

it('discards a pending switch when the account changes', async () => {
  let finish!: (value: { profileStatus: string }) => void;
  (muaEligibilityService.get as jest.Mock).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const pending = changeAppMode('MUA', navigate);
  await useAuthStore.getState().logout();
  useAuthStore.setState({ user: customer, isAuthenticated: true });
  finish({ profileStatus: 'LISTED' });
  await expect(pending).resolves.toBe(false);
  expect(navigate).not.toHaveBeenCalled();
  expect(useAuthStore.getState().activeMode).toBe('CUSTOMER');
});
