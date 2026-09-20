import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BriefcaseBusiness, CalendarCheck2, ChevronRight, Images, X } from 'lucide-react-native';
import { BrandColors, Radius, Shadows, Spacing, Typography } from '../../constants/theme';

const benefits = [
  { icon: BriefcaseBusiness, title: 'Quản lý dịch vụ dễ dàng', text: 'Chủ động giá, thời lượng và nội dung dịch vụ.' },
  { icon: Images, title: 'Portfolio chuyên nghiệp', text: 'Giới thiệu phong cách và những tác phẩm nổi bật.' },
  { icon: CalendarCheck2, title: 'Nhận và quản lý lịch đặt', text: 'Theo dõi yêu cầu và lịch làm việc trong một nơi.' },
];

export default function MuaPitchPage() {
  const router = useRouter();
  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <View style={styles.topbar}><TouchableOpacity onPress={() => router.back()} style={styles.iconButton} accessibilityLabel="Để sau"><X size={23} color={BrandColors.textDark}/></TouchableOpacity></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.heroArt}><View style={styles.logoCircle}><Image source={require('../../assets/images/logo-bbook.png')} style={styles.logo} resizeMode="contain"/></View><View style={styles.sparkleOne}/><View style={styles.sparkleTwo}/></View>
      <Text style={styles.eyebrow}>DÀNH CHO CHUYÊN GIA LÀM ĐẸP</Text>
      <Text style={styles.title}>Trở thành Makeup Artist{`\n`}cùng BeautyBook</Text>
      <Text style={styles.subtitle}>Xây dựng hồ sơ, giới thiệu dịch vụ và kết nối với khách hàng phù hợp.</Text>
      <View style={styles.benefits}>{benefits.map(({ icon: Icon, title, text }) => <View key={title} style={styles.benefit}><View style={styles.benefitIcon}><Icon size={21} color={BrandColors.accentRose}/></View><View style={styles.benefitCopy}><Text style={styles.benefitTitle}>{title}</Text><Text style={styles.benefitText}>{text}</Text></View></View>)}</View>
    </ScrollView>
    <View style={styles.footer}><TouchableOpacity style={styles.primary} onPress={() => router.push('/mua-onboarding/apply')} activeOpacity={0.84}><Text style={styles.primaryText}>Bắt đầu tạo hồ sơ</Text><ChevronRight size={20} color="#FFF"/></TouchableOpacity><TouchableOpacity style={styles.secondary} onPress={() => router.back()}><Text style={styles.secondaryText}>Để sau</Text></TouchableOpacity></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:BrandColors.bgPrimary},topbar:{height:52,paddingHorizontal:Spacing.md,alignItems:'flex-end',justifyContent:'center'},iconButton:{width:44,height:44,borderRadius:22,backgroundColor:BrandColors.bgCard,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:BrandColors.borderLight},content:{paddingHorizontal:Spacing.lg,paddingBottom:20},heroArt:{height:158,marginTop:6,marginBottom:Spacing.lg,borderRadius:Radius.xl,backgroundColor:BrandColors.bgPinkSoft,alignItems:'center',justifyContent:'center',overflow:'hidden'},logoCircle:{width:110,height:110,borderRadius:55,backgroundColor:'#FFF',alignItems:'center',justifyContent:'center',...Shadows.soft},logo:{width:94,height:94},sparkleOne:{position:'absolute',width:54,height:54,borderRadius:27,backgroundColor:'rgba(245,83,137,.16)',left:20,top:18},sparkleTwo:{position:'absolute',width:72,height:72,borderRadius:36,backgroundColor:'rgba(255,255,255,.55)',right:-12,bottom:-16},eyebrow:{fontFamily:Typography.bold,fontSize:11,letterSpacing:1,color:BrandColors.accentRose,textAlign:'center'},title:{fontFamily:Typography.extraBold,fontSize:28,lineHeight:35,color:BrandColors.textDark,textAlign:'center',marginTop:8},subtitle:{fontFamily:Typography.regular,fontSize:15,lineHeight:22,color:BrandColors.textBody,textAlign:'center',marginTop:10,paddingHorizontal:8},benefits:{marginTop:Spacing.lg,gap:10},benefit:{minHeight:74,backgroundColor:'#FFF',borderRadius:Radius.base,padding:Spacing.md,flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:BrandColors.borderLight},benefitIcon:{width:42,height:42,borderRadius:Radius.md,backgroundColor:BrandColors.bgPink,alignItems:'center',justifyContent:'center'},benefitCopy:{flex:1,marginLeft:12},benefitTitle:{fontFamily:Typography.bold,fontSize:14,color:BrandColors.textDark},benefitText:{fontFamily:Typography.regular,fontSize:12,lineHeight:17,color:BrandColors.textMuted,marginTop:2},footer:{paddingHorizontal:Spacing.lg,paddingTop:10,backgroundColor:BrandColors.bgPrimary},primary:{minHeight:52,borderRadius:Radius.base,backgroundColor:BrandColors.accentRose,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},primaryText:{fontFamily:Typography.bold,fontSize:16,color:'#FFF'},secondary:{minHeight:44,alignItems:'center',justifyContent:'center'},secondaryText:{fontFamily:Typography.semiBold,fontSize:14,color:BrandColors.textBody},
});
