import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Wallet } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';
import { useCreateTopUp } from '../../hooks/useWallet';
import { walletService } from '../../services/walletService';
import { TopUpStatus, type WalletTopUpDto } from '../../types/wallet';

const TERMINAL_STATUSES = [TopUpStatus.Cancelled, TopUpStatus.Failed, TopUpStatus.Expired];

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
  const [activeTopUp, setActiveTopUp] = useState<WalletTopUpDto | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { mutateAsync: createTopUp, isPending } = useCreateTopUp();

  const checkUntilSettled = async (topUpId: string): Promise<WalletTopUpDto> => {
    let latest = await walletService.getTopUp(topUpId);

    for (let attempt = 0; attempt < 30 && latest.status === TopUpStatus.Pending; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const topUp = await walletService.getTopUp(topUpId);
      latest = topUp;
    }

    return latest;
  };

  const handleTopUpResult = async (topUp: WalletTopUpDto) => {
    setActiveTopUp(topUp);

    if (topUp.status === TopUpStatus.Paid) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        queryClient.invalidateQueries({ queryKey: ['walletTopUps'] }),
      ]);
      setActiveTopUp(null);
      Alert.alert('Nạp tiền thành công', `${topUp.amount.toLocaleString('vi-VN')}đ đã được cộng vào Ví BBook.`, [
        { text: 'Tiếp tục thanh toán', onPress: () => router.back() },
      ]);
      return;
    }

    if (TERMINAL_STATUSES.includes(topUp.status)) {
      setActiveTopUp(null);
      const message = topUp.status === TopUpStatus.Cancelled
        ? 'Giao dịch đã được hủy.'
        : topUp.status === TopUpStatus.Expired
          ? 'Link thanh toán đã hết hạn. Vui lòng tạo giao dịch mới.'
          : 'Giao dịch không thành công. Vui lòng thử lại.';
      Alert.alert('Chưa thể nạp tiền', message);
      return;
    }

    Alert.alert(
      'Đang chờ xác nhận',
      'Backend chưa nhận được webhook xác nhận từ PayOS. Bạn có thể kiểm tra lại giao dịch mà không cần tạo yêu cầu mới.',
    );
  };

  const verifyActiveTopUp = async (topUpId: string) => {
    try {
      setIsChecking(true);
      const result = await checkUntilSettled(topUpId);
      await handleTopUpResult(result);
    } catch (error: any) {
      Alert.alert('Không thể kiểm tra giao dịch', getTopUpErrorMessage(error));
    } finally {
      setIsChecking(false);
    }
  };

  const handleTopUp = async () => {
    const amount = Number(amountText.replace(/\D/g, ''));
    if (!Number.isInteger(amount) || amount < 10000 || amount > 100000000) {
      Alert.alert('Số tiền không hợp lệ', 'Vui lòng nhập từ 10.000đ đến 100.000.000đ.');
      return;
    }

    try {
      // Return/cancel URLs are owned by the backend because ASP.NET's [Url]
      // validation and payOS require stable HTTP(S) URLs in production.
      const topUp = await createTopUp({ amount });
      if (!topUp.checkoutUrl) throw new Error('Backend không trả về đường dẫn thanh toán PayOS.');

      setActiveTopUp(topUp);
      await WebBrowser.openBrowserAsync(topUp.checkoutUrl);
      await verifyActiveTopUp(topUp.topUpId);
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
        <TouchableOpacity style={[styles.button, (isPending || isChecking || activeTopUp) && styles.buttonDisabled]} disabled={isPending || isChecking || Boolean(activeTopUp)} onPress={handleTopUp}>
          {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Thanh toán qua PayOS</Text>}
        </TouchableOpacity>
        {activeTopUp ? (
          <View style={styles.pendingCard}>
            <Text style={styles.pendingTitle}>Giao dịch đang chờ xác nhận</Text>
            <Text style={styles.pendingText}>Mã giao dịch: {activeTopUp.providerOrderCode}</Text>
            <TouchableOpacity
              style={styles.checkButton}
              disabled={isChecking}
              onPress={() => verifyActiveTopUp(activeTopUp.topUpId)}
            >
              {isChecking ? (
                <ActivityIndicator color={BrandColors.accentPink} />
              ) : (
                <Text style={styles.checkButtonText}>Kiểm tra thanh toán</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
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
