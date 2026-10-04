import * as WebBrowser from 'expo-web-browser';
import type { BookingPaymentDto } from '../types/booking';

/** Provider comes from the server; unknown or mixed contexts never open checkout. */
export async function openDepositCheckout(payment: BookingPaymentDto, isReviewAccount: boolean): Promise<'sample' | 'external'> {
  if (payment.provider === 'SIMULATED' && isReviewAccount) return 'sample';
  if (isReviewAccount || payment.provider !== 'PAYOS') throw new Error('Không thể xác nhận phương thức thanh toán. Vui lòng làm mới lịch đặt.');
  if (!payment.checkoutUrl) throw new Error('payOS không trả về đường dẫn thanh toán.');
  await WebBrowser.openBrowserAsync(payment.checkoutUrl);
  return 'external';
}
