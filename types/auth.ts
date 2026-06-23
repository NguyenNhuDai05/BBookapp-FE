export enum UserRole {
  Customer = 'CUSTOMER',
  MUA = 'MUA',
  Admin = 'ADMIN',
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  hasMuaProfile?: boolean;
  createdAt: string;
}

export interface AuthResponseDto {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
