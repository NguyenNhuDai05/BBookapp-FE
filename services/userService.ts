import { api } from "./api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedDate: string;
  statsCompleted: number;
  statsFavorites: number;
  membershipTier: string;
}

interface BackendUserProfile {
  userId: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  role: number | string;
  createdAt: string;
}

const roleToTier = (role: number | string) => {
  if (role === 2 || role === "MUA") return "Makeup Artist";
  if (role === 0 || role === "Admin") return "Admin";
  return "Customer";
};

const mapUserProfile = (data: BackendUserProfile): UserProfile => ({
  id: data.userId,
  name: data.fullName || "BeautyBook User",
  email: data.email || "",
  avatar: data.avatarUrl || "BB",
  joinedDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString("vi-VN") : "",
  statsCompleted: 0,
  statsFavorites: 0,
  membershipTier: roleToTier(data.role),
});

export const userService = {
  getUserProfile: async (_email?: string): Promise<UserProfile> => {
    const response = await api.get("/User/profile");
    return mapUserProfile(response.data);
  },

  updateUserProfile: async (
    _userId: string,
    updateData: Partial<UserProfile>,
  ): Promise<UserProfile> => {
    const response = await api.put("/User/profile", {
      fullName: updateData.name,
      avatarUrl: updateData.avatar,
    });

    return mapUserProfile(response.data.user || response.data);
  },
};
