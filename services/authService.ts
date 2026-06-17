import { api } from "./api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: number | string;
}

export const USER_ROLES = {
  Customer: 1,
  MUA: 2,
} as const;

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
    role: number = USER_ROLES.Customer,
  ) => {
    const response = await api.post("/Auth/register", {
      fullName,
      email,
      password,
      phoneNumber,
      role,
    });

    return response.data;
  },

  becomeMUA: async () => {
    const response = await api.post("/Auth/become-mua");
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

  loginWithGoogle: async (idToken: string) => {
    const response = await api.post("/Auth/google", {
      idToken,
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
};
