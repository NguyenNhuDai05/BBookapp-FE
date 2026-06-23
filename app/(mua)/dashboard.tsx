import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Spacing, Typography, Radius, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useEarningsSnapshot, usePendingBookings, useAllBookings } from '../../hooks/useMuaBookings';
import { useMuaProfile } from '../../hooks/useMuaProfile';
import { useMuaServices } from '../../hooks/useMuaServices';
import { useMuaPortfolio } from '../../hooks/useMuaPortfolio';
import { MuaBookingCard } from '../../components/mua/MuaBookingCard';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';

export default function MuaDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const muaId = "me";

  const { data: earnings, isLoading: earningsLoading, refetch: refetchEarnings } = useEarningsSnapshot(muaId);
  const { data: pendingBookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = usePendingBookings(muaId);
  const { data: allBookings = [] } = useAllBookings(muaId);
  
  const { data: profile } = useMuaProfile(muaId);
  const { data: services = [] } = useMuaServices(muaId);
  const { data: portfolio = [] } = useMuaPortfolio(muaId);

  // In-app Notification Badge for today's bookings
  const todayBookings = useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    return allBookings.filter(b => (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && b.date === todayStr);
  }, [allBookings]);

  // Profile Completion Calculation
  let completionScore = 0;
  if (profile?.verificationStatus === 'APPROVED') completionScore += 30;
  if (profile?.avatarUrl) completionScore += 10;
  if (portfolio.some((p: any) => p.isCover)) completionScore += 10;
  if (portfolio.length >= 5) completionScore += 20;
  if (services.filter((s: any) => s.status === 'ACTIVE').length >= 3) completionScore += 20;
  if (profile?.bio) completionScore += 10;

  const refreshing = earningsLoading || bookingsLoading;

  const onRefresh = () => {
    refetchEarnings();
    refetchBookings();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BrandColors.accentRose} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.name}>{user?.name || 'MUA'}</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => router.push('/bookings')}>
            <Bell size={24} color={BrandColors.textDark} />
            {todayBookings.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{todayBookings.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <View style={styles.earningsBox}>
              <Text style={styles.earningsLabel}>Doanh thu tháng này</Text>
              <Text style={styles.earningsAmount}>
                {earnings?.month ? earnings.month.toLocaleString('vi-VN') : '0'}đ
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.earningsBox}>
              <Text style={styles.earningsLabel}>Chờ xác nhận</Text>
              <Text style={styles.earningsCount}>{earnings?.pending || 0}</Text>
            </View>
          </View>
        </View>

        <View style={styles.completionCard}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionTitle}>Hoàn thiện hồ sơ</Text>
            <Text style={styles.completionScore}>{completionScore}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${completionScore}%` }]} />
          </View>
          <Text style={styles.completionHint}>
            {completionScore < 100 
              ? 'Hoàn thiện hồ sơ 100% để tăng gấp đôi tỷ lệ được khách hàng đặt lịch.'
              : 'Hồ sơ của bạn rất tuyệt vời! Sẵn sàng nhận lịch đặt.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yêu cầu mới nhất ({pendingBookings.length})</Text>
          {pendingBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Hiện không có yêu cầu đặt lịch nào chờ xác nhận.</Text>
            </View>
          ) : (
            pendingBookings.slice(0, 3).map((booking) => (
              <MuaBookingCard 
                key={booking.id} 
                booking={booking} 
                onPress={() => router.push('/(mua)/bookings')} 
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontFamily: Typography.regular,
    fontSize: 16,
    color: BrandColors.textMuted,
  },
  name: {
    fontFamily: Typography.bold,
    fontSize: 24,
    color: BrandColors.textDark,
  },
  earningsCard: {
    backgroundColor: BrandColors.accentRose,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsBox: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: Spacing.md,
  },
  earningsLabel: {
    fontFamily: Typography.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  earningsAmount: {
    fontFamily: Typography.bold,
    fontSize: 24,
    color: '#FFF',
  },
  earningsCount: {
    fontFamily: Typography.bold,
    fontSize: 24,
    color: '#FFF',
  },
  completionCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    ...Shadows.card,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  completionTitle: {
    fontFamily: Typography.semiBold,
    fontSize: 16,
    color: BrandColors.textDark,
  },
  completionScore: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.accentRose,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: BrandColors.bgPink,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: BrandColors.accentRose,
    borderRadius: Radius.full,
  },
  completionHint: {
    fontFamily: Typography.regular,
    fontSize: 13,
    color: BrandColors.textMuted,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: Typography.semiBold,
    fontSize: 18,
    color: BrandColors.textDark,
    marginBottom: Spacing.md,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontFamily: Typography.medium,
    color: BrandColors.textMuted,
    textAlign: 'center',
  },
  bellBtn: {
    position: 'relative',
    padding: Spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: BrandColors.accentRose,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: Typography.bold,
  }
});
