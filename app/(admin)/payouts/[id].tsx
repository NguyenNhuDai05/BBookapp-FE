import React, { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AdminConfirmDialog, type AdminDialogMode } from '../../../components/admin/AdminConfirmDialog';
import { AdminAccessDenied, AdminErrorState, AdminLoadingState } from '../../../components/admin/AdminStates';
import { AdminStatusBadge } from '../../../components/admin/AdminStatusBadge';
import { BrandColors, Radius, Shadows, Spacing, Typography } from '../../../constants/theme';
import { useAdminPayout, useCompleteAdminPayout, useFailAdminPayout, useStartAdminPayout } from '../../../hooks/useAdminPayouts';
import { getApiError } from '../../../services/api';

const money=(value:number)=>`${Math.max(0,value).toLocaleString('vi-VN')}đ`;
const date=(value?:string)=>value?new Date(value).toLocaleString('vi-VN'):'—';

export default function AdminPayoutDetailScreen(){
  const router=useRouter();
  const {id=''}=useLocalSearchParams<{id:string}>();
  const query=useAdminPayout(id);
  const start=useStartAdminPayout(id);
  const complete=useCompleteAdminPayout(id);
  const fail=useFailAdminPayout(id);
  const lock=useRef(false);
  const [dialog,setDialog]=useState<AdminDialogMode|null>(null);
  const [notice,setNotice]=useState<{tone:'success'|'error'|'warning';text:string}|null>(null);
  const [uncertain,setUncertain]=useState(false);
  const payout=query.data;
  const submitting=start.isPending||complete.isPending||fail.isPending;

  const reconcile=async(expected?:string)=>{
    const result=await query.refetch();
    if(!result.isError&&result.data){setUncertain(false);if(expected&&result.data.status===expected)setNotice({tone:'success',text:'Backend đã xác nhận trạng thái mới nhất.'});return result.data;}
    return undefined;
  };

  const handleError=async(error:unknown,expected?:string)=>{
    const value=getApiError(error);
    if(value.status===403){router.replace('/(admin)/access-denied');return;}
    if(value.status===409){const latest=await reconcile().catch(()=>undefined);if(!latest)setUncertain(true);setNotice({tone:'warning',text:latest?(value.message||'Trạng thái payout đã thay đổi. Dữ liệu đã được tải lại.'):'Trạng thái payout đã thay đổi nhưng chưa thể tải lại. Các thao tác tài chính đã bị khóa.'});return;}
    if(value.isNetworkError||!value.status||value.status>=500){setUncertain(true);const latest=await reconcile(expected).catch(()=>undefined);if(!latest)setNotice({tone:'warning',text:'Chưa thể xác minh kết quả thao tác. Không gửi lại yêu cầu cho đến khi tải được trạng thái mới nhất.'});return;}
    setNotice({tone:'error',text:value.status===404?'Dữ liệu không còn tồn tại hoặc đã được xử lý.':value.message});
  };

  const handleStart=async()=>{
    if(lock.current||submitting||uncertain)return;lock.current=true;setNotice(null);
    try{await start.mutateAsync({});setNotice({tone:'success',text:'Payout đã chuyển sang trạng thái đang xử lý.'});}
    catch(error){await handleError(error,'PROCESSING');}
    finally{lock.current=false;}
  };

  const handleDialogSubmit=async(data:{reference:string;failureCode:string;failureMessage:string;confirmedFundsNotSent:boolean})=>{
    if(lock.current||submitting||uncertain)return;lock.current=true;setNotice(null);
    try{
      if(dialog==='complete'){await complete.mutateAsync({reference:data.reference});setNotice({tone:'success',text:'Backend đã xác nhận payout được chi trả.'});}
      else{await fail.mutateAsync({failureCode:data.failureCode,failureMessage:data.failureMessage,confirmedFundsNotSent:data.confirmedFundsNotSent});setNotice({tone:'success',text:'Backend đã ghi nhận payout thất bại.'});}
      setDialog(null);
    }catch(error){setDialog(null);await handleError(error,dialog==='complete'?'PAID':'FAILED');}
    finally{lock.current=false;}
  };

  if(query.isLoading&&!payout)return <SafeAreaView style={styles.safe}><AdminLoadingState message="Đang tải payout..."/></SafeAreaView>;
  if(query.isError&&!payout){const error=getApiError(query.error);return <SafeAreaView style={styles.safe}>{error.status===403?<AdminAccessDenied/>:<AdminErrorState message={error.message} onRetry={()=>query.refetch()} retrying={query.isFetching}/>}</SafeAreaView>;}
  if(!payout)return <SafeAreaView style={styles.safe}><AdminErrorState message="Dữ liệu không còn tồn tại hoặc đã được xử lý." onRetry={()=>query.refetch()} retrying={query.isFetching}/></SafeAreaView>;

  const bank=payout.bankName||payout.bankCode||'Chưa xác định';
  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}><TouchableOpacity style={styles.back} onPress={()=>router.back()} disabled={submitting}><ArrowLeft size={23} color={BrandColors.textDark}/></TouchableOpacity><View style={{flex:1}}><Text style={styles.title}>Chi tiết payout</Text><Text style={styles.id} numberOfLines={1}>{payout.id}</Text></View><AdminStatusBadge status={payout.status}/></View>
    <ScrollView contentContainerStyle={styles.content}>
      {notice?<View style={[styles.notice,notice.tone==='error'&&styles.noticeError,notice.tone==='warning'&&styles.noticeWarning]}><Text style={styles.noticeText}>{notice.text}</Text></View>:null}
      {uncertain?<View style={styles.uncertain}><AlertTriangle size={20} color="#9A3A12"/><View style={{flex:1}}><Text style={styles.uncertainTitle}>Kết quả thao tác chưa được xác minh</Text><Text style={styles.uncertainText}>Các nút tài chính đang bị khóa để tránh gửi lặp.</Text></View><TouchableOpacity style={styles.refresh} onPress={()=>reconcile()} disabled={query.isFetching}>{query.isFetching?<ActivityIndicator color={BrandColors.accentPink}/>:<RefreshCw size={20} color={BrandColors.accentPink}/>}</TouchableOpacity></View>:null}
      <View style={styles.amountCard}><Text style={styles.label}>Số tiền chi trả</Text><Text style={styles.amount}>{money(payout.amount)}</Text><Text style={styles.provider}>Phương thức: {payout.provider==='MANUAL'?'Thủ công':payout.provider}</Text></View>
      <Section title="Tài khoản nhận"><Row label="Ngân hàng" value={bank}/><Row label="Chủ tài khoản" value={payout.accountHolderName||'—'}/><Row label="Số tài khoản" value={payout.accountNumber||payout.maskedAccountNumber||'—'}/></Section>
      <Section title="Thông tin xử lý"><Row label="Trạng thái" value={payout.status}/><Row label="Ngày tạo" value={date(payout.createdAt)}/><Row label="Bắt đầu xử lý" value={date(payout.processingAt)}/><Row label="Đã chi trả" value={date(payout.paidAt)}/><Row label="Mã tham chiếu" value={payout.providerReference||'—'}/><Row label="Số khoản đối soát" value={String(payout.receivableIds.length)}/></Section>
      {payout.failureCode||payout.failureMessage?<Section title="Thông tin thất bại"><Row label="Mã lỗi" value={payout.failureCode||'—'}/><Row label="Lý do" value={payout.failureMessage||'—'}/><Row label="Thời điểm" value={date(payout.failedAt)}/></Section>:null}
      <View style={styles.actions}>
        {(payout.status==='PENDING'||payout.status==='MANUAL_ACTION_REQUIRED')?<TouchableOpacity style={[styles.primary,(submitting||uncertain)&&styles.disabled]} onPress={handleStart} disabled={submitting||uncertain}>{start.isPending?<ActivityIndicator color="#FFF"/>:<Text style={styles.primaryText}>Bắt đầu xử lý</Text>}</TouchableOpacity>:null}
        {payout.status==='PROCESSING'?<><TouchableOpacity style={[styles.primary,(submitting||uncertain)&&styles.disabled]} onPress={()=>setDialog('complete')} disabled={submitting||uncertain}><Text style={styles.primaryText}>Xác nhận đã chuyển khoản</Text></TouchableOpacity><TouchableOpacity style={[styles.fail,(submitting||uncertain)&&styles.disabled]} onPress={()=>setDialog('fail')} disabled={submitting||uncertain}><Text style={styles.failText}>Đánh dấu thất bại</Text></TouchableOpacity></>:null}
        {payout.status==='FAILED'?<Text style={styles.noAction}>Backend payout hiện không hỗ trợ Retry. Không còn thao tác hợp lệ trên payout này.</Text>:null}
        {payout.status==='PAID'?<Text style={styles.noAction}>Payout đã được backend xác nhận chi trả. Không còn thao tác tài chính.</Text>:null}
        {payout.status==='UNKNOWN'?<Text style={styles.noAction}>Trạng thái chưa được ứng dụng nhận diện. Mọi thao tác tài chính đã bị khóa.</Text>:null}
      </View>
    </ScrollView>
    <AdminConfirmDialog visible={dialog!==null} mode={dialog||'complete'} amount={money(payout.amount)} bank={bank} accountHolder={payout.accountHolderName||'—'} maskedAccountNumber={payout.accountNumber||payout.maskedAccountNumber||'—'} status={payout.status} submitting={submitting} onClose={()=>setDialog(null)} onSubmit={handleDialogSubmit}/>
  </SafeAreaView>;
}

