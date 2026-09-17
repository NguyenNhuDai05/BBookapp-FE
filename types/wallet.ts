export type TopUpStatus = 0 | 1 | 2 | 3 | 4;

export interface WalletTransactionDto {
  transactionId: string;
  amount: number;
  transactionType: number;
  referenceId?: string;
  referenceType?: string;
  description?: string;
  createdAt: string;
}

export interface WalletDto {
  walletId: string;
  userId: string;
  balance: number;
  updatedAt: string;
  transactions: WalletTransactionDto[];
}

export interface WalletTopUpDto {
  topUpId: string;
  amount: number;
  provider: number;
  providerOrderCode: number;
  providerPaymentLinkId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  status: TopUpStatus;
  paidAt?: string;
  cancelledAt?: string;
  expiredAt?: string;
  createdAt: string;
  updatedAt: string;
}
