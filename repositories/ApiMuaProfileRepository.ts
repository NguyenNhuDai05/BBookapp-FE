import { api } from '../services/api';
import type { IMuaProfileRepository } from './IMuaProfileRepository';
import type { MuaProfileDto, PayoutSettingsDto, MuaUpdateDto } from '../types/muaProfile';
import { useAuthStore } from '../store/useAuthStore';
import { isPrivateOperatingPoint, muaLocationPayload } from '../utils/muaLocationPayload';

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
      verificationStatus: (data.verificationStatus?.toUpperCase() as MuaProfileDto['verificationStatus']) || 'UNVERIFIED',
      profileStatus: data.status?.toUpperCase(),
      bio: data.bio || '',
      phoneNumber: data.phoneNumber || root.phoneNumber || '',
      city: data.city || '',
      district: data.district || '',
      provinceCode: data.provinceCode ?? undefined,
      districtCode: data.districtCode ?? undefined,
      operatingProvinceCode: data.operatingProvinceCode ?? undefined,
      operatingAreaIds: data.operatingAreaIds || [],
      latitude: data.latitude ?? undefined, longitude: data.longitude ?? undefined,
      operatingLocationConfirmed: !!data.operatingLocationConfirmed,
      publicMeetingPoint: !!data.publicMeetingPoint,
      operatingLocationLabel: data.operatingLocationLabel ?? undefined,
      workLocationName: data.workLocationName ?? undefined, workLocationAddress: data.workLocationAddress ?? undefined, allowCustomerVisit: data.allowCustomerVisit === true,
      experienceLevel: data.experienceLevel ?? undefined,
      experienceYears: Number(data.experienceYears) || 0,
      specialization: data.specialization || '',
      socialLinks: data.socialLinks || '',
      instagramUrl: data.instagramUrl || '',
      facebookUrl: data.facebookUrl || '',
      specialties: data.specialties || [],
      rejectionReason: data.rejectionReason,
      reviewCount: data.totalBookings || 0,
      rating: data.averageRating || 0
    };
  }

  async updateProfile(data: MuaUpdateDto): Promise<void> {
    const payload = muaLocationPayload(data);
    if (data.clearWorkLocation && isPrivateOperatingPoint(data)) {
      // The existing API gives ClearWorkLocation precedence over coordinates.
      // Complete both writes before reporting success; retrying both is safe.
      await api.put('/Mua/profile', { clearWorkLocation: true });
      try { await api.put('/Mua/profile', payload); }
      catch { throw new Error('Đã xóa địa điểm tiếp khách nhưng chưa lưu vị trí mới. Vui lòng bấm Lưu để thử lại.'); }
      return;
    }
    await api.put('/Mua/profile', payload);
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