function Section({title,children}:{title:string;children:React.ReactNode}){return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>}
function Row({label,value}:{label:string;value:string}){return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:BrandColors.bgPrimary},header:{width:'100%',maxWidth:760,alignSelf:'center',flexDirection:'row',alignItems:'center',gap:10,padding:Spacing.base},back:{width:44,height:44,alignItems:'center',justifyContent:'center'},title:{fontFamily:Typography.extraBold,fontSize:20,color:BrandColors.textDark},id:{fontFamily:Typography.regular,fontSize:11,color:BrandColors.textMuted,marginTop:2},content:{width:'100%',maxWidth:760,alignSelf:'center',padding:Spacing.base,paddingBottom:Spacing.xxl},notice:{padding:Spacing.md,borderRadius:Radius.md,backgroundColor:BrandColors.statusConfirmedBg,marginBottom:Spacing.md},noticeError:{backgroundColor:BrandColors.statusCancelledBg},noticeWarning:{backgroundColor:'#FFF4E8'},noticeText:{fontFamily:Typography.semiBold,fontSize:13,lineHeight:19,color:BrandColors.textDark},uncertain:{flexDirection:'row',alignItems:'center',gap:10,padding:Spacing.md,borderRadius:Radius.md,backgroundColor:'#FFF4E8',marginBottom:Spacing.md},uncertainTitle:{fontFamily:Typography.bold,color:'#7A2E0E'},uncertainText:{fontFamily:Typography.regular,fontSize:12,color:'#7A2E0E',marginTop:2},refresh:{width:44,height:44,alignItems:'center',justifyContent:'center'},amountCard:{alignItems:'center',backgroundColor:BrandColors.textDark,padding:Spacing.lg,borderRadius:Radius.lg,...Shadows.md},label:{fontFamily:Typography.regular,color:'#E8DDE3'},amount:{fontFamily:Typography.extraBold,fontSize:30,color:'#FFF',marginTop:4},provider:{fontFamily:Typography.semiBold,fontSize:12,color:'#E8DDE3',marginTop:6},section:{backgroundColor:'#FFF',padding:Spacing.base,borderRadius:Radius.base,borderWidth:1,borderColor:BrandColors.borderLight,marginTop:Spacing.md},sectionTitle:{fontFamily:Typography.bold,fontSize:15,color:BrandColors.textDark,marginBottom:Spacing.sm},row:{flexDirection:'row',justifyContent:'space-between',gap:Spacing.md,paddingVertical:7},rowLabel:{fontFamily:Typography.regular,color:BrandColors.textSecondary},rowValue:{flex:1,fontFamily:Typography.semiBold,color:BrandColors.textDark,textAlign:'right'},actions:{marginTop:Spacing.lg,gap:Spacing.sm},primary:{minHeight:52,alignItems:'center',justifyContent:'center',borderRadius:Radius.full,backgroundColor:BrandColors.statusConfirmed},primaryText:{fontFamily:Typography.bold,color:'#FFF'},fail:{minHeight:52,alignItems:'center',justifyContent:'center',borderRadius:Radius.full,borderWidth:1,borderColor:BrandColors.statusCancelled},failText:{fontFamily:Typography.bold,color:BrandColors.statusCancelled},disabled:{opacity:.5},noAction:{fontFamily:Typography.semiBold,fontSize:13,lineHeight:19,color:BrandColors.textSecondary,textAlign:'center',padding:Spacing.md}});
