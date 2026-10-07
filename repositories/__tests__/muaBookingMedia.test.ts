import { ApiMuaBookingRepository } from '../ApiMuaBookingRepository';
import { api } from '../../services/api';
jest.mock('../../services/api', () => ({ api: { get: jest.fn() } }));
it('preserves booking customer and service images from the list API', async () => {
  (api.get as jest.Mock).mockResolvedValue({ data: [{ bookingId: 'booking', customerAvatarUrl: 'https://example.com/customer.jpg', muaAvatarUrl: 'https://example.com/mua.jpg', status: 6, paymentStatus: 4, services: [{ serviceId: 'service', imageUrl: 'https://example.com/service.jpg', participantsCount: 1 }] }] });
  const [booking] = await new ApiMuaBookingRepository().getAllBookings('me');
  expect(booking.customer.avatarUrl).toBe('https://example.com/customer.jpg');
  expect(booking.mua.avatarUrl).toBe('https://example.com/mua.jpg');
  expect(booking.services[0].imageUrl).toBe('https://example.com/service.jpg');
});
