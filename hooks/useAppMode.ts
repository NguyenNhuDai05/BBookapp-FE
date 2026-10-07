import { useNavigation } from 'expo-router';
import type { NavigationProp } from 'expo-router/react-navigation';
import { useAuthStore } from '../store/useAuthStore';
import { changeAppMode } from '../services/appModeService';
import { hasMuaAccess, type AppMode } from '../utils/appMode';
import { AppAlert } from '../components/ui/dialogStore';

export function useAppMode() {
  const navigation = useNavigation<NavigationProp<{ '(mua)': undefined; '(tabs)': undefined }>>('/');
  const { activeMode, isModeSwitching, user } = useAuthStore();
  const selectMode = async (mode: AppMode) => {
    try {
      return await changeAppMode(mode, next => navigation.reset({
        index: 0,
        routes: [{ name: next === 'MUA' ? '(mua)' : '(tabs)', state: {
          index: 0, routes: [{ name: next === 'MUA' ? 'dashboard' : 'home' }],
        } }],
      }));
    } catch {
      AppAlert.alert('Không thể chuyển chế độ', 'Không thể chuyển chế độ. Vui lòng thử lại.');
      return false;
    }
  };
  return { activeMode, isModeSwitching, hasMuaAccess: hasMuaAccess(user), selectMode };
}
