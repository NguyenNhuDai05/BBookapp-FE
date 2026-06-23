import { api } from '../services/api';
import type { IAuthRepository, LoginRequest, RegisterRequest } from './IAuthRepository';
import type { AuthResponseDto, UserDto } from '../types/auth';

interface BackendTokenDto {
  token: string;
  expiration: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
}

export class ApiAuthRepository implements IAuthRepository {
  async login(request: LoginRequest): Promise<AuthResponseDto> {
    const response = await api.post<BackendTokenDto>('/Auth/login', request);
    return this.mapToAuthResponse(response.data);
  }

  async register(request: RegisterRequest): Promise<AuthResponseDto> {
    // Map string role to backend enum int
    let backendRole = 1; // Default to Customer
    if (request.role === 'Admin') backendRole = 0;
    if (request.role === 'MUA') backendRole = 2;

    const payload = {
      fullName: request.fullName,
      email: request.email,
      password: request.password,
      phoneNumber: request.phone, // Map phone -> phoneNumber
      role: backendRole, // Map string -> int
    };

    const response = await api.post<{message: string, user: any}>('/Auth/register', payload);
    
    // The backend returns a User object on register, not a TokenDto.
    // We must automatically log in the user to get their JWT token!
    if (request.password) {
      return this.login({ email: request.email, password: request.password });
    }

    return this.mapToAuthResponse(response.data.user);
  }

  async getMe(): Promise<UserDto> {
    // UserController has GET /api/user/profile
    const response = await api.get('/user/profile');
    const data = response.data;
    return {
      id: data.id || data.userId,
      name: data.fullName || data.name,
      email: data.email,
      role: data.role,
      avatar: data.avatar,
      hasMuaProfile: data.hasMuaProfile,
      createdAt: data.createdAt || new Date().toISOString()
    } as UserDto;
  }

  async logout(): Promise<void> {
    // Usually handled client-side by dropping the token, or an optional backend call.
    return Promise.resolve();
  }

  async becomeMua(): Promise<AuthResponseDto> {
    const response = await api.post<BackendTokenDto>('/Auth/become-mua');
    return this.mapToAuthResponse(response.data);
  }

  private mapToAuthResponse(data: any): AuthResponseDto {
    return {
      accessToken: data.token,
      refreshToken: '', // Backend doesn't support refresh tokens yet
      expiresIn: 3600,
      user: {
        id: data.userId || data.id,
        name: data.fullName,
        email: data.email,
        role: data.role,
        hasMuaProfile: data.hasMuaProfile,
        createdAt: new Date().toISOString()
      } as UserDto
    };
  }
}
