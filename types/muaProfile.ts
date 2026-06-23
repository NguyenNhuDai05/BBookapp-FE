export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PayoutSettingsDto {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  isVerified: boolean;
}

export interface PayoutTransactionDto {
  id: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface MuaProfileDto {
  id: string;
  name: string;
  avatarUrl?: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  bio?: string;
  reviewCount?: number;
  rating?: number;
}

export interface MuaUpdateDto {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}
