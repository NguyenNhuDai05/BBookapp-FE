import AsyncStorage from "@react-native-async-storage/async-storage";
import { hasMuaAccess } from '../utils/appMode';
import { muaEligibilityService } from '../services/muaEligibilityService';
import { getApiError } from '../services/api';
import { create } from "zustand";
import { authService } from "../services/authService";
import type { UserDto } from "../types/auth";
import { UserRole } from "../types/auth";
import { queryClient } from "../lib/queryClient";
import { NotificationService } from "../services/NotificationService";
import { signalRService } from "../services/signalRService";
import { useBookingStore } from './useBookingStore';
import type { MuaApplicationRequestDto } from "../types/onboarding";

const TOKEN_KEY = "user_jwt_token";
const ACTIVE_MODE_KEY = "bbook_active_mode";

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<boolean>;
  login: (email: string, password?: string) => Promise<boolean>;
  becomeMUA: (request: MuaApplicationRequestDto) => Promise<boolean>;
  logout: () => Promise<void>;
  expireSession: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  register: (fullName: string, email: string, password: string, role: UserRole, otp: string) => Promise<boolean>;
  activeMode: 'CUSTOMER' | 'MUA';
  isModeSwitching: boolean;
  switchMode: (mode: 'CUSTOMER' | 'MUA') => Promise<void>;
  updateUser: (user: Partial<UserDto>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  activeMode: 'CUSTOMER',

  isModeSwitching: false,
  switchMode: async (mode) => {
    const user = get().user;
    const previousMode = get().activeMode;
    const nextMode = mode === 'MUA' && !hasMuaAccess(user) ? 'CUSTOMER' : mode;
    set({ activeMode: nextMode });
    try { await AsyncStorage.setItem(ACTIVE_MODE_KEY, nextMode); }
    catch (error) {
      if (get().user?.id === user?.id) set({ activeMode: previousMode });
      throw error;
    }
  },
  updateUser: (updatedUser) => set((state) => ({ user: state.user ? { ...state.user, ...updatedUser } : null })),

  initialize: async () => {
    try {
      const [token, storedMode] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(ACTIVE_MODE_KEY),
      ]);

      if (!token) {
        queryClient.clear();
        useBookingStore.getState().resetDraft();
        await AsyncStorage.removeItem(ACTIVE_MODE_KEY);
        set({
          user: null,
          isAuthenticated: false,
          activeMode: 'CUSTOMER',
        });

        return false;
      }

      const user = await authService.getMe();

      let restoreMua = storedMode === 'MUA' && hasMuaAccess(user);
      if (restoreMua) {
        try { restoreMua = (await muaEligibilityService.get()).profileStatus !== 'SUSPENDED'; }
        catch (error) {
          // Preserve the existing session-expiration behavior for an invalid JWT.
          if (getApiError(error).status === 401) throw error;
          restoreMua = false;
        }
      }
      if (storedMode === 'MUA' && !restoreMua) {
        // Persist the safe fallback without turning a storage error into logout.
        await AsyncStorage.setItem(ACTIVE_MODE_KEY, 'CUSTOMER').catch(() => undefined);
      }
      set({
        user,
        isAuthenticated: true,
        activeMode: restoreMua ? 'MUA' : 'CUSTOMER',
      });

      return true;
    } catch {
      await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(ACTIVE_MODE_KEY)]);
      queryClient.clear();
      useBookingStore.getState().resetDraft();

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

      const user = res.user.isDemoAccount ? await authService.getMe() : res.user;
      queryClient.clear();
      useBookingStore.getState().resetDraft();

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        activeMode: 'CUSTOMER',
      });

      return true;
    } catch {
      await get().expireSession();
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

  register: async (fullName: string, email: string, password: string, role: UserRole, otp: string) => {
    try {
      set({ isLoading: true });

      await authService.register({ fullName, email, password, role, otp });
      set({ isLoading: false });

      return true;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await signalRService.disconnect();
      await NotificationService.unregisterDevice();
      await authService.logout();
    } finally {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(ACTIVE_MODE_KEY);
      queryClient.clear();
      useBookingStore.getState().resetDraft();

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
    useBookingStore.getState().resetDraft();
    set({ user: null, isAuthenticated: false, isLoading: false, activeMode: 'CUSTOMER' });
  },

  deleteAccount: async () => {
    set({ isLoading: true });
    try {
      await authService.deleteAccount();
      await AsyncStorage.clear();
      queryClient.clear();
      useBookingStore.getState().resetDraft();
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
