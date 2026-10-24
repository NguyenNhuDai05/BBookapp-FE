// Pure ranking for the consolidated 20-style engine. No native or API work.
import catalog from './bbook-makeup-catalog-20-vi-v1.2.json';
import {scoringMetadata} from './scoringMetadata';
import overlay from './compatibilityOverlay20.json';
import legacy from './bbook-makeup-style-library.vi.json';
import {buildFaceProfile} from './faceFeatures/profileV2';
import {compatibilityRules,type TechniqueKey} from './techniqueCompatibility';
import {scoreMeasurements} from './measurementRanking';
import type {Extraction,FaceFeatureSummaryV3} from './faceFeatures/extractor';
import type {Intensity,LibraryPreferences,Occasion} from './styleLibrary';
export const scoringPolicy={faceBudget:1,occasionBonus:.12,intensityBonus:.08} as const;
const oldOrder=['natural','peach','soft-glam','soft-korean','clean-girl','strawberry','latte','douyin','classic-glam','thai-glam','smokey-eyes','bridal-soft-glam'];
export const tieBreakOrder=[...oldOrder,'j-beauty','igari','ulzzang','western-glam','nude-makeup','fox-eye','sunkissed','glass-skin'] as const;
export type Candidate={key:string;name:string;displayName:string;intensity:Intensity;occasions:Occasion[];tags:string[];colorPalette:string[];ruleIds:string[];techniqueKeys:TechniqueKey[];metadataSource:'legacy-12'|'catalog-20';mappingReview:'inherited-experimental'|'proposed-experimental'|'preference-only'};
export const candidates:Candidate[]=catalog.styles.map(s=>{
 const old=legacy.styles.find(o=>o.key===s.key);
 const ids=overlay.ruleIds[s.key as keyof typeof overlay.ruleIds];
 const source=scoringMetadata[s.key];
 return {key:s.key,name:source.name,displayName:s.displayName,intensity:source.intensity as Intensity,occasions:[...source.occasions] as Occasion[],tags:[...source.tags],colorPalette:[...source.colorPalette],ruleIds:[...ids],techniqueKeys:old?[...old.faceCompatibility.techniqueKeys] as TechniqueKey[]:[...new Set(ids.map(id=>compatibilityRules.find(r=>r.id===id)!.techniqueKey))],metadataSource:old?'legacy-12':'catalog-20',mappingReview:old?'inherited-experimental':ids.length?'proposed-experimental':'preference-only'};
});
export function validateConfiguration(pool:readonly Candidate[],order:readonly string[]){
 const keys=pool.map(c=>c.key);
 if(new Set(keys).size!==keys.length||new Set(order).size!==order.length||keys.length!==order.length||keys.some(k=>!order.includes(k))||order.some(k=>!keys.includes(k)))throw Error('Tie-break must contain every candidate key exactly once');
 for(const c of pool){if(new Set(c.ruleIds).size!==c.ruleIds.length||c.ruleIds.some(id=>!compatibilityRules.some(r=>r.id===id&&c.techniqueKeys.includes(r.techniqueKey))))throw Error(`Invalid compatibility overlay: ${c.key}`);}
}
validateConfiguration(candidates,tieBreakOrder);
export type StyleScore={styleKey:string;displayName:string;faceScore:number;preferenceScore:number;finalScore:number;selected:boolean;selectionReason:'face-technique-match'|'explicit-preference'|'diverse-discovery';evidenceStatus:'experimental'|'preference-only'|'fallback';ruleContributions:{ruleId:string;feature:string;techniqueKey:TechniqueKey;contribution:number;explanation:string}[];preferenceContributions:{kind:'occasion'|'intensity';value:string;contribution:number;explanation:string}[];explanations:string[]};
export type EngineOptions={experimental?:boolean;measurementRanking?:boolean;localFeatures?:Extraction['features'];qualityContext?:Extraction['qualityContext']};
export function evaluateRanking(summary:FaceFeatureSummaryV3|undefined,preferences:LibraryPreferences={occasion:null,intensity:null},options:EngineOptions={}){
 const profile=buildFaceProfile(summary,options.localFeatures,options.qualityContext);
 const active=options.experimental===false?[]:compatibilityRules.filter(r=>{const m=profile.measurements[r.feature];return m?.quality===r.requiredQuality&&m.calibration==='provisional'&&m.observation===r.observation&&r.evidenceStatus==='experimental'&&r.reviewStatus==='pending';});
 const activeFeatures=[...new Set(active.map(r=>r.feature))];
 const pool=candidates;
 const ranked=pool.filter(c=>c.key!=='bridal-soft-glam'||preferences.occasion==='wedding').map(c=>{
  const rules=active.filter(r=>c.ruleIds.includes(r.id)&&c.techniqueKeys.includes(r.techniqueKey));
  const measured = options.measurementRanking && options.experimental !== false ? scoreMeasurements(c.key, profile) : null;
  const faceScore=measured ? measured.reduce((sum, r) => sum + r.contribution, 0) : activeFeatures.length?new Set(rules.map(r=>r.feature)).size/activeFeatures.length*scoringPolicy.faceBudget:0;
  const prefs:StyleScore['preferenceContributions']=[];
  if(preferences.occasion&&c.occasions.includes(preferences.occasion))prefs.push({kind:'occasion',value:preferences.occasion,contribution:scoringPolicy.occasionBonus,explanation:`Sở thích dịp ${preferences.occasion}: +${scoringPolicy.occasionBonus}`});
  if(preferences.intensity&&c.intensity===preferences.intensity)prefs.push({kind:'intensity',value:preferences.intensity,contribution:scoringPolicy.intensityBonus,explanation:`Sở thích độ đậm ${preferences.intensity}: +${scoringPolicy.intensityBonus}`});
  const preferenceScore=prefs.reduce((sum,p)=>sum+p.contribution,0);
  const contributions=measured ?? rules.map(r=>({ruleId:r.id,feature:r.feature,techniqueKey:r.techniqueKey,contribution:scoringPolicy.faceBudget/Math.max(1,activeFeatures.length)/rules.filter(x=>x.feature===r.feature).length,explanation:r.explanation}));
  const row:StyleScore={styleKey:c.key,displayName:c.displayName,faceScore,preferenceScore,finalScore:faceScore+preferenceScore,selected:false,selectionReason:faceScore>0?'face-technique-match':preferenceScore?'explicit-preference':'diverse-discovery',evidenceStatus:faceScore>0?'experimental':preferenceScore?'preference-only':'fallback',ruleContributions:contributions,preferenceContributions:prefs,explanations:[...new Set(contributions.map(r=>r.explanation)),...prefs.map(p=>p.explanation)]};
  return {row,intensity:c.intensity};
 }).sort((a,b)=>b.row.finalScore-a.row.finalScore||tieBreakOrder.indexOf(a.row.styleKey)-tieBreakOrder.indexOf(b.row.styleKey)||a.row.styleKey.localeCompare(b.row.styleKey));
 const scoreOrder=ranked.map(r=>r.row.styleKey),selected:typeof ranked=[];
 while(selected.length<Math.min(3,pool.length)&&ranked.length){const best=ranked[0].row.finalScore,candidates=ranked.filter(r=>r.row.finalScore===best);const next=candidates.find(r=>!selected.some(s=>s.intensity===r.intensity))||candidates[0];next.row.selected=true;selected.push(next);ranked.splice(ranked.indexOf(next),1);}
 return {measurements:Object.entries(profile.measurements).filter(([key])=>['eyeSpacing','eyeAspect','browArch','mouthAspect'].includes(key)).map(([key,m])=>({key,value:m.value,quality:m.quality,reason:m.reason})),top3:selected.map(r=>r.row),scores:[...selected,...ranked].map(r=>r.row),scoreOrder,activatedRules:options.measurementRanking ? [...new Set([...selected, ...ranked].flatMap(r => r.row.ruleContributions.map(c => c.ruleId)))] : active.map(r=>r.id),acceptedFeatures:Object.values(profile.measurements).filter(m=>m.quality==='provisional').map(m=>m.key),rejectedFeatures:Object.values(profile.measurements).filter(m=>m.quality!=='provisional').map(m=>({key:m.key,reason:m.reason})),preferences};
}

export type RankingTrace={algorithmVersion?:string;measurements?:{key:string;value:number|null;quality:string;reason:string|null}[];experimentalEnabled:boolean;acceptedFeatures:string[];rejectedFeatures:{key:string;reason:string}[];activatedRules:string[];source:'face-aware'|'fallback';styles:{styleKey:string;ruleContributions:{ruleId:string;feature:string;techniqueKey:TechniqueKey;contribution:number}[];faceScore:number;preferenceScore:number;finalScore:number;selected:boolean;selectionReason:string;selectionBasis?:string}[]};

