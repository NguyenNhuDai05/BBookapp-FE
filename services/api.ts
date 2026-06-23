import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.12:5261/api";

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
