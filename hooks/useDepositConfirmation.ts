import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import { useAuthStore } from '../store/useAuthStore';
import { depositConfirmationState, hasRecordedDeposit } from '../utils/depositConfirmation';

export function useDepositConfirmation(bookingId: string) {
  const client = useQueryClient();
  const focused = useIsFocused();
  const review = useAuthStore(state => state.user?.isDemoAccount === true);
  const [active, setActive] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const [expiredAttempt, setExpiredAttempt] = useState<{ id: string; attempt: number } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const timedOut = expiredAttempt?.id === bookingId && expiredAttempt.attempt === attempt;
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
    const timer = setTimeout(() => setExpiredAttempt({ id: bookingId, attempt }), 90_000);
    return () => clearTimeout(timer);
  }, [bookingId, attempt]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => listener.remove();
  }, []);
  const query = useQuery({
    queryKey: ['depositConfirmation', bookingId],
    enabled: !!bookingId && focused && active && !timedOut,
    retry: false,
    queryFn: async () => {
      const existing = await bookingService.getBookingDetail(bookingId);
      const result = review || hasRecordedDeposit(existing) ? existing : await bookingService.reconcileDeposit(bookingId);
      client.setQueryData(['bookingDetail', bookingId], result);
      if (depositConfirmationState(result) !== 'pending') {
        void client.invalidateQueries({ queryKey: ['userBookings'] });
        void client.invalidateQueries({ queryKey: ['mua-bookings'] });
      }
      return result;
    },
    refetchInterval: query => !focused || !active || timedOut || query.state.error || Date.now() - startedAt.current >= 90_000
      || (query.state.data && depositConfirmationState(query.state.data) !== 'pending') ? false : 5000,
  });
  const { refetch } = query;
  useEffect(() => { if (bookingId && focused && active && !timedOut) void refetch(); }, [bookingId, focused, active, timedOut, refetch]);
  const retry = useCallback(() => {
    startedAt.current = Date.now();
    setExpiredAttempt(null);
    setAttempt(value => value + 1);
    void refetch();
  }, [refetch]);
  return { ...query, timedOut, retry };
}
