import React,{useMemo,useState} from 'react';
import {Platform,ScrollView,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {ArrowLeft,Check} from 'lucide-react-native';
import type {Analysis,Photo} from '../makeupAdvisor/faceAnalysis';
import {advisorTheme as t} from '../makeupAdvisor/advisorTheme';
import {extractLipGeometry} from './lipGeometry';
import {LipstickOverlay} from './LipstickOverlay';
import {lipstickPresets} from './lipstickPresets';

function OpacitySlider({value,onChange}:{value:number;onChange:(value:number)=>void}){
 const [width,setWidth]=useState(0);
 const update=(x:number)=>{if(width>0)onChange(Math.round(Math.max(0,Math.min(1,x/width))*100));};
 return <View accessibilityRole="adjustable" accessibilityLabel="Độ đậm màu son" accessibilityValue={{min:0,max:100,now:value,text:`${value}%`}} accessibilityActions={[{name:'increment',label:'Tăng độ đậm'},{name:'decrement',label:'Giảm độ đậm'}]} onAccessibilityAction={e=>onChange(Math.max(0,Math.min(100,value+(e.nativeEvent.actionName==='increment'?5:-5))))}
  style={s.slider} onLayout={e=>setWidth(e.nativeEvent.layout.width)} onStartShouldSetResponder={()=>true} onMoveShouldSetResponder={()=>true} onResponderGrant={e=>update(e.nativeEvent.locationX)} onResponderMove={e=>update(e.nativeEvent.locationX)} onResponderTerminationRequest={()=>false}>
  <View pointerEvents="none" style={s.track}><View style={[s.fill,{width:`${value}%`}]}/></View>
  <View pointerEvents="none" style={[s.thumb,{left:Math.max(0,width-24)*value/100}]}/>
 </View>;
}
export function MakeupStudio({photo,analysis,onBack,onNewPhoto}:{photo?:Photo;analysis?:Analysis;onBack:()=>void;onNewPhoto:()=>void}){
 const geometry=useMemo(()=>extractLipGeometry(photo,analysis),[photo,analysis]);
 const [color,setColor]=useState(0),[opacity,setOpacity]=useState(45),[original,setOriginal]=useState(false);
 const [viewport,setViewport]=useState({width:0,height:0}),[imageFailed,setImageFailed]=useState(false);
 const supported=Platform.OS==='android'&&geometry.supported&&!imageFailed;
 const selected=lipstickPresets[color];
 return <View style={s.page}>
  <View style={s.header}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Quay lại kết quả Advisor" onPress={onBack} style={s.back}><ArrowLeft size={22} color={t.text}/></TouchableOpacity><View style={s.heading}><Text style={s.title}>Thử makeup</Text><Text style={s.subtitle}>Khám phá màu son phù hợp với phong cách của bạn</Text></View></View>
  <ScrollView contentContainerStyle={s.content}>
   {supported&&photo?<>
    <View testID="studio-photo" style={s.photo} onLayout={e=>setViewport({width:e.nativeEvent.layout.width,height:e.nativeEvent.layout.height})}>
     <LipstickOverlay photo={photo} geometry={geometry} viewport={viewport} color={selected.color} opacity={opacity} original={original} onImageError={()=>setImageFailed(true)}/>
     <View pointerEvents="none" style={s.badge}><Text style={s.badgeText}>{original?'Ảnh gốc':'Đã makeup'}</Text></View>
    </View>
    <View style={s.compare}>{[true,false].map(value=><TouchableOpacity key={String(value)} accessibilityRole="button" accessibilityState={{selected:original===value}} onPress={()=>setOriginal(value)} style={[s.toggle,original===value&&s.selectedToggle]}><Text style={[s.toggleText,original===value&&s.activeText]}>{value?'Ảnh gốc':'Đã makeup'}</Text></TouchableOpacity>)}</View>
    <View style={s.card}><Text style={s.label}>Màu son · {selected.name}</Text><View style={s.colors}>{lipstickPresets.map((preset,index)=><TouchableOpacity key={preset.name} accessibilityRole="button" accessibilityLabel={`Màu son ${preset.name}`} accessibilityState={{selected:color===index}} onPress={()=>setColor(index)} style={s.colorButton}><View style={[s.swatchRing,color===index&&s.selectedRing]}><View style={[s.swatch,{backgroundColor:preset.color}]}>{color===index&&<Check size={20} color="#fff"/>}</View></View><Text style={s.colorName}>{preset.name}</Text></TouchableOpacity>)}</View></View>
    <View style={s.card}><View style={s.row}><Text style={s.label}>Độ đậm</Text><Text style={s.percent}>{opacity}%</Text></View><OpacitySlider value={opacity} onChange={setOpacity}/><Text style={s.note}>Giảm độ đậm để giữ nét môi tự nhiên hơn.</Text></View>
    <Text style={s.note}>Mô phỏng màu son 2D để tham khảo. Ánh sáng và màu môi gốc ảnh hưởng kết quả. Ảnh chỉ được xử lý trên thiết bị.</Text>
   </>:<View accessibilityLiveRegion="polite" style={s.card}><Text style={s.label}>Chưa thể thử son trên ảnh này</Text><Text style={s.subtitle}>{Platform.OS!=='android'?'Tính năng hiện hỗ trợ bản Android.':imageFailed?'Ảnh tạm không còn khả dụng. Hãy thử quét ảnh khác.':!geometry.supported?geometry.reason:''}</Text></View>}
  </ScrollView>
  <View style={s.footer}><TouchableOpacity accessibilityRole="button" onPress={onBack} style={s.secondary}><Text style={s.activeText}>Quay lại</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={onNewPhoto} style={s.primary}><Text style={s.primaryText}>Thử lại ảnh khác</Text></TouchableOpacity></View>
 </View>;
}
const s=StyleSheet.create({
 page:{flex:1,backgroundColor:t.background},header:{flexDirection:'row',padding:12,alignItems:'center',gap:8},back:{width:44,height:44,alignItems:'center',justifyContent:'center'},heading:{flex:1},title:{fontSize:23,fontWeight:'700',color:t.text},subtitle:{fontSize:13,lineHeight:20,color:t.body,marginTop:4},content:{padding:16,gap:16,width:'100%',maxWidth:600,alignSelf:'center',paddingBottom:24},photo:{width:'100%',height:380,backgroundColor:t.imageBackground,borderRadius:24,overflow:'hidden'},badge:{position:'absolute',left:14,top:14,backgroundColor:'#FFFFFFE8',paddingHorizontal:12,paddingVertical:6,borderRadius:16},badgeText:{fontSize:12,color:t.text,fontWeight:'600'},compare:{flexDirection:'row',backgroundColor:'#F6E8EF',borderRadius:16,padding:4},toggle:{flex:1,minHeight:44,justifyContent:'center',alignItems:'center',borderRadius:12},selectedToggle:{backgroundColor:'#fff'},toggleText:{color:t.body,fontSize:14},activeText:{color:t.accent,fontWeight:'600',fontSize:14},card:{backgroundColor:t.surface,padding:16,borderRadius:20,gap:12},label:{fontSize:16,fontWeight:'600',color:t.text},colors:{flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap',gap:4},colorButton:{alignItems:'center',minWidth:48,paddingVertical:6,gap:6},swatchRing:{padding:4,borderWidth:2,borderColor:'transparent',borderRadius:30},selectedRing:{borderColor:t.accent},swatch:{width:38,height:38,borderRadius:22,alignItems:'center',justifyContent:'center'},colorName:{fontSize:11,color:t.body},row:{flexDirection:'row',justifyContent:'space-between'},percent:{fontSize:16,fontWeight:'600',color:t.accent},slider:{height:44,justifyContent:'center'},track:{height:5,backgroundColor:'#F2DFE7',borderRadius:4},fill:{height:5,backgroundColor:t.accent,borderRadius:4},thumb:{position:'absolute',width:24,height:24,borderRadius:12,backgroundColor:t.accent,borderWidth:3,borderColor:'#fff',elevation:2},note:{fontSize:12,lineHeight:19,color:t.body},footer:{flexDirection:'row',padding:16,gap:12,borderTopWidth:1,borderTopColor:t.border,backgroundColor:'#fff'},secondary:{flex:1,minHeight:48,borderWidth:1,borderColor:t.accent,borderRadius:14,alignItems:'center',justifyContent:'center'},primary:{flex:1,minHeight:48,backgroundColor:t.accent,borderRadius:14,alignItems:'center',justifyContent:'center'},primaryText:{fontSize:14,color:'#fff',fontWeight:'600'},
});
