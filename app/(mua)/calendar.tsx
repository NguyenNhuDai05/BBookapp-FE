import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Spacing, Typography, Radius } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useAllBookings } from '../../hooks/useMuaBookings';

export default function MuaCalendarScreen() {
  const { user } = useAuthStore();
  const muaId = "me";
  
  const { data: bookings = [], isLoading, refetch } = useAllBookings(muaId);

  // Group confirmed bookings by date
  const groupedBookings = useMemo(() => {
    const confirmed = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS');
    const grouped: Record<string, typeof confirmed> = {};
    
    // Sort by date and time
    confirmed.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    confirmed.forEach(b => {
      if (!grouped[b.date]) grouped[b.date] = [];
      grouped[b.date].push(b);
    });

    return grouped;
  }, [bookings]);

  const datesWithBookings = Object.keys(groupedBookings).sort();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch làm việc (Đã xác nhận)</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={BrandColors.accentRose} />}
      >
        {datesWithBookings.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Chưa có lịch hẹn nào sắp tới.</Text>
          </View>
        ) : (
          datesWithBookings.map((dateStr) => {
            const dayBookings = groupedBookings[dateStr];
            return (
              <View key={dateStr} style={styles.dayCard}>
                <View style={styles.dateCol}>
                  <Text style={styles.dateNumber}>{dateStr.split('-')[2]}</Text>
                  <Text style={styles.dateMonth}>Thg {dateStr.split('-')[1]}</Text>
                </View>
                <View style={styles.slotsCol}>
                  <View style={styles.slotsGrid}>
                    {dayBookings.map((b) => (
                      <View key={b.id} style={styles.slotPillBooked}>
                        <Text style={styles.slotTextBooked}>{b.time} - {b.customer.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: Spacing.md, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: BrandColors.borderLight },
  headerTitle: { fontFamily: Typography.bold, fontSize: 20, color: BrandColors.textDark },
  content: { padding: Spacing.md, paddingBottom: 100 },
  dayCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  dateCol: { width: 60, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: BrandColors.borderLight, paddingRight: Spacing.sm, marginRight: Spacing.md },
  dateNumber: { fontFamily: Typography.bold, fontSize: 28, color: BrandColors.textDark },
  dateMonth: { fontFamily: Typography.medium, fontSize: 13, color: BrandColors.textMuted },
  slotsCol: { flex: 1, justifyContent: 'center' },
  slotsGrid: { flexDirection: 'column', gap: Spacing.sm },
  slotPillBooked: { backgroundColor: BrandColors.accentRose + '20', paddingVertical: 8, paddingHorizontal: 12, borderRadius: Radius.sm, alignSelf: 'flex-start' },
  slotTextBooked: { fontFamily: Typography.medium, color: BrandColors.accentRose, fontSize: 13 },
  emptyState: { padding: Spacing.xl, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: Typography.regular, color: BrandColors.textMuted, fontSize: 15 }
});
