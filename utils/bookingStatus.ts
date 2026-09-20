import { PaymentStatus, type BookingPaymentStatus, type BookingStatus, type RefundStatus, type RefundSummaryDto } from '../types/booking';

export const mapBookingStatus = (value: unknown): BookingStatus => {
  const map: Record<string, BookingStatus> = {
    '0': 'PENDING_CONFIRMATION', Pending: 'PENDING_CONFIRMATION',
    '1': 'CONFIRMED', Approved: 'CONFIRMED',
    '2': 'COMPLETED', Completed: 'COMPLETED',
    '3': 'CANCELLED', Cancelled: 'CANCELLED',
    '4': 'WAITING_CUSTOMER', WaitingCustomer: 'WAITING_CUSTOMER',
    '5': 'PENDING_PAYMENT', PendingPayment: 'PENDING_PAYMENT',
    '6': 'PENDING_CONFIRMATION', PendingConfirmation: 'PENDING_CONFIRMATION',
    '7': 'REJECTED', Rejected: 'REJECTED',
    '8': 'IN_PROGRESS', InProgress: 'IN_PROGRESS',
    '9': 'DISPUTED', Disputed: 'DISPUTED',
    '10': 'AUTO_COMPLETED', AutoCompleted: 'AUTO_COMPLETED',
  };
  return map[String(value)] ?? 'UNKNOWN';
};

export const mapPaymentStatus = (value: unknown): PaymentStatus => {
  const map: Record<string, PaymentStatus> = {
    '0': PaymentStatus.UNPAID, Unpaid: PaymentStatus.UNPAID,
    '1': PaymentStatus.PAID_LEGACY, Paid: PaymentStatus.PAID_LEGACY,
    '2': PaymentStatus.REFUNDED, Refunded: PaymentStatus.REFUNDED,
    '3': PaymentStatus.FAILED, Failed: PaymentStatus.FAILED,
    '4': PaymentStatus.DEPOSIT_HELD, DepositHeld: PaymentStatus.DEPOSIT_HELD,
    '5': PaymentStatus.RELEASED, Released: PaymentStatus.RELEASED,
    '6': PaymentStatus.FROZEN, Frozen: PaymentStatus.FROZEN,
    '7': PaymentStatus.REFUND_PENDING, RefundPending: PaymentStatus.REFUND_PENDING,
    '8': PaymentStatus.PARTIALLY_REFUNDED, PartiallyRefunded: PaymentStatus.PARTIALLY_REFUNDED,
    '9': PaymentStatus.FORFEITED, Forfeited: PaymentStatus.FORFEITED,
  };
  return map[String(value)] ?? PaymentStatus.UNKNOWN;
};

export const mapBookingPaymentStatus = (value: unknown): BookingPaymentStatus => {
  const map: Record<string, BookingPaymentStatus> = {
    '0': 'CREATED', Created: 'CREATED',
    '1': 'PENDING', Pending: 'PENDING',
    '2': 'PAID', Paid: 'PAID',
    '3': 'FAILED', Failed: 'FAILED',
    '4': 'EXPIRED', Expired: 'EXPIRED',
    '5': 'REFUND_PENDING', RefundPending: 'REFUND_PENDING',
    '6': 'REFUNDED', Refunded: 'REFUNDED',
    '7': 'PARTIALLY_REFUNDED', PartiallyRefunded: 'PARTIALLY_REFUNDED',
    '8': 'FORFEITED', Forfeited: 'FORFEITED',
  };
  return map[String(value)] ?? 'UNKNOWN';
};

export const mapRefundStatus = (value: unknown): RefundStatus => {
  const map: Record<string, RefundStatus> = {
    '0': 'PENDING', Pending: 'PENDING',
    '1': 'MANUAL_ACTION_REQUIRED', ManualActionRequired: 'MANUAL_ACTION_REQUIRED',
    '2': 'PROCESSING', Processing: 'PROCESSING',
    '3': 'COMPLETED', Completed: 'COMPLETED',
    '4': 'FAILED', Failed: 'FAILED',
    '5': 'AWAITING_DESTINATION', AwaitingDestination: 'AWAITING_DESTINATION',
  };
  return map[String(value)] ?? 'UNKNOWN';
};

