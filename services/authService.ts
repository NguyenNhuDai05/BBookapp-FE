import { ApiAuthRepository } from '../repositories/ApiAuthRepository';
import type { IAuthRepository, LoginRequest, RegisterRequest } from '../repositories/IAuthRepository';
import type { AuthResponseDto, UserDto } from '../types/auth';
import type { MuaApplicationRequestDto } from '../types/onboarding';

class AuthService {
  private repository: IAuthRepository;

  constructor(repository: IAuthRepository) {
    this.repository = repository;
  }

  async login(request: LoginRequest): Promise<AuthResponseDto> {
    return this.repository.login(request);
  }


  async register(request: RegisterRequest): Promise<void> {
    await this.repository.register(request);
  }

  requestRegistrationOtp(email: string) { return this.repository.requestRegistrationOtp(email); }
  requestPasswordReset(email: string) { return this.repository.requestPasswordReset(email); }
  verifyPasswordResetOtp(email: string, otp: string) { return this.repository.verifyPasswordResetOtp(email, otp); }
  completePasswordReset(email: string, resetToken: string, newPassword: string) { return this.repository.completePasswordReset(email, resetToken, newPassword); }
  resetPassword(email: string, otp: string, newPassword: string) { return this.repository.resetPassword(email, otp, newPassword); }
  changePassword(currentPassword: string, newPassword: string) { return this.repository.changePassword(currentPassword, newPassword); }

  async getMe(): Promise<UserDto> {
    return this.repository.getMe();
  }

  async logout(): Promise<void> {
    return this.repository.logout();
  }

  async becomeMua(request: MuaApplicationRequestDto): Promise<AuthResponseDto> {
    return this.repository.becomeMua(request);
  }

  async deleteAccount(): Promise<void> {
    return this.repository.deleteAccount();
  }
}

// Export a singleton instance using the REAL API repository
export const authService = new AuthService(new ApiAuthRepository());
