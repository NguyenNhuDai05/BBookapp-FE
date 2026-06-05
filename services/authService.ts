import { api } from "./api";

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");

    return response.data;
  },

  register: async (
    fullName: string,
    email: string,
    password: string,
    phoneNumber: string,
  ) => {
    const response = await api.post("/Auth/register", {
      fullName,
      email,
      password,
      phoneNumber,
      role: 0,
    });

    return response.data;
  },
};
