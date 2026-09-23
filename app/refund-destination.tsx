import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Building2, CheckCircle2, Plus, Trash2 } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { refundService } from '../services/refundService';
import { getApiError } from '../services/api';
import { BrandColors, Radius, Spacing, Typography } from '../constants/theme';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

const KEY = ['customer', 'refund-bank-accounts'] as const;
const securityStyles=StyleSheet.create({badge:{fontFamily:Typography.bold,fontSize:10,color:'#9A6700',backgroundColor:'#FFF4CE',paddingHorizontal:8,paddingVertical:3,borderRadius:Radius.full},text:{fontFamily:Typography.regular,fontSize:11,color:'#9A6700',marginTop:5}});

export default function RefundDestinationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refundId, bookingId } = useLocalSearchParams<{ refundId?: string; bookingId?: string }>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const accounts = useQuery({ queryKey: KEY, queryFn: refundService.getBankAccounts });
  const assign = useMutation({
    mutationFn: (bankAccountId: string) => refundService.setDestination(String(refundId), bankAccountId),
    onSuccess: (_, bankAccountId) => {
      void queryClient.invalidateQueries({ queryKey: ['bookingDetail', bookingId] });
      void queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      const selected = accounts.data?.find(item => item.id === bankAccountId);
      const message = selected?.verificationStatus === 'PENDING_ADMIN'
        ? 'Admin đã thấy tài khoản và QR. Khoản hoàn sẽ vào hàng xử lý ngay sau khi admin duyệt.'
        : selected?.isCoolingDown
        ? `Admin đã thấy thông tin tài khoản. Khoản hoàn sẽ tự vào hàng xử lý sau ${new Date(selected.activatedAt).toLocaleString('vi-VN')}.`
        : 'Khoản hoàn đã được đưa vào hàng đợi xử lý.';
      Alert.alert('Đã chọn tài khoản', message, [{ text: 'Xem booking', onPress: () => router.replace(`/booking/${bookingId}` as any) }]);
    },
    onError: error => Alert.alert('Không thể cập nhật', getApiError(error).message),
  });
  const remove = useMutation({
    mutationFn: refundService.deleteBankAccount,
    onSuccess: async () => { setDeleteId(null); await queryClient.invalidateQueries({ queryKey: KEY }); },
    onError: error => Alert.alert('Không thể xóa', getApiError(error).message),
  });
  const openForm = () => router.push({ pathname: '/refund-bank-account-form', params: { refundId, bookingId } } as any);

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}><TouchableOpacity style={styles.icon} onPress={() => router.back()}><ArrowLeft size={23} color={BrandColors.textDark}/></TouchableOpacity><Text style={styles.title}>Tài khoản nhận hoàn tiền</Text><TouchableOpacity style={styles.icon} onPress={openForm}><Plus size={23} color={BrandColors.accentRose}/></TouchableOpacity></View>
    {refundId ? <View style={styles.notice}><Text style={styles.noticeText}>Chọn tài khoản sẽ nhận khoản hoàn này.</Text></View> : null}
    {accounts.isLoading ? <ActivityIndicator style={{ marginTop: 40 }} color={BrandColors.accentRose}/> : accounts.isError ? <Text style={styles.error}>{getApiError(accounts.error).message}</Text> :
      <FlatList data={accounts.data || []} keyExtractor={item => item.id} contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}><Building2 size={38} color={BrandColors.textMuted}/><Text style={styles.emptyTitle}>Chưa có tài khoản nhận tiền</Text><Text style={styles.emptyText}>Thêm tài khoản ngân hàng chính chủ để nhận tiền hoàn.</Text><TouchableOpacity style={styles.add} onPress={openForm}><Text style={styles.addText}>Thêm tài khoản</Text></TouchableOpacity></View>}
        renderItem={({ item }) => <TouchableOpacity style={styles.card} onPress={() => refundId && assign.mutate(item.id)} disabled={assign.isPending} activeOpacity={refundId ? .75 : 1}><View style={{ flex: 1 }}><View style={styles.row}><Text style={styles.bank}>{item.bankName || item.bankBin}</Text>{item.isDefault ? <Text style={styles.defaultBadge}>Mặc định</Text> : null}{item.verificationStatus==='PENDING_ADMIN' ? <Text style={securityStyles.badge}>Chờ admin duyệt</Text> : item.isCoolingDown?<Text style={securityStyles.badge}>Bảo vệ 24h</Text>:null}</View><Text style={styles.number}>{item.maskedAccountNumber}</Text><Text style={styles.holder}>{item.accountHolderName}</Text>{item.verificationStatus==='PENDING_ADMIN'?<Text style={securityStyles.text}>Admin sẽ đối chiếu QR và kích hoạt tài khoản.</Text>:item.isCoolingDown?<Text style={securityStyles.text}>Có thể xử lý sau {new Date(item.activatedAt).toLocaleString('vi-VN')}</Text>:null}</View>{refundId ? <CheckCircle2 size={22} color={BrandColors.accentRose}/> : <TouchableOpacity style={styles.delete} onPress={() => setDeleteId(item.id)}><Trash2 size={19} color={BrandColors.statusCancelled}/></TouchableOpacity>}</TouchableOpacity>}/>
    }
    <ConfirmDialog visible={Boolean(deleteId)} title="Xóa tài khoản" message="Tài khoản sẽ không còn được dùng cho các khoản hoàn tiền mới." confirmLabel="Xóa" destructive loading={remove.isPending} onCancel={() => setDeleteId(null)} onConfirm={() => { if (deleteId) remove.mutate(deleteId); }}/>
  </SafeAreaView>;
}

