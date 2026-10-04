import type { BookingDto, BookingPaymentDto } from '../types/booking';
import type { UserDto } from '../types/auth';
import type { MuaEarningsDto } from '../types/earnings';

export const REVIEW_FINANCIAL_NOTICE = 'Giao dịch mẫu dành cho đánh giá ứng dụng. Không có tiền thật được chuyển.';
export const REVIEW_DATA_NOTICE = 'Dữ liệu mẫu dành cho đánh giá ứng dụng. Thông tin đã được chuẩn bị và được quản lý riêng.';
export const REVIEW_PASSWORD_NOTICE = 'Mật khẩu của tài khoản đánh giá được quản lý riêng.';
export const REVIEW_PROTECTED_NOTICE = 'Tài khoản đánh giá được bảo vệ để duy trì quyền truy cập trong quá trình xét duyệt.';
export type DemoBookingAction = 'paymentSucceed' | 'counterpartAccept' | 'counterpartReject';
export function hasDemoAction(user: UserDto | null, booking: BookingDto | undefined, action: DemoBookingAction) {
  return user?.isDemoAccount === true && booking?.customer.id === user.id && booking.availableDemoActions?.includes(action) === true;
}
export function canConfirmSamplePayment(user: UserDto | null, booking: BookingDto | undefined, payment: BookingPaymentDto | null) {
  return payment?.provider === 'SIMULATED' && payment.bookingId === booking?.id && hasDemoAction(user, booking, 'paymentSucceed');
}
export function canRequestSamplePayout(user: UserDto | null, earnings: MuaEarningsDto | undefined) {
  return user?.isDemoAccount === true && earnings?.canRequestSimulatedPayout === true && !!earnings.permittedSimulationBankAccountId;
}
export function reviewErrorMessage(code: unknown) {
  if (code === 'PLAY_REVIEW_ACCOUNT_PROTECTED') return REVIEW_PROTECTED_NOTICE;
  if (code === 'PLAY_REVIEW_OPERATION_BLOCKED') return 'Thao tác này không khả dụng cho tài khoản đánh giá. Vui lòng làm mới dữ liệu hoặc chọn tính năng khác.';
  return undefined;
}
