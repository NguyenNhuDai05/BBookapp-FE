import React from 'react';
import { ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAllBookings } from '../../hooks/useMuaBookings';
import { InternalBookingCalendar } from '../../components/booking/InternalBookingCalendar';
import { BrandColors, Spacing, Typography } from '../../constants/theme';

export default function MuaCalendarScreen() {
  const { data: bookings = [], isLoading, refetch } = useAllBookings('me');
  return <SafeAreaView style={styles.container} edges={['top']}><View style={styles.header}><Text style={styles.title}>Lịch làm việc</Text></View><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={BrandColors.accentRose} />}><InternalBookingCalendar bookings={bookings} viewAs="mua" /></ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ container:{flex:1,backgroundColor:'#F9FAFB'},header:{padding:Spacing.md,backgroundColor:'#FFF',borderBottomWidth:1,borderBottomColor:BrandColors.borderLight},title:{fontFamily:Typography.bold,fontSize:20,color:BrandColors.textDark},content:{padding:Spacing.md,paddingBottom:100} });
