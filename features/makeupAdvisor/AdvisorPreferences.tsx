import React from 'react';
import {StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {DEFAULT_PREFERENCES,type Intensity,type LibraryPreferences,type Occasion} from './styleLibrary';
import {scoringIntensityLabels as intensityLabels,scoringOccasionLabels as occasionLabels} from './scoringMetadata';
import {AdvisorDisclosure} from './AdvisorDisclosure';
import {advisorTheme as t} from './advisorTheme';
export function AdvisorPreferences({value,onChange,disabled=false,embedded=false}:{value:LibraryPreferences;onChange:(p:LibraryPreferences)=>void;disabled?:boolean;embedded?:boolean}){
 const choice=(label:string,selected:boolean,press:()=>void)=><TouchableOpacity key={label} accessibilityRole="button" accessibilityState={{selected,disabled}} disabled={disabled} onPress={press} style={[s.chip,selected&&s.selected]}><Text style={[s.label,selected&&s.selectedLabel]}>{label}</Text></TouchableOpacity>;
 const content=<View style={s.content}>
  <Text style={s.note}>Bạn có thể bỏ qua hoặc chỉ chọn một mục. Thay đổi lựa chọn dùng kết quả quét hiện có.</Text>
  <Text style={s.heading}>Dịp trang điểm</Text><View style={s.chips}>{choice('Không chọn dịp',value.occasion===null,()=>onChange({...value,occasion:null}))}{(Object.keys(occasionLabels) as Occasion[]).map(o=>choice(occasionLabels[o],value.occasion===o,()=>onChange({...value,occasion:o})))}</View>
  <Text style={s.heading}>Độ đậm mong muốn</Text><View style={s.chips}>{choice('Không chọn độ đậm',value.intensity===null,()=>onChange({...value,intensity:null}))}{(Object.keys(intensityLabels) as Intensity[]).map(i=>choice(intensityLabels[i],value.intensity===i,()=>onChange({...value,intensity:i})))}</View>
  <TouchableOpacity accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} style={s.clear} onPress={()=>onChange({...DEFAULT_PREFERENCES})}><Text style={s.label}>Xóa lựa chọn</Text></TouchableOpacity>
 </View>;
 return embedded?content:<AdvisorDisclosure title="Tinh chỉnh gợi ý · tùy chọn">{content}</AdvisorDisclosure>;
}
const s=StyleSheet.create({content:{gap:10},note:{fontSize:12,lineHeight:19,color:t.body},heading:{fontSize:14,lineHeight:21,fontWeight:'600',color:t.text},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{minHeight:44,maxWidth:'100%',justifyContent:'center',paddingVertical:10,paddingHorizontal:12,borderRadius:14,borderWidth:1,borderColor:t.border,backgroundColor:t.surface},selected:{backgroundColor:t.accent,borderColor:t.accent},label:{fontSize:12,lineHeight:18,color:t.accent},selectedLabel:{color:'#fff',fontWeight:'600'},clear:{minHeight:44,justifyContent:'center',alignSelf:'flex-start'}});
