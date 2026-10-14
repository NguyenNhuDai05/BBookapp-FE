import type {Extraction,FaceFeatureSummaryV3,Feature} from './extractor';
export type Observation='relatively_low'|'relatively_high'|'neutral'|'unknown';
export type ProfileMeasurement={key:string;value:number|null;observation:Observation;quality:'provisional'|'missing'|'rejected';calibration:'provisional';reason:string|null;sourceFeatures:string[]};
export type FaceProfileV2={schemaVersion:2;measurements:Record<string,ProfileMeasurement>};
// Inherited experimental buckets from existing makeupProfile/local advisor.
// These are not population percentiles, anatomy labels or validated beauty rules.
export const observationPolicy={eyeSpacing:{low:.46,high:.52},eyeAspect:{low:.25,high:.25},browArch:{low:.08,high:.08},mouthAspect:{low:.3,high:.3}} as const;
export const measurementKeys=['outlineAspect','eyeSpacing','leftEyeWidth','rightEyeWidth','leftEyeAspect','rightEyeAspect','leftEyeTilt','rightEyeTilt','eyeWidthDifference','leftEyePosition','rightEyePosition','leftBrowLength','rightBrowLength','leftBrowArch','rightBrowArch','leftBrowTilt','rightBrowTilt','leftBrowEyeGap','rightBrowEyeGap','noseBridgeLength','noseBaseWidth','mouthWidth','mouthAspect','upperLipThickness','lowerLipThickness','mouthPosition','lowerFaceHeight','outlineUpperWidth','outlineMiddleWidth','outlineLowerWidth','chinWidth','outlineCompactness','meshProjectedArea','meshRelativeZSpan'] as const;
const range=(key:string):readonly[number,number]=>key==='outlineAspect'?[.5,2.5]:key.endsWith('Tilt')?[0,.25]:key.startsWith('mesh')?[0,4]:[0,1];
const lips=new Set(['mouthWidth','mouthAspect','upperLipThickness','lowerLipThickness','mouthPosition','lowerFaceHeight']);
export function buildFaceProfile(summary?:FaceFeatureSummaryV3,localFeatures?:Extraction['features'],qualityContext?:Extraction['qualityContext']):FaceProfileV2{
 const measurements:FaceProfileV2['measurements']={};
 const d=summary?.detection,p=d?.pose,b=d?.boundingBox;
 const normalizedBox=b&&[b.x,b.y,b.width,b.height].every(Number.isFinite)&&b.x>=0&&b.y>=0&&b.width>0&&b.height>0&&b.x+b.width<=1&&b.y+b.height<=1;
 const quality=summary?.schemaVersion===3&&['face_detection','face_mesh'].includes(summary.analysisMethod)&&normalizedBox&&summary?.quality?.singleFace===true&&summary.quality.frontal===true&&d?.faceCount===1&&p&&[p.yaw,p.pitch,p.roll].every(Number.isFinite)&&Math.abs(p.yaw)<=15&&Math.abs(p.pitch)<=15&&Math.abs(p.roll)<=10;
 for(const key of measurementKeys){
  const local:Feature|undefined=localFeatures?.[key];
  const value=local?.value??summary?.features?.[key],source=local?.source??summary?.featureSources?.[key];
  let reason:string|null=null;
  if(value===undefined)reason='missing';
  else if(!quality)reason='quality_or_pose';
  else if(!Number.isFinite(value))reason='nonfinite';
  else if(!['face_detection','face_mesh'].includes(source||''))reason='missing_source';
  else if(summary?.missing?.includes(key))reason='declared_missing';
  else if(qualityContext?.eyesClosed===true&&(key==='eyeSpacing'||key.includes('Eye')))reason='eyes_closed';
  else if(lips.has(key)&&summary?.quality.expressionLimited)reason='expression';
  else {const [lo,hi]=range(key);if(value<lo||value>hi||(/(Width|Length|Thickness|Aspect|Height)$/.test(key)&&value<=0))reason='out_of_range';}
  measurements[key]={key,value:reason?null:value!,observation:'unknown',quality:reason==='missing'?'missing':reason?'rejected':'provisional',calibration:'provisional',reason,sourceFeatures:[key]};
 }
 function derived(key:string,from:string[],reduce:(v:number[])=>number){
  const usable=from.every(k=>measurements[k].quality==='provisional');
  measurements[key]={key,value:usable?reduce(from.map(k=>measurements[k].value!)):null,observation:'unknown',quality:usable?'provisional':'missing',calibration:'provisional',reason:usable?null:'incomplete_pair',sourceFeatures:from};
 }
 derived('eyeAspect',['leftEyeAspect','rightEyeAspect'],v=>Math.min(...v));
 derived('browArch',['leftBrowArch','rightBrowArch'],v=>(v[0]+v[1])/2);
 for(const [key,policy] of Object.entries(observationPolicy)){
  const m=measurements[key];if(m.quality!=='provisional')continue;
  m.observation=m.value!<policy.low?'relatively_low':m.value!>=policy.high?'relatively_high':'neutral';
 }
 return {schemaVersion:2,measurements};
}
