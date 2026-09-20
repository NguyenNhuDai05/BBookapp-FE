import React, { useMemo } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, ChevronRight, Circle, RefreshCw } from 'lucide-react-native';
import { useMuaEligibility } from '../../hooks/useMuaEligibility';
import { BrandColors, Radius, Shadows, Spacing, Typography } from '../../constants/theme';

const routes: Record<string, string> = {
  accountActive: '/(mua)/settings', basicInformation: '/(mua)/edit-profile', phoneNumber: '/(mua)/edit-profile', city: '/(mua)/edit-profile', bio: '/(mua)/edit-profile', specialty: '/(mua)/edit-profile', activeService: '/(mua)/services', publicPortfolioImages: '/(mua)/services?tab=PORTFOLIO', workingSchedule: '/(mua)/working-hours',
};

export default function MuaSetupScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useMuaEligibility();
  const completed = useMemo(() => data?.requirements.filter(item => item.isMet).length || 0, [data]);

  if (isLoading) return <SafeAreaView style={styles.center}><ActivityIndicator color={BrandColors.accentRose} /><Text style={styles.loading}>Đang kiểm tra hồ sơ...</Text></SafeAreaView>;
  if (isError || !data) return <SafeAreaView style={styles.center}><Text style={styles.errorTitle}>Không thể tải tiến độ hồ sơ</Text><TouchableOpacity style={styles.retry} onPress={() => refetch()}><RefreshCw size={17} color="#FFF"/><Text style={styles.retryText}>Thử lại</Text></TouchableOpacity></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}><TouchableOpacity onPress={() => router.back()} style={styles.iconButton} accessibilityLabel="Quay lại"><ArrowLeft size={23} color={BrandColors.textDark}/></TouchableOpacity><Text style={styles.headerTitle}>Hoàn thiện hồ sơ</Text><View style={styles.iconButton}/></View>
      <ScrollView refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={BrandColors.accentRose}/>} contentContainerStyle={styles.content}>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}><Text style={styles.progressTitle}>{data.completionPercentage}% hoàn thành</Text><Text style={styles.progressMeta}>{completed}/{data.requirements.length} mục</Text></View>
          <View style={styles.track}><View style={[styles.fill, { width: `${data.completionPercentage}%` }]}/></View>
          <Text style={styles.support}>Hoàn thành các mục bắt buộc để hồ sơ được công khai và bắt đầu nhận booking.</Text>
        </View>

        <Text style={styles.sectionTitle}>Các mục cần hoàn thiện</Text>
        <View style={styles.list}>
          {data.requirements.map((item, index) => {
            const route = routes[item.key];
            return <TouchableOpacity key={item.key} disabled={item.isMet || !route} onPress={() => router.push(route as any)} style={[styles.row, index > 0 && styles.rowBorder]} accessibilityRole={route ? 'button' : undefined}>
              <View style={[styles.statusIcon, item.isMet && styles.statusIconDone]}>{item.isMet ? <CheckCircle2 size={20} color={BrandColors.statusConfirmed}/> : <Circle size={20} color={BrandColors.textMuted}/>}</View>
              <View style={styles.rowCopy}><Text style={styles.rowTitle}>{item.label}</Text><Text style={styles.rowSubtitle}>{item.isMet ? 'Đã hoàn tất' : item.current != null && item.required != null ? `${item.current}/${item.required} đã hoàn thành` : 'Chưa hoàn tất'}</Text></View>
              {!item.isMet && route ? <ChevronRight size={20} color={BrandColors.textMuted}/> : null}
            </TouchableOpacity>;
          })}
        </View>

        <Text style={styles.sectionTitle}>Thiết lập bổ sung</Text>
        <View style={styles.optional}><Text style={styles.optionalTitle}>Xác minh & tài khoản nhận tiền</Text><Text style={styles.optionalText}>Các thiết lập này không chặn việc nhận booking khi backend chưa yêu cầu. Bạn có thể hoàn thiện sau trong Cài đặt.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:BrandColors.bgPrimary},center:{flex:1,alignItems:'center',justifyContent:'center',padding:Spacing.lg,backgroundColor:BrandColors.bgPrimary},loading:{marginTop:10,color:BrandColors.textMuted},errorTitle:{fontFamily:Typography.bold,fontSize:17,color:BrandColors.textDark},retry:{marginTop:16,minHeight:44,paddingHorizontal:20,borderRadius:Radius.md,backgroundColor:BrandColors.accentRose,flexDirection:'row',alignItems:'center',gap:8},retryText:{color:'#FFF',fontFamily:Typography.bold},header:{height:58,paddingHorizontal:Spacing.md,backgroundColor:'#FFF',flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:BrandColors.borderLight},iconButton:{width:44,height:44,alignItems:'center',justifyContent:'center'},headerTitle:{fontFamily:Typography.bold,fontSize:18,color:BrandColors.textDark},content:{padding:Spacing.base,paddingBottom:Spacing.xxl},progressCard:{backgroundColor:'#FFF',padding:Spacing.lg,borderRadius:Radius.base,borderWidth:1,borderColor:BrandColors.borderLight,...Shadows.sm},progressHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},progressTitle:{fontFamily:Typography.extraBold,fontSize:20,color:BrandColors.textDark},progressMeta:{fontFamily:Typography.bold,color:BrandColors.accentRose},track:{height:9,borderRadius:Radius.full,backgroundColor:BrandColors.bgPink,overflow:'hidden',marginTop:14},fill:{height:'100%',backgroundColor:BrandColors.accentPink,borderRadius:Radius.full},support:{fontFamily:Typography.regular,fontSize:14,lineHeight:20,color:BrandColors.textBody,marginTop:14},sectionTitle:{fontFamily:Typography.bold,fontSize:16,color:BrandColors.textDark,marginTop:Spacing.lg,marginBottom:Spacing.sm},list:{backgroundColor:'#FFF',borderRadius:Radius.base,borderWidth:1,borderColor:BrandColors.borderLight,overflow:'hidden'},row:{minHeight:72,paddingHorizontal:Spacing.md,flexDirection:'row',alignItems:'center'},rowBorder:{borderTopWidth:1,borderTopColor:BrandColors.borderDivider},statusIcon:{width:34,alignItems:'flex-start'},statusIconDone:{opacity:.9},rowCopy:{flex:1,paddingVertical:12},rowTitle:{fontFamily:Typography.semiBold,fontSize:15,color:BrandColors.textDark},rowSubtitle:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textMuted,marginTop:3},optional:{backgroundColor:BrandColors.bgPinkLight,borderRadius:Radius.base,padding:Spacing.base,borderWidth:1,borderColor:BrandColors.borderLight},optionalTitle:{fontFamily:Typography.semiBold,fontSize:14,color:BrandColors.textDark},optionalText:{fontFamily:Typography.regular,fontSize:12,lineHeight:18,color:BrandColors.textMuted,marginTop:5},
});
