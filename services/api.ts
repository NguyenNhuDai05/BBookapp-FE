import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";
import { normalizeMediaUrlsInPayload } from "../utils/mediaUrl";

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
export const API_URL =
  configuredApiUrl || webApiUrl || "https://beautybook-13zj.onrender.com/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 25000,
});

let unauthorizedHandler: (() => void | Promise<void>) | undefined;
let isHandlingUnauthorized = false;
let hasPendingUnauthorized = false;

const runUnauthorizedHandler = async () => {
  if (isHandlingUnauthorized || !unauthorizedHandler) return;
  isHandlingUnauthorized = true;
  hasPendingUnauthorized = false;
  try {
    await unauthorizedHandler();
  } finally {
    isHandlingUnauthorized = false;
  }
};

export const setUnauthorizedHandler = (
  handler?: () => void | Promise<void>,
) => {
  unauthorizedHandler = handler;
  if (handler && hasPendingUnauthorized) void runUnauthorizedHandler();
};

export const getApiError = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return {
      status: undefined,
      code: undefined,
      message: error instanceof Error ? error.message : "Đã xảy ra lỗi.",
      isNetworkError: false,
    };
  }
  const payload = error.response?.data as
    | {
        code?: string;
        Code?: string;
        message?: string;
        Message?: string;
        title?: string;
      }
    | undefined;
  return {
    status: error.response?.status,
    code: payload?.code ?? payload?.Code,
    message:
      payload?.message ??
      payload?.Message ??
      payload?.title ??
      (error.code === "ECONNABORTED"
        ? "Kết nối mất nhiều thời gian hơn dự kiến."
        : error.message),
    isNetworkError: !error.response || error.code === "ECONNABORTED",
  };
};

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

api.interceptors.response.use(
  (response) => {
    response.data = normalizeMediaUrlsInPayload(response.data);
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      const token = await AsyncStorage.getItem("user_jwt_token");
      if (token) {
        if (unauthorizedHandler) await runUnauthorizedHandler();
        else {
          await AsyncStorage.removeItem("user_jwt_token");
          hasPendingUnauthorized = true;
        }
      }
    }
    return Promise.reject(error);
  },
);
