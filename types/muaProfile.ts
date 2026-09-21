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
  brandName?: string;
  avatarUrl?: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  bio?: string;
  phoneNumber?: string;
  city?: string;
  experienceYears?: number;
  specialization?: string;
  socialLinks?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  specialties?: { styleId: number; name: string; isActive: boolean }[];
  reviewCount?: number;
  rating?: number;
}

export interface MuaUpdateDto {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  city?: string;
  experienceYears?: number;
  specialization?: string;
  socialLinks?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  styleIds?: number[];
}
