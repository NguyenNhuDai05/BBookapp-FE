import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useDemoBookingAction } from '../../hooks/useBooking';
import { hasDemoAction } from '../../utils/playReview';
import { getApiError } from '../../services/api';
import { AppAlert } from '../ui/dialogStore';
import type { BookingDto } from '../../types/booking';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';

export function ReviewCounterpartActions({ booking }: { booking: BookingDto }) {
  const user = useAuthStore(state => state.user);
  const mutation = useDemoBookingAction();
  const actions = (['counterpartAccept', 'counterpartReject'] as const).filter(action => hasDemoAction(user, booking, action));
  if (!actions.length) return null;
  return <View style={s.card}><Text style={s.title}>Phản hồi từ MUA mẫu</Text><Text style={s.text}>Để kiểm tra quy trình đặt lịch, bạn có thể mô phỏng phản hồi của MUA mẫu.</Text>
    {actions.map(action => <TouchableOpacity key={action} style={s.button} disabled={mutation.isPending} onPress={async () => {
      if (mutation.isPending) return;
      try { await mutation.mutateAsync({ bookingId: booking.id, action }); } catch (error) { AppAlert.alert('Không thể tiếp tục', getApiError(error).message); }
    }}><Text style={s.buttonText}>{action === 'counterpartAccept' ? 'MUA chấp nhận' : 'MUA từ chối'}</Text></TouchableOpacity>)}
  </View>;
}
const s = StyleSheet.create({ card: { padding: Spacing.lg, marginBottom: Spacing.md, backgroundColor: '#FFF', borderRadius: Radius.lg }, title: { fontFamily: Typography.semiBold, color: BrandColors.textDark, fontSize: 16, marginBottom: 8 }, text: { fontFamily: Typography.regular, color: BrandColors.textSecondary, lineHeight: 20 }, button: { padding: Spacing.md, backgroundColor: BrandColors.bgPinkLight, borderRadius: Radius.md, marginTop: Spacing.sm }, buttonText: { color: BrandColors.accentPink, fontFamily: Typography.semiBold } });
