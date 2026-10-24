import React,{useState} from 'react';
import {Image,StyleSheet,View} from 'react-native';
import Svg,{Path} from 'react-native-svg';
import type {Photo} from '../makeupAdvisor/faceAnalysis';
import {containImage,type Size} from './imageTransform';
import type {LipGeometry} from './lipGeometry';

export function LipstickOverlay({photo,geometry,viewport,color,opacity,original,onImageError}:{photo:Photo;geometry:LipGeometry;viewport:Size;color:string;opacity:number;original:boolean;onImageError:()=>void}){
 const [loadedUri,setLoadedUri]=useState<string>();
 const fit=containImage(photo,viewport);
 if(!fit)return null;
 const frame={position:'absolute' as const,left:fit.left,top:fit.top,width:fit.width,height:fit.height};
 return <View style={StyleSheet.absoluteFill} pointerEvents="none">
  <Image accessibilityLabel="Selfie đã quét của bạn" source={{uri:photo.uri}} style={frame} resizeMode="contain" onError={onImageError} onLoad={e=>{const source=e.nativeEvent.source;if(source.width===photo.width&&source.height===photo.height)setLoadedUri(photo.uri);else onImageError();}}/>
  {loadedUri===photo.uri&&geometry.supported&&!original&&<Svg testID="lipstick-overlay" style={frame} width={fit.width} height={fit.height} viewBox={`0 0 ${photo.width} ${photo.height}`} preserveAspectRatio="xMidYMid meet">
   <Path testID="lipstick-mask" d={geometry.path} fill={color} fillOpacity={Math.max(0,Math.min(100,opacity))/100} fillRule="evenodd"/>
  </Svg>}
 </View>;
}
