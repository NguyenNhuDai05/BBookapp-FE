export type PayoutStatus = 'PENDING' | 'MANUAL_ACTION_REQUIRED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'UNKNOWN';
export type PayoutProvider = 'MANUAL' | 'PAYOS' | 'UNKNOWN';

export interface MuaBankAccountDto {
  id: string;
  bankCode: string;
  bankName?: string;
  maskedAccountNumber: string;
  accountHolderName: string;
  isDefault: boolean;
  isActive: boolean;
  verificationStatus: string;
  method: 'BANK' | 'MOMO';
  qrCodeUrl?: string;
  activatedAt: string;
  isCoolingDown: boolean;
}

export interface UpsertMuaBankAccountRequest {
  bankCode: string;
  bankName?: string;
  accountNumber: string;
  accountHolderName: string;
  isDefault: boolean;
  currentPassword: string;
  method: 'BANK' | 'MOMO';
  qrCodeUrl?: string;
}

export interface CreatePayoutRequest {
  bankAccountId: string;
  receivableIds?: string[];
  idempotencyKey: string;
}

export interface MuaPayoutDto {
  id: string;
  amount: number;
  status: PayoutStatus;
  provider: PayoutProvider;
  bankCode: string;
  bankName?: string;
  maskedAccountNumber: string;
  accountHolderName: string;
  providerReference?: string;
  idempotencyKey: string;
  receivableIds: string[];
  createdAt: string;
  processingAt?: string;
  paidAt?: string;
  failedAt?: string;
  reconciledAt?: string;
  failureCode?: string;
  failureMessage?: string;
  qrCodeUrl?: string;
}
