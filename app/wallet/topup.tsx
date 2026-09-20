import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Wallet } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';

export default function WalletTopUpScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color={BrandColors.textDark} /></TouchableOpacity>
        <Text style={styles.title}>Ví BBook</Text><View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.icon}><Wallet size={32} color={BrandColors.accentPink} /></View>
        <Text style={styles.label}>Nạp tiền không còn được hỗ trợ</Text>
        <Text style={styles.hint}>Booking mới thanh toán tiền cọc trực tiếp. Lịch sử giao dịch ví cũ vẫn được giữ nguyên.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl, backgroundColor: '#FFF' },
  title: { fontFamily: Typography.bold, fontSize: 18, color: BrandColors.textDark },
  content: { padding: Spacing.xl },
  icon: { width: 64, height: 64, borderRadius: 32, backgroundColor: BrandColors.bgPinkLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: Spacing.xl },
  label: { fontFamily: Typography.semiBold, fontSize: 14, color: BrandColors.textDark, marginBottom: 8 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: BrandColors.borderLight, borderRadius: Radius.lg, padding: Spacing.lg, fontFamily: Typography.bold, fontSize: 24, color: BrandColors.textDark },
  hint: { fontFamily: Typography.regular, fontSize: 13, lineHeight: 19, color: BrandColors.textSecondary, marginVertical: Spacing.lg },
  button: { backgroundColor: BrandColors.accentPink, borderRadius: Radius.full, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#FFF', fontFamily: Typography.bold, fontSize: 15 },
  pendingCard: { marginTop: Spacing.lg, padding: Spacing.lg, borderRadius: Radius.lg, backgroundColor: '#FFF', borderWidth: 1, borderColor: BrandColors.borderLight },
  pendingTitle: { fontFamily: Typography.bold, fontSize: 14, color: BrandColors.textDark },
  pendingText: { fontFamily: Typography.regular, fontSize: 13, color: BrandColors.textSecondary, marginTop: 4 },
  checkButton: { marginTop: Spacing.md, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full, borderWidth: 1, borderColor: BrandColors.accentPink },
  checkButtonText: { color: BrandColors.accentPink, fontFamily: Typography.bold, fontSize: 14 },
});
