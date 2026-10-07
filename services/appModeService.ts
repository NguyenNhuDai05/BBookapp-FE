import { useAuthStore } from '../store/useAuthStore';
import { muaEligibilityService } from './muaEligibilityService';
import { hasMuaAccess, type AppMode } from '../utils/appMode';

export async function changeAppMode(mode: AppMode, navigate: (mode: AppMode) => void): Promise<boolean> {
  const before = useAuthStore.getState();
  if (before.isModeSwitching || !before.isAuthenticated || !before.user || before.activeMode === mode) return false;
  const accountId = before.user.id;
  useAuthStore.setState({ isModeSwitching: true });
  try {
    if (mode === 'MUA') {
      if (!hasMuaAccess(before.user)) throw new Error('MUA access unavailable');
      const eligibility = await muaEligibilityService.get();
      if (eligibility.profileStatus === 'SUSPENDED') throw new Error('MUA access suspended');
    }
    const current = useAuthStore.getState();
    if (!current.isAuthenticated || current.user?.id !== accountId) return false;
    if (mode === 'MUA' && !hasMuaAccess(current.user)) throw new Error('MUA access unavailable');
    await current.switchMode(mode);
    if (useAuthStore.getState().user?.id !== accountId) return false;
    navigate(mode);
    return true;
  } catch (error) {
    if (useAuthStore.getState().user?.id === accountId && useAuthStore.getState().activeMode !== before.activeMode) {
      await useAuthStore.getState().switchMode(before.activeMode).catch(() => undefined);
      // Even when disk recovery also fails, retain a usable in-memory context.
      if (useAuthStore.getState().user?.id === accountId) useAuthStore.setState({ activeMode: before.activeMode });
    }
    throw error;
  } finally {
    useAuthStore.setState({ isModeSwitching: false });
  }
}
