import { api } from './api';

export type MuaStyle = {
  styleId: number;
  name: string;
  description?: string | null;
  isActive: boolean;
};

export const muaStyleService = {
  async selectOrCreate(name: string): Promise<MuaStyle> {
    const response = await api.post<MuaStyle>('/Mua/styles/select-or-create', { name });
    return response.data;
  },
  async getActiveStyles(): Promise<MuaStyle[]> {
    const response = await api.get<MuaStyle[]>('/Mua/styles');
    return response.data;
  },
};
