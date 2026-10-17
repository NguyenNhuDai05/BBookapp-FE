import React from 'react';
import {Image,StyleSheet,Text,View, type ImageSourcePropType} from 'react-native';
import {Camera,ShieldCheck,Sparkles} from 'lucide-react-native';
export const advisorPortrait:ImageSourcePropType=require('../../assets/images/advisor/styles/Bảng phong cách trang điểm.webp');
const boardDimensions=Image.resolveAssetSource(advisorPortrait);
export function AdvisorLanding(){
 return <>
  <Text style={s.eyebrow}>BEAUTY, YOUR WAY</Text>
  <Text style={s.title}>Khám phá phong cách makeup của bạn</Text>
  <Text style={s.subtitle}>Một selfie, những ý tưởng mới cho vẻ đẹp của riêng bạn.</Text>
  <View style={[s.hero,{aspectRatio:boardDimensions.width/boardDimensions.height}]}>
   <Image source={advisorPortrait} style={StyleSheet.absoluteFill} resizeMode="contain" accessibilityLabel="Bảng phong cách trang điểm"/>
  </View>
  <View style={s.features}>
   {[{Icon:Camera,title:'Một selfie'},{Icon:Sparkles,title:'3 ý tưởng makeup'},{Icon:ShieldCheck,title:'Ảnh trên thiết bị'}].map(({Icon,title})=><View key={title} style={s.feature}><Icon size={20} color="#bd4b79" strokeWidth={1.5}/><Text style={s.caption}>{title}</Text></View>)}
  </View>
 </>;
}
const s=StyleSheet.create({eyebrow:{fontSize:10,letterSpacing:2.5,color:'#aa577a',fontWeight:'600',marginTop:10},title:{fontSize:34,lineHeight:41,fontWeight:'700',letterSpacing:-1,color:'#2B1B2A',maxWidth:380},subtitle:{fontSize:15,lineHeight:23,color:'#806877',maxWidth:330},hero:{width:'100%',borderRadius:24,overflow:'hidden',marginTop:6},features:{flexDirection:'row',justifyContent:'space-around',paddingVertical:12},feature:{alignItems:'center',gap:9},caption:{fontSize:11,color:'#806877'}});
