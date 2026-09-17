import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Wallet } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';
import { useCreateTopUp } from '../../hooks/useWallet';
import { walletService } from '../../services/walletService';

const PAID = 1;

const getTopUpErrorMessage = (error: any) => {
  const responseData = error?.response?.data;
  const validationErrors = responseData?.errors;

  if (validationErrors && typeof validationErrors === 'object') {
    const firstValidationMessage = Object.values(validationErrors)
      .flatMap(value => Array.isArray(value) ? value : [])
      .find(value => typeof value === 'string');

    if (firstValidationMessage) return firstValidationMessage;
  }

  return responseData?.message
    || responseData?.Message
    || (error?.response?.status
      ? `Máy chủ từ chối yêu cầu thanh toán (mã ${error.response.status}).`
      : error?.message)
    || 'Đã có lỗi xảy ra khi tạo giao dịch thanh toán.';
};

export default function WalletTopUpScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ amount?: string }>();
  const suggestedAmount = Math.max(10000, Math.ceil(Number(params.amount || 10000) / 1000) * 1000);
  const [amountText, setAmountText] = useState(String(suggestedAmount));
  const { mutateAsync: createTopUp, isPending } = useCreateTopUp();

  const checkUntilSettled = async (topUpId: string) => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const topUp = await walletService.getTopUp(topUpId);
      if (topUp.status === PAID) return true;
      if ([2, 3, 4].includes(topUp.status)) return false;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    return false;
  };

  const handleTopUp = async () => {
    const amount = Number(amountText.replace(/\D/g, ''));
    if (!Number.isInteger(amount) || amount < 10000 || amount > 100000000) {
      Alert.alert('Số tiền không hợp lệ', 'Vui lòng nhập từ 10.000đ đến 100.000.000đ.');
      return;
    }

    try {
      const returnUrl = Linking.createURL('/wallet/topup', { queryParams: { result: 'success' } });
      const cancelUrl = Linking.createURL('/wallet/topup', { queryParams: { result: 'cancel' } });
      const topUp = await createTopUp({ amount, returnUrl, cancelUrl });
      if (!topUp.checkoutUrl) throw new Error('Backend không trả về đường dẫn thanh toán PayOS.');

      await WebBrowser.openAuthSessionAsync(topUp.checkoutUrl, returnUrl);
      const paid = await checkUntilSettled(topUp.topUpId);
      if (!paid) {
        Alert.alert('Đang chờ xác nhận', 'Giao dịch chưa được PayOS xác nhận. Bạn có thể kiểm tra lại sau.');
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      Alert.alert('Nạp tiền thành công', `${amount.toLocaleString('vi-VN')}đ đã được cộng vào Ví BBook.`, [
        { text: 'Tiếp tục thanh toán', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Không thể nạp tiền', getTopUpErrorMessage(error));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color={BrandColors.textDark} /></TouchableOpacity>
        <Text style={styles.title}>Nạp Ví BBook</Text><View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.icon}><Wallet size={32} color={BrandColors.accentPink} /></View>
        <Text style={styles.label}>Số tiền muốn nạp</Text>
        <TextInput style={styles.input} value={amountText} onChangeText={setAmountText} keyboardType="number-pad" />
        <Text style={styles.hint}>Bạn sẽ thanh toán an toàn trên cổng PayOS. Số dư chỉ được cộng sau khi backend xác nhận webhook.</Text>
        <TouchableOpacity style={styles.button} disabled={isPending} onPress={handleTopUp}>
          {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Thanh toán qua PayOS</Text>}
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
  buttonText: { color: '#FFF', fontFamily: Typography.bold, fontSize: 15 },
});
