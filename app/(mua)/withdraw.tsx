import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Building2, CheckCircle2, Circle, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';
import { useEarningsSnapshot } from '../../hooks/useMuaBookings';
import { useCreateMuaPayout, useMuaBankAccounts } from '../../hooks/useMuaPayouts';
import { getApiError } from '../../services/api';

const money = (value: number) => `${Math.max(0, value).toLocaleString('vi-VN')}đ`;

export default function WithdrawScreen() {
  const router = useRouter();
  const earnings = useEarningsSnapshot('me');
  const banks = useMuaBankAccounts();
  const create = useCreateMuaPayout();
  const submitLock = useRef(false);
  const [selected, setSelected] = useState<string>();
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [key] = useState(() => Crypto.randomUUID());
  const selectedId = selected || (banks.data?.find(item => item.isDefault)?.id ?? banks.data?.[0]?.id);
  const selectedBank = banks.data?.find(item => item.id === selectedId);
  const availableIds = useMemo(
    () => earnings.data?.receivables.filter(item => item.status === 1).map(item => item.id) ?? [],
    [earnings.data],
  );
  const amount = earnings.data?.availableTotal ?? 0;
  const loading = earnings.isLoading || banks.isLoading;
  const canSubmit = Boolean(selectedId) && amount > 0 && !create.isPending;

  const openConfirmation = () => {
    if (!canSubmit) return;
    setSubmitError('');
    setConfirmationVisible(true);
  };

  const confirmWithdraw = async () => {
    if (!selectedId || amount <= 0 || create.isPending || submitLock.current) return;
    submitLock.current = true;
    setSubmitError('');
    try {
      const payout = await create.mutateAsync({ bankAccountId: selectedId, receivableIds: availableIds, idempotencyKey: key });
      setConfirmationVisible(false);
      router.replace({ pathname: '/(mua)/payouts/[id]', params: { id: payout.id } } as any);
    } catch (error) {
      const value = getApiError(error);
      setConfirmationVisible(false);
      setSubmitError(value.isNetworkError
        ? 'Chưa thể xác minh yêu cầu đã được ghi nhận. Hãy thử lại trên màn này để sử dụng cùng mã yêu cầu.'
        : value.message);
    } finally {
      submitLock.current = false;
    }
  };

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}><TouchableOpacity style={styles.back} onPress={() => router.back()} disabled={create.isPending}><ArrowLeft size={23} color={BrandColors.textDark}/></TouchableOpacity><Text style={styles.title}>Rút tiền</Text><View style={styles.back}/></View>
    <ScrollView contentContainerStyle={styles.content}>
      {loading ? <ActivityIndicator color={BrandColors.accentRose}/> : earnings.isError || banks.isError ? <Text style={styles.error}>{getApiError(earnings.error || banks.error).message}</Text> : <>
        <View style={styles.amountCard}><Text style={styles.label}>Số tiền yêu cầu</Text><Text style={styles.amount}>{money(amount)}</Text><Text style={styles.caption}>{availableIds.length} khoản thu nhập khả dụng</Text></View>
        <View style={styles.sectionRow}><Text style={styles.section}>Tài khoản nhận</Text><TouchableOpacity onPress={() => router.push('/(mua)/bank-account-form' as any)}><Text style={styles.link}>Thêm mới</Text></TouchableOpacity></View>
        {!banks.data?.length ? <TouchableOpacity style={styles.empty} onPress={() => router.push('/(mua)/bank-account-form' as any)}><Building2 size={30} color={BrandColors.textMuted}/><Text style={styles.emptyText}>Thêm tài khoản ngân hàng trước khi rút tiền.</Text></TouchableOpacity> : banks.data.map(bank => <TouchableOpacity key={bank.id} style={[styles.bank, selectedId === bank.id && styles.bankSelected]} onPress={() => setSelected(bank.id)}><View style={{flex:1}}><Text style={styles.bankName}>{bank.bankName || bank.bankCode}</Text><Text style={styles.bankMeta}>{bank.maskedAccountNumber} · {bank.accountHolderName}</Text></View>{selectedId === bank.id ? <CheckCircle2 size={22} color={BrandColors.accentRose}/> : <Circle size={22} color={BrandColors.textMuted}/>}</TouchableOpacity>)}
        <Text style={styles.notice}>Số tiền được Backend tính từ các khoản phải thu khả dụng. Sau khi gửi, yêu cầu sẽ chờ Admin kiểm tra và chuyển khoản.</Text>
        {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
        <TouchableOpacity style={[styles.submit, !canSubmit && styles.disabled]} disabled={!canSubmit} onPress={openConfirmation}>{create.isPending ? <ActivityIndicator color="#FFF"/> : <Text style={styles.submitText}>Xác nhận rút {money(amount)}</Text>}</TouchableOpacity>
      </>}
    </ScrollView>

    <Modal visible={confirmationVisible} transparent animationType="fade" onRequestClose={() => !create.isPending && setConfirmationVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.confirmCard}>
          <View style={styles.confirmHeader}><Text style={styles.confirmTitle}>Xác nhận rút tiền</Text><TouchableOpacity style={styles.close} onPress={() => setConfirmationVisible(false)} disabled={create.isPending}><X size={21} color={BrandColors.textDark}/></TouchableOpacity></View>
          <Text style={styles.confirmAmount}>{money(amount)}</Text>
          <Text style={styles.confirmText}>Tiền sẽ được chuyển tới tài khoản:</Text>
          <View style={styles.confirmBank}><Text style={styles.confirmBankName}>{selectedBank?.bankName || selectedBank?.bankCode}</Text><Text style={styles.bankMeta}>{selectedBank?.maskedAccountNumber} · {selectedBank?.accountHolderName}</Text></View>
          <View style={styles.confirmActions}><TouchableOpacity style={styles.cancel} onPress={() => setConfirmationVisible(false)} disabled={create.isPending}><Text style={styles.cancelText}>Quay lại</Text></TouchableOpacity><TouchableOpacity style={styles.confirmButton} onPress={confirmWithdraw} disabled={create.isPending}>{create.isPending ? <ActivityIndicator color="#FFF"/> : <Text style={styles.confirmButtonText}>Gửi yêu cầu</Text>}</TouchableOpacity></View>
        </View>
      </View>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:BrandColors.bgPrimary},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:Spacing.md},back:{width:44,height:44,alignItems:'center',justifyContent:'center'},title:{fontFamily:Typography.bold,fontSize:20,color:BrandColors.textDark},content:{padding:Spacing.base,paddingBottom:Spacing.xxl},amountCard:{backgroundColor:BrandColors.accentRose,borderRadius:Radius.lg,padding:Spacing.lg,alignItems:'center'},label:{fontFamily:Typography.medium,color:'#FFEAF0'},amount:{fontFamily:Typography.extraBold,fontSize:32,color:'#FFF',marginVertical:4},caption:{fontFamily:Typography.regular,fontSize:12,color:'#FFEAF0'},sectionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:Spacing.xl,marginBottom:Spacing.sm},section:{fontFamily:Typography.bold,fontSize:17,color:BrandColors.textDark},link:{fontFamily:Typography.bold,color:BrandColors.accentRose},bank:{flexDirection:'row',alignItems:'center',backgroundColor:'#FFF',padding:Spacing.md,borderRadius:Radius.md,borderWidth:1,borderColor:BrandColors.borderLight,marginBottom:Spacing.sm},bankSelected:{borderColor:BrandColors.accentRose,backgroundColor:BrandColors.bgPinkLight},bankName:{fontFamily:Typography.bold,color:BrandColors.textDark},bankMeta:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textSecondary,marginTop:4},empty:{alignItems:'center',padding:Spacing.xl,backgroundColor:'#FFF',borderRadius:Radius.md,borderWidth:1,borderStyle:'dashed',borderColor:BrandColors.borderLight},emptyText:{fontFamily:Typography.regular,color:BrandColors.textMuted,textAlign:'center',marginTop:10},notice:{fontFamily:Typography.regular,fontSize:12,lineHeight:18,color:BrandColors.textSecondary,marginVertical:Spacing.lg},submit:{minHeight:54,alignItems:'center',justifyContent:'center',backgroundColor:BrandColors.textDark,borderRadius:Radius.full,marginTop:Spacing.md},submitText:{fontFamily:Typography.bold,color:'#FFF'},disabled:{opacity:.4},error:{color:BrandColors.statusCancelled,backgroundColor:BrandColors.statusCancelledBg,padding:Spacing.md,borderRadius:Radius.md,marginBottom:Spacing.sm},modalOverlay:{flex:1,backgroundColor:'rgba(48,23,38,.45)',alignItems:'center',justifyContent:'center',padding:Spacing.base},confirmCard:{width:'100%',maxWidth:440,backgroundColor:'#FFF',borderRadius:Radius.xl,padding:Spacing.lg},confirmHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},confirmTitle:{fontFamily:Typography.bold,fontSize:19,color:BrandColors.textDark},close:{width:40,height:40,alignItems:'center',justifyContent:'center',borderRadius:20,backgroundColor:'#F6F2F4'},confirmAmount:{fontFamily:Typography.extraBold,fontSize:30,color:BrandColors.accentRose,textAlign:'center',marginVertical:Spacing.lg},confirmText:{fontFamily:Typography.regular,fontSize:13,color:BrandColors.textSecondary},confirmBank:{backgroundColor:BrandColors.bgPinkLight,borderRadius:Radius.md,padding:Spacing.md,marginTop:Spacing.sm},confirmBankName:{fontFamily:Typography.bold,color:BrandColors.textDark},confirmActions:{flexDirection:'row',gap:Spacing.sm,marginTop:Spacing.lg},cancel:{flex:1,minHeight:50,alignItems:'center',justifyContent:'center',borderRadius:Radius.full,backgroundColor:'#F3F0F2'},cancelText:{fontFamily:Typography.bold,color:BrandColors.textDark},confirmButton:{flex:1.3,minHeight:50,alignItems:'center',justifyContent:'center',borderRadius:Radius.full,backgroundColor:BrandColors.accentRose},confirmButtonText:{fontFamily:Typography.bold,color:'#FFF'},
});
