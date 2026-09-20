import React, { useMemo } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Spacing, Typography, Radius, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useEarningsSnapshot, usePendingBookings, useAllBookings } from '../../hooks/useMuaBookings';
import { useMuaServices } from '../../hooks/useMuaServices';
import { useMuaPortfolio } from '../../hooks/useMuaPortfolio';
import { MuaBookingCard } from '../../components/mua/MuaBookingCard';
import { useRouter } from 'expo-router';
import { Bell, BriefcaseBusiness, CalendarClock, Images } from 'lucide-react-native';
import { useMuaEligibility } from '../../hooks/useMuaEligibility';
import { MuaCompletionCard } from '../../components/mua/MuaCompletionCard';
import { ErrorView } from '../../components/ui/ErrorView';
import { getApiError } from '../../services/api';

export default function MuaDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const muaId = "me";

  const { data: earnings, error: earningsError, isLoading: earningsLoading, isError: earningsIsError, refetch: refetchEarnings } = useEarningsSnapshot(muaId);
  const { data: pendingBookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = usePendingBookings(muaId);
  const { data: allBookings = [] } = useAllBookings(muaId);
  
  useMuaServices(muaId);
  useMuaPortfolio(muaId);
  const { data: eligibility, isError: eligibilityError, refetch: refetchEligibility } = useMuaEligibility();

  // In-app Notification Badge for today's bookings
  const todayBookings = useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    return allBookings.filter(b => (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && b.date === todayStr);
  }, [allBookings]);

  const refreshing = earningsLoading || bookingsLoading;

  const onRefresh = () => {
    refetchEarnings();
    refetchBookings();
    refetchEligibility();
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

        {eligibilityError ? <ErrorView message="Không thể tải trạng thái hồ sơ" onRetry={refetchEligibility} /> : eligibility ? <View style={styles.completionWrap}><MuaCompletionCard eligibility={eligibility} compact onContinue={() => router.push('/mua-onboarding/setup')} /></View> : null}

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(mua)/services')}><BriefcaseBusiness size={21} color={BrandColors.accentRose}/><Text style={styles.quickText}>Dịch vụ</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(mua)/services?tab=PORTFOLIO')}><Images size={21} color={BrandColors.accentRose}/><Text style={styles.quickText}>Portfolio</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(mua)/working-hours')}><CalendarClock size={21} color={BrandColors.accentRose}/><Text style={styles.quickText}>Giờ làm</Text></TouchableOpacity>
        </View>

        {earningsIsError ? (
          <ErrorView message={getApiError(earningsError).message || 'Không thể tải doanh thu.'} onRetry={() => refetchEarnings()} />
        ) : (
          <TouchableOpacity style={styles.earningsCard} activeOpacity={0.85} onPress={() => router.push('/(mua)/earnings' as any)}>
            {earningsLoading || !earnings ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View style={styles.earningsRow}>
                <View style={styles.earningsBox}>
                  <Text style={styles.earningsLabel}>Có thể rút</Text>
                  <Text style={styles.earningsAmount}>{earnings.availableTotal.toLocaleString('vi-VN')}đ</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.earningsBox}>
                  <Text style={styles.earningsLabel}>Đang giữ</Text>
                  <Text style={styles.earningsCount}>{earnings.onHoldTotal.toLocaleString('vi-VN')}đ</Text>
                </View>
              </View>
            )}
            {earnings && earnings.payoutPendingTotal > 0 ? <Text style={styles.payoutPending}>{earnings.payoutPendingTotal.toLocaleString('vi-VN')}đ đang chờ chi trả</Text> : null}
            {earnings ? <Text style={styles.earningsLink}>Xem thu nhập và rút tiền ›</Text> : null}
          </TouchableOpacity>
        )}

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
  completionWrap: { marginBottom: Spacing.md },
  quickActions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  quickAction: { flex: 1, minHeight: 72, borderRadius: Radius.md, backgroundColor: '#FFF', borderWidth: 1, borderColor: BrandColors.borderLight, alignItems: 'center', justifyContent: 'center', gap: 6 },
  quickText: { fontFamily: Typography.semiBold, fontSize: 12, color: BrandColors.textDark },
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
  payoutPending: { fontFamily: Typography.semiBold, fontSize: 12, color: '#FFF', marginTop: Spacing.md },
  earningsLink: { fontFamily: Typography.bold, fontSize: 12, color: '#FFF', marginTop: Spacing.sm, textAlign: 'right' },
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
