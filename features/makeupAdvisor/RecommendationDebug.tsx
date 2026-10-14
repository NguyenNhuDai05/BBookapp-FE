import React,{useState} from 'react';
import {Text,View} from 'react-native';
import Constants from 'expo-constants';
import type {RankingTrace} from './recommendationCore';
import {AdvisorButton,styles as s} from './AdvisorResults';
export function RecommendationDebug({trace}:{trace?:RankingTrace}){
 const [open,setOpen]=useState(false);
 if(Constants.expoConfig?.extra?.advisorDiagnosticMode!==true||!['manual-test','local'].includes(Constants.expoConfig?.extra?.advisorReleaseEnvironment)||!trace)return null;
 return <View style={s.card}><AdvisorButton title="Kiểm tra ranking · chỉ trên thiết bị" onPress={()=>setOpen(!open)}/>
 {open&&<><Text selectable style={s.note}>{JSON.stringify(trace,null,2)}</Text><Text style={s.note}>Trace chỉ chứa tên feature/rule và điểm thử nghiệm, không có ảnh hoặc tọa độ. Không phải phần trăm phù hợp.</Text></>}
 </View>;
}

