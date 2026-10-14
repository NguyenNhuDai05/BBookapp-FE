import React,{useEffect,useState} from 'react';
import {ActivityIndicator,Animated,StyleSheet,Text,View} from 'react-native';
import {CircleCheck,TriangleAlert} from 'lucide-react-native';
import {phaseCopy,SUCCESS_TRANSITION_MS,type ScanFailure,type ScanPhase} from './scanState';
import {useReducedMotion} from './useReducedMotion';
import {ScanPhoto} from './ScanPhoto';
import type {Analysis,Photo} from './faceAnalysis';
export function DynamicScanStatus({phase,failure}:{phase:ScanPhase;failure?:ScanFailure}){
 const reduced=useReducedMotion();const [entry]=useState(()=>new Animated.Value(1));
 const error=phase==='validation_error'||phase==='processing_error',success=phase==='success';
 const copy=error&&failure?failure:phaseCopy[phase];
 useEffect(()=>{entry.setValue(reduced?1:0);if(reduced)return;const animation=Animated.timing(entry,{toValue:1,duration:error?250:200,useNativeDriver:true});animation.start();return()=>animation.stop();},[phase,failure,error,reduced,entry]);
 if(phase==='idle'||phase==='cancelled')return null;
 const color=error?'#FFAF90':success?'#FFD6E5':'#FF5C9A';
 return <Animated.View accessibilityLiveRegion={error?'assertive':'polite'} style={[s.panel,{opacity:entry,transform:[{translateY:entry.interpolate({inputRange:[0,1],outputRange:[10,0]})}]},error&&s.error]}>
  <View style={s.icon}>{error?<TriangleAlert size={24} color={color}/>:success?<CircleCheck size={24} color={color}/>:<ActivityIndicator animating={!reduced} color={color}/>}</View>
  <View style={s.copy}><Text style={s.main}>{copy.main}</Text>{!!copy.secondary&&<Text style={s.secondary}>{copy.secondary}</Text>}</View>
 </Animated.View>;
}
// Results commit immediately. This non-interactive layer crossfades the prior scan
// above the real Results for 400 ms; its completion never navigates or runs inference.
export function ScanSuccessTransition({photo,analysis}:{photo:Photo;analysis?:Analysis}){
 const reduced=useReducedMotion();const [opacity]=useState(()=>new Animated.Value(1));const [finished,setFinished]=useState(false);
 useEffect(()=>{if(reduced)return;const animation=Animated.timing(opacity,{toValue:0,duration:SUCCESS_TRANSITION_MS,useNativeDriver:true});animation.start(({finished:done})=>{if(done)setFinished(true);});return()=>animation.stop();},[reduced,opacity]);
 if(reduced||finished)return null;
 return <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[s.transition,{opacity}]}>
  <View style={s.photo}><ScanPhoto photo={photo} analysis={analysis} scanning={false} state="success"/></View><DynamicScanStatus phase="success"/>
 </Animated.View>;
}
const s=StyleSheet.create({panel:{flexDirection:'row',gap:12,alignItems:'center',padding:18,borderRadius:20,backgroundColor:'#241A24EE',borderWidth:1,borderColor:'#FF5C9A33'},error:{borderColor:'#FFAF9066'},icon:{width:30,alignItems:'center'},copy:{flex:1,gap:5},main:{fontSize:14,lineHeight:21,fontWeight:'600',color:'#FFF7FA'},secondary:{fontSize:12,lineHeight:18,color:'#D5BCCC'},transition:{position:'absolute',top:64,bottom:0,left:0,right:0,padding:24,gap:16,backgroundColor:'#FFF7FA'},photo:{flex:1,minHeight:0,justifyContent:'center'}});
