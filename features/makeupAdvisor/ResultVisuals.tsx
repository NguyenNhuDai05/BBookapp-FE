import React,{useState} from 'react';
import {Image,StyleSheet,Text,View,type ImageSourcePropType,type StyleProp,type ViewStyle} from 'react-native';
import {Palette} from 'lucide-react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {colorFor,styleFor,styleImages} from './styleImages';
export function AdvisorImage({source,label,style}:{source?:ImageSourcePropType;label:string;style:StyleProp<ViewStyle>}){
 const [failed,setFailed]=useState(false);
 return <View style={[ui.image,style]}>{source&&!failed?<Image source={source} accessibilityLabel={label} resizeMode="cover" resizeMethod="resize" onError={()=>setFailed(true)} style={StyleSheet.absoluteFill}/>:<LinearGradient colors={['#FFE3EF','#EBCBD9']} style={[StyleSheet.absoluteFill,ui.placeholder]}><Palette size={32} color="#AD6484" strokeWidth={1.2}/><Text style={ui.placeholderText}>Ảnh đang được bổ sung</Text></LinearGradient>}</View>;
}
export function MakeupStyleImage({styleKey}:{styleKey:string}){return <AdvisorImage key={styleKey} source={styleImages[styleFor(styleKey)?.imageKey||`${styleKey}.webp`]} label={`Minh họa ${styleFor(styleKey)?.displayName||styleKey}`} style={ui.hero}/>;}
export function MakeupStylePalette({colors}:{colors:string[]}){return <View accessibilityLabel="Bảng màu minh họa" style={ui.palette}>{colors.map(name=><View key={name} style={ui.color}><View accessibilityLabel={name} style={[ui.swatch,{backgroundColor:colorFor(name)||'#F3E9EF'}]}/><Text style={ui.colorName}>{name}</Text></View>)}</View>;}
export const ui=StyleSheet.create({image:{overflow:'hidden',backgroundColor:'#FFE8F1',borderRadius:18},hero:{width:'100%',aspectRatio:4/5},placeholder:{justifyContent:'center',alignItems:'center',gap:12,padding:12},placeholderText:{fontSize:11,lineHeight:17,color:'#936078',textAlign:'center'},palette:{flexDirection:'row',flexWrap:'wrap',gap:10},color:{alignItems:'center',gap:5,maxWidth:70},swatch:{width:28,height:28,borderRadius:14,borderWidth:1,borderColor:'#FFFFFF'},colorName:{fontSize:10,lineHeight:14,color:'#806877',textAlign:'center'}});


