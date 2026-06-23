import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { authService } from "../services/authService";
import type { UserDto } from "../types/auth";
import { UserRole } from "../types/auth";
import { queryClient } from "../lib/queryClient";

const TOKEN_KEY = "user_jwt_token";

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<boolean>;
  login: (email: string, password?: string) => Promise<boolean>;
  loginWithGoogleToken: (idToken: string) => Promise<boolean>;
  becomeMUA: () => Promise<boolean>;
  logout: () => Promise<void>;
  register: (fullName: string, email: string, password?: string, phone?: string, role?: UserRole) => Promise<boolean>;
  activeMode: 'CUSTOMER' | 'MUA';
  switchMode: (mode: 'CUSTOMER' | 'MUA') => void;
  updateUser: (user: Partial<UserDto>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  activeMode: 'CUSTOMER',

  switchMode: (mode) => set({ activeMode: mode }),
  updateUser: (updatedUser) => set((state) => ({ user: state.user ? { ...state.user, ...updatedUser } : null })),

  initialize: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      if (!token) {
        set({
          user: null,
          isAuthenticated: false,
          activeMode: 'CUSTOMER',
        });

        return false;
      }

      const user = await authService.getMe();

      set({
        user,
        isAuthenticated: true,
        activeMode: user.hasMuaProfile ? 'CUSTOMER' : 'CUSTOMER', // Default to customer on launch even if MUA
      });

      return true;
    } catch {
      await AsyncStorage.removeItem(TOKEN_KEY);

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

      set({
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
        activeMode: res.user.hasMuaProfile ? 'CUSTOMER' : 'CUSTOMER',
      });

      return true;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  loginWithGoogleToken: async (idToken: string) => {
    // Mock implementation for now
    return true;
  },

  becomeMUA: async () => {
    try {
      set({ isLoading: true });
      const res = await authService.becomeMua();
      await AsyncStorage.setItem(TOKEN_KEY, res.accessToken);
      set({
        user: res.user,
        activeMode: 'MUA',
        isLoading: false
      });
      return true;
    } catch (e) {
      console.error('Error becoming MUA:', e);
      set({ isLoading: false });
      return false;
    }
  },

  register: async (fullName: string, email: string, password?: string, phone?: string, role?: UserRole) => {
    try {
      set({ isLoading: true });

      const res = await authService.register({ fullName, email, password, phone, role });

      await AsyncStorage.setItem(TOKEN_KEY, res.accessToken);

      set({
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
        activeMode: res.user.hasMuaProfile ? 'CUSTOMER' : 'CUSTOMER',
      });

      return true;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      await AsyncStorage.removeItem(TOKEN_KEY);
      queryClient.clear();

      set({
        user: null,
        isAuthenticated: false,
        activeMode: 'CUSTOMER',
      });
    }
  },
}));
