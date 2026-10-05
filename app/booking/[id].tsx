import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AppAlert as appDialog } from '../../components/ui/dialogStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowLeft, MessageCircle, Calendar, Clock, Copy, RotateCcw } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography, Shadows } from '../../constants/theme';
import { useBookingDetail, useConfirmBookingCompletion, usePayBookingDeposit } from '../../hooks/useBooking';
import { useAuthStore } from '../../store/useAuthStore';
import { REVIEW_FINANCIAL_NOTICE } from '../../utils/playReview';
import { ReviewNotice } from '../../components/ReviewNotice';
import { ReviewCounterpartActions } from '../../components/booking/ReviewCounterpartActions';
import { SamplePaymentConfirmation } from '../../components/booking/SamplePaymentConfirmation';
import type { BookingPaymentDto } from '../../types/booking';
import { getApiError } from '../../services/api';
import { ComplaintEntry } from '../../components/booking/ComplaintEntry';
import { BookingStatus } from '../../types/booking';
import { BookingTimeline } from '../../components/BookingTimeline';
import { openDepositCheckout } from '../../services/bookingPaymentFlow';
import { BookingLocationCard } from '../../components/booking/BookingLocationCard';

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán cọc', color: '#FF9800', bg: '#FFF3E0' },
  PENDING_CONFIRMATION: { label: 'Đang chờ MUA xác nhận', color: '#FF9800', bg: '#FFF3E0' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#2196F3', bg: '#E3F2FD' },
  IN_PROGRESS: { label: 'Đang thực hiện', color: '#9C27B0', bg: '#F3E5F5' },
  COMPLETED: { label: 'Hoàn thành', color: '#4CAF50', bg: '#E8F5E9' },
  WAITING_CUSTOMER: { label: 'Chờ khách xác nhận', color: '#00BCD4', bg: '#E0F7FA' },
  CANCELLED: { label: 'Đã hủy', color: '#F44336', bg: '#FFEBEE' },
  REJECTED: { label: 'Từ chối', color: '#F44336', bg: '#FFEBEE' },
  DISPUTED: { label: 'Đang chờ quản trị viên xử lý', color: '#F44336', bg: '#FFEBEE' },
  AUTO_COMPLETED: { label: 'Tự động hoàn thành', color: '#4CAF50', bg: '#E8F5E9' },
  UNKNOWN: { label: 'Trạng thái không xác định', color: '#616161', bg: '#F5F5F5' },
};

