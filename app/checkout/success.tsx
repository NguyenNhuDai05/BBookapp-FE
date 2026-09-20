import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, ShieldCheck, Clock, Home, FileText } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography, Shadows } from '../../constants/theme';
import { useBookingStore } from '../../store/useBookingStore';
import { useBookingDetail } from '../../hooks/useBooking';
import * as WebBrowser from 'expo-web-browser';

export default function CheckoutSuccessScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const { data: booking, isLoading } = useBookingDetail(bookingId || '', true);
  const { draft, resetDraft } = useBookingStore();

  useEffect(() => {
    // expo-web-browser returns void here (including on web), so chaining
    // `.catch()` crashes the payment-result screen after returning from payOS.
    // A synchronous guard is enough and remains safe on Android when there is
    // no in-app browser session left to dismiss.
    try {
      WebBrowser.dismissBrowser();
    } catch {
      // The checkout result is still determined by the backend webhook/polling.
    }
  }, []);

  const handleGoHome = () => {
    resetDraft();
    router.replace('/(tabs)/explore');
  };

  const handleGoBookings = () => {
    resetDraft();
    router.replace('/(tabs)/bookings');
  };

  if (isLoading || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BrandColors.accentPink} />
          <Text style={styles.subtitle}>Đang xác nhận khoản cọc...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const travelFee = booking.travelFee;
  const totalAmount = booking.totalAmount;
  const depositAmount = booking.depositAmount;
  const remainingAmount = booking.remainingAmount;

  if (booking && booking.paymentStatus !== 4) {
    return (
      <SafeAreaView style={styles.waitingScreen}>
        <View style={styles.waitingContent}>
          <View style={styles.waitingCard}>
            <View style={styles.waitingIcon}>
              <ActivityIndicator size="large" color={BrandColors.accentPink} />
            </View>
            <Text style={styles.waitingEyebrow}>ĐANG XỬ LÝ THANH TOÁN</Text>
            <Text style={styles.waitingTitle}>Đang xác nhận tiền cọc</Text>
            <Text style={styles.waitingSubtitle}>
              payOS đang gửi kết quả thanh toán về BeautyBook. Quá trình này thường chỉ mất vài giây.
            </Text>

            <View style={styles.waitingNotice}>
              <Clock size={18} color="#A85B16" />
              <Text style={styles.waitingNoticeText}>
                Bạn có thể rời màn hình này. Trạng thái booking sẽ tự động cập nhật khi giao dịch được xác nhận.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.waitingPrimaryBtn}
              activeOpacity={0.85}
              onPress={() => router.replace(`/booking/${booking.id}`)}
            >
              <FileText size={18} color="#FFF" />
              <Text style={styles.primaryBtnText}>Xem chi tiết booking</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.waitingSecondaryBtn} onPress={handleGoHome}>
              <Text style={styles.waitingSecondaryBtnText}>Về trang chủ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.checkIconWrapper}>
            <CheckCircle size={48} color="#00C853" fill="#E8F5E9" />
          </View>
          <Text style={styles.title}>Thanh toán thành công!</Text>
          <Text style={styles.subtitle}>Mã đơn: {bookingId ? bookingId.slice(0, 8).toUpperCase() : 'Đang cập nhật'} • Đã cọc {depositAmount.toLocaleString('vi-VN')}đ</Text>
        </View>

        {/* Shield Banner */}
        <View style={styles.shieldBanner}>
          <ShieldCheck size={24} color={BrandColors.accentPink} />
          <View style={styles.shieldTextWrapper}>
            <Text style={styles.shieldTitle}>Bảo vệ số tiền cọc</Text>
            <Text style={styles.shieldText}>Khoản cọc đã được ghi nhận cho booking và sẽ được đối soát trước khi chi trả cho MUA.</Text>
          </View>
        </View>

        {/* Receipt Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin lịch hẹn</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Chuyên gia</Text>
            <Text style={styles.infoValue}>{booking.mua.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thời gian</Text>
            <Text style={styles.infoValue}>{draft.time} - {draft.date}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Địa điểm</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{draft.address}</Text>
          </View>

          <View style={styles.divider} />
          
          {booking.services.map(s => (
            <View key={s.id} style={styles.serviceRow}>
              <Text style={styles.serviceName}>{s.participantsCount}x {s.name}</Text>
              <Text style={styles.servicePrice}>{(s.price * s.participantsCount).toLocaleString('vi-VN')}đ</Text>
            </View>
          ))}
          <View style={styles.serviceRow}>
            <Text style={styles.serviceName}>Phí di chuyển</Text>
            <Text style={styles.servicePrice}>{travelFee.toLocaleString('vi-VN')}đ</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.totalValue}>{totalAmount.toLocaleString('vi-VN')}đ</Text>
          </View>
          
          <View style={styles.paidRow}>
            <Text style={styles.paidLabel}>Đã cọc ({(booking.depositRate <= 1 ? booking.depositRate * 100 : booking.depositRate).toLocaleString('vi-VN')}%)</Text>
            <Text style={styles.paidValue}>- {depositAmount.toLocaleString('vi-VN')}đ</Text>
          </View>

          <View style={styles.remainingBox}>
            <Text style={styles.remainingLabel}>Cần thanh toán sau khi hoàn thành</Text>
            <Text style={styles.remainingValue}>{remainingAmount.toLocaleString('vi-VN')}đ</Text>
          </View>
        </View>

        {/* Status Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trạng thái đơn</Text>
          <View style={styles.timerBanner}>
            <Clock size={16} color="#FF9800" />
            <Text style={styles.timerText}>Chuyên gia có 24h để xác nhận lịch này</Text>
          </View>

          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <View style={[styles.timelineLine, styles.timelineLineActive]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitleActive}>Đã thanh toán cọc</Text>
                <Text style={styles.timelineTime}>Vừa xong</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotPending]} />
              <View style={styles.timelineLine} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitlePending}>Chờ MUA xác nhận</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineLine} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Đã xác nhận</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Hoàn thành</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleGoBookings}>
          <FileText size={18} color={BrandColors.textDark} />
          <Text style={styles.secondaryBtnText}>Xem lịch sử</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleGoHome}>
          <Home size={18} color="#FFF" />
          <Text style={styles.primaryBtnText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  waitingScreen: {
    flex: 1,
    backgroundColor: BrandColors.bgPrimary,
  },
  waitingContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  waitingCard: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: BrandColors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    ...Shadows.elevated,
  },
  waitingIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.bgPink,
    marginBottom: Spacing.lg,
  },
  waitingEyebrow: {
    fontFamily: Typography.extraBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: BrandColors.accentPink,
    marginBottom: Spacing.sm,
  },
  waitingTitle: {
    fontFamily: Typography.extraBold,
    fontSize: 24,
    lineHeight: 31,
    color: BrandColors.textDark,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  waitingSubtitle: {
    fontFamily: Typography.regular,
    fontSize: 15,
    lineHeight: 22,
    color: BrandColors.textBody,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  waitingNotice: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: '#FFF8EC',
    marginBottom: Spacing.lg,
  },
  waitingNoticeText: {
    flex: 1,
    fontFamily: Typography.medium,
    fontSize: 13,
    lineHeight: 19,
    color: '#7A4A1F',
  },
  waitingPrimaryBtn: {
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: BrandColors.accentPink,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    ...Shadows.soft,
  },
  waitingSecondaryBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  waitingSecondaryBtnText: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: 40 + 20,
    paddingBottom: 100,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  checkIconWrapper: {
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Typography.bold,
    fontSize: 22,
    color: BrandColors.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  
  shieldBanner: {
    flexDirection: 'row',
    backgroundColor: BrandColors.bgPinkLight,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  shieldTextWrapper: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  shieldTitle: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: BrandColors.accentPink,
    marginBottom: 4,
  },
  shieldText: {
    fontFamily: Typography.regular,
    fontSize: 13,
    color: BrandColors.textDark,
    lineHeight: 18,
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
    borderColor: '#F5F5F5',
    borderWidth: 1,
  },
  cardTitle: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.textDark,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontFamily: Typography.semiBold,
    fontSize: 14,
    color: BrandColors.textDark,
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: Spacing.md,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  serviceName: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: BrandColors.textDark,
    flex: 1,
  },
  servicePrice: {
    fontFamily: Typography.semiBold,
    fontSize: 14,
    color: BrandColors.textDark,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: BrandColors.textDark,
  },
  totalValue: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: BrandColors.textDark,
  },
  paidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  paidLabel: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: '#00C853',
  },
  paidValue: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: '#00C853',
  },
  remainingBox: {
    backgroundColor: '#FAFAFA',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingLabel: {
    fontFamily: Typography.medium,
    fontSize: 12,
    color: BrandColors.textSecondary,
    flex: 1,
  },
  remainingValue: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.accentPink,
  },

  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  timerText: {
    fontFamily: Typography.medium,
    fontSize: 13,
    color: '#E65100',
    marginLeft: 8,
  },
  
  timeline: {
    paddingLeft: Spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    marginRight: Spacing.md,
    marginTop: 4,
    zIndex: 2,
  },
  timelineDotActive: {
    backgroundColor: BrandColors.accentPink,
  },
  timelineDotPending: {
    backgroundColor: '#FF9800',
    borderWidth: 2,
    borderColor: '#FFF3E0',
  },
  timelineLine: {
    position: 'absolute',
    top: 16,
    bottom: -Spacing.xl,
    left: 5,
    width: 2,
    backgroundColor: '#E0E0E0',
    zIndex: 1,
  },
  timelineLineActive: {
    backgroundColor: BrandColors.accentPink,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: '#BDBDBD',
  },
  timelineTitleActive: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: BrandColors.textDark,
    marginBottom: 4,
  },
  timelineTitlePending: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: '#FF9800',
  },
  timelineTime: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: BrandColors.textSecondary,
  },

  bottomPadding: { height: 20 },
  
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: BrandColors.textDark,
  },
  primaryBtn: {
    flex: 1,
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
    fontSize: 14,
    color: '#FFF',
  },
});
