import React from 'react';
import { Text } from 'react-native';
import { AppModal } from '../ui/AppModal';
import { useBookingDetail, useDemoBookingAction } from '../../hooks/useBooking';
import { useAuthStore } from '../../store/useAuthStore';
import type { BookingPaymentDto } from '../../types/booking';
import { canConfirmSamplePayment, REVIEW_FINANCIAL_NOTICE } from '../../utils/playReview';
import { getApiError } from '../../services/api';

export function SamplePaymentConfirmation({ payment, onClose, onSuccess }: { payment: BookingPaymentDto; onClose: () => void; onSuccess: () => void }) {
  const user = useAuthStore(state => state.user);
  const query = useBookingDetail(payment.bookingId);
  const action = useDemoBookingAction();
  const allowed = canConfirmSamplePayment(user, query.data, payment) && !query.isFetching;
  return <AppModal visible title="Xác nhận thanh toán mẫu" description={REVIEW_FINANCIAL_NOTICE} variant="confirm" onClose={onClose}
    loading={action.isPending || query.isFetching}
    primaryAction={allowed ? { label: 'Xác nhận thanh toán', loading: action.isPending, onPress: async () => {
      if (!allowed || action.isPending) return;
      try { await action.mutateAsync({ bookingId: payment.bookingId, action: 'paymentSucceed' }); onSuccess(); } catch { /* Error is presented below; settled hook reloads capabilities. */ }
    } } : undefined}
    secondaryAction={{ label: 'Quay lại', onPress: onClose }}>
    <Text>{payment.amount.toLocaleString('vi-VN')}đ</Text>
    {action.isError || query.isError ? <Text accessibilityRole="alert">{getApiError(action.error || query.error).message}</Text> : !allowed && !query.isFetching ? <Text>Thanh toán mẫu hiện không khả dụng. Vui lòng kiểm tra lại lịch đặt.</Text> : null}
  </AppModal>;
}
