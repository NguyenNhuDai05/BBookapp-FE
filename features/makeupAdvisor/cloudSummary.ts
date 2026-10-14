import type {FaceFeatureSummaryV3} from './faceFeatures/extractor';

const features=new Set(['outlineAspect','eyeSpacing','leftEyeWidth','rightEyeWidth','leftEyeAspect','rightEyeAspect','leftBrowLength','rightBrowLength','leftBrowArch','rightBrowArch','leftBrowEyeGap','rightBrowEyeGap','noseBridgeLength','noseBaseWidth','mouthWidth','mouthAspect','upperLipThickness','lowerLipThickness','lowerFaceHeight','outlineUpperWidth','outlineMiddleWidth','outlineLowerWidth','chinWidth','leftEyeTilt','rightEyeTilt','leftBrowTilt','rightBrowTilt']);
const missing=new Set([...features,'leftEyePosition','rightEyePosition','eyeWidthDifference','mouthPosition','outlineCompactness','meshProjectedArea','meshRelativeZSpan']);
// Rebuild from known keys; preserve exact on-device values for local advice.
// Coarsening is minimization, not proof of anonymity or provider permission.
export function cloudSummary(s:FaceFeatureSummaryV3):FaceFeatureSummaryV3 {
 const values:Record<string,number>={},sources:FaceFeatureSummaryV3['featureSources']={};
 const omitted:string[]=[];
 for(const [key,value] of Object.entries(s.features)){
  const source=s.featureSources[key];
  if(!features.has(key)||!Number.isFinite(value)||(source!=='face_mesh'&&source!=='face_detection'))continue;
  const rounded=Math.round(value*1000)/1000;
  if(rounded===0&&value>0&&!key.endsWith('Tilt')&&!key.endsWith('Arch')&&!key.endsWith('Gap')){omitted.push(key);continue;}
  values[key]=rounded;sources[key]=source;
 }
 const d=s.detection,b=d?.boundingBox,p=d?.pose;
 const lower=(v:number)=>Math.floor(v*1000)/1000;
 return {schemaVersion:s.schemaVersion,analysisMethod:s.analysisMethod,
  quality:{frontal:s.quality.frontal,singleFace:s.quality.singleFace,expressionLimited:s.quality.expressionLimited},
  detection:d&&b&&p?{faceCount:d.faceCount,boundingBox:{x:lower(b.x),y:lower(b.y),width:lower(b.width),height:lower(b.height)},pose:{yaw:Math.round(p.yaw*10)/10,pitch:Math.round(p.pitch*10)/10,roll:Math.round(p.roll*10)/10}}:null,
  features:values,featureSources:sources,
  missing:[...new Set([...s.missing,...omitted])].filter(k=>missing.has(k)&&!(k in values)),limitations:[...s.limitations],
 };
}
