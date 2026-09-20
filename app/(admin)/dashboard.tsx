import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Banknote, CalendarClock, ChevronRight, LogOut, RotateCcw, ShieldCheck, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BrandColors, Radius, Shadows, Spacing, Typography } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';

const unavailable = [
  {title:'MUA và tài khoản',subtitle:'Chưa có API danh sách quản trị',icon:Users},
  {title:'Booking',subtitle:'Chưa có API danh sách quản trị',icon:CalendarClock},
];

export default function AdminDashboard(){
  const router=useRouter();
  const user=useAuthStore(state=>state.user);
  const logout=useAuthStore(state=>state.logout);
  const handleLogout=async()=>{await logout();router.replace('/(auth)/login');};
  return <SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>ADMIN PORTAL</Text><Text style={styles.title}>Xin chào, {user?.name||'Admin'}</Text></View><TouchableOpacity style={styles.logout} onPress={handleLogout} accessibilityLabel="Đăng xuất"><LogOut size={21} color={BrandColors.statusCancelled}/></TouchableOpacity></View>
    <View style={styles.security}><ShieldCheck size={22} color={BrandColors.statusConfirmed}/><View style={{flex:1}}><Text style={styles.securityTitle}>Khu vực vận hành bảo mật</Text><Text style={styles.securityText}>Các thao tác tài chính luôn sử dụng trạng thái xác nhận từ backend.</Text></View></View>
    <Text style={styles.section}>Vận hành</Text>
    <TouchableOpacity style={styles.card} onPress={()=>router.push('/(admin)/payouts' as any)} activeOpacity={.8}><View style={styles.icon}><Banknote size={24} color={BrandColors.accentPink}/></View><View style={styles.copy}><Text style={styles.cardTitle}>Chi trả MUA</Text><Text style={styles.cardText}>Xử lý hàng đợi payout thủ công</Text></View><ChevronRight size={20} color={BrandColors.textMuted}/></TouchableOpacity>
    <TouchableOpacity style={styles.card} onPress={()=>router.push('/(admin)/refunds' as any)} activeOpacity={.8}><View style={styles.icon}><RotateCcw size={24} color={BrandColors.accentPink}/></View><View style={styles.copy}><Text style={styles.cardTitle}>Hoàn tiền customer</Text><Text style={styles.cardText}>Xử lý và đối soát các khoản hoàn</Text></View><ChevronRight size={20} color={BrandColors.textMuted}/></TouchableOpacity>
    <Text style={styles.section}>Chưa khả dụng</Text>
    {unavailable.map(item=><View key={item.title} style={[styles.card,styles.disabled]}><View style={[styles.icon,styles.disabledIcon]}><item.icon size={23} color={BrandColors.textMuted}/></View><View style={styles.copy}><Text style={styles.disabledTitle}>{item.title}</Text><Text style={styles.cardText}>{item.subtitle}</Text></View><View style={styles.badge}><Text style={styles.badgeText}>Chưa khả dụng</Text></View></View>)}
  </ScrollView></SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:BrandColors.bgPrimary},content:{width:'100%',maxWidth:760,alignSelf:'center',padding:Spacing.base,paddingBottom:Spacing.xxl},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:Spacing.md},eyebrow:{fontFamily:Typography.bold,fontSize:11,letterSpacing:1.2,color:BrandColors.accentPink},title:{fontFamily:Typography.extraBold,fontSize:23,color:BrandColors.textDark,marginTop:3},logout:{width:46,height:46,borderRadius:23,alignItems:'center',justifyContent:'center',backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.borderLight},security:{flexDirection:'row',gap:12,backgroundColor:BrandColors.statusConfirmedBg,padding:Spacing.md,borderRadius:Radius.base,marginTop:Spacing.sm},securityTitle:{fontFamily:Typography.bold,color:BrandColors.statusConfirmed},securityText:{fontFamily:Typography.regular,fontSize:13,lineHeight:18,color:BrandColors.textBody,marginTop:2},section:{fontFamily:Typography.bold,fontSize:15,color:BrandColors.textDark,marginTop:Spacing.lg,marginBottom:Spacing.sm},card:{minHeight:82,flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.borderLight,borderRadius:Radius.base,padding:Spacing.md,marginBottom:Spacing.sm,...Shadows.sm},icon:{width:46,height:46,borderRadius:Radius.md,alignItems:'center',justifyContent:'center',backgroundColor:BrandColors.bgPink},copy:{flex:1},cardTitle:{fontFamily:Typography.bold,fontSize:16,color:BrandColors.textDark},cardText:{fontFamily:Typography.regular,fontSize:13,lineHeight:18,color:BrandColors.textSecondary,marginTop:3},disabled:{opacity:.72},disabledIcon:{backgroundColor:'#F2F2F2'},disabledTitle:{fontFamily:Typography.bold,fontSize:15,color:BrandColors.textMuted},badge:{paddingHorizontal:8,paddingVertical:4,borderRadius:Radius.full,backgroundColor:'#F2F2F2'},badgeText:{fontFamily:Typography.bold,fontSize:10,color:BrandColors.textMuted}});
