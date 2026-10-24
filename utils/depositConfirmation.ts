import { PaymentStatus, type BookingDto } from '../types/booking';

export function depositConfirmationState(booking: Pick<BookingDto, 'paymentStatus' | 'status'>): 'pending' | 'success' | 'refund' | 'failed' | 'unknown' {
  switch (booking.paymentStatus) {
    case PaymentStatus.PAID_LEGACY:
    case PaymentStatus.DEPOSIT_HELD:
    case PaymentStatus.RELEASED:
    case PaymentStatus.FROZEN: return 'success';
    case PaymentStatus.REFUND_PENDING:
    case PaymentStatus.REFUNDED:
    case PaymentStatus.PARTIALLY_REFUNDED:
    case PaymentStatus.FORFEITED: return 'refund';
    case PaymentStatus.FAILED: return 'failed';
    case PaymentStatus.UNPAID:
      return booking.status === 'CANCELLED' || booking.status === 'REJECTED' ? 'failed' : 'pending';
    default: return 'unknown';
  }
}

export function hasRecordedDeposit(booking: Pick<BookingDto, 'paymentStatus' | 'status'>) {
  const state = depositConfirmationState(booking);
  return state === 'success' || state === 'refund';
}
