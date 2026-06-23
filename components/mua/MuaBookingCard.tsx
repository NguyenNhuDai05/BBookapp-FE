import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MapPin, Clock, Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react-native';
import { BrandColors, Spacing, Typography, Radius, Shadows } from '../../constants/theme';
import type { BookingDto } from '../../types/booking';
import { useUpdateBookingStatus } from '../../hooks/useMuaBookings';
import { BookingServiceList } from '../BookingServiceList';

interface MuaBookingCardProps {
  booking: BookingDto;
  onPress?: () => void;
}

export function MuaBookingCard({ booking, onPress }: MuaBookingCardProps) {
  const { mutate: updateStatus, isPending } = useUpdateBookingStatus(booking.mua.id);

  const handleAccept = () => {
    updateStatus({ bookingId: booking.id, status: 'CONFIRMED' });
  };

  const handleReject = () => {
    updateStatus({ bookingId: booking.id, status: 'REJECTED', reason: 'MUA từ chối' });
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
    'CANCELLED': 'Đã hủy',
    'REJECTED': 'Từ chối'
  }[booking.status] || booking.status;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.customerInfo}>
          <Image 
            source={{ uri: booking.customer.avatarUrl || 'https://via.placeholder.com/150' }} 
            style={styles.avatar} 
          />
          <View>
            <Text style={styles.customerName}>{booking.customer.name}</Text>
            <Text style={styles.customerPhone}>{booking.customer.phone}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>{statusLabel}</Text>
        </View>
      </View>

      <BookingServiceList services={booking.services} />

      <View style={styles.footer}>
        <View style={styles.footerTotals}>
          <Text style={styles.totalLabel}>Tổng tiền:</Text>
          <Text style={styles.totalAmount}>{booking.totalAmount.toLocaleString('vi-VN')}đ</Text>
        </View>
        <View style={styles.footerTotals}>
          <Text style={styles.totalLabel}>Tổng dịch vụ:</Text>
          <Text style={styles.serviceCount}>{booking.services.reduce((acc, s) => acc + s.participantsCount, 0)}</Text>
        </View>
      </View>

      {booking.status === 'PENDING' && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.rejectBtn]} 
            onPress={handleReject}
            disabled={isPending}
          >
            <XCircle size={20} color={BrandColors.statusCancelled} />
            <Text style={[styles.actionText, { color: BrandColors.statusCancelled }]}>Từ chối</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.acceptBtn]} 
            onPress={handleAccept}
            disabled={isPending}
          >
            <CheckCircle size={20} color="#FFF" />
            <Text style={[styles.actionText, { color: '#FFF' }]}>Chấp nhận</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BrandColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.sm,
    backgroundColor: BrandColors.bgPrimary,
  },
  customerName: {
    fontFamily: Typography.semiBold,
    fontSize: 16,
    color: BrandColors.textDark,
  },
  customerPhone: {
    fontFamily: Typography.regular,
    fontSize: 13,
    color: BrandColors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontFamily: Typography.medium,
    fontSize: 12,
  },
  serviceList: {
    marginBottom: Spacing.sm,
    paddingLeft: 4,
  },
  serviceItem: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: BrandColors.textDark,
    marginBottom: 2,
  },
  logisticsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: Typography.medium,
    fontSize: 14,
    color: BrandColors.textDark,
    lineHeight: 20,
  },
  addressBlock: {
    flex: 1,
  },
  locationType: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: BrandColors.textDark,
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: BrandColors.borderLight,
    marginVertical: Spacing.sm,
  },
  footer: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: BrandColors.borderLight,
    gap: 4,
  },
  footerTotals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: BrandColors.textLight,
  },
  totalAmount: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.accentRose,
  },
  serviceCount: {
    fontFamily: Typography.semiBold,
    fontSize: 14,
    color: BrandColors.textDark,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    gap: Spacing.xs,
  },
  rejectBtn: {
    backgroundColor: BrandColors.statusCancelled + '10',
    borderWidth: 1,
    borderColor: BrandColors.statusCancelled + '30',
  },
  acceptBtn: {
    backgroundColor: BrandColors.statusConfirmed,
  },
  actionText: {
    fontFamily: Typography.semiBold,
    fontSize: 14,
  }
});
