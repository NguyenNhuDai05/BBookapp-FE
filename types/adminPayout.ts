export type AdminPayoutStatus =
  | 'PENDING'
  | 'MANUAL_ACTION_REQUIRED'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'UNKNOWN';

export type AdminPayoutProvider = 'MANUAL' | 'PAYOS' | 'UNKNOWN';

export interface AdminPayoutDto {
  id: string;
  amount: number;
  status: AdminPayoutStatus;
  provider: AdminPayoutProvider;
  bankCode: string;
  bankName?: string;
  maskedAccountNumber: string;
  accountNumber?: string;
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

export interface StartAdminPayoutRequest {
  reference?: string;
}

export interface CompleteAdminPayoutRequest {
  reference: string;
}

export interface FailAdminPayoutRequest {
  failureCode: string;
  failureMessage: string;
  confirmedFundsNotSent: boolean;
}
