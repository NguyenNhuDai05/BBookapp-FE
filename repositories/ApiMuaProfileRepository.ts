import { api } from '../services/api';
import type { IMuaProfileRepository } from './IMuaProfileRepository';
import type { MuaProfileDto, PayoutSettingsDto, MuaUpdateDto } from '../types/muaProfile';
import { useAuthStore } from '../store/useAuthStore';

export class ApiMuaProfileRepository implements IMuaProfileRepository {
  async getProfile(muaId: string): Promise<MuaProfileDto> {
    let id = muaId;
    if (id === 'me') {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Not authenticated');
      id = user.id;
    }
    const response = await api.get(`/Mua/${id}`);
    
    // Mapping from backend to frontend DTO
    const data = response.data;
    return {
      id: data.muaId || id,
      name: data.fullName || data.name || '',
      avatarUrl: data.avatarUrl || data.avatar || '',
      verificationStatus: (data.status?.toUpperCase() as any) || 'UNVERIFIED',
      bio: data.bio || '',
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