export default function BookingDetailScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const [samplePayment, setSamplePayment] = useState<BookingPaymentDto | null>(null);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading, error } = useBookingDetail(id);
  const { mutateAsync: payDeposit, isPending: isPaying } = usePayBookingDeposit();
  const { mutate: confirmCompletion, isPending: isConfirming } = useConfirmBookingCompletion();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={BrandColors.accentPink} />
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Không tìm thấy chi tiết lịch đặt.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusInfo = STATUS_CONFIG[booking.status];

  const handlePayDeposit = async () => {
    try {
      const payment = await payDeposit(booking.id);
      if (await openDepositCheckout(payment, user?.isDemoAccount === true) === 'sample') { setSamplePayment(payment); return; }
      router.push({ pathname: '/checkout/success', params: { bookingId: booking.id } });
    } catch (err: any) {
      appDialog.alert('Không thể thanh toán cọc', getApiError(err).message);
    }
  };


  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={BrandColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết lịch đặt</Text>
        <View style={styles.headerRight} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>


        <BookingTimeline booking={booking} />
        {user?.isDemoAccount ? <ReviewNotice message={REVIEW_FINANCIAL_NOTICE} title={booking.refund ? 'Hoàn tiền mẫu' : 'Giao dịch mẫu'} /> : null}
        <ReviewCounterpartActions booking={booking}/>

        <View style={[styles.statusBanner, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.statusBannerText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>

        {booking.refund ? (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/refund/[id]', params: { id: booking.refund!.refundId } })}
          >
            <View style={styles.refundLinkRow}>
              <RotateCcw size={22} color={BrandColors.accentPink} />
              <View style={styles.refundLinkContent}>
                <Text style={styles.sectionTitle}>Theo dõi hoàn tiền</Text>
                <Text style={styles.infoText}>{booking.refund.amount.toLocaleString('vi-VN')}đ</Text>
              </View>
              <Text style={styles.refundLinkAction}>Xem chi tiết</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Booking ID & MUA */}
        <View style={styles.card}>
          <View style={styles.idRow}>
            <Text style={styles.idLabel}>Mã đơn: <Text style={styles.idValue}>{booking.id}</Text></Text>
            <TouchableOpacity style={styles.copyBtn}>
              <Copy size={14} color={BrandColors.textSecondary} />
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.muaRow}>
            <Image source={{ uri: booking.mua.avatarUrl }} style={styles.muaAvatar} />
            <View style={styles.muaInfo}>
              <Text style={styles.muaName}>{booking.mua.name}</Text>
              <Text style={styles.muaRole}>Chuyên gia Makeup</Text>
            </View>
            <TouchableOpacity style={styles.chatBtn}>
              <MessageCircle size={18} color={BrandColors.accentPink} />
              <Text style={styles.chatText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Schedule Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thời gian & Địa điểm</Text>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Calendar size={18} color={BrandColors.accentPink} />
            <Text style={styles.infoText}>Ngày: {booking.date}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Clock size={18} color={BrandColors.accentPink} />
            <Text style={styles.infoText}>Giờ hẹn: {booking.time}</Text>
          </View>
          <View style={styles.divider} />
          <BookingLocationCard key={booking.id} booking={booking} authorized={!!user?.id && (user.id === booking.customer.id || user.id === booking.mua.id)} />
        </View>

        {/* Services */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dịch vụ đã đặt</Text>
          <View style={styles.divider} />
          {booking.services.map((s) => (
            <View key={s.id} style={styles.serviceItem}>
              <View style={styles.serviceItemLeft}>
                <Image
                  source={{ uri: s.imageUrl || 'https://images.unsplash.com/photo-1512496015851-a1c8ce9015c3?w=200&q=80' }}
                  style={styles.serviceImage}
                />
                <Text style={styles.serviceName} numberOfLines={2}>
                  {s.name} <Text style={styles.serviceQty}>x{s.participantsCount}</Text>
                </Text>
              </View>
              <Text style={styles.servicePriceHighlight}>
                {(s.price * s.participantsCount).toLocaleString('vi-VN')}đ
              </Text>
            </View>
          ))}

        </View>

        {/* Payment */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
          <View style={styles.divider} />
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Tổng thanh toán</Text>
            <Text style={styles.paymentValueTotal}>{booking.totalAmount.toLocaleString('vi-VN')}đ</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>{user?.isDemoAccount ? 'Khoản cọc mẫu' : `Đã cọc qua ${booking.paymentMethod}`}</Text>
            <Text style={styles.paymentValuePaid}>- {booking.depositAmount.toLocaleString('vi-VN')}đ</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Cần thanh toán sau</Text>
            <Text style={styles.paymentValueRemaining}>{booking.remainingAmount.toLocaleString('vi-VN')}đ</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Phí BeautyBook</Text>
            <Text style={styles.paymentValueTotal}>{booking.platformFeeAmount.toLocaleString('vi-VN')}đ</Text>
          </View>
        </View>
        {booking.status === 'WAITING_CUSTOMER' && !booking.hasOpenComplaint && <View style={styles.card}><Text style={{fontFamily:Typography.regular,color:BrandColors.textDark,lineHeight:22}}>Bạn có 24 giờ sau khi MUA gửi hoàn thành để xác nhận hoặc báo vấn đề.{booking.customerConfirmationDeadline ? ' Hạn phản hồi: '+new Date(booking.customerConfirmationDeadline).toLocaleString('vi-VN')+'.' : ''} Sau hạn này hệ thống có thể tự hoàn thành và mở khoản thu nhập để MUA yêu cầu chi trả nếu không có vấn đề chưa xử lý.</Text></View>}
        <ComplaintEntry bookingId={booking.id} customer open={booking.hasOpenComplaint} />
        {/* Actions for COMPLETED or CANCELLED */}
        {(booking.status === 'COMPLETED' || booking.status === 'AUTO_COMPLETED') && (
          <View style={[styles.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm }]}>
            <TouchableOpacity
              style={[styles.reviewBtn, booking.isReviewed && styles.reviewedBtn]}
              disabled={booking.isReviewed}
              onPress={() => { /* Navigate to review screen if needed */ }}
            >
              <Text style={[styles.reviewBtnText, booking.isReviewed && styles.reviewedBtnText]}>
                {booking.isReviewed ? 'Đã đánh giá' : 'Đánh giá'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rebookBtn}
              onPress={() => router.push({ pathname: '/mua-detail', params: { id: booking.mua.id, tab: 'Dịch vụ' } })}
            >
              <Text style={styles.rebookBtnText}>Đặt lại</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      {samplePayment ? <SamplePaymentConfirmation payment={samplePayment} onClose={() => setSamplePayment(null)} onSuccess={() => setSamplePayment(null)} /> : null}

      {/* Cancel Action */}
      {booking.status === 'PENDING_PAYMENT' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handlePayDeposit} disabled={isPaying}>
            <Text style={styles.actionBtnText}>{isPaying ? 'Đang thanh toán...' : 'Thanh toán cọc'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {booking.status === 'WAITING_CUSTOMER' && !booking.hasOpenComplaint && (
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.cancelBtnFlex} onPress={() => router.push(`/booking/${booking.id}/complaint`)}><Text style={styles.cancelBtnText}>Khiếu nại</Text></TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtnFlex} disabled={isConfirming} onPress={() => appDialog.alert('Xác nhận dịch vụ hoàn thành', 'Chỉ xác nhận khi dịch vụ đã hoàn thành. Khoản thu nhập của MUA sẽ được mở để yêu cầu chi trả. Nếu có vấn đề, hãy chọn Khiếu nại trước khi xác nhận; bạn vẫn có thể liên hệ hỗ trợ sau đó.', [{ text: 'Quay lại', style: 'cancel' }, { text: 'Xác nhận hoàn thành', onPress: () => confirmCompletion(booking.id) }])}><Text style={styles.actionBtnText}>Xác nhận hoàn thành</Text></TouchableOpacity>
        </View>
      )}
      {(booking.status === 'PENDING_CONFIRMATION' || booking.status === 'CONFIRMED') && !booking.hasOpenComplaint && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.push(`/booking/${booking.id}/cancel`)}
          >
            <Text style={styles.cancelBtnText}>Hủy đơn đặt lịch</Text>
          </TouchableOpacity>
        </View>
      )}
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
  },
errorText: { fontFamily: Typography.medium, color: BrandColors.textSecondary, marginBottom: Spacing.lg },
backBtn: { padding: Spacing.md, backgroundColor: BrandColors.bgPinkLight, borderRadius: Radius.md },
backBtnText: { color: BrandColors.accentPink, fontFamily: Typography.bold },
header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFF',
  },
headerBtn: { padding: Spacing.xs },
headerTitle: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.textDark,
  },
headerRight: { width: 32 },
scrollContent: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
statusBanner: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
statusBannerText: {
    fontFamily: Typography.bold,
    fontSize: 16,
  },
card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...Shadows.card,
  },
idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
idLabel: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
idValue: {
    fontFamily: Typography.bold,
    color: BrandColors.textDark,
  },
copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
copyText: {
    fontFamily: Typography.medium,
    fontSize: 12,
    color: BrandColors.textSecondary,
  },
divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: Spacing.md,
},
refundLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
refundLinkContent: { flex: 1 },
refundLinkAction: { color: BrandColors.accentPink, fontFamily: Typography.bold, fontSize: 13 },
muaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
muaAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.md,
  },
muaInfo: {
    flex: 1,
  },
muaName: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: BrandColors.textDark,
  },
muaRole: {
    fontFamily: Typography.regular,
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: BrandColors.accentPink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
chatText: {
    fontFamily: Typography.semiBold,
    fontSize: 13,
    color: BrandColors.accentPink,
  },
sectionTitle: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.textDark,
    marginBottom: Spacing.sm,
  },
infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
infoText: {
    flex: 1,
    fontFamily: Typography.medium,
    fontSize: 15,
    color: BrandColors.textDark,
    lineHeight: 22,
  },
addressBlock: { flex: 1 },
locationType: {
    fontFamily: Typography.semiBold,
    fontSize: 13,
    color: BrandColors.accentPink,
    marginBottom: 2,
  },
noteText: {
    flex: 1,
    fontFamily: Typography.regular,
    fontSize: 15,
    color: BrandColors.textDark,
    fontStyle: 'italic',
  },
serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
serviceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: Spacing.sm,
  },
serviceImage: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    marginRight: Spacing.sm,
  },
serviceName: {
    fontFamily: Typography.semiBold,
    fontSize: 15,
    color: BrandColors.textDark,
    flexShrink: 1,
  },
serviceQty: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: BrandColors.accentPink,
  },
servicePriceHighlight: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.accentPink,
  },
paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
paymentLabel: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
paymentValueTotal: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: BrandColors.textDark,
  },
paymentValuePaid: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: '#00C853',
  },
paymentValueRemaining: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: BrandColors.accentPink,
  },
footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
cancelBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F44336',
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
cancelBtnText: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: '#F44336',
  },
actionBtnText: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: '#FFF',
  },
primaryBtn: { backgroundColor: BrandColors.accentPink, paddingVertical: 14, borderRadius: Radius.full, alignItems: 'center' },
footerRow: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: Spacing.md, flexDirection: 'row', gap: Spacing.sm, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
cancelBtnFlex: { flex: 1, borderWidth: 1, borderColor: '#F44336', paddingVertical: 14, borderRadius: Radius.full, alignItems: 'center' },
primaryBtnFlex: { flex: 1, backgroundColor: BrandColors.accentPink, paddingVertical: 14, borderRadius: Radius.full, alignItems: 'center' },
disputeInput: { minHeight: 90, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, textAlignVertical: 'top' },
reviewBtn: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: BrandColors.accentPink,
    paddingVertical: 12,
    borderRadius: Radius.full,
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
reviewedBtn: {
    borderColor: '#BDBDBD',
    backgroundColor: '#F5F5F5',
  },
reviewBtnText: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: BrandColors.accentPink,
  },
reviewedBtnText: {
    color: '#9E9E9E',
  },
rebookBtn: {
    flex: 1,
    backgroundColor: BrandColors.accentPink,
    paddingVertical: 12,
    borderRadius: Radius.full,
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
rebookBtnText: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: '#FFF',
  }
});
