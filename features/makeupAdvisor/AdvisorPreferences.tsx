import React,{useState} from 'react';
import {Text,View} from 'react-native';
import {AdvisorButton,styles as s} from './AdvisorResults';
import {DEFAULT_PREFERENCES,Intensity,LibraryPreferences,Occasion} from './styleLibrary';
import {scoringIntensityLabels as intensityLabels,scoringOccasionLabels as occasionLabels} from './scoringMetadata';
export function AdvisorPreferences({value,onChange,disabled=false}:{value:LibraryPreferences;onChange:(p:LibraryPreferences)=>void;disabled?:boolean}){
 const [open,setOpen]=useState(false);
 return <View style={s.card}><AdvisorButton title="Tinh chỉnh gợi ý · tùy chọn" onPress={()=>setOpen(!open)}/>
 {open&&<><Text style={s.body}>Bạn có thể bỏ qua hoặc chỉ chọn một mục. Thay đổi lựa chọn dùng kết quả quét hiện có.</Text>
 <Text style={s.heading}>Dịp trang điểm</Text><AdvisorButton title={`${value.occasion===null?'✓ ':''}Không chọn dịp`} disabled={disabled} onPress={()=>onChange({...value,occasion:null})}/>
 {(Object.keys(occasionLabels) as Occasion[]).map(o=><AdvisorButton key={o} title={`${value.occasion===o?'✓ ':''}${occasionLabels[o]}`} disabled={disabled} onPress={()=>onChange({...value,occasion:o})}/>)}
 <Text style={s.heading}>Độ đậm mong muốn</Text><AdvisorButton title={`${value.intensity===null?'✓ ':''}Không chọn độ đậm`} disabled={disabled} onPress={()=>onChange({...value,intensity:null})}/>
 {(Object.keys(intensityLabels) as Intensity[]).map(i=><AdvisorButton key={i} title={`${value.intensity===i?'✓ ':''}${intensityLabels[i]}`} disabled={disabled} onPress={()=>onChange({...value,intensity:i})}/>)}
 <AdvisorButton title="Xóa lựa chọn" disabled={disabled} onPress={()=>onChange({...DEFAULT_PREFERENCES})}/></>}
 </View>;
}

