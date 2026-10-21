import { withSessionStorage } from '../services/sessionStorageLock';
import { sessionCredentials } from '../services/sessionCredentials';
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
let initializing: Promise<boolean> | undefined;
let sessionRevision = 0;

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionError: string | null;
  loginError: string | null;
  initialize: () => Promise<boolean>;
  login: (email: string, password?: string) => Promise<boolean>;
  becomeMUA: (request: MuaApplicationRequestDto) => Promise<boolean>;
  logout: () => Promise<void>;
  expireSession: (expectedToken?: string) => Promise<void>;
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
  sessionError: null,
  loginError: null,
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

  initialize: () => {
    if (initializing) return initializing;
    const revision = sessionRevision;
    initializing = (async () => {
    let startupToken: string | null = null;
    try {
      const [token, storedMode] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(ACTIVE_MODE_KEY),
      ]);

      startupToken = token;
      if (revision !== sessionRevision) return get().isAuthenticated;
      if (!token) {
        queryClient.clear();
        useBookingStore.getState().resetDraft();
        await AsyncStorage.removeItem(ACTIVE_MODE_KEY);
        if (revision !== sessionRevision) return get().isAuthenticated;
        set({
          sessionError: null,
          user: null,
          isAuthenticated: false,
          activeMode: 'CUSTOMER',
        });

        return false;
      }

      const user = await authService.getMe();
      if (revision !== sessionRevision) return get().isAuthenticated;

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
      if (revision !== sessionRevision) return get().isAuthenticated;
      set({
        sessionError: null,
        user,
        isAuthenticated: true,
        activeMode: restoreMua ? 'MUA' : 'CUSTOMER',
      });

      return true;
    } catch (error) {
      if (revision !== sessionRevision) return get().isAuthenticated;
      const failure = getApiError(error);
      if (failure.status !== 401) {
        if (get().isAuthenticated) return true;
        set({ sessionError: failure.isNetworkError ? "Chưa thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại." : "Chưa thể kiểm tra phiên đăng nhập. Vui lòng thử lại." });
        return false;
      }
      await get().expireSession(startupToken || undefined);
      return false;
    }
    })().finally(() => { initializing = undefined; });
    return initializing;
  },

  login: async (email: string, password?: string) => {
    const revision = ++sessionRevision;
    try {
      set({ isLoading: true, loginError: null });

      const res = await authService.login({ email, password });
      if (revision !== sessionRevision) return false;
      await withSessionStorage(async () => {
        if (revision !== sessionRevision) return;
        await sessionCredentials.save(res.refreshToken);
        await AsyncStorage.setItem(TOKEN_KEY, res.accessToken);
        await AsyncStorage.setItem(ACTIVE_MODE_KEY, 'CUSTOMER');
      });

      const user = res.user.isDemoAccount ? await authService.getMe() : res.user;
      if (revision !== sessionRevision) return false;
      queryClient.clear();
      useBookingStore.getState().resetDraft();

      set({
        user,
        isAuthenticated: true,
        sessionError: null,
        isLoading: false,
        activeMode: 'CUSTOMER',
      });

      return true;
    } catch (error) {
      if (revision !== sessionRevision) return false;
      const failure = getApiError(error);
      set({ isLoading: false, loginError: failure.status === 401
        ? "Email hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra và thử lại."
        : failure.isNetworkError ? "Không thể kết nối máy chủ hoặc kết nối đã hết thời gian chờ. Vui lòng thử lại."
        : failure.status && failure.status >= 500 ? "Máy chủ đang tạm thời gián đoạn. Vui lòng thử lại sau."
        : failure.message || "Chưa thể đăng nhập. Vui lòng thử lại." });
      return false;
    }
  },

  becomeMUA: async (request) => {
    try {
      set({ isLoading: true });
      const res = await authService.becomeMua(request);
      await withSessionStorage(async () => {
        await AsyncStorage.setItem(TOKEN_KEY, res.accessToken);
        await AsyncStorage.setItem(ACTIVE_MODE_KEY, 'MUA');
      });
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
    const revision = ++sessionRevision;
    try {
      const refreshToken = await withSessionStorage(() => sessionCredentials.get()).catch(() => null);
      await signalRService.disconnect();
      await NotificationService.unregisterDevice();
      await authService.logout(refreshToken || '');
    } finally {
      await withSessionStorage(async () => {
      if (revision !== sessionRevision) return;
      await sessionCredentials.clear().catch(() => undefined);
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(ACTIVE_MODE_KEY);
      queryClient.clear();
      useBookingStore.getState().resetDraft();

      set({
        user: null,
        isAuthenticated: false,
        activeMode: 'CUSTOMER',
        sessionError: null,
      });
      });
    }
  },

  expireSession: async (expectedToken) => withSessionStorage(async () => {
    if (expectedToken && await AsyncStorage.getItem(TOKEN_KEY) !== expectedToken) return;
    sessionRevision++;
    await sessionCredentials.clear().catch(() => undefined);
    await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(ACTIVE_MODE_KEY)]);
    queryClient.clear();
    useBookingStore.getState().resetDraft();
    set({ sessionError: null, user: null, isAuthenticated: false, isLoading: false, activeMode: 'CUSTOMER' });
  }),

  deleteAccount: async () => {
    const revision = ++sessionRevision;
    set({ isLoading: true });
    try {
      await authService.deleteAccount();
      await withSessionStorage(async () => {
      if (revision !== sessionRevision) return;
      await sessionCredentials.clear().catch(() => undefined);
      await AsyncStorage.clear();
      queryClient.clear();
      useBookingStore.getState().resetDraft();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        activeMode: 'CUSTOMER',
        sessionError: null,
      });
      });
    } catch (error) {
      if (revision !== sessionRevision) throw error;
      set({ isLoading: false });
      throw error;
    }
  },
}));
