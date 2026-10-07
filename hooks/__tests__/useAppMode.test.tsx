import { renderHook, act } from '@testing-library/react-native';
import { useAppMode } from '../useAppMode';
import { useAuthStore } from '../../store/useAuthStore';
import { muaEligibilityService } from '../../services/muaEligibilityService';
import { UserRole } from '../../types/auth';

const mockReset = jest.fn();
jest.mock('expo-router', () => ({ useNavigation: (parent: string) => {
  if (parent !== '/') throw new Error('Must reset the root navigator');
  return { reset: mockReset };
} }));
jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('../../services/authService', () => ({ authService: {} }));
jest.mock('../../services/NotificationService', () => ({ NotificationService: {} }));
jest.mock('../../services/signalRService', () => ({ signalRService: {} }));
jest.mock('../../lib/queryClient', () => ({ queryClient: {} }));
jest.mock('../../services/muaEligibilityService', () => ({ muaEligibilityService: { get: jest.fn() } }));
jest.mock('../../components/ui/dialogStore', () => ({ AppAlert: { alert: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: { id: 'a', name: 'A', email: 'a@test.local', role: UserRole.MUA, hasMuaProfile: true, createdAt: '' }, isAuthenticated: true, activeMode: 'CUSTOMER', isModeSwitching: false });
  (muaEligibilityService.get as jest.Mock).mockResolvedValue({ profileStatus: 'LISTED' });
});

it('replaces all previous stack entries with the correct group and root screen in both directions', async () => {
  const { result } = await renderHook(() => useAppMode());
  await act(async () => { await result.current.selectMode('MUA'); });
  expect(mockReset).toHaveBeenLastCalledWith({ index: 0, routes: [{ name: '(mua)', state: { index: 0, routes: [{ name: 'dashboard' }] } }] });
  await act(async () => { await result.current.selectMode('CUSTOMER'); });
  expect(mockReset).toHaveBeenLastCalledWith({ index: 0, routes: [{ name: '(tabs)', state: { index: 0, routes: [{ name: 'home' }] } }] });
});
