export interface CustomerBankAccountDto {
  id: string;
  bankBin: string;
  bankName?: string;
  maskedAccountNumber: string;
  accountHolderName: string;
  isDefault: boolean;
}

export interface UpsertCustomerBankAccountRequest {
  bankBin: string;
  bankName?: string;
  accountNumber: string;
  accountHolderName: string;
  isDefault: boolean;
}

export type AdminRefundStatus = 'PENDING' | 'MANUAL_ACTION_REQUIRED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'AWAITING_DESTINATION' | 'UNKNOWN';

export interface AdminRefundDto {
  refundId: string;
  bookingId: string;
  customerId: string;
  customerName?: string;
  amount: number;
  status: AdminRefundStatus;
  reason: string;
  providerReference?: string;
  destinationBankBin?: string;
  destinationBankName?: string;
  destinationAccountNumber?: string;
  maskedDestinationAccountNumber?: string;
  destinationAccountName?: string;
  createdAt: string;
  processingAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureCode?: string;
  failureMessage?: string;
}
