import { ApiBookingRepository } from '../ApiBookingRepository';
import { api } from '../../services/api';
jest.mock('../../services/api', () => ({ api: { get: jest.fn(), post: jest.fn() } }));
const snapshot = { bookingId: 'booking-1', customerId: 'customer-1', muaId: 'mua-1', serviceAddress: 'Địa chỉ booking', address: 'Legacy alias', serviceLatitude: 10.78, serviceLongitude: 106.7, notes: 'Tầng 12', services: [] };
beforeEach(() => jest.clearAllMocks());
it('maps canonical address, coordinates and notes from the booking response', async () => {
  jest.mocked(api.get).mockResolvedValue({ data: snapshot });
  const result = await new ApiBookingRepository().getBookingDetail(snapshot.bookingId);
  expect(result).toMatchObject({ address: snapshot.serviceAddress, serviceLatitude: snapshot.serviceLatitude, serviceLongitude: snapshot.serviceLongitude, note: snapshot.notes, serviceLocationType: null });
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(api.get).toHaveBeenCalledWith('/Booking/booking-1');
});
it('history preserves each snapshot and never infers a workplace type', async () => {
  jest.mocked(api.get).mockResolvedValue({ data: [{ ...snapshot, serviceLatitude: null, serviceLongitude: null, serviceAddress: null }] });
  expect(await new ApiBookingRepository().getUserBookings()).toEqual([expect.objectContaining({ address: snapshot.address, serviceLatitude: null, serviceLongitude: null, serviceLocationType: null })]);
});
it('accepts explicit future workplace snapshot fields without any live-profile fallback', async () => {
  jest.mocked(api.get).mockResolvedValue({ data: { ...snapshot, serviceLocationType: 'MUA_WORK_LOCATION', serviceLocationName: 'Snapshot studio', muaProfile: { address: 'Private newer address', latitude: 20, longitude: 100 } } });
  expect(await new ApiBookingRepository().getBookingDetail(snapshot.bookingId)).toMatchObject({ address: snapshot.serviceAddress, serviceLatitude: snapshot.serviceLatitude, serviceLocationType: 'MUA_WORK_LOCATION', serviceLocationName: 'Snapshot studio' });
});
it('forwards optional customer GPS and notes into the existing backend fields', async () => {
  jest.mocked(api.post).mockResolvedValue({ data: snapshot });
  await new ApiBookingRepository().createBooking({ idempotencyKey: 'test', muaId: snapshot.muaId, services: [{ serviceId: 'service', participantsCount: 1 }], date: '2026-10-10', time: '10:00', address: snapshot.serviceAddress, serviceLatitude: snapshot.serviceLatitude, serviceLongitude: snapshot.serviceLongitude, note: snapshot.notes, paymentMethod: 'payOS' });
  expect(api.post).toHaveBeenCalledWith('/Booking/create', expect.objectContaining({ address: snapshot.serviceAddress, serviceLatitude: snapshot.serviceLatitude, serviceLongitude: snapshot.serviceLongitude, notes: snapshot.notes }));
});
