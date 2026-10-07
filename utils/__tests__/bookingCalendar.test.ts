import { isCalendarBooking } from '../bookingCalendar';
import { BookingDto, PaymentStatus } from '../../types/booking';

const booking = (status: BookingDto['status'], paymentStatus = PaymentStatus.UNPAID, depositPaidAt?: string) => ({ status, paymentStatus, depositPaidAt } as BookingDto);
describe('booking calendar visibility', () => {
  it('shows customer deposits before MUA confirms, including legacy payments', () => {
    expect(isCalendarBooking(booking('PENDING_CONFIRMATION', PaymentStatus.DEPOSIT_HELD), 'customer')).toBe(true);
    expect(isCalendarBooking(booking('PENDING_CONFIRMATION', PaymentStatus.PAID_LEGACY), 'customer')).toBe(true);
    expect(isCalendarBooking(booking('PENDING_CONFIRMATION', PaymentStatus.UNPAID, '2026-10-07'), 'customer')).toBe(true);
    expect(isCalendarBooking(booking('PENDING_CONFIRMATION'), 'customer')).toBe(false);
    expect(isCalendarBooking(booking('PENDING_CONFIRMATION', PaymentStatus.DEPOSIT_HELD), 'mua')).toBe(false);
  });
  it.each(['CANCELLED', 'REJECTED', 'PENDING_PAYMENT', 'UNKNOWN'] as const)('removes %s even when deposit was previously paid', status => {
    expect(isCalendarBooking(booking(status, PaymentStatus.DEPOSIT_HELD, '2026-10-07'), 'customer')).toBe(false);
    expect(isCalendarBooking(booking(status, PaymentStatus.DEPOSIT_HELD), 'mua')).toBe(false);
  });
  it.each(['CONFIRMED', 'IN_PROGRESS', 'WAITING_CUSTOMER'] as const)('keeps %s in both calendars', status => {
    expect(isCalendarBooking(booking(status), 'customer')).toBe(true);
    expect(isCalendarBooking(booking(status), 'mua')).toBe(true);
  });
});
