import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;

// On web, derive the API host from the URL used to open Expo. This avoids stale
// LAN addresses breaking all requests whenever the development machine changes IP.
const webApiUrl =
  Platform.OS === "web" && typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5261/api`
    : undefined;

// An explicit build/runtime URL must win on every platform. Previously web
// always replaced the configured production URL with `<current-host>:5261`,
// which made deployed/test builds call a developer LAN backend.
export const API_URL = configuredApiUrl || webApiUrl || "http://localhost:5261/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("user_jwt_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);
