import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { authService, AuthUser } from "../services/authService";

const TOKEN_KEY = "user_jwt_token";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogleToken: (idToken: string) => Promise<boolean>;
  becomeMUA: () => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  initialize: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      if (!token) {
        set({
          user: null,
          isAuthenticated: false,
        });

        return false;
      }

      const user = await authService.getMe();

      set({
        user,
        isAuthenticated: true,
      });

      return true;
    } catch {
      await AsyncStorage.removeItem(TOKEN_KEY);

      set({
        user: null,
        isAuthenticated: false,
      });

      return false;
    }
  },

  login: async (email, password) => {
    try {
      set({
        isLoading: true,
      });

      const data = await authService.login(email, password);

      await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.log(error);

      set({
        isLoading: false,
      });

      return false;
    }
  },

  loginWithGoogleToken: async (idToken) => {
    try {
      set({
        isLoading: true,
      });

      const data = await authService.loginWithGoogle(idToken);

      await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.log(error);

      set({
        isLoading: false,
      });

      return false;
    }
  },

  becomeMUA: async () => {
    try {
      set({
        isLoading: true,
      });

      const data = await authService.becomeMUA();

      await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.log(error);

      set({
        isLoading: false,
      });

      return false;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);

    set({
      user: null,
      isAuthenticated: false,
    });
  },
}));
