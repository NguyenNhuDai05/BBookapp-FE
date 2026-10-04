import { api } from '../api';
import { ApiBookingRepository } from '../../repositories/ApiBookingRepository';
import { ApiAuthRepository } from '../../repositories/ApiAuthRepository';
import { ApiMuaPayoutRepository } from '../../repositories/ApiMuaPayoutRepository';
import { openDepositCheckout } from '../bookingPaymentFlow';
import * as browser from 'expo-web-browser';
import { canConfirmSamplePayment, hasDemoAction, canRequestSamplePayout } from '../../utils/playReview';
import { UserRole, type UserDto } from '../../types/auth';
import type { BookingDto, BookingPaymentDto } from '../../types/booking';

jest.mock('../api', () => ({ api: { post: jest.fn(), get: jest.fn() } }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
const post = api.post as jest.Mock;
const get = api.get as jest.Mock;
const user: UserDto = { id: 'review', name: 'Review', email: 'unrelated@example.test', role: UserRole.MUA, createdAt: '', isDemoAccount: true };
const booking = { id: 'booking', customer: { id: 'review' }, availableDemoActions: ['paymentSucceed', 'counterpartAccept'] } as BookingDto;
const payment = { bookingId: 'booking', provider: 'SIMULATED', amount: 150000, status: 'PENDING', checkoutUrl: null } as BookingPaymentDto;
beforeEach(() => jest.clearAllMocks());

it('keeps normal PayOS browser checkout and never opens a browser for sample payment without URL', async () => {
  await expect(openDepositCheckout({ ...payment, provider: 'PAYOS', checkoutUrl: 'https://checkout.example.test/order' }, false)).resolves.toBe('external');
  expect(browser.openBrowserAsync).toHaveBeenCalledTimes(1);
  expect(browser.openBrowserAsync).toHaveBeenCalledWith('https://checkout.example.test/order');
  await expect(openDepositCheckout(payment, true)).resolves.toBe('sample');
  expect(browser.openBrowserAsync).toHaveBeenCalledTimes(1);
});
it.each([
  [{ ...payment, provider: 'PAYOS', checkoutUrl: 'https://checkout.example.test/order' }, true],
  [payment, false],
  [{ ...payment, provider: 'UNKNOWN' }, false],
  [{ ...payment, provider: 'PAYOS' }, false],
] as const)('fails closed for incompatible/unknown providers or missing PayOS URL', async (attempt, review) => {
  await expect(openDepositCheckout(attempt, review)).rejects.toThrow();
  expect(browser.openBrowserAsync).not.toHaveBeenCalled();
});
it('requires provider, current customer and explicit action; neither email nor role grants authority', () => {
  expect(canConfirmSamplePayment(user, booking, payment)).toBe(true);
  expect(canConfirmSamplePayment({ ...user, isDemoAccount: false }, booking, payment)).toBe(false);
  expect(canConfirmSamplePayment(user, { ...booking, availableDemoActions: undefined }, payment)).toBe(false);
  expect(canConfirmSamplePayment(user, booking, { ...payment, provider: 'PAYOS' })).toBe(false);
  expect(canConfirmSamplePayment(user, booking, { ...payment, bookingId: 'other' })).toBe(false);
  expect(hasDemoAction(user, { ...booking, customer: { ...booking.customer, id: 'other' } }, 'counterpartAccept')).toBe(false);
  expect(hasDemoAction(user, booking, 'counterpartReject')).toBe(false);
});
it('maps simulated deposit provider and nullable checkout URL', async () => {
  post.mockResolvedValue({ data: { paymentId: 'p', bookingId: 'booking', provider: 1, amount: 150000, status: 1, checkoutUrl: null } });
  expect(await new ApiBookingRepository().createDepositPayment('booking')).toEqual(expect.objectContaining({ provider: 'SIMULATED', checkoutUrl: null }));
  expect(post).toHaveBeenCalledWith('/Booking/booking/deposit-payment');
});
it.each(['paymentSucceed', 'counterpartAccept', 'counterpartReject'] as const)('posts only the explicit %s endpoint then reads server booking', async action => {
  const paths = { paymentSucceed: 'demo-payment/succeed', counterpartAccept: 'demo-counterpart/accept', counterpartReject: 'demo-counterpart/reject' };
  post.mockResolvedValue({ data: {} }); get.mockResolvedValue({ data: { bookingId: 'booking', customerId: 'review', availableDemoActions: [] } });
  const result = await new ApiBookingRepository().performDemoAction('booking', action);
  expect(post.mock.calls[0]).toEqual([`/Booking/booking/${paths[action]}`]);
  expect(get).toHaveBeenCalledWith('/Booking/booking');
  expect(result.availableDemoActions).toEqual([]);
});
it('does not manufacture success when stale capabilities are rejected', async () => {
  post.mockRejectedValue(new Error('PLAY_REVIEW_OPERATION_BLOCKED'));
  await expect(new ApiBookingRepository().performDemoAction('booking', 'paymentSucceed')).rejects.toThrow();
  expect(get).not.toHaveBeenCalled();
});
it('maps server login marker and own-profile counterpart without any hardcoded identities', async () => {
  post.mockResolvedValue({ data: { token: 'token', userId: 'review', fullName: 'Review', role: 2, hasMuaProfile: true, isDemoAccount: true } });
  const repository = new ApiAuthRepository();
  expect((await repository.login({ email: 'any@example.test', password: 'input' })).user).toEqual(expect.objectContaining({ isDemoAccount: true, hasMuaProfile: true, role: UserRole.MUA }));
  get.mockResolvedValue({ data: { userId: 'review', role: 2, isDemoAccount: true, demoCounterpartMuaId: 'server-counterpart' } });
  expect(await repository.getMe()).toEqual(expect.objectContaining({ demoCounterpartMuaId: 'server-counterpart' }));
  get.mockResolvedValue({ data: { userId: 'normal', role: 2 } });
  expect(await repository.getMe()).toEqual(expect.objectContaining({ isDemoAccount: false, demoCounterpartMuaId: null }));
});
it('requests sample payout using the existing endpoint and ordinary body; maps actual paid provider', async () => {
  const request = { bankAccountId: 'permitted', receivableIds: ['receipt'], idempotencyKey: 'key' };
  post.mockResolvedValue({ data: { id: 'payout', status: 3, provider: 2 } });
  expect(await new ApiMuaPayoutRepository().createPayout(request)).toEqual(expect.objectContaining({ provider: 'SIMULATED', status: 'PAID' }));
  expect(post).toHaveBeenCalledWith('/mua/payouts', request);
});
it('preserves normal payout provider and ordinary endpoint', async () => {
  const request = { bankAccountId: 'approved-bank', idempotencyKey: 'normal-key' };
  post.mockResolvedValue({ data: { id: 'normal-payout', status: 0, provider: 0 } });
  expect(await new ApiMuaPayoutRepository().createPayout(request)).toEqual(expect.objectContaining({ provider: 'MANUAL', status: 'PENDING' }));
  expect(post).toHaveBeenCalledWith('/mua/payouts', request);
});
it('fails closed for missing payout capability, permitted bank or account marker', () => {
  const earnings = { canRequestSimulatedPayout: true, permittedSimulationBankAccountId: 'bank' } as import('../../types/earnings').MuaEarningsDto;
  expect(canRequestSamplePayout(user, earnings)).toBe(true);
  expect(canRequestSamplePayout(user, { ...earnings, permittedSimulationBankAccountId: null })).toBe(false);
  expect(canRequestSamplePayout(user, { ...earnings, canRequestSimulatedPayout: false })).toBe(false);
  expect(canRequestSamplePayout({ ...user, isDemoAccount: false }, earnings)).toBe(false);
});
