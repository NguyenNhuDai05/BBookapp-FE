import { api } from './api';

export type MuaStyle = {
  styleId: number;
  name: string;
  description?: string | null;
  isActive: boolean;
};

export const muaStyleService = {
  async getActiveStyles(): Promise<MuaStyle[]> {
    const response = await api.get<MuaStyle[]>('/Mua/styles');
    return response.data;
  },
};
