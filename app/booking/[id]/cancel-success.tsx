import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, Home, FileText } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../../constants/theme';
import { useBookingDetail } from '../../../hooks/useBooking';

export default function CancelSuccessScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking } = useBookingDetail(id);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <View style={styles.iconWrapper}>
          <CheckCircle size={64} color="#00C853" fill="#E8F5E9" />
        </View>
        <Text style={styles.title}>Hủy đơn thành công</Text>
        
        {booking && (
          <Text style={styles.subtitle}>
            Đơn đặt lịch <Text style={styles.bold}>{booking.id}</Text> với chuyên gia <Text style={styles.bold}>{booking.mua.name}</Text> đã được hủy.
          </Text>
        )}

        <View style={styles.refundBox}>
          <Text style={styles.refundTitle}>Thông báo hoàn tiền</Text>
          <Text style={styles.refundText}>
            Do bạn hủy trước 24h, số tiền cọc <Text style={styles.bold}>{booking?.depositAmount?.toLocaleString('vi-VN')}đ</Text> sẽ được hoàn lại vào Ví BeautyBook trong vòng 24h.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/explore')}>
          <Home size={18} color="#FFF" />
          <Text style={styles.primaryBtnText}>Về trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)/bookings')}>
          <FileText size={18} color={BrandColors.textDark} />
          <Text style={styles.secondaryBtnText}>Xem lịch sử booking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  iconWrapper: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Typography.bold,
    fontSize: 22,
    color: BrandColors.textDark,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontFamily: Typography.regular,
    fontSize: 15,
    color: BrandColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  bold: {
    fontFamily: Typography.bold,
    color: BrandColors.textDark,
  },
  
  refundBox: {
    backgroundColor: BrandColors.bgPinkLight,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    width: '100%',
  },
  refundTitle: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: BrandColors.accentPink,
    marginBottom: 8,
  },
  refundText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: BrandColors.textDark,
    lineHeight: 20,
  },

  footer: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  primaryBtn: {
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
    fontSize: 15,
    color: '#FFF',
  },
  secondaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: BrandColors.textDark,
  },
});
