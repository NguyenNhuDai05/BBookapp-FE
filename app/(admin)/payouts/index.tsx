import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { AdminAccessDenied, AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../../components/admin/AdminStates';
import { AdminStatusBadge } from '../../../components/admin/AdminStatusBadge';
import { BrandColors, Radius, Shadows, Spacing, Typography } from '../../../constants/theme';
import { adminPayoutDetailKey, useAdminPayouts } from '../../../hooks/useAdminPayouts';
import { getApiError } from '../../../services/api';
import type { AdminPayoutDto } from '../../../types/adminPayout';

type Filter='ACTION'|'PROCESSING'|'FAILED';
const money=(value:number)=>`${Math.max(0,value).toLocaleString('vi-VN')}đ`;
const date=(value:string)=>value?new Date(value).toLocaleString('vi-VN'):'—';

export default function AdminPayoutListScreen(){
  const router=useRouter();
  const queryClient=useQueryClient();
  const [filter,setFilter]=useState<Filter>('ACTION');
  const query=useAdminPayouts();
  const items=useMemo(()=>{const data=query.data||[];if(filter==='ACTION')return data.filter(x=>x.status==='PENDING'||x.status==='MANUAL_ACTION_REQUIRED'||x.status==='UNKNOWN');if(filter==='PROCESSING')return data.filter(x=>x.status==='PROCESSING');return data.filter(x=>x.status==='FAILED');},[query.data,filter]);
  const open=(item:AdminPayoutDto)=>{queryClient.setQueryData(adminPayoutDetailKey(item.id),item);router.push({pathname:'/(admin)/payouts/[id]',params:{id:item.id}} as any);};
  const apiError=getApiError(query.error);
  if(query.isLoading&&!query.data)return <SafeAreaView style={styles.safe}><AdminLoadingState message="Đang tải hàng đợi payout..."/></SafeAreaView>;
  if(query.isError&&!query.data)return <SafeAreaView style={styles.safe}>{apiError.status===403?<AdminAccessDenied/>:<AdminErrorState message={apiError.status===404?'Dữ liệu không còn tồn tại hoặc đã được xử lý.':apiError.message} onRetry={()=>query.refetch()} retrying={query.isFetching}/>}</SafeAreaView>;
  return <SafeAreaView style={styles.safe} edges={['top']}><View style={styles.header}><TouchableOpacity style={styles.back} onPress={()=>router.back()}><ArrowLeft size={23} color={BrandColors.textDark}/></TouchableOpacity><View style={{flex:1}}><Text style={styles.title}>Chi trả MUA</Text><Text style={styles.subtitle}>Hàng đợi payout cần vận hành thủ công</Text></View></View>
    <View style={styles.tabs}>{([['ACTION','Cần xử lý'],['PROCESSING','Đang xử lý'],['FAILED','Thất bại']] as const).map(([key,label])=><TouchableOpacity key={key} style={[styles.tab,filter===key&&styles.tabActive]} onPress={()=>setFilter(key)}><Text style={[styles.tabText,filter===key&&styles.tabTextActive]}>{label}</Text></TouchableOpacity>)}</View>
    <FlatList data={items} keyExtractor={item=>item.id} contentContainerStyle={[styles.list,!items.length&&styles.emptyList]} refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={()=>query.refetch()} tintColor={BrandColors.accentPink}/>} ListEmptyComponent={<AdminEmptyState title="Không có payout" message="Không có payout nào trong trạng thái này."/>} renderItem={({item})=><TouchableOpacity style={styles.card} onPress={()=>open(item)} activeOpacity={.8}><View style={styles.cardTop}><Text style={styles.amount}>{money(item.amount)}</Text><AdminStatusBadge status={item.status}/></View><Text style={styles.holder}>{item.accountHolderName||'Chưa có tên chủ tài khoản'}</Text><Text style={styles.bank}>{item.bankName||item.bankCode||'Ngân hàng chưa xác định'} · {item.maskedAccountNumber||'••••'}</Text><View style={styles.cardBottom}><Text style={styles.created}>{date(item.createdAt)}</Text><ChevronRight size={19} color={BrandColors.textMuted}/></View></TouchableOpacity>}/>
  </SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:BrandColors.bgPrimary},header:{width:'100%',maxWidth:760,alignSelf:'center',flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:Spacing.base,paddingVertical:Spacing.md},back:{width:44,height:44,alignItems:'center',justifyContent:'center'},title:{fontFamily:Typography.extraBold,fontSize:21,color:BrandColors.textDark},subtitle:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textSecondary,marginTop:2},tabs:{width:'100%',maxWidth:760,alignSelf:'center',flexDirection:'row',paddingHorizontal:Spacing.base,gap:6},tab:{flex:1,minHeight:42,alignItems:'center',justifyContent:'center',borderRadius:Radius.full,backgroundColor:'#F0ECEE'},tabActive:{backgroundColor:BrandColors.accentPink},tabText:{fontFamily:Typography.semiBold,fontSize:12,color:BrandColors.textSecondary},tabTextActive:{color:'#FFF'},list:{width:'100%',maxWidth:760,alignSelf:'center',padding:Spacing.base,paddingBottom:Spacing.xxl},emptyList:{flexGrow:1},card:{backgroundColor:'#FFF',padding:Spacing.base,borderRadius:Radius.base,borderWidth:1,borderColor:BrandColors.borderLight,marginBottom:Spacing.sm,...Shadows.sm},cardTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},amount:{fontFamily:Typography.extraBold,fontSize:20,color:BrandColors.textDark},holder:{fontFamily:Typography.bold,fontSize:14,color:BrandColors.textDark,marginTop:Spacing.md},bank:{fontFamily:Typography.regular,fontSize:13,color:BrandColors.textSecondary,marginTop:3},cardBottom:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:Spacing.md,paddingTop:Spacing.sm,borderTopWidth:1,borderTopColor:BrandColors.borderDivider},created:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textMuted}});
