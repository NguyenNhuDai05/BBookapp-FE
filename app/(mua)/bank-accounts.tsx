import { useAuthStore } from '../../store/useAuthStore';
import { ReviewNotice } from '../../components/ReviewNotice';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Building2, Pencil, Plus, Star, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';
import { useBankAccounts, useDeleteBankAccount, useSetDefaultBankAccount } from '../../hooks/useBankAccounts';
import { getApiError } from '../../services/api';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { FeedbackDialog } from '../../components/common/FeedbackDialog';
import { BankDefaultPasswordModal } from '../../components/bank/BankDefaultPasswordModal';
import { canOfferBankDefault, getBankAccountErrorMessage, getBankAccountPresentation, isEffectiveBankDefault } from '../../utils/bankAccountStatus';
import type { BankAccount } from '../../types/bankAccount';

export default function BankAccountsScreen(){
  const router=useRouter();
  const review=useAuthStore(state=>state.user?.isDemoAccount===true);
  const query=useBankAccounts();
  const remove=useDeleteBankAccount();
  const setDefault=useSetDefaultBankAccount();
  const submitLock=useRef(false);
  const [deleteId,setDeleteId]=useState<string|null>(null);
  const [defaultId,setDefaultId]=useState<string|null>(null);
  const [feedback,setFeedback]=useState<{title:string;message:string;error?:boolean}|null>(null);
  const confirmDelete=async()=>{if(!deleteId||remove.isPending)return;try{await remove.mutateAsync(deleteId);setDeleteId(null);setFeedback({title:'Đã xóa tài khoản',message:'Tài khoản không còn được dùng cho giao dịch mới.'});}catch(error){setFeedback({title:'Không thể xóa',message:getApiError(error).message,error:true});}};
  const confirmDefault=async(currentPassword:string,otp?:string)=>{if(!defaultId||setDefault.isPending||submitLock.current)return;submitLock.current=true;try{await setDefault.mutateAsync({id:defaultId,currentPassword,otp});setDefaultId(null);setFeedback({title:'Đã đặt mặc định',message:'Tài khoản nhận tiền mặc định đã được cập nhật.'});}catch(error){const value=getApiError(error);setFeedback({title:'Không thể đặt mặc định',message:getBankAccountErrorMessage(value.code,value.message),error:true});}finally{submitLock.current=false;}};
  const edit=(item:BankAccount)=>router.push({pathname:'/(mua)/bank-account-form',params:{id:item.id,bankCode:item.bankCode,bankName:item.bankName||'',holder:item.accountHolderName,financialQrMediaId:item.financialQrMediaId||''}} as never);
  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}><TouchableOpacity style={styles.icon} onPress={()=>router.back()}><ArrowLeft size={23} color={BrandColors.textDark}/></TouchableOpacity><Text style={styles.title}>Tài khoản ngân hàng</Text><TouchableOpacity disabled={review} style={styles.icon} onPress={()=>router.push('/(mua)/bank-account-form' as never)}><Plus size={23} color={BrandColors.accentRose}/></TouchableOpacity></View>
    {review?<ReviewNotice title="Tài khoản mẫu"/>:null}
    {query.isLoading?<ActivityIndicator style={{marginTop:40}} color={BrandColors.accentRose}/>:query.isError?<Text style={styles.error}>{getApiError(query.error).message}</Text>:<FlatList data={query.data||[]} keyExtractor={x=>x.id} contentContainerStyle={styles.list} ListEmptyComponent={<View style={styles.empty}><Building2 size={35} color={BrandColors.textMuted}/><Text style={styles.emptyText}>Chưa có tài khoản nhận tiền.</Text><TouchableOpacity disabled={review} style={styles.add} onPress={()=>router.push('/(mua)/bank-account-form' as never)}><Text style={styles.addText}>Thêm tài khoản</Text></TouchableOpacity></View>} renderItem={({item})=>{const state=getBankAccountPresentation(item);const effectiveDefault=isEffectiveBankDefault(item);return <View style={styles.card}><View style={styles.copy}><View style={styles.row}><Text style={styles.bank}>{item.bankName||item.bankCode}</Text>{effectiveDefault?<Text style={styles.default}>Mặc định</Text>:null}</View><Text style={styles.number}>{item.maskedAccountNumber}</Text><Text style={styles.holder}>{item.accountHolderName}</Text><Text style={[styles.state,state.selectable&&styles.stateUsable]}>{review?'Tài khoản mẫu · '+state.label:state.label}</Text>{!review&&canOfferBankDefault(item)?<TouchableOpacity style={styles.defaultButton} onPress={()=>setDefaultId(item.id)} disabled={setDefault.isPending}><Star size={15} color={BrandColors.accentRose}/><Text style={styles.defaultButtonText}>Đặt làm mặc định</Text></TouchableOpacity>:null}</View><TouchableOpacity disabled={review} style={styles.action} onPress={()=>edit(item)}><Pencil size={18} color={BrandColors.accentRose}/></TouchableOpacity><TouchableOpacity style={styles.action} onPress={()=>setDeleteId(item.id)} disabled={review||remove.isPending}><Trash2 size={19} color={BrandColors.statusCancelled}/></TouchableOpacity></View>;}}/>}
    <ConfirmDialog visible={Boolean(deleteId)} title="Xóa tài khoản" message="Tài khoản sẽ không còn được dùng cho các yêu cầu rút tiền mới." confirmLabel="Xóa" destructive loading={remove.isPending} onCancel={()=>setDeleteId(null)} onConfirm={confirmDelete}/>
    <BankDefaultPasswordModal accountId={defaultId||undefined} visible={Boolean(defaultId)} loading={setDefault.isPending} onCancel={()=>setDefaultId(null)} onSubmit={confirmDefault}/>
    <FeedbackDialog visible={Boolean(feedback)} title={feedback?.title||''} message={feedback?.message||''} error={feedback?.error} onClose={()=>setFeedback(null)}/>
  </SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:BrandColors.bgPrimary},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:Spacing.md},icon:{width:44,height:44,alignItems:'center',justifyContent:'center'},title:{fontFamily:Typography.bold,fontSize:20,color:BrandColors.textDark},list:{padding:Spacing.base,flexGrow:1},card:{flexDirection:'row',alignItems:'center',backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.borderLight,borderRadius:Radius.md,padding:Spacing.md,marginBottom:Spacing.sm},copy:{flex:1},row:{flexDirection:'row',alignItems:'center',gap:8},bank:{fontFamily:Typography.bold,fontSize:16,color:BrandColors.textDark},default:{fontFamily:Typography.bold,fontSize:10,color:BrandColors.statusConfirmed,backgroundColor:BrandColors.statusConfirmedBg,paddingHorizontal:8,paddingVertical:3,borderRadius:Radius.full},number:{fontFamily:Typography.bold,fontSize:15,color:BrandColors.textBody,marginTop:7},holder:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textSecondary,marginTop:3},state:{fontFamily:Typography.semiBold,fontSize:11,color:'#9A6700',marginTop:6},stateUsable:{color:BrandColors.statusConfirmed},defaultButton:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:6,marginTop:10,paddingHorizontal:12,paddingVertical:8,borderRadius:Radius.full,backgroundColor:BrandColors.bgPinkLight},defaultButtonText:{fontFamily:Typography.bold,fontSize:12,color:BrandColors.accentRose},action:{width:42,height:42,alignItems:'center',justifyContent:'center'},empty:{alignItems:'center',justifyContent:'center',paddingTop:80},emptyText:{fontFamily:Typography.regular,color:BrandColors.textMuted,marginVertical:Spacing.md},add:{backgroundColor:BrandColors.accentRose,borderRadius:Radius.full,paddingHorizontal:20,paddingVertical:12},addText:{fontFamily:Typography.bold,color:'#FFF'},error:{margin:Spacing.base,padding:Spacing.md,color:BrandColors.statusCancelled,backgroundColor:BrandColors.statusCancelledBg,borderRadius:Radius.md}});
