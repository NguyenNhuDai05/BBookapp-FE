import React,{useEffect,useMemo,useState} from 'react';
import {Animated,Easing,Image,StyleSheet,Text,View} from 'react-native';
import Svg,{Circle,Path} from 'react-native-svg';
import type {Analysis,Photo,Point} from './faceAnalysis';
import {useReducedMotion} from './useReducedMotion';
import {SUCCESS_TRANSITION_MS} from './scanState';
import {SCAN_SWEEP_MS} from './scanPresentation';
export function overlayGeometry(analysis?:Analysis){
 if(!analysis||analysis.faceCount!==1)return {points:[] as Point[],path:''};
 const valid=(p:Point)=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x<=analysis.width&&p.y<=analysis.height;
 const mesh=analysis.mesh;
 if(mesh?.points.length===468&&new Set(mesh.points.map(p=>p.index)).size===468&&mesh.points.every(p=>valid(p)&&Number.isFinite(p.z)&&Number.isInteger(p.index)&&p.index>=0&&p.index<468)){
  const points=new Map(mesh.points.map(p=>[p.index,p]));const edges=new Set<string>();const lines:string[]=[];
  for(const t of mesh.triangles){if(t.length!==3||new Set(t).size!==3||!t.every(i=>Number.isInteger(i)&&points.has(i)))continue;for(let i=0;i<3;i++){const a=t[i],b=t[(i+1)%3],key=[a,b].sort((a,b)=>a-b).join(':');if(edges.has(key))continue;edges.add(key);const p=points.get(a)!,q=points.get(b)!;lines.push(`M${p.x},${p.y}L${q.x},${q.y}`);}}
  return {points:mesh.points,path:lines.join('')};
 }
 return {points:(analysis.contours||[]).flatMap(c=>c.points).filter(valid),path:''};
}
export function ScanPhoto({photo,analysis,scanning,status,state='processing',showStatus=true}:{photo:Photo;analysis?:Analysis;scanning:boolean;status?:string;state?:'processing'|'success'|'error';showStatus?:boolean}){
 const reduced=useReducedMotion();
 const [overlayOpacity]=useState(()=>new Animated.Value(1));
 useEffect(()=>{overlayOpacity.setValue(1);if(state!=='success')return;const animation=Animated.timing(overlayOpacity,{toValue:0,duration:reduced?0:SUCCESS_TRANSITION_MS,useNativeDriver:true});animation.start();return()=>animation.stop();},[state,reduced,overlayOpacity]);
 const [progress]=useState(()=>new Animated.Value(0));const [height,setHeight]=useState(0);
 useEffect(()=>{progress.setValue(0);if(!scanning||state!=='processing'||reduced)return;const animation=Animated.loop(Animated.timing(progress,{toValue:1,duration:SCAN_SWEEP_MS,easing:Easing.linear,useNativeDriver:true}));animation.start();return()=>animation.stop();},[scanning,progress,state,reduced]);
 const {points,path}=useMemo(()=>overlayGeometry(analysis),[analysis]);
 return <View style={[styles.frame,{aspectRatio:photo.width/photo.height,flexShrink:1}]} onLayout={e=>setHeight(e.nativeEvent.layout.height)}>
  <Image source={{uri:photo.uri}} resizeMode="contain" style={StyleSheet.absoluteFill}/>
  <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,{opacity:overlayOpacity}]}>{!!points.length&&analysis&&<Svg pointerEvents="none" style={StyleSheet.absoluteFill} viewBox={`0 0 ${analysis.width} ${analysis.height}`} preserveAspectRatio="xMidYMid meet" accessibilityLabel="Các điểm đường nét khuôn mặt được nhận diện">
   {!!path&&<Path d={path} fill="none" stroke="#FFD6E5" strokeWidth={Math.max(1,analysis.width/900)} opacity={.22}/>}
   {points.map((p,i)=><Circle key={i} cx={p.x} cy={p.y} r={Math.max(1.4,analysis.width/450)} fill="#fff5fa" opacity={.72}/>)}
  </Svg>}</Animated.View>
  <View pointerEvents="none" style={[styles.corner,{borderColor:state==='error'?'#FFAF90':'#FFD6E5'},{top:14,left:14,borderTopWidth:3,borderLeftWidth:3}]}/><View pointerEvents="none" style={[styles.corner,{borderColor:state==='error'?'#FFAF90':'#FFD6E5'},{top:14,right:14,borderTopWidth:3,borderRightWidth:3}]}/><View pointerEvents="none" style={[styles.corner,{borderColor:state==='error'?'#FFAF90':'#FFD6E5'},{bottom:14,left:14,borderBottomWidth:3,borderLeftWidth:3}]}/><View pointerEvents="none" style={[styles.corner,{borderColor:state==='error'?'#FFAF90':'#FFD6E5'},{bottom:14,right:14,borderBottomWidth:3,borderRightWidth:3}]}/>
  {((scanning&&state==='processing')||state==='success')&&<><Animated.View pointerEvents="none" style={[styles.beam,{opacity:overlayOpacity,transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[0,Math.max(0,height-12)]})}]}]}><View style={styles.line}/></Animated.View>{showStatus&&!!status&&<View style={styles.badge}><Text accessibilityLiveRegion="polite" style={styles.label}>{status}</Text></View>}</>}
 </View>;
}
const styles=StyleSheet.create({frame:{width:'100%',borderRadius:24,overflow:'hidden',backgroundColor:'#FFD6E5'},corner:{position:'absolute',width:25,height:25,borderColor:'#FFF7FA'},beam:{position:'absolute',top:0,left:0,right:0,height:12,backgroundColor:'#FF5C9A33',shadowColor:'#FF5C9A',shadowOpacity:1,shadowRadius:12,elevation:4},line:{height:2,marginTop:5,backgroundColor:'#fff0f7'},badge:{position:'absolute',bottom:28,left:28,right:28,padding:12,borderRadius:14,backgroundColor:'#2B1B2Acc'},label:{color:'#fff',fontSize:13,textAlign:'center'}});
