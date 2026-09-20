export enum MuaReceivableStatus {
  OnHold = 0,
  Available = 1,
  Frozen = 2,
  PayoutPending = 3,
  PaidOut = 4,
  Reversed = 5,
}

export interface MuaReceivableDto {
  id: string;
  bookingId: string;
  grossAmount: number;
  platformFeeAmount: number;
  netAmount: number;
  status: MuaReceivableStatus;
  createdAt: string;
  availableAt?: string;
  frozenAt?: string;
  paidOutAt?: string;
  reversedAt?: string;
}

export interface MuaEarningsDto {
  onHoldTotal: number;
  availableTotal: number;
  frozenTotal: number;
  payoutPendingTotal: number;
  paidOutTotal: number;
  receivables: MuaReceivableDto[];
}
