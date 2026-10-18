import React,{useRef,useState} from 'react';
import {ScrollView,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {ChevronLeft,ChevronRight} from 'lucide-react-native';
import {advisorTheme as t} from './advisorTheme';

export function AdvisorCarousel({label,itemWidth,count,children}:{label:string;itemWidth:number;count:number;children:React.ReactNode}){
 const ref=useRef<ScrollView>(null),[viewport,setViewport]=useState(0),[offset,setOffset]=useState(0);
 const end=viewport>0?Math.max(0,count*(itemWidth+12)-12-viewport):0;
 const move=(direction:number)=>ref.current?.scrollTo({x:Math.max(0,Math.min(end,offset+direction*(itemWidth+12))),animated:true});
 return <View style={s.container}>
  <ScrollView ref={ref} horizontal accessibilityLabel={label} accessibilityHint="Vuốt ngang hoặc dùng nút trước và tiếp theo" showsHorizontalScrollIndicator={false} snapToInterval={itemWidth+12} decelerationRate="fast" onLayout={e=>setViewport(e.nativeEvent.layout.width)} onScroll={e=>setOffset(e.nativeEvent.contentOffset.x)} scrollEventThrottle={64} contentContainerStyle={s.items}>{children}</ScrollView>
  {end>0&&<View style={s.controls}><Text style={s.hint}>Vuốt để xem thêm</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel={`${label} trước`} accessibilityState={{disabled:offset<=1}} disabled={offset<=1} onPress={()=>move(-1)} style={[s.arrow,offset<=1&&s.disabled]}><ChevronLeft size={18} color={t.accent}/></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={`${label} tiếp theo`} accessibilityState={{disabled:offset>=end-1}} disabled={offset>=end-1} onPress={()=>move(1)} style={[s.arrow,offset>=end-1&&s.disabled]}><ChevronRight size={18} color={t.accent}/></TouchableOpacity></View>}
 </View>;
}
const s=StyleSheet.create({container:{gap:4},items:{gap:12,paddingBottom:4,alignItems:'flex-start'},controls:{flexDirection:'row',alignItems:'center',gap:4},hint:{flex:1,fontSize:11,lineHeight:16,color:t.body},arrow:{width:44,height:44,alignItems:'center',justifyContent:'center'},disabled:{opacity:.35}});
