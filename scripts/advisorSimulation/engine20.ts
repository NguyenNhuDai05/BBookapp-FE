// Phase B only. No app/runtime entry point may import this module.
import catalog from '../../features/makeupAdvisor/bbook-makeup-catalog-20-vi-v1.2.json';
import legacy from '../../features/makeupAdvisor/bbook-makeup-style-library.vi.json';
import {buildFaceProfile} from '../../features/makeupAdvisor/faceFeatures/profileV2';
import {compatibilityRules,type TechniqueKey} from '../../features/makeupAdvisor/techniqueCompatibility';
import type {Extraction,FaceFeatureSummaryV3} from '../../features/makeupAdvisor/faceFeatures/extractor';
import type {Intensity,LibraryPreferences,Occasion} from '../../features/makeupAdvisor/styleLibrary';
export const simulationWeights={faceBudget:1,occasionBonus:.12,intensityBonus:.08} as const;
const oldOrder=['natural','peach','soft-glam','soft-korean','clean-girl','strawberry','latte','douyin','classic-glam','thai-glam','smokey-eyes','bridal-soft-glam'];
export const tieBreakOrder=[...oldOrder,'j-beauty','igari','ulzzang','western-glam','nude-makeup','fox-eye','sunkissed','glass-skin'] as const;
export const proposedRuleIds:Readonly<Record<string,readonly string[]>>={
 'j-beauty':['opening-low-soft','arch-high-natural'],
 igari:[],
 ulzzang:['opening-low-soft','opening-high-gradient','arch-low-soft'],
 'western-glam':['lip-low-outline','opening-high-gradient'],
 'nude-makeup':['opening-low-soft','arch-high-natural'],
 'fox-eye':['spacing-low-outer'],
 sunkissed:[],
 'glass-skin':['opening-low-soft','arch-high-natural'],
};
export type SimCandidate={key:string;name:string;displayName:string;intensity:Intensity;occasions:Occasion[];tags:string[];colorPalette:string[];ruleIds:string[];techniqueKeys:TechniqueKey[];metadataSource:'legacy-12'|'catalog-20';mappingReview:'inherited-experimental'|'proposed-experimental'|'preference-only'};
export const candidates:SimCandidate[]=catalog.styles.map(s=>{
 const old=legacy.styles.find(o=>o.key===s.key);
 const ids=old?.faceCompatibility.ruleIds||[...(proposedRuleIds[s.key]||[])];
 const source=old||s;
 return {key:s.key,name:source.name,displayName:s.displayName,intensity:source.intensity as Intensity,occasions:[...source.occasions] as Occasion[],tags:[...source.tags],colorPalette:[...source.colorPalette],ruleIds:[...ids],techniqueKeys:old?[...old.faceCompatibility.techniqueKeys] as TechniqueKey[]:[...new Set(ids.map(id=>compatibilityRules.find(r=>r.id===id)!.techniqueKey))],metadataSource:old?'legacy-12':'catalog-20',mappingReview:old?'inherited-experimental':ids.length?'proposed-experimental':'preference-only'};
});
export function validateSimulationConfiguration(pool:readonly SimCandidate[],order:readonly string[]){
 const keys=pool.map(c=>c.key);
 if(new Set(keys).size!==keys.length||new Set(order).size!==order.length||keys.length!==order.length||keys.some(k=>!order.includes(k))||order.some(k=>!keys.includes(k)))throw Error('Tie-break must contain every candidate key exactly once');
 for(const c of pool){if(new Set(c.ruleIds).size!==c.ruleIds.length||c.ruleIds.some(id=>!compatibilityRules.some(r=>r.id===id&&c.techniqueKeys.includes(r.techniqueKey))))throw Error(`Invalid compatibility overlay: ${c.key}`);}
}
validateSimulationConfiguration(candidates,tieBreakOrder);
export type SimScore={styleKey:string;displayName:string;faceScore:number;preferenceScore:number;finalScore:number;selected:boolean;selectionReason:'face-technique-match'|'explicit-preference'|'diverse-discovery';evidenceStatus:'experimental'|'preference-only'|'fallback';ruleContributions:{ruleId:string;feature:string;techniqueKey:TechniqueKey;contribution:number;explanation:string}[];preferenceContributions:{kind:'occasion'|'intensity';value:string;contribution:number;explanation:string}[];explanations:string[]};
export type SimOptions={experimental?:boolean;localFeatures?:Extraction['features'];qualityContext?:Extraction['qualityContext'];legacyOnly?:boolean};
export function simulateEngine20(summary:FaceFeatureSummaryV3|undefined,preferences:LibraryPreferences={occasion:null,intensity:null},options:SimOptions={}){
 const profile=buildFaceProfile(summary,options.localFeatures,options.qualityContext);
 const active=options.experimental===false?[]:compatibilityRules.filter(r=>{const m=profile.measurements[r.feature];return m?.quality===r.requiredQuality&&m.calibration==='provisional'&&m.observation===r.observation&&r.evidenceStatus==='experimental'&&r.reviewStatus==='pending';});
 const activeFeatures=[...new Set(active.map(r=>r.feature))];
 const pool=options.legacyOnly?candidates.filter(c=>c.metadataSource==='legacy-12'):candidates;
 const ranked=pool.filter(c=>c.key!=='bridal-soft-glam'||preferences.occasion==='wedding').map(c=>{
  const rules=active.filter(r=>c.ruleIds.includes(r.id)&&c.techniqueKeys.includes(r.techniqueKey));
  const faceScore=activeFeatures.length?new Set(rules.map(r=>r.feature)).size/activeFeatures.length*simulationWeights.faceBudget:0;
  const prefs:SimScore['preferenceContributions']=[];
  if(preferences.occasion&&c.occasions.includes(preferences.occasion))prefs.push({kind:'occasion',value:preferences.occasion,contribution:simulationWeights.occasionBonus,explanation:`Sở thích dịp ${preferences.occasion}: +${simulationWeights.occasionBonus}`});
  if(preferences.intensity&&c.intensity===preferences.intensity)prefs.push({kind:'intensity',value:preferences.intensity,contribution:simulationWeights.intensityBonus,explanation:`Sở thích độ đậm ${preferences.intensity}: +${simulationWeights.intensityBonus}`});
  const preferenceScore=prefs.reduce((sum,p)=>sum+p.contribution,0);
  const contributions=rules.map(r=>({ruleId:r.id,feature:r.feature,techniqueKey:r.techniqueKey,contribution:simulationWeights.faceBudget/Math.max(1,activeFeatures.length)/rules.filter(x=>x.feature===r.feature).length,explanation:r.explanation}));
  const row:SimScore={styleKey:c.key,displayName:c.displayName,faceScore,preferenceScore,finalScore:faceScore+preferenceScore,selected:false,selectionReason:rules.length?'face-technique-match':preferenceScore?'explicit-preference':'diverse-discovery',evidenceStatus:rules.length?'experimental':preferenceScore?'preference-only':'fallback',ruleContributions:contributions,preferenceContributions:prefs,explanations:[...new Set(contributions.map(r=>r.explanation)),...prefs.map(p=>p.explanation)]};
  return {row,intensity:c.intensity};
 }).sort((a,b)=>b.row.finalScore-a.row.finalScore||tieBreakOrder.indexOf(a.row.styleKey)-tieBreakOrder.indexOf(b.row.styleKey)||a.row.styleKey.localeCompare(b.row.styleKey));
 const scoreOrder=ranked.map(r=>r.row.styleKey),selected:typeof ranked=[];
 while(selected.length<Math.min(3,pool.length)&&ranked.length){const best=ranked[0].row.finalScore,candidates=ranked.filter(r=>r.row.finalScore===best);const next=candidates.find(r=>!selected.some(s=>s.intensity===r.intensity))||candidates[0];next.row.selected=true;selected.push(next);ranked.splice(ranked.indexOf(next),1);}
 return {simulationOnly:true as const,top3:selected.map(r=>r.row),scores:[...selected,...ranked].map(r=>r.row),scoreOrder,activatedRules:active.map(r=>r.id),acceptedFeatures:Object.values(profile.measurements).filter(m=>m.quality==='provisional').map(m=>m.key),rejectedFeatures:Object.values(profile.measurements).filter(m=>m.quality!=='provisional').map(m=>({key:m.key,reason:m.reason})),preferences};
}
