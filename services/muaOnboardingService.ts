import { api } from './api';
import type { MuaApplicationRequestDto, MuaApplicationResponseDto } from '../types/onboarding';

class MuaApplicationService {
  async submitApplication(request: MuaApplicationRequestDto): Promise<MuaApplicationResponseDto> {
    const response = await api.put('/Mua/profile', request);
    return response.data;
  }
}

export const muaApplicationService = new MuaApplicationService();
