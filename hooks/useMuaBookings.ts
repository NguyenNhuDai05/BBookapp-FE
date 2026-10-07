import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { muaBookingService } from '../services/muaBookingService';
import type { BookingStatus } from '../types/booking';
import { getApiError } from '../services/api';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export const usePendingBookings = (muaId: string) => {
  return useQuery({
    queryKey: ['mua-bookings', muaId, 'PENDING'],
    queryFn: () => muaBookingService.getPendingBookings(muaId),
    staleTime: 60 * 1000, // 1 min
  });
};

export const useAllBookings = (muaId: string) => {
  const focused = useIsFocused();
  const query = useQuery({
    queryKey: ['mua-bookings', muaId, 'ALL'],
    queryFn: () => muaBookingService.getAllBookings(muaId),
    staleTime: 60 * 1000,
    refetchInterval: focused ? 15000 : false,
  });
  const { refetch } = query;
  useFocusEffect(useCallback(() => { void refetch(); }, [refetch]));
  return query;
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

    },
    onError: (error, variables) => {
      if (getApiError(error).status !== 409) return;
      queryClient.invalidateQueries({ queryKey: ['mua-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingDetail', variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
    },
  });
};

export const useEarningsSnapshot = (muaId: string) => {
  return useQuery({
    queryKey: ['mua-earnings', muaId],
    queryFn: () => muaBookingService.getEarningsSnapshot(),
    staleTime: 0, // Refresh financial state when returning to the screen.
    retry: false,
  });
};
