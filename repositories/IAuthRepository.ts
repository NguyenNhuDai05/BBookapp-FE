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
  phone?: string;
  role?: UserRole;
}

export interface IAuthRepository {
  login(request: LoginRequest): Promise<AuthResponseDto>;
  loginWithGoogle(idToken: string): Promise<AuthResponseDto>;
  register(request: RegisterRequest): Promise<void>;
  getMe(): Promise<UserDto>;
  logout(): Promise<void>;
  becomeMua(request: MuaApplicationRequestDto): Promise<AuthResponseDto>;
  deleteAccount(): Promise<void>;
}
