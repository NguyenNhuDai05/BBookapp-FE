import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, CheckCircle, Home, FileText, RefreshCw } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../../constants/theme';
import { useBookingDetail } from '../../../hooks/useBooking';
import { formatVnd, getRefundPresentation } from '../../../utils/bookingStatus';
import { PaymentStatus } from '../../../types/booking';

export default function CancelSuccessScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading, isError, refetch, isFetching } = useBookingDetail(id);
  const isCancelled = booking?.status === 'CANCELLED';
  const refundPresentation = isCancelled
    ? getRefundPresentation(booking.paymentStatus, booking.refund, booking.cancellationRefundAmount)
    : undefined;
  const hasRefundAmount = (booking?.cancellationRefundAmount ?? booking?.refund?.amount ?? 0) > 0;

  if (isLoading && !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={BrandColors.accentPink} />
          <Text style={styles.stateText}>Đang xác minh kết quả hủy booking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError && !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.stateContainer}>
          <AlertTriangle size={52} color="#E65100" />
          <Text style={styles.stateTitle}>Chưa thể xác minh kết quả hủy booking</Text>
          <Text style={styles.stateText}>Vui lòng kiểm tra kết nối và thử lại.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()} disabled={isFetching}>
            {isFetching ? <ActivityIndicator color="#FFF" /> : <RefreshCw size={18} color="#FFF" />}
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!isCancelled) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.stateContainer}>
          <AlertTriangle size={52} color="#E65100" />
          <Text style={styles.stateTitle}>Chưa xác nhận booking đã được hủy</Text>
          <Text style={styles.stateText}>Trạng thái hiện tại chưa phải đã hủy. Hãy tải lại để nhận trạng thái mới nhất.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()} disabled={isFetching}>
            {isFetching ? <ActivityIndicator color="#FFF" /> : <RefreshCw size={18} color="#FFF" />}
            <Text style={styles.retryText}>Tải lại trạng thái</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <View style={styles.iconWrapper}>
          <CheckCircle size={64} color="#00C853" fill="#E8F5E9" />
        </View>
        <Text style={styles.title}>Hủy đơn thành công</Text>
        
        <Text style={styles.subtitle}>
          Đơn đặt lịch <Text style={styles.bold}>{booking.id}</Text> với chuyên gia <Text style={styles.bold}>{booking.mua.name}</Text> đã được hủy.
        </Text>

        {refundPresentation && (
          <View style={styles.refundBox}>
            <Text style={styles.refundTitle}>{refundPresentation.label}</Text>
            <Text style={styles.refundRow}>Tiền cọc: <Text style={styles.bold}>{formatVnd(booking.depositAmount)}</Text></Text>
            {hasRefundAmount && booking.cancellationRefundPercentage !== undefined && (
              <Text style={styles.refundRow}>Mức hoàn: <Text style={styles.bold}>{booking.cancellationRefundPercentage}%</Text></Text>
            )}
            {hasRefundAmount && (
              <Text style={styles.refundRow}>
                {booking.refund?.status === 'COMPLETED' || booking.paymentStatus === PaymentStatus.REFUNDED || booking.paymentStatus === PaymentStatus.PARTIALLY_REFUNDED ? 'Số tiền đã hoàn' : 'Hoàn dự kiến'}:{' '}
                <Text style={styles.bold}>{formatVnd(booking.refund?.amount ?? booking.cancellationRefundAmount ?? 0)}</Text>
              </Text>
            )}
            <Text style={styles.refundText}>{refundPresentation.description}</Text>
          </View>
        )}

        {booking.refund?.status === 'AWAITING_DESTINATION' && (
          <TouchableOpacity style={styles.retryButton} onPress={() => router.push({ pathname: '/refund-destination', params: { refundId: booking.refund!.refundId, bookingId: booking.id } } as any)}>
            <Text style={styles.retryText}>Thêm tài khoản nhận tiền</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/explore')}>
          <Home size={18} color="#FFF" />
          <Text style={styles.primaryBtnText}>Về trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)/bookings')}>
          <FileText size={18} color={BrandColors.textDark} />
          <Text style={styles.secondaryBtnText}>Xem lịch sử booking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  stateTitle: {
    fontFamily: Typography.bold,
    fontSize: 19,
    color: BrandColors.textDark,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  stateText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  retryButton: {
    minWidth: 140,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BrandColors.accentPink,
    borderRadius: Radius.full,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  retryText: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: '#FFF',
  },
  iconWrapper: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Typography.bold,
    fontSize: 22,
    color: BrandColors.textDark,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontFamily: Typography.regular,
    fontSize: 15,
    color: BrandColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  bold: {
    fontFamily: Typography.bold,
    color: BrandColors.textDark,
  },
  
  refundBox: {
    backgroundColor: BrandColors.bgPinkLight,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    width: '100%',
  },
  refundTitle: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: BrandColors.accentPink,
    marginBottom: 8,
  },
  refundText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: BrandColors.textDark,
    lineHeight: 20,
  },
  refundRow: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: BrandColors.textDark,
    marginBottom: 6,
  },

  footer: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: BrandColors.accentPink,
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: '#FFF',
  },
  secondaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: BrandColors.textDark,
  },
});
