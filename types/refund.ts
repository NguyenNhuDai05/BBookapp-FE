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
  destinationQrCodeUrl?: string;
  createdAt: string;
  processingAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureCode?: string;
  failureMessage?: string;
}
