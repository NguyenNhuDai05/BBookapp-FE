import type {Analysis,Photo,Point} from '../../makeupAdvisor/faceAnalysis';
export const photo:Photo={uri:'file:///cache/bbook-normalized-studio-test.jpg',width:720,height:960};
const line=(count:number,y:number,curve:number):Point[]=>Array.from({length:count},(_,i)=>({x:260+200*i/(count-1),y:y+curve*Math.sin(Math.PI*i/(count-1))}));
export function sample():Analysis{return {width:720,height:960,faceCount:1,faces:[{box:{x:100,y:100,width:520,height:720},angles:{x:0,y:0,z:0}}],contours:[{type:8,points:line(11,600,-35)},{type:9,points:line(9,600,-10)},{type:10,points:line(9,600,15)},{type:11,points:line(9,600,40)}],mesh:null,meshStatus:'unavailable',latencyMs:1,nativeHeapBeforeBytes:0,nativeHeapAfterBytes:0};}
