import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { authService } from "../services/authService";
import type { UserDto } from "../types/auth";
import { UserRole } from "../types/auth";
import { queryClient } from "../lib/queryClient";
import { NotificationService } from "../services/NotificationService";
import type { MuaApplicationRequestDto } from "../types/onboarding";

const TOKEN_KEY = "user_jwt_token";
const ACTIVE_MODE_KEY = "bbook_active_mode";

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<boolean>;
  login: (email: string, password?: string) => Promise<boolean>;
  loginWithGoogleToken: (idToken: string) => Promise<boolean>;
  becomeMUA: (request: MuaApplicationRequestDto) => Promise<boolean>;
  logout: () => Promise<void>;
  expireSession: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  register: (fullName: string, email: string, password?: string, phone?: string, role?: UserRole) => Promise<boolean>;
  activeMode: 'CUSTOMER' | 'MUA';
  switchMode: (mode: 'CUSTOMER' | 'MUA') => void;
  updateUser: (user: Partial<UserDto>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  activeMode: 'CUSTOMER',

  switchMode: (mode) => {
    const user = get().user;
    const hasMuaAccess = user?.role === UserRole.MUA || user?.hasMuaProfile === true;
    const nextMode = mode === 'MUA' && !hasMuaAccess ? 'CUSTOMER' : mode;
    set({ activeMode: nextMode });
    void AsyncStorage.setItem(ACTIVE_MODE_KEY, nextMode);
  },
  updateUser: (updatedUser) => set((state) => ({ user: state.user ? { ...state.user, ...updatedUser } : null })),

  initialize: async () => {
    try {
      const [token, storedMode] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(ACTIVE_MODE_KEY),
      ]);

      if (!token) {
        await AsyncStorage.removeItem(ACTIVE_MODE_KEY);
        set({
          user: null,
          isAuthenticated: false,
          activeMode: 'CUSTOMER',
        });

        return false;
      }

      const user = await authService.getMe();

      const hasMuaAccess = user.role === UserRole.MUA || user.hasMuaProfile === true;
      set({
        user,
        isAuthenticated: true,
        activeMode: storedMode === 'MUA' && hasMuaAccess ? 'MUA' : 'CUSTOMER',
      });

      return true;
    } catch {
      await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(ACTIVE_MODE_KEY)]);

      set({
        user: null,
        isAuthenticated: false,
        activeMode: 'CUSTOMER',
      });

      return false;
    }
  },

  login: async (email: string, password?: string) => {
    try {
      set({ isLoading: true });

      const res = await authService.login({ email, password });

      await AsyncStorage.setItem(TOKEN_KEY, res.accessToken);
      await AsyncStorage.setItem(ACTIVE_MODE_KEY, 'CUSTOMER');

      set({
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
        activeMode: 'CUSTOMER',
      });

      return true;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  loginWithGoogleToken: async (idToken: string) => {
    try {
      set({ isLoading: true });
      const res = await authService.loginWithGoogle(idToken);
      await AsyncStorage.setItem(TOKEN_KEY, res.accessToken);
      await AsyncStorage.setItem(ACTIVE_MODE_KEY, 'CUSTOMER');
      set({
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
        activeMode: 'CUSTOMER',
      });
      return true;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  becomeMUA: async (request) => {
    try {
      set({ isLoading: true });
      const res = await authService.becomeMua(request);
      await AsyncStorage.setItem(TOKEN_KEY, res.accessToken);
      await AsyncStorage.setItem(ACTIVE_MODE_KEY, 'MUA');
      set({
        user: res.user,
        activeMode: 'MUA',
        isLoading: false
      });
      return true;
    } catch (e) {
      console.error('Error becoming MUA:', e);
      set({ isLoading: false });
      throw e;
    }
  },

  register: async (fullName: string, email: string, password?: string, phone?: string, role?: UserRole) => {
    try {
      set({ isLoading: true });

      await authService.register({ fullName, email, password, phone, role });
      set({ isLoading: false });

      return true;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await NotificationService.unregisterDevice();
      await authService.logout();
    } finally {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(ACTIVE_MODE_KEY);
      queryClient.clear();

      set({
        user: null,
        isAuthenticated: false,
        activeMode: 'CUSTOMER',
      });
    }
  },

  expireSession: async () => {
    await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(ACTIVE_MODE_KEY)]);
    queryClient.clear();
    set({ user: null, isAuthenticated: false, isLoading: false, activeMode: 'CUSTOMER' });
  },

  deleteAccount: async () => {
    set({ isLoading: true });
    try {
      await authService.deleteAccount();
      await AsyncStorage.clear();
      queryClient.clear();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        activeMode: 'CUSTOMER',
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
