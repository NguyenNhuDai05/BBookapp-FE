export type MuaProfileStatus = 'DRAFT' | 'LISTED' | 'SUSPENDED' | string;

export interface MuaEligibilityRequirement {
  key: string;
  label: string;
  isMet: boolean;
  current?: number | null;
  required?: number | null;
}

export interface MuaEligibility {
  completionPercentage: number;
  profileStatus: MuaProfileStatus;
  canPublishProfile: boolean;
  canReceiveBookings: boolean;
  canWithdraw: boolean;
  verificationStatus: string;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  requirements: MuaEligibilityRequirement[];
  missingRequirements: MuaEligibilityRequirement[];
}
