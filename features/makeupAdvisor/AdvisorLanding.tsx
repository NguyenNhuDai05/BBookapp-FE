import React from 'react';
import {StyleSheet,Text,View,useWindowDimensions,type ImageSourcePropType} from 'react-native';
import {Camera,ScanFace,Sparkles} from 'lucide-react-native';
import {AdvisorImage} from './ResultVisuals';
import {advisorTheme as t} from './advisorTheme';
export const advisorPortrait:ImageSourcePropType=require('../../assets/images/advisor/styles/Bảng phong cách trang điểm.webp');
export function AdvisorLanding(){
 const {height}=useWindowDimensions();
 return <>
  <Text style={s.eyebrow}>BBOOK BEAUTY ADVISOR</Text>
  <Text style={s.title}>Tìm phong cách makeup của bạn</Text>
  <Text style={s.subtitle}>Một selfie, ba gợi ý để bạn khám phá vẻ đẹp theo cách riêng.</Text>
  <AdvisorImage source={advisorPortrait} label="Bảng phong cách trang điểm" style={[s.hero,{height:Math.min(280,Math.max(160,height*.29))}]}/>
  <View style={s.steps}>
   {[{Icon:Camera,title:'Chụp ảnh'},{Icon:ScanFace,title:'Phân tích'},{Icon:Sparkles,title:'Nhận 3 gợi ý'}].map(({Icon,title},i)=><View key={title} style={s.step}><Icon size={20} color={t.accent} strokeWidth={1.6}/><Text style={s.caption}>{i+1}. {title}</Text></View>)}
  </View>
  <Text style={s.privacy}>Ảnh được xử lý trên thiết bị · Gợi ý chỉ để tham khảo</Text>
 </>;
}
const s=StyleSheet.create({eyebrow:{fontSize:10,lineHeight:15,letterSpacing:1.5,color:t.accent,fontWeight:'600',marginTop:4},title:{fontSize:27,lineHeight:34,fontWeight:'700',letterSpacing:-.6,color:t.text,maxWidth:440},subtitle:{fontSize:14,lineHeight:22,color:t.body,maxWidth:440},hero:{width:'100%',borderRadius:16},steps:{flexDirection:'row',gap:8,paddingVertical:8},step:{flex:1,alignItems:'center',gap:8},caption:{fontSize:12,lineHeight:18,color:t.text,textAlign:'center'},privacy:{fontSize:12,lineHeight:18,color:t.body,textAlign:'center'}});
