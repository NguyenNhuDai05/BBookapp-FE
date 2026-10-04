import { AppModal } from '../../components/ui/AppModal';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import {ArrowLeft, Building2, CheckCircle2, Circle} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';
import { useEarningsSnapshot } from '../../hooks/useMuaBookings';
import { useCreateMuaPayout } from '../../hooks/useMuaPayouts';
import { useBankAccounts } from '../../hooks/useBankAccounts';
import { useMuaEligibility } from '../../hooks/useMuaEligibility';
import { getApiError } from '../../services/api';
import { canSubmitWithdraw, getBankAccountErrorMessage, getBankAccountPresentation, isBankAccountSelectable } from '../../utils/bankAccountStatus';

import { useAuthStore } from '../../store/useAuthStore';
import { canRequestSamplePayout, REVIEW_FINANCIAL_NOTICE } from '../../utils/playReview';
import { ReviewNotice } from '../../components/ReviewNotice';

const money = (value: number) => `${Math.max(0, value).toLocaleString('vi-VN')}đ`;

export default function WithdrawScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const review = user?.isDemoAccount === true;
  const earnings = useEarningsSnapshot('me');
  const banks = useBankAccounts();
  const create = useCreateMuaPayout();
  const eligibility = useMuaEligibility();
  const submitLock = useRef(false);
  const [selected, setSelected] = useState<string>();
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [key] = useState(() => Crypto.randomUUID());
  const permittedId = earnings.data?.permittedSimulationBankAccountId;
  const visibleBanks = review ? banks.data?.filter(bank => bank.id === permittedId) : banks.data;
  const selectedId = review ? permittedId ?? undefined : selected || (banks.data?.find(item => item.isDefault && isBankAccountSelectable(item))?.id ?? banks.data?.find(isBankAccountSelectable)?.id);
  const selectedBank = banks.data?.find(item => item.id === selectedId);
  const availableIds = useMemo(
    () => earnings.data?.receivables.filter(item => item.status === 1).map(item => item.id) ?? [],
    [earnings.data],
  );
  const amount = earnings.data?.availableTotal ?? 0;
  const loading = earnings.isLoading || banks.isLoading || eligibility.isLoading;
  const canSubmit = amount > 0 && (review ? canRequestSamplePayout(user, earnings.data) && selectedBank?.id === permittedId : canSubmitWithdraw(eligibility.data?.canWithdraw===true,selectedBank)) && !create.isPending;

  const openConfirmation = () => {
    if (!canSubmit) return;
    setSubmitError('');
    setConfirmationVisible(true);
  };

  const confirmWithdraw = async () => {
    if (!canSubmit || !selectedId || amount <= 0 || create.isPending || submitLock.current) return;
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
        : getBankAccountErrorMessage(value.code,value.message));
    } finally {
      submitLock.current = false;
    }
  };

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}><TouchableOpacity style={styles.back} onPress={() => router.back()} disabled={create.isPending}><ArrowLeft size={23} color={BrandColors.textDark}/></TouchableOpacity><Text style={styles.title}>{review?'Rút tiền mẫu':'Rút tiền'}</Text><View style={styles.back}/></View>
    <ScrollView contentContainerStyle={styles.content}>{review?<ReviewNotice message={REVIEW_FINANCIAL_NOTICE}/>:null}
      {loading ? <ActivityIndicator color={BrandColors.accentRose}/> : earnings.isError || banks.isError || eligibility.isError ? <Text style={styles.error}>{getApiError(earnings.error || banks.error || eligibility.error).message}</Text> : <>
        <View style={styles.amountCard}><Text style={styles.label}>Số tiền yêu cầu</Text><Text style={styles.amount}>{money(amount)}</Text><Text style={styles.caption}>{availableIds.length} khoản thu nhập khả dụng</Text></View>
        <View style={styles.sectionRow}><Text style={styles.section}>Tài khoản nhận</Text><TouchableOpacity disabled={review} onPress={() => router.push('/(mua)/bank-account-form' as any)}><Text style={styles.link}>Thêm mới</Text></TouchableOpacity></View>
        {!visibleBanks?.length ? <TouchableOpacity disabled={review} style={styles.empty} onPress={() => router.push('/(mua)/bank-account-form' as any)}><Building2 size={30} color={BrandColors.textMuted}/><Text style={styles.emptyText}>{review ? 'Tài khoản mẫu hiện chưa khả dụng. Vui lòng làm mới thu nhập.' : 'Thêm tài khoản ngân hàng trước khi rút tiền.'}</Text></TouchableOpacity> : visibleBanks!.map(bank => {const state=getBankAccountPresentation(bank);const selectable=review?canRequestSamplePayout(user,earnings.data)&&bank.id===permittedId:state.selectable;return <TouchableOpacity key={bank.id} style={[styles.bank, selectedId === bank.id && styles.bankSelected,!selectable&&styles.bankDisabled]} onPress={() => selectable&&setSelected(bank.id)} disabled={!selectable}><View style={{flex:1}}><Text style={styles.bankName}>{bank.bankName || bank.bankCode}</Text><Text style={styles.bankMeta}>{bank.maskedAccountNumber} · {bank.accountHolderName}</Text><Text style={[styles.bankState,state.selectable&&styles.bankStateUsable]}>{review?'Tài khoản mẫu · '+state.label:state.label}</Text></View>{selectedId === bank.id ? <CheckCircle2 size={22} color={BrandColors.accentRose}/> : <Circle size={22} color={BrandColors.textMuted}/>}</TouchableOpacity>})}
        <Text style={styles.notice}>{review ? REVIEW_FINANCIAL_NOTICE : 'Số tiền được Backend tính từ các khoản phải thu khả dụng. Sau khi gửi, yêu cầu sẽ chờ Admin kiểm tra và chuyển khoản.'}</Text>
        {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
        <TouchableOpacity style={[styles.submit, !canSubmit && styles.disabled]} disabled={!canSubmit} onPress={openConfirmation}>{create.isPending ? <ActivityIndicator color="#FFF"/> : <Text style={styles.submitText}>Xác nhận rút {money(amount)}</Text>}</TouchableOpacity>
      </>}
    </ScrollView>

    <AppModal visible={confirmationVisible} title="Xác nhận rút tiền" variant="confirm"
    description={review ? REVIEW_FINANCIAL_NOTICE : "Tiền sẽ được chuyển tới tài khoản dưới đây sau khi yêu cầu được xử lý."}
    loading={create.isPending} onClose={()=>setConfirmationVisible(false)}
    primaryAction={{label:'Gửi yêu cầu',onPress:confirmWithdraw,loading:create.isPending}}
    secondaryAction={{label:'Quay lại',onPress:()=>setConfirmationVisible(false)}}>
      <Text style={styles.confirmAmount}>{money(amount)}</Text>
      <View style={styles.confirmBank}><Text style={styles.confirmBankName}>{selectedBank?.bankName || selectedBank?.bankCode}</Text><Text style={styles.bankMeta}>{selectedBank?.maskedAccountNumber} · {selectedBank?.accountHolderName}</Text></View>
    </AppModal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
safe:{flex:1,backgroundColor:BrandColors.bgPrimary},
header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:Spacing.md},
back:{width:44,height:44,alignItems:'center',justifyContent:'center'},
title:{fontFamily:Typography.bold,fontSize:20,color:BrandColors.textDark},
content:{padding:Spacing.base,paddingBottom:Spacing.xxl},
amountCard:{backgroundColor:BrandColors.accentRose,borderRadius:Radius.lg,padding:Spacing.lg,alignItems:'center'},
label:{fontFamily:Typography.medium,color:'#FFEAF0'},
amount:{fontFamily:Typography.extraBold,fontSize:32,color:'#FFF',marginVertical:4},
caption:{fontFamily:Typography.regular,fontSize:12,color:'#FFEAF0'},
sectionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:Spacing.xl,marginBottom:Spacing.sm},
section:{fontFamily:Typography.bold,fontSize:17,color:BrandColors.textDark},
link:{fontFamily:Typography.bold,color:BrandColors.accentRose},
bank:{flexDirection:'row',alignItems:'center',backgroundColor:'#FFF',padding:Spacing.md,borderRadius:Radius.md,borderWidth:1,borderColor:BrandColors.borderLight,marginBottom:Spacing.sm},
bankSelected:{borderColor:BrandColors.accentRose,backgroundColor:BrandColors.bgPinkLight},
bankDisabled:{opacity:.58},
bankName:{fontFamily:Typography.bold,color:BrandColors.textDark},
bankMeta:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textSecondary,marginTop:4},
bankState:{fontFamily:Typography.semiBold,fontSize:11,color:'#9A6700',marginTop:5},
bankStateUsable:{color:BrandColors.statusConfirmed},
empty:{alignItems:'center',padding:Spacing.xl,backgroundColor:'#FFF',borderRadius:Radius.md,borderWidth:1,borderStyle:'dashed',borderColor:BrandColors.borderLight},
emptyText:{fontFamily:Typography.regular,color:BrandColors.textMuted,textAlign:'center',marginTop:10},
notice:{fontFamily:Typography.regular,fontSize:12,lineHeight:18,color:BrandColors.textSecondary,marginVertical:Spacing.lg},
submit:{minHeight:54,alignItems:'center',justifyContent:'center',backgroundColor:BrandColors.textDark,borderRadius:Radius.full,marginTop:Spacing.md},
submitText:{fontFamily:Typography.bold,color:'#FFF'},
disabled:{opacity:.4},
error:{color:BrandColors.statusCancelled,backgroundColor:BrandColors.statusCancelledBg,padding:Spacing.md,borderRadius:Radius.md,marginBottom:Spacing.sm},
confirmAmount:{fontFamily:Typography.extraBold,fontSize:30,color:BrandColors.accentRose,textAlign:'center',marginVertical:Spacing.lg},
confirmBank:{backgroundColor:BrandColors.bgPinkLight,borderRadius:Radius.md,padding:Spacing.md,marginTop:Spacing.sm},
confirmBankName:{fontFamily:Typography.bold,color:BrandColors.textDark}
});
