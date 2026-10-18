import React,{useState} from 'react';
import {Image,StyleSheet,Text,View,type ImageSourcePropType,type StyleProp,type ViewStyle} from 'react-native';
import {Palette} from 'lucide-react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {colorFor,styleFor,styleImages} from './styleImages';
import {advisorTheme as t} from './advisorTheme';
export function AdvisorImage({source,label,style}:{source?:ImageSourcePropType;label:string;style:StyleProp<ViewStyle>}){
 const identity=JSON.stringify(source);
 const [failedSource,setFailedSource]=useState<string>();
 const frame=StyleSheet.flatten(style);
 const compact=(typeof frame?.width==='number'&&frame.width<100)||(typeof frame?.height==='number'&&frame.height<90);
 // Preserve every edge of the supplied posters/collages. Inset the image so
 // rounded frame corners cannot clip it; keep Android decoding resize enabled.
 return <View style={[ui.image,style]}>{source&&failedSource!==identity?<Image key={identity} source={source} accessibilityLabel={label} resizeMode="contain" resizeMethod="resize" onError={()=>setFailedSource(identity)} style={ui.fullImage}/>:<LinearGradient accessible accessibilityLabel={`${label} · Ảnh đang được bổ sung`} colors={['#F5F2F3','#EEE8EB']} style={[StyleSheet.absoluteFill,ui.placeholder]}><Palette size={24} color={t.body} strokeWidth={1.2}/>{!compact&&<Text style={ui.placeholderText}>Ảnh đang được bổ sung</Text>}</LinearGradient>}</View>;
}
export function MakeupStyleImage({styleKey,style}:{styleKey:string;style?:StyleProp<ViewStyle>}){
 const source=styleImages[styleFor(styleKey)?.imageKey||`${styleKey}.webp`];
 const dimensions=source?Image.resolveAssetSource(source):undefined;
 const aspectRatio=dimensions?.width&&dimensions?.height?dimensions.width/dimensions.height:3/4;
 return <AdvisorImage key={styleKey} source={source} label={`Minh họa ${styleFor(styleKey)?.displayName||styleKey}`} style={[ui.hero,{aspectRatio},style]}/>;
}
export function MakeupStylePalette({colors}:{colors:string[]}){return <View accessibilityLabel="Bảng màu minh họa" style={ui.palette}>{colors.map(name=><View key={name} style={ui.color}><View accessibilityLabel={name} style={[ui.swatch,{backgroundColor:colorFor(name)||'#F3E9EF'}]}/><Text style={ui.colorName}>{name}</Text></View>)}</View>;}
export const ui=StyleSheet.create({image:{backgroundColor:t.imageBackground,borderRadius:12},fullImage:{position:'absolute',top:4,bottom:4,left:4,right:4},hero:{width:'100%'},placeholder:{borderRadius:12,justifyContent:'center',alignItems:'center',gap:6,padding:6},placeholderText:{fontSize:11,lineHeight:16,color:t.body,textAlign:'center'},palette:{flexDirection:'row',flexWrap:'wrap',gap:12},color:{alignItems:'center',gap:5,maxWidth:76},swatch:{width:30,height:30,borderRadius:15,borderWidth:1,borderColor:'#DDD3D8'},colorName:{fontSize:11,lineHeight:16,color:t.body,textAlign:'center'}});


