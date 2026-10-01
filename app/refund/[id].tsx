import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, ArrowLeft, Check, Circle, Landmark, RefreshCw } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Radius, Shadows, Spacing, Typography } from '../../constants/theme';
import { refundService } from '../../services/refundService';
import { buildRefundTimeline, formatVnd, isRefundPollingStatus, REFUND_STATUS_LABELS } from '../../utils/bookingStatus';

const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  : '—';

export default function CustomerRefundDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [focused, setFocused] = useState(false);
  const refund = useQuery({
    queryKey: ['customer-refund', id],
    queryFn: () => refundService.getCustomerById(id),
    enabled: Boolean(id),
    refetchInterval: query => focused && isRefundPollingStatus(query.state.data?.status) ? 20_000 : false,
  });
  const refetch = refund.refetch;

  useFocusEffect(useCallback(() => {
    setFocused(true);
    void refetch();
    return () => setFocused(false);
  }, [refetch]));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (focused && state === 'active') void refetch();
    });
    return () => subscription.remove();
  }, [focused, refetch]);

  if (refund.isLoading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={BrandColors.accentPink} /></SafeAreaView>;
  if (refund.isError || !refund.data) return (
    <SafeAreaView style={styles.center}>
      <AlertCircle size={42} color={BrandColors.accentPink} />
      <Text style={styles.errorTitle}>Không thể mở yêu cầu hoàn tiền</Text>
      <Text style={styles.errorBody}>Yêu cầu có thể không còn tồn tại hoặc bạn không có quyền xem.</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={() => refetch()}><Text style={styles.primaryText}>Thử lại</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>Quay lại</Text></TouchableOpacity>
    </SafeAreaView>
  );

  const item = refund.data;
  const timeline = buildRefundTimeline(item);
  return (
    <SafeAreaView style={styles.safe} edges={['top','left','right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.roundButton} onPress={() => router.back()}><ArrowLeft size={23} color={BrandColors.textDark} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Theo dõi hoàn tiền</Text>
        <TouchableOpacity style={styles.roundButton} onPress={() => refetch()}><RefreshCw size={20} color={BrandColors.accentPink} /></TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refund.isRefetching} onRefresh={refetch} tintColor={BrandColors.accentPink} />}
      >
        <View style={styles.hero}>
          <Text style={styles.amount}>{formatVnd(item.amount)}</Text>
          <Text style={[styles.status, item.status === 'FAILED' && styles.failed]}>{REFUND_STATUS_LABELS[item.status]}</Text>
          <Text style={styles.bookingCode}>Booking {item.bookingId}</Text>
        </View>

        {item.status === 'AWAITING_DESTINATION' ? (
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname:'/refund-destination', params:{ refundId:item.refundId, bookingId:item.bookingId } } as never)}>
            <Landmark size={19} color="#FFF" /><Text style={styles.primaryText}>Thêm tài khoản nhận tiền</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tiến trình</Text>
          {timeline.map((step, index) => (
            <View key={step.label} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                {step.completed ? <View style={styles.doneCircle}><Check size={13} color="#FFF" /></View> : <Circle size={22} color={BrandColors.borderLight} />}
                {index < timeline.length - 1 ? <View style={[styles.line, step.completed && styles.doneLine]} /> : null}
              </View>
              <View style={styles.timelineCopy}>
                <Text style={[styles.stepLabel, !step.completed && styles.pendingLabel]}>{step.label}</Text>
                {step.timestamp ? <Text style={styles.stepTime}>{formatDate(step.timestamp)}</Text> : null}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Chi tiết</Text>
          <Row label="Lý do" value={item.reason || 'Booking bị từ chối hoặc hủy'} />
          <Row label="Ngày tạo yêu cầu" value={formatDate(item.createdAt)} />
          {item.processingAt ? <Row label="Bắt đầu xử lý" value={formatDate(item.processingAt)} /> : null}
          {item.completedAt ? <Row label="Hoàn tất" value={formatDate(item.completedAt)} /> : null}
          {item.failedAt ? <Row label="Chưa thành công lúc" value={formatDate(item.failedAt)} /> : null}
        </View>

        {(item.destinationBankName || item.maskedDestinationAccountNumber || item.destinationAccountName) ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tài khoản nhận tiền</Text>
            <Row label="Ngân hàng" value={item.destinationBankName || '—'} />
            <Row label="Số tài khoản" value={item.maskedDestinationAccountNumber || '—'} />
            <Row label="Chủ tài khoản" value={item.destinationAccountName || '—'} />
            {item.status === 'COMPLETED' && item.providerReference ? <Row label="Mã giao dịch" value={item.providerReference} /> : null}
          </View>
        ) : null}

        {item.status === 'FAILED' ? (
          <View style={styles.failureBox}>
            <Text style={styles.failureTitle}>Khoản hoàn chưa thể hoàn tất</Text>
            <Text style={styles.failureBody}>Vui lòng thử tải lại hoặc liên hệ bộ phận hỗ trợ để được kiểm tra.</Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => refetch()}><Text style={styles.secondaryText}>Thử tải lại</Text></TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label:string; value:string }) {
  return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:BrandColors.bgPrimary},
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:32,backgroundColor:BrandColors.bgPrimary},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:16,backgroundColor:'#FFF',borderBottomWidth:1,borderBottomColor:BrandColors.borderDivider},
  roundButton:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:BrandColors.bgPink},
  headerTitle:{fontFamily:Typography.bold,fontSize:18,color:BrandColors.textDark},
  content:{width:'100%',maxWidth:560,alignSelf:'center',padding:Spacing.base,paddingBottom:40},
  hero:{alignItems:'center',backgroundColor:'#FFF',borderRadius:Radius.xl,padding:24,marginBottom:12,...Shadows.card},
  amount:{fontFamily:Typography.bold,fontSize:30,color:BrandColors.textDark},
  status:{fontFamily:Typography.bold,fontSize:15,color:'#168451',marginTop:8,textAlign:'center'},
  failed:{color:'#C62828'},
  bookingCode:{fontFamily:Typography.regular,fontSize:11,color:BrandColors.textMuted,marginTop:8},
  card:{backgroundColor:'#FFF',borderRadius:Radius.xl,padding:Spacing.lg,marginTop:12,borderWidth:1,borderColor:BrandColors.borderLight,...Shadows.sm},
  sectionTitle:{fontFamily:Typography.bold,fontSize:17,color:BrandColors.textDark,marginBottom:12},
  timelineRow:{flexDirection:'row',minHeight:64},
  timelineRail:{width:28,alignItems:'center'},
  doneCircle:{width:22,height:22,borderRadius:11,backgroundColor:BrandColors.accentPink,alignItems:'center',justifyContent:'center'},
  line:{width:2,flex:1,backgroundColor:BrandColors.borderLight},
  doneLine:{backgroundColor:'#F6A3BE'},
  timelineCopy:{flex:1,paddingLeft:10,paddingBottom:16},
  stepLabel:{fontFamily:Typography.semiBold,fontSize:14,color:BrandColors.textDark},
  pendingLabel:{color:BrandColors.textMuted},
  stepTime:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textMuted,marginTop:4},
  row:{flexDirection:'row',justifyContent:'space-between',gap:16,paddingVertical:9,borderBottomWidth:1,borderBottomColor:'#F4F0F2'},
  rowLabel:{flex:1,fontFamily:Typography.regular,color:BrandColors.textMuted},
  rowValue:{flex:1.35,fontFamily:Typography.semiBold,color:BrandColors.textDark,textAlign:'right'},
  primaryButton:{minHeight:48,borderRadius:Radius.full,backgroundColor:BrandColors.accentPink,flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center',paddingHorizontal:20,marginVertical:8},
  primaryText:{fontFamily:Typography.bold,color:'#FFF'},
  secondaryButton:{alignSelf:'flex-start',borderWidth:1,borderColor:BrandColors.accentPink,borderRadius:Radius.full,paddingHorizontal:18,paddingVertical:10,marginTop:14},
  secondaryText:{fontFamily:Typography.bold,color:BrandColors.accentPink},
  failureBox:{backgroundColor:'#FFF3F3',borderRadius:Radius.lg,padding:Spacing.lg,marginTop:12},
  failureTitle:{fontFamily:Typography.bold,color:'#B71C1C',fontSize:16},
  failureBody:{fontFamily:Typography.regular,color:BrandColors.textBody,lineHeight:20,marginTop:6},
  errorTitle:{fontFamily:Typography.bold,fontSize:18,color:BrandColors.textDark,marginTop:14,textAlign:'center'},
  errorBody:{fontFamily:Typography.regular,color:BrandColors.textMuted,lineHeight:20,marginTop:6,textAlign:'center'},
  backText:{fontFamily:Typography.bold,color:BrandColors.textMuted,marginTop:10},
});
