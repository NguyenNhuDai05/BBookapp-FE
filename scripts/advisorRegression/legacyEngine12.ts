// Frozen engine 12 oracle. Tests/reports only; never import from app runtime.
import type {FaceFeatureSummaryV3,Extraction} from '../../features/makeupAdvisor/faceFeatures/extractor';
import type {AdvisorResult} from '../../features/makeupAdvisor/advisorRecommendation';
import {DEFAULT_PREFERENCES,LibraryPreferences,styleLibrary} from '../../features/makeupAdvisor/styleLibrary';
import {buildFaceProfile} from '../../features/makeupAdvisor/faceFeatures/profileV2';
import {compatibilityRules,TechniqueKey} from '../../features/makeupAdvisor/techniqueCompatibility';
import {faceAwareExperimental} from '../../features/makeupAdvisor/flags';
export const occasionLabels={daily:'Hằng ngày',work:'Đi làm',school:'Đi học',date:'Hẹn hò',party:'Đi tiệc',photoshoot:'Chụp ảnh',wedding:'Đám cưới'};
export const intensityLabels={light:'Nhẹ',medium:'Vừa',bold:'Nổi bật'};
const curated=['natural','peach','soft-glam','soft-korean','clean-girl','strawberry','latte','douyin','classic-glam','thai-glam','smokey-eyes','bridal-soft-glam'];
export type RankingTrace={experimentalEnabled:boolean;acceptedFeatures:string[];rejectedFeatures:{key:string;reason:string}[];activatedRules:string[];source:'face-aware'|'fallback';styles:{styleKey:string;ruleContributions:{ruleId:string;feature:string;techniqueKey:TechniqueKey;contribution:number}[];faceScore:number;preferenceScore:number;finalScore:number;selected:boolean;selectionReason:string}[]};
export const scoringPolicy={faceBudget:1,occasionBonus:.12,intensityBonus:.08} as const;
type EngineOptions={experimental?:boolean;localFeatures?:Extraction['features'];qualityContext?:Extraction['qualityContext']};
export function recommendFromLibrary(summary?:FaceFeatureSummaryV3,preferences:LibraryPreferences=DEFAULT_PREFERENCES,options:EngineOptions={}):AdvisorResult{
 const profile=buildFaceProfile(summary,options.localFeatures,options.qualityContext);
 const experimental=options.experimental??faceAwareExperimental;
 const active=experimental?compatibilityRules.filter(r=>{
  const m=profile.measurements[r.feature];return m?.quality===r.requiredQuality&&m.calibration==='provisional'&&m.observation===r.observation&&r.evidenceStatus==='experimental'&&r.reviewStatus==='pending';
 }):[];
 const activeFeatures=[...new Set(active.map(r=>r.feature))];
 const ranked=styleLibrary.filter(s=>s.key!=='bridal-soft-glam'||preferences.occasion==='wedding').map(s=>{
  const rules=active.filter(r=>s.faceCompatibility.ruleIds.includes(r.id)&&s.faceCompatibility.techniqueKeys.includes(r.techniqueKey));
  const covered=[...new Set(rules.map(r=>r.feature))];
  // One capped contribution per feature; duplicate rules cannot inflate score.
  // Denominator is the same active-feature set for all styles, including no-rule styles.
  const faceScore=activeFeatures.length?covered.length/activeFeatures.length*scoringPolicy.faceBudget:0;
  const preferenceScore=(preferences.occasion&&s.occasions.includes(preferences.occasion)?scoringPolicy.occasionBonus:0)+(preferences.intensity&&s.intensity===preferences.intensity?scoringPolicy.intensityBonus:0);
  return {s,rules,faceScore,preferenceScore,score:faceScore+preferenceScore};
 }).sort((a,b)=>b.score-a.score||curated.indexOf(a.s.key)-curated.indexOf(b.s.key)||a.s.key.localeCompare(b.s.key));
 const selected:typeof ranked=[];
 // Tie-only diversity: preferences remain the primary ordering evidence.
 while(selected.length<3){const best=ranked[0].score;const candidates=ranked.filter(r=>r.score===best);
  const next=candidates.find(r=>!selected.some(x=>x.s.intensity===r.s.intensity))||candidates[0];
  selected.push(next);ranked.splice(ranked.indexOf(next),1);
 }
 const trace:RankingTrace={experimentalEnabled:experimental===true,acceptedFeatures:Object.values(profile.measurements).filter(m=>m.quality==='provisional').map(m=>m.key),rejectedFeatures:Object.values(profile.measurements).filter(m=>m.quality!=='provisional').map(m=>({key:m.key,reason:m.reason||'unknown'})),activatedRules:active.map(r=>r.id),source:selected.some(r=>r.rules.length)?'face-aware':'fallback',styles:[...selected,...ranked].map(r=>({styleKey:r.s.key,ruleContributions:r.rules.map(rule=>({ruleId:rule.id,feature:rule.feature,techniqueKey:rule.techniqueKey,contribution:scoringPolicy.faceBudget/Math.max(1,activeFeatures.length)/r.rules.filter(x=>x.feature===rule.feature).length})),faceScore:r.faceScore,preferenceScore:r.preferenceScore,finalScore:r.score,selected:selected.includes(r),selectionReason:r.rules.length?'face-technique-match':r.preferenceScore?'explicit-preference':'diverse-discovery'}))};
 return {source:'local',localEvidence:trace.source==='face-aware'?'experimental':'fallback',rankingTrace:trace,recommendations:selected.map(({s,rules})=>{
  const reasons:string[]=[];
  if(preferences.occasion&&s.occasions.includes(preferences.occasion))reasons.push(`Một lựa chọn để thử cho dịp ${occasionLabels[preferences.occasion].toLocaleLowerCase('vi')}.`);
  if(preferences.intensity&&s.intensity===preferences.intensity)reasons.push(`Độ đậm ${intensityLabels[preferences.intensity].toLocaleLowerCase('vi')} theo lựa chọn của bạn.`);
  const t=s.techniques,faceReasons=[...new Set(rules.map(r=>r.explanation))];
  const explanation=[...faceReasons,...reasons,s.whyTry].join(' ');
  const regionTip=(region:'eyes'|'brows'|'lips')=>rules.filter(r=>region==='eyes'?r.feature.startsWith('eye'):region==='brows'?r.feature==='browArch':r.feature==='mouthAspect').map(r=>r.explanation).join(' ');
  return {styleKey:s.key,title:s.displayName,displayName:s.displayName,shortDescription:s.shortDescription,whyItFits:explanation,whyRecommended:explanation,
   matchedTechniques:[...new Set(rules.map(r=>r.techniqueKey))],recommendationSource:rules.length?'local-face-aware':'local-library',evidenceStatus:rules.length?'experimental':'fallback',detailedTechniques:t,
   makeupFocus:[`Nền: ${t.base}`,`Mắt: ${t.eyes} ${regionTip('eyes')}`.trim(),`Lông mày: ${t.brows} ${regionTip('brows')}`.trim(),`Má: ${t.cheeks}`,`Môi: ${t.lips} ${regionTip('lips')}`.trim(),`Tạo khối / bắt sáng: ${t.contourHighlight}`],
   colorSuggestions:s.colorPalette,occasionFit:s.occasions.map(o=>occasionLabels[o]),serviceQueryKeywords:[s.name,s.displayName,...s.tags.slice(0,3)],quickSteps:s.quickSteps,imageKey:s.imageKey};
 })};
}

