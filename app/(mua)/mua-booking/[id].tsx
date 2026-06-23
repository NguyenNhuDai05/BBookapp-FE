import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Clock, Calendar as CalendarIcon, Phone, FileText, CheckCircle, XCircle } from 'lucide-react-native';
import { BrandColors, Spacing, Typography, Radius } from '../../../constants/theme';
import { useBookingDetail } from '../../../hooks/useBooking';
import { useUpdateBookingStatus } from '../../../hooks/useMuaBookings';
import { BookingTimeline } from '../../../components/BookingTimeline';

export default function MuaBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const { data: booking, isLoading, isError } = useBookingDetail(id);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateBookingStatus(booking?.mua.id || 'me');
  
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={BrandColors.accentRose} />
      </SafeAreaView>
    );
  }

  if (isError || !booking) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Không thể tải chi tiết lịch đặt</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(mua)/bookings')}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleAccept = () => {
    updateStatus({ bookingId: booking.id, status: 'CONFIRMED' });
  };

  const handleReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    if (!rejectReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do từ chối');
      return;
    }
    updateStatus({ bookingId: booking.id, status: 'REJECTED', reason: rejectReason });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return BrandColors.statusPending;
      case 'CONFIRMED': return BrandColors.statusConfirmed;
      case 'IN_PROGRESS': return BrandColors.statusCompleted;
      case 'WAITING_CUSTOMER': return '#00BCD4'; // Cyan
      case 'COMPLETED': return BrandColors.statusCompleted;
      case 'CANCELLED': 
      case 'REJECTED': return BrandColors.statusCancelled;
      default: return BrandColors.textMuted;
    }
  };

  const statusLabel = {
    'PENDING': 'Chờ xác nhận',
    'CONFIRMED': 'Đã xác nhận',
    'IN_PROGRESS': 'Đang thực hiện',
    'WAITING_CUSTOMER': 'Chờ khách xác nhận',
    'COMPLETED': 'Hoàn thành',
    'CANCELLED': 'Khách đã hủy',
    'REJECTED': 'Đã từ chối'
  }[booking.status] || booking.status;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(mua)/bookings')}>
          <ArrowLeft size={24} color={BrandColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết lịch đặt</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>

        <BookingTimeline booking={booking} />

        {/* Customer Info */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
            <View style={styles.divider} />
            <View style={styles.customerRow}>
              <Image 
                source={{ uri: booking.customer.avatarUrl || 'https://i.pravatar.cc/150?u=' + booking.customer.id }} 
                style={styles.avatar} 
              />
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{booking.customer.name}</Text>
                <View style={styles.phoneRow}>
                  <Phone size={14} color={BrandColors.textMuted} />
                  <Text style={styles.phoneText}>{booking.customer.phone || 'Chưa cập nhật SĐT'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Schedule Info */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Thời gian & Địa điểm</Text>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <CalendarIcon size={18} color={BrandColors.primary} />
              <Text style={styles.infoText}>Ngày: {booking.date}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Clock size={18} color={BrandColors.primary} />
              <Text style={styles.infoText}>Giờ hẹn: {booking.time}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <MapPin size={18} color={BrandColors.primary} />
              <View style={styles.addressBlock}>
                <Text style={styles.locationType}>
                  {booking.locationType === 'AT_STUDIO' ? 'Làm tại Studio' : 'Làm tận nơi'}
                </Text>
                <Text style={styles.infoText}>{booking.address}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Services Info */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Dịch vụ đã chọn</Text>
            <View style={styles.divider} />
            {booking.services.map((service, idx) => (
              <View key={service.id} style={[styles.serviceRow, idx > 0 && styles.serviceRowBorder]}>
                <View style={styles.serviceItemLeft}>
                  <Image 
                    source={{ uri: service.imageUrl || 'https://images.unsplash.com/photo-1512496015851-a1c8ce9015c3?w=200&q=80' }} 
                    style={styles.serviceImage} 
                  />
                  <Text style={styles.serviceName} numberOfLines={2}>
                    {service.name} <Text style={styles.serviceQty}>x{service.participantsCount}</Text>
                  </Text>
                </View>
                <Text style={styles.servicePriceHighlight}>
                  {(service.price * service.participantsCount).toLocaleString('vi-VN')}đ
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Notes */}
        {booking.note && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Ghi chú từ khách hàng</Text>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <FileText size={18} color={BrandColors.textMuted} />
                <Text style={styles.noteText}>{booking.note}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Pricing Summary */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tổng dịch vụ</Text>
              <Text style={styles.priceValue}>{booking.serviceTotal.toLocaleString()}đ</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Phụ phí di chuyển</Text>
              <Text style={styles.priceValue}>{booking.travelFee.toLocaleString()}đ</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabelBold}>Tổng cộng</Text>
              <Text style={styles.priceValueBold}>{booking.totalAmount.toLocaleString()}đ</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabelDeposit}>Đã cọc ({booking.paymentMethod})</Text>
              <Text style={styles.priceValueDeposit}>-{booking.depositAmount.toLocaleString()}đ</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabelRemaining}>Cần thu thêm</Text>
              <Text style={styles.priceValueRemaining}>{booking.remainingAmount.toLocaleString()}đ</Text>
            </View>
          </View>
        </View>

        {/* Reject Reason input */}
        {showRejectInput && booking.status === 'PENDING' && (
          <View style={styles.rejectContainer}>
            <Text style={styles.rejectLabel}>Lý do từ chối:</Text>
            <TextInput
              style={styles.rejectInput}
              placeholder="Nhập lý do để khách hàng biết..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
            <TouchableOpacity style={styles.cancelRejectBtn} onPress={() => setShowRejectInput(false)}>
              <Text style={styles.cancelRejectText}>Hủy thao tác</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Actions - moved inside ScrollView to ensure visibility */}
        {booking.status === 'PENDING' && (
          <View style={[styles.bottomBar, { backgroundColor: 'transparent', borderTopWidth: 0 }]}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.rejectBtn]} 
              onPress={handleReject}
              disabled={isUpdating}
            >
              <XCircle size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>Từ chối</Text>
            </TouchableOpacity>
            
            {!showRejectInput && (
              <TouchableOpacity 
                style={[styles.actionBtn, styles.acceptBtn]} 
                onPress={handleAccept}
                disabled={isUpdating}
              >
                <CheckCircle size={20} color="#FFF" />
                <Text style={styles.actionBtnText}>Chấp nhận</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {(booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') && (
          <View style={[styles.bottomBar, { backgroundColor: 'transparent', borderTopWidth: 0 }]}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.completeBtn]} 
              onPress={() => router.push({ pathname: '/(mua)/mua-booking/complete', params: { id: booking.id } })}
            >
              <CheckCircle size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>Hoàn thành đơn</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: BrandColors.borderLight },
  headerTitle: { fontFamily: Typography.bold, fontSize: 18, color: BrandColors.textDark },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: Spacing.sm, paddingTop: Spacing.md, paddingBottom: 100 },
  statusBadge: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, marginBottom: Spacing.lg },
  statusText: { fontFamily: Typography.bold, fontSize: 14 },
  section: { marginBottom: Spacing.sm },
  sectionTitle: { fontFamily: Typography.bold, fontSize: 16, color: BrandColors.textDark, marginBottom: Spacing.sm },
  card: { backgroundColor: '#FFF', borderRadius: Radius.lg, padding: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  customerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: Spacing.md },
  customerInfo: { flex: 1 },
  customerName: { fontFamily: Typography.bold, fontSize: 16, color: BrandColors.textDark, marginBottom: 4 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  phoneText: { fontFamily: Typography.medium, fontSize: 14, color: BrandColors.textMuted },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoText: { flex: 1, fontFamily: Typography.medium, fontSize: 15, color: BrandColors.textDark, lineHeight: 22 },
  addressBlock: { flex: 1 },
  locationType: { fontFamily: Typography.semiBold, fontSize: 13, color: BrandColors.primary, marginBottom: 2 },
  divider: { height: 1, backgroundColor: BrandColors.borderLight, marginVertical: Spacing.sm },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs, alignItems: 'center' },
  serviceRowBorder: { borderTopWidth: 1, borderTopColor: BrandColors.borderLight, paddingTop: Spacing.sm, marginTop: Spacing.sm },
  serviceItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: Spacing.sm },
  serviceImage: { width: 48, height: 48, borderRadius: Radius.md, marginRight: Spacing.sm },
  serviceName: { fontFamily: Typography.semiBold, fontSize: 15, color: BrandColors.textDark, flexShrink: 1 },
  serviceQty: { fontFamily: Typography.medium, fontSize: 14, color: BrandColors.primary },
  servicePriceHighlight: { fontFamily: Typography.bold, fontSize: 16, color: BrandColors.accentPink },
  noteText: { flex: 1, fontFamily: Typography.regular, fontSize: 15, color: BrandColors.textDark, fontStyle: 'italic' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  priceLabel: { fontFamily: Typography.regular, fontSize: 14, color: BrandColors.textMuted },
  priceValue: { fontFamily: Typography.medium, fontSize: 14, color: BrandColors.textDark },
  priceLabelBold: { fontFamily: Typography.bold, fontSize: 16, color: BrandColors.textDark },
  priceValueBold: { fontFamily: Typography.bold, fontSize: 16, color: BrandColors.textDark },
  priceLabelDeposit: { fontFamily: Typography.medium, fontSize: 14, color: BrandColors.statusConfirmed },
  priceValueDeposit: { fontFamily: Typography.bold, fontSize: 14, color: BrandColors.statusConfirmed },
  priceLabelRemaining: { fontFamily: Typography.bold, fontSize: 16, color: BrandColors.accentRose, marginTop: Spacing.sm },
  priceValueRemaining: { fontFamily: Typography.bold, fontSize: 20, color: BrandColors.accentRose, marginTop: Spacing.sm },
  rejectContainer: { backgroundColor: '#FFF', borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.sm },
  rejectLabel: { fontFamily: Typography.semiBold, fontSize: 14, color: BrandColors.textDark, marginBottom: Spacing.xs },
  rejectInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: BrandColors.borderLight, borderRadius: Radius.md, padding: Spacing.sm, fontFamily: Typography.regular, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  cancelRejectBtn: { alignSelf: 'flex-end', marginTop: Spacing.sm },
  cancelRejectText: { fontFamily: Typography.medium, fontSize: 14, color: BrandColors.textMuted },
  bottomBar: { flexDirection: 'row', padding: Spacing.md, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: BrandColors.borderLight, gap: Spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', height: 48, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center', gap: 8 },
  acceptBtn: { backgroundColor: BrandColors.statusConfirmed },
  rejectBtn: { backgroundColor: BrandColors.statusCancelled },
  completeBtn: { backgroundColor: BrandColors.accentRose },
  actionBtnText: { fontFamily: Typography.bold, fontSize: 15, color: '#FFF' },
  errorText: { fontFamily: Typography.medium, fontSize: 16, color: BrandColors.accentRose, marginBottom: Spacing.md },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: BrandColors.primary, borderRadius: Radius.full },
  backBtnText: { fontFamily: Typography.bold, color: '#FFF' }
});
