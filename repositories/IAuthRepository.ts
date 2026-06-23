import type { AuthResponseDto, UserDto, UserRole } from '../types/auth';

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
  register(request: RegisterRequest): Promise<AuthResponseDto>;
  getMe(): Promise<UserDto>;
  logout(): Promise<void>;
  becomeMua(): Promise<AuthResponseDto>;
}
