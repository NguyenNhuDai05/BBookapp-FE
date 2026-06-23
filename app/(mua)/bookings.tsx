import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Spacing, Typography } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useAllBookings } from '../../hooks/useMuaBookings';
import { MuaBookingCard } from '../../components/mua/MuaBookingCard';
import { BookingStatus } from '../../types/booking';
import { useRouter } from 'expo-router';

type TabFilter = 'PENDING' | 'CONFIRMED' | 'HISTORY';

export default function MuaBookingsScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const muaId = "me";
  const [activeTab, setActiveTab] = useState<TabFilter>('PENDING');

  const { data: bookings = [], isLoading, refetch } = useAllBookings(muaId);

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'PENDING') return b.status === 'PENDING';
    if (activeTab === 'CONFIRMED') return b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS' || b.status === 'WAITING_CUSTOMER';
    if (activeTab === 'HISTORY') return b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'REJECTED';
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý lịch đặt</Text>
      </View>

      <View style={styles.tabContainer}>
        {(['PENDING', 'CONFIRMED', 'HISTORY'] as TabFilter[]).map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'PENDING' ? 'Chờ xác nhận' : tab === 'CONFIRMED' ? 'Sắp tới' : 'Lịch sử'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MuaBookingCard 
            booking={item} 
            onPress={() => router.push(`/(mua)/mua-booking/${item.id}`)} 
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={BrandColors.accentRose} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Không có lịch đặt nào.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: Spacing.md,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  headerTitle: {
    fontFamily: Typography.bold,
    fontSize: 20,
    color: BrandColors.textDark,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  tabBtn: {
    paddingVertical: Spacing.md,
    marginRight: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: BrandColors.accentRose,
  },
  tabText: {
    fontFamily: Typography.medium,
    fontSize: 15,
    color: BrandColors.textMuted,
  },
  tabTextActive: {
    color: BrandColors.accentRose,
    fontFamily: Typography.semiBold,
  },
  listContent: {
    padding: Spacing.md,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  emptyText: {
    fontFamily: Typography.medium,
    color: BrandColors.textMuted,
  }
});
