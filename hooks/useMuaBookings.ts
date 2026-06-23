import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { muaBookingService } from '../services/muaBookingService';
import type { BookingStatus } from '../types/booking';

export const usePendingBookings = (muaId: string) => {
  return useQuery({
    queryKey: ['mua-bookings', muaId, 'PENDING'],
    queryFn: () => muaBookingService.getPendingBookings(muaId),
    staleTime: 60 * 1000, // 1 min
  });
};

export const useAllBookings = (muaId: string) => {
  return useQuery({
    queryKey: ['mua-bookings', muaId, 'ALL'],
    queryFn: () => muaBookingService.getAllBookings(muaId),
    staleTime: 60 * 1000,
  });
};

export const useUpdateBookingStatus = (muaId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, status, reason }: { bookingId: string; status: BookingStatus; reason?: string }) => {
      return muaBookingService.updateBookingStatus(bookingId, status, reason);
    },
    onSuccess: (data, variables) => {
      // Invalidate both PENDING and ALL lists to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['mua-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingDetail', variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['mua-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['mua-earnings'] });
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });

      // Nếu MUA chấp nhận đơn -> Tự động thêm vào Calendar & Hẹn giờ Push Notification
      if (variables.status === 'CONFIRMED' && data) {
        import('../services/NotificationService').then(({ NotificationService }) => {
          NotificationService.requestPermissions().then((granted) => {
            if (granted) {
              const servicesStr = data.services.map(s => s.name).join(', ');
              NotificationService.scheduleBookingReminders(
                data.customer.name,
                data.date,
                data.time,
                servicesStr
              );
            }
          });
        });
      }
    },
  });
};

export const useEarningsSnapshot = (muaId: string) => {
  return useQuery({
    queryKey: ['mua-earnings', muaId],
    queryFn: () => muaBookingService.getEarningsSnapshot(muaId),
    staleTime: 5 * 60 * 1000, // 5 min
  });
};
