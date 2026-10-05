import type { AuthResponseDto, UserDto, UserRole } from '../types/auth';
import type { MuaApplicationRequestDto } from '../types/onboarding';

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password?: string;
  role?: UserRole;
  otp: string;
}

export interface IAuthRepository {
  login(request: LoginRequest): Promise<AuthResponseDto>;
  register(request: RegisterRequest): Promise<void>;
  requestRegistrationOtp(email: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  getMe(): Promise<UserDto>;
  logout(): Promise<void>;
  becomeMua(request: MuaApplicationRequestDto): Promise<AuthResponseDto>;
  deleteAccount(): Promise<void>;
}
