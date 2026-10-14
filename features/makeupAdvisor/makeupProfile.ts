import type {FaceFeatureSummaryV3} from './faceFeatures/extractor';

export type MakeupRegion={evidence:'unknown'|'experimental_2d';signals:string[];sourceFeatures:string[]};
export type MakeupProfile={schemaVersion:1;sourceSummaryVersion:3;evidenceStatus:'unknown'|'experimental_2d';regions:Record<'eyes'|'brows'|'cheeks'|'lips',MakeupRegion>;unknown:string[];limitations:string[]};
// Same experimental presentation buckets as the server converter. Neither
// confidence percentages nor anatomical face-shape labels are fabricated.
export function makeupProfile(s:FaceFeatureSummaryV3):MakeupProfile {
 const value=(key:string)=>Number.isFinite(s.features[key])?s.features[key]:undefined;
 const region=(build:(signals:string[],used:string[])=>void):MakeupRegion=>{const signals:string[]=[],used:string[]=[];build(signals,used);return {evidence:signals.length?'experimental_2d':'unknown',signals,sourceFeatures:[...new Set(used)]};};
 const eyes=region((signals,used)=>{
  const spacing=value('eyeSpacing');if(spacing!==undefined){signals.push(spacing<.46?'lower_spacing_projection':'higher_spacing_projection');used.push('eyeSpacing');}
  const l=value('leftEyeAspect'),r=value('rightEyeAspect');if(l!==undefined&&r!==undefined){signals.push(Math.min(l,r)<.25?'lower_eye_opening_projection':'moderate_eye_opening_projection');used.push('leftEyeAspect','rightEyeAspect');}
 });
 const brows=region((signals,used)=>{const l=value('leftBrowArch'),r=value('rightBrowArch');if(l!==undefined&&r!==undefined){signals.push((l+r)/2>=.08?'more_curved_brow_projection':'gentler_brow_projection');used.push('leftBrowArch','rightBrowArch');}});
 const cheeks=region((signals,used)=>{const ratio=value('outlineAspect');if(ratio!==undefined){signals.push(ratio>=1.4?'longer_outline_projection':ratio<=1.1?'wider_outline_projection':'balanced_outline_projection');used.push('outlineAspect');}});
 const lips=region((signals,used)=>{
  if(s.quality.expressionLimited)return;
  const width=value('mouthWidth');if(width!==undefined){signals.push(width>=.36?'wider_lip_projection':'compact_lip_projection');used.push('mouthWidth');}
  const aspect=value('mouthAspect');if(aspect!==undefined){signals.push(aspect>=.3?'greater_lip_height_projection':'lower_lip_height_projection');used.push('mouthAspect');}
 });
 const regions={eyes,brows,cheeks,lips};
 return {schemaVersion:1,sourceSummaryVersion:3,evidenceStatus:Object.values(regions).some(r=>r.signals.length)?'experimental_2d':'unknown',regions,unknown:['undertone','skinType','faceShape','anatomicalDepth'],limitations:['Projection signals are experimental, uncalibrated and may be unknown; they are not anatomy or identity.','Coarsening does not establish anonymity or permission to use Unpaid Services.']};
}
