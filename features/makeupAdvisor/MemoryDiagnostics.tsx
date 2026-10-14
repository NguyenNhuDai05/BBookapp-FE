import React,{useState} from 'react';
import {Text,TouchableOpacity,View} from 'react-native';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import {memoryTrace,type MemorySnapshot} from './faceAnalysis';
import {styles} from './AdvisorResults';
export function MemoryDiagnostics({snapshot,code}:{snapshot?:MemorySnapshot;code?:string}){
 const [copied,setCopied]=useState(false),[failed,setFailed]=useState(false);
 if(!snapshot||(!__DEV__&&Constants.expoConfig?.extra?.advisorDiagnosticMode!==true))return null;
 const copy=async()=>{try{const ok=await Clipboard.setStringAsync(JSON.stringify({code,checkpoints:memoryTrace()},null,2));if(ok===false){setFailed(true);return;}setCopied(true);setFailed(false);}catch{setFailed(true);}};
 return <View style={{gap:8,paddingVertical:10}}><Text style={styles.note}>Chẩn đoán kiểm thử · {String(snapshot.checkpoint||'camera availability')} · {code}</Text><Text selectable style={styles.note}>PSS: {String(snapshot.pssKB??snapshot.memoryInfoPssKB??'—')} KB · giới hạn: {String(snapshot.limitKB??'—')} KB · camera available: {String(snapshot.cameraAvailable??'chưa đo')}</Text><TouchableOpacity accessibilityRole="button" onPress={()=>void copy()} style={{paddingVertical:10}}><Text style={styles.buttonText}>{copied?'Đã sao chép log chẩn đoán':'Sao chép log chẩn đoán'}</Text></TouchableOpacity>{failed&&<Text style={styles.note}>Chưa sao chép được. Bạn có thể lấy các dòng BBookMemoryCheckpoint trong Console.</Text>}</View>;
}
