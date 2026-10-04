export type PayoutStatus = 'PENDING' | 'MANUAL_ACTION_REQUIRED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'UNKNOWN';
export type PayoutProvider = 'MANUAL' | 'PAYOS' | 'SIMULATED' | 'UNKNOWN';

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
  bankBin?: string;
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