export const mapRefundSummary = (value: any): RefundSummaryDto | undefined => value ? {
  refundId: String(value.refundId ?? ''),
  amount: Number(value.amount ?? 0),
  status: mapRefundStatus(value.status),
  reasonCode: value.reasonCode,
  reason: value.reason,
  providerReference: value.providerReference,
  maskedDestinationAccountNumber: value.maskedDestinationAccountNumber,
  destinationBankName: value.destinationBankName,
  destinationAccountName: value.destinationAccountName,
  createdAt: value.createdAt,
  processingAt: value.processingAt,
  completedAt: value.completedAt,
  failedAt: value.failedAt,
  failureCode: value.failureCode,
  failureMessage: value.failureMessage,
} : undefined;

export const getRefundPresentation = (
  paymentStatus: PaymentStatus,
  refund?: RefundSummaryDto,
  cancellationRefundAmount?: number,
) => {
  if (cancellationRefundAmount === 0 || paymentStatus === PaymentStatus.FORFEITED) {
    return { label: 'Booking đã được hủy', description: 'Booking này không phát sinh khoản hoàn tiền.', tone: 'neutral' as const };
  }
  if (paymentStatus === PaymentStatus.PARTIALLY_REFUNDED) return { label: 'Đã hoàn một phần', description: `Đã hoàn: ${formatVnd(refund?.amount ?? 0)}`, tone: 'success' as const };
  if (paymentStatus === PaymentStatus.REFUNDED || refund?.status === 'COMPLETED') return { label: 'Đã hoàn tiền', description: `Số tiền hoàn: ${formatVnd(refund?.amount ?? 0)}`, tone: 'success' as const };
  switch (refund?.status) {
    case 'AWAITING_DESTINATION': return { label: 'Cần tài khoản nhận tiền', description: 'Vui lòng bổ sung tài khoản ngân hàng để nhận khoản hoàn.', tone: 'pending' as const };
    case 'MANUAL_ACTION_REQUIRED': return { label: 'Đang chờ xử lý hoàn tiền', description: 'Bộ phận hỗ trợ sẽ tiếp tục xử lý khoản hoàn.', tone: 'pending' as const };
    case 'PROCESSING': return { label: 'Đang xử lý hoàn tiền', description: 'Khoản hoàn đang được đối soát.', tone: 'pending' as const };
    case 'FAILED': return { label: 'Hoàn tiền chưa thành công', description: 'Vui lòng liên hệ hỗ trợ để được kiểm tra.', tone: 'error' as const };
    case 'PENDING': return { label: 'Đang chờ hoàn tiền', description: 'Khoản hoàn sẽ được xử lý theo trạng thái của hệ thống.', tone: 'pending' as const };
    case 'UNKNOWN': return { label: 'Trạng thái hoàn tiền đang được cập nhật', description: 'Vui lòng tải lại sau.', tone: 'neutral' as const };
    default:
      if (paymentStatus === PaymentStatus.REFUND_PENDING) {
        return { label: 'Đang chờ hoàn tiền', description: 'Khoản hoàn sẽ được xử lý theo trạng thái của hệ thống.', tone: 'pending' as const };
      }
      if (paymentStatus === PaymentStatus.UNKNOWN) {
        return { label: 'Trạng thái hoàn tiền đang được cập nhật', description: 'Vui lòng tải lại sau.', tone: 'neutral' as const };
      }
      return { label: 'Booking đã được hủy', description: 'Chưa ghi nhận khoản hoàn tiền từ hệ thống.', tone: 'neutral' as const };
  }
};

export const formatVnd = (amount: number) => `${Math.max(0, Number(amount) || 0).toLocaleString('vi-VN')}đ`;
