import { api } from '../services/api';
import type { IAuthRepository, LoginRequest, RegisterRequest } from './IAuthRepository';
import { UserRole, type AuthResponseDto, type UserDto } from '../types/auth';
import type { MuaApplicationRequestDto } from '../types/onboarding';

interface BackendTokenDto {
  token: string;
  expiration: string;
  userId: string;
  fullName: string;
  email: string;
  role: number | string;
  hasMuaProfile: boolean;
  isDemoAccount?: boolean;
}

interface BackendUserDto {
  isDemoAccount?: boolean;
  demoCounterpartMuaId?: string | null;
  userId: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  role: number | string;
  hasMuaProfile: boolean;
  createdAt: string;
}

const mapBackendRole = (role: number | string): UserRole => {
  if (role === 0 || String(role).toUpperCase() === 'ADMIN') return UserRole.Admin;
  if (role === 2 || String(role).toUpperCase() === 'MUA') return UserRole.MUA;
  return UserRole.Customer;
};

export class ApiAuthRepository implements IAuthRepository {
  async login(request: LoginRequest): Promise<AuthResponseDto> {
    const response = await api.post<BackendTokenDto>('/Auth/login', request);
    return this.mapToAuthResponse(response.data);
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponseDto> {
    const response = await api.post<BackendTokenDto>('/Auth/google', { idToken });
    return this.mapToAuthResponse(response.data);
  }

  async register(request: RegisterRequest): Promise<void> {
    const payload = {
      fullName: request.fullName,
      email: request.email,
      password: request.password,
      role: 1,
      otp: request.otp,
    };

    await api.post('/Auth/register', payload);
  }

  async requestRegistrationOtp(email: string): Promise<void> { await api.post('/Auth/register/request-otp', { email }); }
  async requestPasswordReset(email: string): Promise<void> { await api.post('/Auth/forgot-password', { email }); }
  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    await api.post('/Auth/reset-password', { email, otp, newPassword });
  }
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/Auth/change-password', { currentPassword, newPassword });
  }

  async getMe(): Promise<UserDto> {
    // UserController has GET /api/user/profile
    const response = await api.get<BackendUserDto>('/User/profile');
    const data = response.data;
    return {
      id: data.userId,
      name: data.fullName || '',
      email: data.email || '',
      role: mapBackendRole(data.role),
      avatar: data.avatarUrl,
      avatarUrl: data.avatarUrl,
      hasMuaProfile: data.hasMuaProfile,
      isDemoAccount: data.isDemoAccount === true,
      demoCounterpartMuaId: data.demoCounterpartMuaId ?? null,
      createdAt: data.createdAt,
    };
  }

  async logout(): Promise<void> {
    // Usually handled client-side by dropping the token, or an optional backend call.
    return Promise.resolve();
  }

  async becomeMua(request: MuaApplicationRequestDto): Promise<AuthResponseDto> {
    const response = await api.post<BackendTokenDto>('/Auth/become-mua', request);
    return this.mapToAuthResponse(response.data);
  }

  async deleteAccount(): Promise<void> {
    await api.delete('/User/me');
  }

  private mapToAuthResponse(data: BackendTokenDto): AuthResponseDto {
    const expiration = new Date(data.expiration).getTime();
    return {
      accessToken: data.token,
      refreshToken: '', // Backend doesn't support refresh tokens yet
      expiresIn: Number.isNaN(expiration) ? 0 : Math.max(0, Math.floor((expiration - Date.now()) / 1000)),
      user: {
        id: data.userId,
        name: data.fullName,
        email: data.email,
        role: mapBackendRole(data.role),
        hasMuaProfile: data.hasMuaProfile,
        isDemoAccount: data.isDemoAccount === true,
        demoCounterpartMuaId: null,
        createdAt: new Date().toISOString()
      },
    };
  }
}
