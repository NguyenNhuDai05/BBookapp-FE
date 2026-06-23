import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MapPin, Calendar, Clock, ArrowRight } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography, Shadows } from '../../constants/theme';
import { useUserBookings, useConfirmBookingCompletion } from '../../hooks/useBooking';
import { BookingDto, BookingStatus } from '../../types/booking';
import { BookingServiceList } from '../../components/BookingServiceList';

type TabType = 'ALL' | 'COMPLETED' | 'PENDING' | 'CANCELLED';

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Chờ xác nhận', color: '#FF9800', bg: '#FFF3E0' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#2196F3', bg: '#E3F2FD' },
  IN_PROGRESS: { label: 'Đang thực hiện', color: '#9C27B0', bg: '#F3E5F5' },
  WAITING_CUSTOMER: { label: 'Chờ bạn xác nhận', color: '#00BCD4', bg: '#E0F7FA' },
  COMPLETED: { label: 'Hoàn thành', color: '#4CAF50', bg: '#E8F5E9' },
  CANCELLED: { label: 'Đã hủy', color: '#F44336', bg: '#FFEBEE' },
  REJECTED: { label: 'Từ chối', color: '#F44336', bg: '#FFEBEE' },
};

export default function BookingsTab() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const { data: bookings, isLoading, error, refetch, isRefetching } = useUserBookings();
  const { mutate: confirmCompletion, isPending: isConfirming } = useConfirmBookingCompletion();

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    switch (activeTab) {
      case 'COMPLETED':
        return bookings.filter(b => b.status === 'COMPLETED');
      case 'PENDING':
        return bookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS' || b.status === 'WAITING_CUSTOMER');
      case 'CANCELLED':
        return bookings.filter(b => b.status === 'CANCELLED');
      case 'ALL':
      default:
        return bookings;
    }
  }, [bookings, activeTab]);

  const renderTab = (type: TabType, label: string) => {
    const isActive = activeTab === type;
    return (
      <TouchableOpacity
        style={[styles.tab, isActive && styles.tabActive]}
        onPress={() => setActiveTab(type)}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading && !isRefetching) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={BrandColors.accentPink} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Đã có lỗi xảy ra khi tải lịch hẹn.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử Booking</Text>
      </View>

      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {renderTab('ALL', 'Tất cả')}
          {renderTab('COMPLETED', 'Hoàn thành')}
          {renderTab('PENDING', 'Đang xử lý')}
          {renderTab('CANCELLED', 'Đã hủy')}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={BrandColors.accentPink} />
        }
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Chưa có lịch hẹn nào.</Text>
          </View>
        ) : (
          filteredBookings.map(renderBookingCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function renderBookingCard(booking: BookingDto) {
    const statusInfo = STATUS_CONFIG[booking.status];
    
    return (
      <View key={booking.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.muaInfo}>
            <Image source={{ uri: booking.mua.avatarUrl }} style={styles.muaAvatar} />
            <Text style={styles.muaName}>{booking.mua.name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <BookingServiceList services={booking.services} />

        {booking.status === 'WAITING_CUSTOMER' && (
          <View style={[styles.reviewBanner, { backgroundColor: '#E0F7FA' }]}>
            <Text style={[styles.reviewBannerText, { color: '#006064' }]}>MUA đã hoàn tất dịch vụ. Vui lòng xác nhận để giải ngân tiền cọc.</Text>
            <TouchableOpacity 
              style={[styles.confirmBtn, isConfirming && { opacity: 0.5 }]}
              onPress={() => confirmCompletion(booking.id)}
              disabled={isConfirming}
            >
              <Text style={styles.confirmBtnText}>Xác nhận & Giải ngân</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footerTotalsBlock}>
          <View style={styles.footerTotalRow}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.price}>{booking.totalAmount.toLocaleString('vi-VN')}đ</Text>
          </View>
          <View style={styles.footerTotalRow}>
            <Text style={styles.totalLabel}>Tổng dịch vụ:</Text>
            <Text style={styles.serviceCount}>{booking.services.reduce((acc, s) => acc + s.participantsCount, 0)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.leftActions}>
            {booking.status === 'COMPLETED' && (
              <TouchableOpacity 
                disabled={booking.isReviewed}
                onPress={() => {
                  if (!booking.isReviewed) {
                    router.push({
                      pathname: '/booking/review',
                      params: { id: booking.id, muaName: booking.mua.name }
                    });
                  }
                }}
              >
                <Text style={[styles.reviewTextBtn, booking.isReviewed && styles.reviewedText]}>
                  {booking.isReviewed ? 'Đã đánh giá' : 'Đánh giá'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.rightActions}>
            {(booking.status === 'COMPLETED' || booking.status === 'CANCELLED') && (
              <TouchableOpacity style={styles.rebookBtn}>
                <Text style={styles.rebookBtnText}>Đặt lại</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.detailBtn}
              onPress={() => router.push(`/booking/${booking.id}`)}
            >
              <Text style={styles.detailBtnText}>Chi tiết</Text>
              <ArrowRight size={14} color={BrandColors.textDark} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
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
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontFamily: Typography.bold,
    fontSize: 22,
    color: BrandColors.textDark,
  },
  
  tabsWrapper: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: '#F5F5F5',
  },
  tabActive: {
    backgroundColor: BrandColors.bgPinkLight,
  },
  tabText: {
    fontFamily: Typography.medium,
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  tabTextActive: {
    color: BrandColors.accentPink,
    fontFamily: Typography.bold,
  },
  
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Typography.medium,
    color: BrandColors.textSecondary,
  },
  errorText: {
    fontFamily: Typography.medium,
    color: BrandColors.textSecondary,
    marginBottom: Spacing.md,
  },
  retryBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    backgroundColor: BrandColors.accentPink,
    borderRadius: Radius.lg,
  },
  retryText: {
    color: '#FFF',
    fontFamily: Typography.bold,
  },
  
  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  muaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muaAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
    backgroundColor: BrandColors.bgPrimary,
  },
  muaName: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: BrandColors.textDark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontFamily: Typography.bold,
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: Spacing.md,
  },
  servicesList: {
    marginBottom: Spacing.sm,
  },
  serviceRow: {
    marginBottom: 4,
  },
  serviceName: {
    fontFamily: Typography.semiBold,
    fontSize: 15,
    color: BrandColors.textDark,
  },
  logisticsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
  logisticsDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: Spacing.sm,
  },
  
  reviewBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF8E1', // light yellow
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  reviewBannerText: {
    fontFamily: Typography.medium,
    fontSize: 12,
    color: '#FF8F00',
  },
  reviewBtnText: {
    fontFamily: Typography.bold,
    fontSize: 12,
    color: BrandColors.accentPink,
  },
  
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  leftActions: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  price: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.accentRose,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  detailBtnText: {
    fontFamily: Typography.semiBold,
    fontSize: 13,
    color: BrandColors.textDark,
  },
  rebookBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: BrandColors.accentPink,
  },
  rebookBtnText: {
    fontFamily: Typography.semiBold,
    fontSize: 13,
    color: '#FFF',
  },
  reviewTextBtn: {
    fontFamily: Typography.semiBold,
    fontSize: 14,
    color: BrandColors.accentPink,
  },
  reviewedText: {
    color: BrandColors.textMuted,
  },
  confirmBtn: {
    backgroundColor: '#00BCD4',
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  confirmBtnText: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: '#FFF',
  },
  footerTotalsBlock: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: Spacing.md,
    marginBottom: Spacing.xs,
    gap: 4,
  },
  footerTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: BrandColors.textLight,
  },
  serviceCount: {
    fontFamily: Typography.semiBold,
    fontSize: 14,
    color: BrandColors.textDark,
  },
});
