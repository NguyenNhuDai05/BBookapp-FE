import { api } from '../services/api';
import type { IMuaProfileRepository } from './IMuaProfileRepository';
import type { MuaProfileDto, PayoutSettingsDto, MuaUpdateDto } from '../types/muaProfile';
import { useAuthStore } from '../store/useAuthStore';

export class ApiMuaProfileRepository implements IMuaProfileRepository {
  async getProfile(muaId: string): Promise<MuaProfileDto> {
    const currentUser = useAuthStore.getState().user;
    const isMine = muaId === 'me' || muaId === currentUser?.id;
    const response = await api.get(isMine ? '/User/profile' : `/Mua/${muaId}`);
    
    // Mapping from backend to frontend DTO
    const root = response.data;
    const data = isMine ? (root.muaProfile || root.MuaProfile || root) : root;
    return {
      id: data.muaId || currentUser?.id || muaId,
      name: data.fullName || root.fullName || data.name || '',
      avatarUrl: data.avatarUrl || root.avatarUrl || data.avatar || '',
      verificationStatus: (data.status?.toUpperCase() as any) || 'UNVERIFIED',
      bio: data.bio || '',
      phoneNumber: data.phoneNumber || root.phoneNumber || '',
      city: data.city || '',
      experienceYears: Number(data.experienceYears) || 0,
      specialization: data.specialization || '',
      socialLinks: data.socialLinks || '',
      rejectionReason: data.rejectionReason,
      reviewCount: data.totalBookings || 0,
      rating: data.averageRating || 0
    };
  }

  async updateProfile(data: MuaUpdateDto): Promise<void> {
    await api.put('/Mua/profile', data);
  }

  async getPayoutSettings(muaId: string): Promise<PayoutSettingsDto | null> {
    // Implement when backend supports payout settings
    return null;
  }

  async updatePayoutSettings(muaId: string, settings: PayoutSettingsDto): Promise<void> {
    // Implement when backend supports payout settings
    return Promise.resolve();
  }
}
