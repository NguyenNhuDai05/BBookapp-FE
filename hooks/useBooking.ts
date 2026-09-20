import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import { CreateBookingRequest, CancelBookingRequest, ReviewCreateRequest } from '../types/booking';
import { getApiError } from '../services/api';

const invalidateBookingState = (queryClient: ReturnType<typeof useQueryClient>, bookingId?: string) => {
  queryClient.invalidateQueries({ queryKey: ['userBookings'] });
  queryClient.invalidateQueries({ queryKey: ['mua-bookings'] });
  if (bookingId) queryClient.invalidateQueries({ queryKey: ['bookingDetail', bookingId] });
};

export const useAvailableTimeSlots = (muaId: string, date: string, durationMinutes: number) => {
  return useQuery({
    queryKey: ['timeSlots', muaId, date, durationMinutes],
    queryFn: () => bookingService.getAvailableTimeSlots(muaId, date, durationMinutes),
    enabled: !!muaId && !!date && durationMinutes > 0,
    retry: false,
  });
};

export const useUserBookings = () => {
  return useQuery({
    queryKey: ['userBookings'],
    queryFn: () => bookingService.getUserBookings(),
  });
};

export const useBookingDetail = (bookingId: string, pollUntilPaid = false) => {
  return useQuery({
    queryKey: ['bookingDetail', bookingId],
    queryFn: () => bookingService.getBookingDetail(bookingId),
    enabled: !!bookingId,
    refetchInterval: pollUntilPaid
      ? query => query.state.data?.paymentStatus === 4 ? false : 2000
      : false,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: CreateBookingRequest) => bookingService.createBooking(request),
    onSuccess: () => {
      // Invalidate bookings list so it refreshes
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
};

export const usePayBookingDeposit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => bookingService.createDepositPayment(bookingId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingDetail', data.bookingId] });
    },
  });
};

export const useDisputeBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      bookingService.disputeBooking(bookingId, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingDetail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['mua-bookings'] });
    },
    onError: (error, request) => {
      if (getApiError(error).status === 409) invalidateBookingState(queryClient, request.bookingId);
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    retry: false,
    mutationFn: async (request: CancelBookingRequest) => {
      try {
        return await bookingService.cancelBooking(request);
      } catch (error) {
        const apiError = getApiError(error);
        if (apiError.status !== 409 && !apiError.isNetworkError) throw error;

        try {
          const authoritativeBooking = await bookingService.getBookingDetail(request.bookingId);
          if (authoritativeBooking.status === 'CANCELLED') return authoritativeBooking;
        } catch (reconciliationError) {
          if (apiError.isNetworkError && getApiError(reconciliationError).isNetworkError) {
            throw new Error('Chưa thể xác minh kết quả hủy booking. Vui lòng kiểm tra lại khi có kết nối.');
          }
        }

        throw error;
      }
    },
    onSuccess: (data) => {
      // Make the mutation response immediately authoritative for the success screen.
      queryClient.setQueryData(['bookingDetail', data.id], data);
      void queryClient.invalidateQueries({ queryKey: ['bookingDetail', data.id] });
      void queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      void queryClient.invalidateQueries({ queryKey: ['mua-bookings'] });
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
    onError: (error, bookingId) => {
      if (getApiError(error).status === 409) invalidateBookingState(queryClient, bookingId);
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
