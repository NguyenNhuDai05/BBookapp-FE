import { api } from "./api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phoneNumber: string;
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
  phoneNumber?: string;
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
  avatar: data.avatarUrl || "",
  phoneNumber: data.phoneNumber || "",
  joinedDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString("vi-VN") : "",
  statsCompleted: 0,
  statsFavorites: 0,
  membershipTier: roleToTier(data.role),
});

export const userService = {
  getUserProfile: async (email?: string): Promise<UserProfile> => {
    try {
      const response = await api.get("/User/profile");
      return mapUserProfile(response.data);
    } catch (e) {
      console.error('API Error getting user profile:', e);
      throw e;
    }
  },

  updateUserProfile: async (updateData: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await api.put("/User/profile", {
      fullName: updateData.name,
      avatarUrl: updateData.avatar,
      phoneNumber: updateData.phoneNumber,
    });

    return mapUserProfile(response.data.user || response.data);
  },
};
