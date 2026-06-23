import { ApiAuthRepository } from '../repositories/ApiAuthRepository';
import type { IAuthRepository, LoginRequest, RegisterRequest } from '../repositories/IAuthRepository';
import type { AuthResponseDto, UserDto } from '../types/auth';

class AuthService {
  private repository: IAuthRepository;

  constructor(repository: IAuthRepository) {
    this.repository = repository;
  }

  async login(request: LoginRequest): Promise<AuthResponseDto> {
    return this.repository.login(request);
  }

  async register(request: RegisterRequest): Promise<AuthResponseDto> {
    return this.repository.register(request);
  }

  async getMe(): Promise<UserDto> {
    return this.repository.getMe();
  }

  async logout(): Promise<void> {
    return this.repository.logout();
  }

  async becomeMua(): Promise<AuthResponseDto> {
    return this.repository.becomeMua();
  }
}

// Export a singleton instance using the REAL API repository
export const authService = new AuthService(new ApiAuthRepository());
