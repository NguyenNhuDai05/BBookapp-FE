import { api } from './api';
import type { MuaApplicationRequestDto, MuaApplicationResponseDto } from '../types/onboarding';

class MuaApplicationService {
  async submitApplication(request: MuaApplicationRequestDto): Promise<MuaApplicationResponseDto> {
    const response = await api.put('/Mua/profile', request);
    return { profile: request, status: response.data?.status || 'Draft' };
  }
}

export const muaApplicationService = new MuaApplicationService();