const styles = StyleSheet.create({safe:{flex:1,backgroundColor:BrandColors.bgPrimary},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:Spacing.md},icon:{width:44,height:44,alignItems:'center',justifyContent:'center'},title:{fontFamily:Typography.bold,fontSize:20,color:BrandColors.textDark},notice:{marginHorizontal:Spacing.base,backgroundColor:BrandColors.bgPink,padding:Spacing.md,borderRadius:Radius.md},noticeText:{fontFamily:Typography.semiBold,fontSize:13,color:BrandColors.textBody},list:{padding:Spacing.base,flexGrow:1},card:{flexDirection:'row',alignItems:'center',backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.borderLight,borderRadius:Radius.md,padding:Spacing.md,marginBottom:Spacing.sm},row:{flexDirection:'row',alignItems:'center',gap:8},bank:{fontFamily:Typography.bold,fontSize:16,color:BrandColors.textDark},defaultBadge:{fontFamily:Typography.bold,fontSize:10,color:BrandColors.statusConfirmed,backgroundColor:BrandColors.statusConfirmedBg,paddingHorizontal:8,paddingVertical:3,borderRadius:Radius.full},number:{fontFamily:Typography.bold,fontSize:15,color:BrandColors.textBody,marginTop:7},holder:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textSecondary,marginTop:3},delete:{width:42,height:42,alignItems:'center',justifyContent:'center'},empty:{alignItems:'center',justifyContent:'center',paddingTop:80,paddingHorizontal:Spacing.xl},emptyTitle:{fontFamily:Typography.bold,fontSize:17,color:BrandColors.textDark,marginTop:Spacing.md},emptyText:{fontFamily:Typography.regular,color:BrandColors.textMuted,textAlign:'center',marginTop:5,marginBottom:Spacing.md},add:{backgroundColor:BrandColors.accentRose,borderRadius:Radius.full,paddingHorizontal:20,paddingVertical:12},addText:{fontFamily:Typography.bold,color:'#FFF'},error:{margin:Spacing.base,padding:Spacing.md,color:BrandColors.statusCancelled,backgroundColor:BrandColors.statusCancelledBg,borderRadius:Radius.md}});
