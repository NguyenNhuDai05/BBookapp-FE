import { withSessionStorage } from './sessionStorageLock';
import { sessionCredentials } from './sessionCredentials';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";
import { normalizeMediaUrlsInPayload } from "../utils/mediaUrl";
import { sanitizeUiMessage } from "../utils/uiMessage";
import { reviewErrorMessage } from '../utils/playReview';

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

// Shared rotation: a burst of expired requests consumes the credential once.
let rotating: Promise<string | null> | undefined;
const rotateSession = () => {
  if (rotating) return rotating;
  rotating = (async () => {
    const {refreshToken, previous} = await withSessionStorage(async () => ({
      previous: await AsyncStorage.getItem('user_jwt_token'), refreshToken: await sessionCredentials.get(),
    }));
    if (!refreshToken || !previous) return null;
    const {data} = await axios.post<{token:string; refreshToken:string}>(API_URL + '/Auth/refresh', {refreshToken}, {timeout:25000});
    return withSessionStorage(async () => {
      if (await AsyncStorage.getItem('user_jwt_token') !== previous) return null;
      if (!data.token || !data.refreshToken) throw new Error('Invalid session response');
      await sessionCredentials.save(data.refreshToken);
      await AsyncStorage.setItem('user_jwt_token', data.token);
      return data.token;
    });
  })().finally(() => { rotating = undefined; });
  return rotating;
};

type RequestTiming = { area: 'login' | 'otp' | 'profile' | 'feed' | 'other'; milliseconds: number; status: number | null };
const timings: RequestTiming[] = [];
const started = new WeakMap<object, number>();
export const getRequestTimings = (): readonly RequestTiming[] => timings.map(item => ({...item}));
const recordTiming = (config: object & {url?: string}, status: number | null) => {
  const start = started.get(config);
  if (start === undefined) return;
  started.delete(config);
  const url = config.url || '';
  const area = url === '/Auth/login' ? 'login' : url.includes('request-otp') ? 'otp' : url === '/User/profile' ? 'profile' : url.startsWith('/Feed') ? 'feed' : 'other';
  timings.push({area,milliseconds:Date.now()-start,status});
  if (timings.length > 30) timings.shift();
};

let readiness: Promise<void> | undefined;
let readyUntil = 0;
// Probe a safe GET before submitting auth mutations. Never replay registration
// or OTP POSTs after a timeout: the server might already have processed them.
export function ensureApiReady(): Promise<void> {
  if (Date.now() < readyUntil) return Promise.resolve();
  if (readiness) return readiness;
  readiness = (async () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        await axios.get(API_URL.replace(/\/api\/?$/, '') + '/health', {timeout:10000});
        readyUntil = Date.now() + 60000;
        return;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status && error.response.status < 500) return;
          if (!error.response && !['ECONNABORTED','ETIMEDOUT'].includes(error.code || '')) throw error;
        }
        if (attempt === 5) throw error;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  })().finally(() => { readiness = undefined; });
  return readiness;
}

let unauthorizedHandler: ((expectedToken?: string) => void | Promise<void>) | undefined;
let isHandlingUnauthorized = false;
let hasPendingUnauthorized = false;

const runUnauthorizedHandler = async (expectedToken?: string) => {
  if (isHandlingUnauthorized || !unauthorizedHandler) return;
  isHandlingUnauthorized = true;
  hasPendingUnauthorized = false;
  try {
    await unauthorizedHandler(expectedToken);
  } finally {
    isHandlingUnauthorized = false;
  }
};

export const setUnauthorizedHandler = (
  handler?: (expectedToken?: string) => void | Promise<void>,
) => {
  unauthorizedHandler = handler;
  if (handler && hasPendingUnauthorized) void runUnauthorizedHandler();
};

export const getApiError = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return {
      status: undefined,
      code: undefined,
      message: sanitizeUiMessage(error instanceof Error ? error.message : error),
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
        errors?: Record<string, string[]>;
        Errors?: Record<string, string[]>;
      }
    | undefined;
  const validationErrors = payload?.errors ?? payload?.Errors;
  const firstValidationMessage = validationErrors
    ? Object.values(validationErrors).flat().find(Boolean)
    : undefined;
  return {
    status: error.response?.status,
    code: payload?.code ?? payload?.Code,
    message: reviewErrorMessage(payload?.code ?? payload?.Code) ?? sanitizeUiMessage(
      firstValidationMessage ??
      payload?.message ??
      payload?.Message ??
      payload?.title ??
      (error.code === "ECONNABORTED"
        ? "Kết nối mất nhiều thời gian hơn dự kiến."
        : error.message)),
    isNetworkError: !error.response || error.code === "ECONNABORTED",
  };
};

api.interceptors.request.use(
  async (config) => {
    started.set(config, Date.now());
    if (/^\/Auth\/(login|register(?:\/request-otp)?)$/.test(config.url || '')) {
      try { await ensureApiReady(); }
      catch (error) { recordTiming(config, axios.isAxiosError(error) ? error.response?.status ?? null : null); throw error; }
    }
    const token = await withSessionStorage(() => AsyncStorage.getItem("user_jwt_token"));

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    recordTiming(response.config, response.status);
    response.data = normalizeMediaUrlsInPayload(response.data);
    return response;
  },
  async (error) => {
    const request = error.config;
    if (request) recordTiming(request, error.response?.status ?? null);
    const publicAuth = /\/Auth\/(login|register|forgot-password|reset-password|google|refresh|logout)/i.test(request?.url || '');
    if (error.response?.status === 401 && request && !publicAuth) {
      const token = await AsyncStorage.getItem('user_jwt_token');
      if (token && !request._sessionRetried && request.headers?.Authorization !== 'Bearer ' + token) {
        request._sessionRetried = true;
        return api(request);
      }
      if (token) {
        try {
          const renewed = request._sessionRetried ? null : await rotateSession();
          if (renewed) { request._sessionRetried = true; return api(request); }
        } catch (refreshError) {
          // Transport/server failures preserve credentials for a later retry.
          if (!axios.isAxiosError(refreshError) || refreshError.response?.status !== 401) return Promise.reject(refreshError);
        }
        if (await AsyncStorage.getItem('user_jwt_token') === token) {
          if (unauthorizedHandler) await runUnauthorizedHandler(token);
          else {
            await sessionCredentials.clear();
            await AsyncStorage.removeItem('user_jwt_token');
            hasPendingUnauthorized = true;
          }
        }
      }
    }
    return Promise.reject(error);
  },
);
