import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';
import type { BookingDto } from '../../types/booking';

export const BOOKING_CONFIRMATION_POLICY = 'Lịch chỉ được xác nhận khi MUA đồng ý. Nếu MUA chưa xác nhận trước giờ hẹn, booking sẽ tự hủy và bạn được hoàn toàn bộ tiền cọc. Thời gian nhận lại tiền phụ thuộc tiến trình hoàn tiền.';

export function BookingConfirmationNotice({ booking, viewAs = 'customer' }: { booking: BookingDto; viewAs?: 'customer' | 'mua' }) {
  const timedOut = booking.status === 'CANCELLED' && booking.cancellationPolicyRule === 'MUA_CONFIRMATION_TIMEOUT_FULL';
  if (!timedOut && booking.status !== 'PENDING_CONFIRMATION') return null;

  const [year, month, day] = booking.date.split('-');
  const deadline = booking.muaConfirmationDeadline
    ? new Date(booking.muaConfirmationDeadline).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    : `${booking.time} ngày ${day}/${month}/${year}`;

  return <View style={styles.card}>
    <Text style={styles.title}>{timedOut ? 'Tự hủy do MUA chưa xác nhận' : 'Hạn MUA xác nhận lịch'}</Text>
    <Text style={styles.body}>{timedOut
      ? viewAs === 'mua'
        ? 'Booking đã tự hủy vì bạn chưa xác nhận trước giờ hẹn. Đã tạo hồ sơ hoàn toàn bộ tiền cọc cho khách.'
        : 'MUA chưa xác nhận trước giờ hẹn nên booking đã tự hủy. Xem tiến trình hoàn toàn bộ tiền cọc trong chi tiết hoàn tiền.'
      : `${viewAs === 'mua' ? 'Bạn cần nhận hoặc từ chối' : 'MUA cần xác nhận'} trước ${deadline} (giờ Việt Nam). Nếu chưa được xác nhận khi đến giờ hẹn, booking sẽ tự hủy và tạo hồ sơ hoàn toàn bộ tiền cọc cho khách.`}</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { padding: Spacing.md, marginVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: '#FFF8E1' },
  title: { fontFamily: Typography.semiBold, color: BrandColors.textDark, marginBottom: Spacing.xs },
  body: { fontFamily: Typography.regular, color: BrandColors.textSecondary, lineHeight: 21 },
});
