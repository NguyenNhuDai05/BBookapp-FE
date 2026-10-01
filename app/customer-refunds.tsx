import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, CircleDollarSign } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Radius, Shadows, Spacing, Typography } from '../constants/theme';
import { refundService } from '../services/refundService';
import { formatVnd, REFUND_STATUS_LABELS } from '../utils/bookingStatus';

export default function CustomerRefundsScreen() {
  const router = useRouter();
  const query = useInfiniteQuery({
    queryKey:['customer-refunds'],
    queryFn:({ pageParam }) => refundService.getCustomerRefunds(pageParam, 20),
    initialPageParam:1,
    getNextPageParam:lastPage => lastPage.page * lastPage.pageSize < lastPage.total ? lastPage.page + 1 : undefined,
  });
  const items = query.data?.pages.flatMap(page => page.items) ?? [];
  return (
    <SafeAreaView style={styles.safe} edges={['top','left','right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}><ArrowLeft size={23} color={BrandColors.textDark} /></TouchableOpacity>
        <View><Text style={styles.title}>Các khoản hoàn tiền</Text><Text style={styles.subtitle}>Trạng thái mới nhất từ hệ thống</Text></View>
      </View>
      {query.isLoading ? <View style={styles.center}><ActivityIndicator size="large" color={BrandColors.accentPink} /></View>
        : query.isError ? <View style={styles.center}><Text style={styles.emptyTitle}>Không thể tải yêu cầu hoàn tiền</Text><TouchableOpacity onPress={() => query.refetch()}><Text style={styles.retry}>Thử lại</Text></TouchableOpacity></View>
        : <FlatList
          data={items}
          keyExtractor={item => item.refundId}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} tintColor={BrandColors.accentPink} />}
          contentContainerStyle={styles.list}
          onEndReached={() => { if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          renderItem={({item}) => <TouchableOpacity style={styles.card} onPress={() => router.push({pathname:'/refund/[id]',params:{id:item.refundId}})}>
            <View style={styles.icon}><CircleDollarSign size={24} color={BrandColors.accentPink} /></View>
            <View style={styles.copy}><Text style={styles.amount}>{formatVnd(item.amount)}</Text><Text style={styles.status}>{REFUND_STATUS_LABELS[item.status]}</Text><Text style={styles.date}>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '—'}</Text></View>
            <ChevronRight size={20} color={BrandColors.textMuted} />
          </TouchableOpacity>}
          ListEmptyComponent={<View style={styles.center}><CircleDollarSign size={42} color={BrandColors.accentPink} /><Text style={styles.emptyTitle}>Chưa có yêu cầu hoàn tiền</Text><Text style={styles.emptyBody}>Khi phát sinh khoản hoàn, tiến trình sẽ xuất hiện tại đây.</Text></View>}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={{paddingVertical:16}} color={BrandColors.accentPink} /> : null}
        />}
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:BrandColors.bgPrimary},header:{flexDirection:'row',alignItems:'center',gap:12,padding:16,backgroundColor:'#FFF',borderBottomWidth:1,borderBottomColor:BrandColors.borderDivider},back:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:BrandColors.bgPink},title:{fontFamily:Typography.bold,fontSize:21,color:BrandColors.textDark},subtitle:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textMuted,marginTop:2},list:{width:'100%',maxWidth:560,alignSelf:'center',padding:Spacing.base,paddingBottom:40,flexGrow:1},card:{flexDirection:'row',alignItems:'center',backgroundColor:'#FFF',borderRadius:Radius.lg,padding:16,marginBottom:10,borderWidth:1,borderColor:BrandColors.borderLight,...Shadows.sm},icon:{width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center',backgroundColor:BrandColors.bgPink,marginRight:12},copy:{flex:1},amount:{fontFamily:Typography.bold,fontSize:18,color:BrandColors.textDark},status:{fontFamily:Typography.semiBold,fontSize:13,color:BrandColors.accentPink,marginTop:3},date:{fontFamily:Typography.regular,fontSize:11,color:BrandColors.textMuted,marginTop:5},center:{flex:1,alignItems:'center',justifyContent:'center',padding:32},emptyTitle:{fontFamily:Typography.bold,fontSize:18,color:BrandColors.textDark,textAlign:'center',marginTop:12},emptyBody:{fontFamily:Typography.regular,color:BrandColors.textMuted,textAlign:'center',marginTop:6},retry:{fontFamily:Typography.bold,color:BrandColors.accentPink,marginTop:12}
});
