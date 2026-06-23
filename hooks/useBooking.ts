import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import { CreateBookingRequest, CancelBookingRequest, ReviewCreateRequest } from '../types/booking';

export const useAvailableTimeSlots = (muaId: string, date: string) => {
  return useQuery({
    queryKey: ['timeSlots', muaId, date],
    queryFn: () => bookingService.getAvailableTimeSlots(muaId, date),
    enabled: !!muaId && !!date,
  });
};

export const useUserBookings = () => {
  return useQuery({
    queryKey: ['userBookings'],
    queryFn: () => bookingService.getUserBookings(),
  });
};

export const useBookingDetail = (bookingId: string) => {
  return useQuery({
    queryKey: ['bookingDetail', bookingId],
    queryFn: () => bookingService.getBookingDetail(bookingId),
    enabled: !!bookingId,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: CreateBookingRequest) => bookingService.createBooking(request),
    onSuccess: () => {
      // Invalidate bookings list so it refreshes
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: CancelBookingRequest) => bookingService.cancelBooking(request),
    onSuccess: (data) => {
      // Refresh list and detail
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingDetail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['mua-bookings'] });
    },
  });
};

export const useConfirmBookingCompletion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (bookingId: string) => bookingService.confirmBookingCompletion(bookingId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingDetail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['mua-bookings'] });
    },
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: ReviewCreateRequest) => bookingService.submitReview(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingDetail', variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['mua'] });
    },
  });
};
