import { api } from "./api";

export const getFeed = async (page: number = 1, limit: number = 20) => {
  const { data } = await api.get(`/Feed?page=${page}&limit=${limit}`);
  return data;
};
