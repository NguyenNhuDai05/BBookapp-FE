import { api } from "./api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: number | string;
}

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post("/Auth/login", {
      email,
      password,
    });

    const data = response.data;

    return {
      accessToken: data.token,
      expiration: data.expiration,
      user: {
        id: data.userId,
        name: data.fullName,
        email: data.email,
        role: data.role,
      } as AuthUser,
    };
  },

  getMe: async () => {
    const response = await api.get("/User/profile");
    const data = response.data;

    return {
      id: data.userId,
      name: data.fullName,
      email: data.email,
      role: data.role,
    } as AuthUser;
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
      role: 1,
    });

    return response.data;
  },
};
