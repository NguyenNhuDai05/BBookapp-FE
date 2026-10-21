import {evaluateRanking,candidates,tieBreakOrder} from './recommendationCore';
import {makeupEffects,validEffects,type MakeupEffect,type SuggestionSource} from './effects';
import {validScoringPresentation,presentationStyle,catalogLabels} from './presentationCatalog';
import {scoringMetadata,scoringIntensityLabels,scoringOccasionLabels} from './scoringMetadata';
import type {Extraction} from './faceFeatures/extractor';
import {DEFAULT_PREFERENCES,type LibraryPreferences} from './styleLibrary';
import type {EngineOptions} from './recommendationCore';
import type {AdvisorResult,MakeupRecommendation} from './advisorRecommendation';
import {faceAwareExperimental,measurementRankingEnabled} from './flags';
export function recommendFromLibrary(extraction:Extraction,preferences:LibraryPreferences=DEFAULT_PREFERENCES,effects:MakeupEffect[]=[],options:EngineOptions={}):AdvisorResult{
 if(extraction.status!=='valid'||!validEffects(effects))throw {code:'E_RECOMMENDATIONS'};
 const base=evaluateRanking(extraction.summary,preferences,{...options,experimental:options.experimental??faceAwareExperimental,measurementRanking:options.measurementRanking??measurementRankingEnabled,localFeatures:extraction.features,qualityContext:extraction.qualityContext});
 const matched=effects.length?base.scores.filter(r=>effects.every(e=>makeupEffects[e].keys.includes(r.styleKey))):[];
 const nominee=matched.length?[...matched].sort((a,b)=>b.preferenceScore-a.preferenceScore||tieBreakOrder.indexOf(a.styleKey)-tieBreakOrder.indexOf(b.styleKey))[0]:undefined;
 const chosen=nominee&&!base.top3.some(r=>r.styleKey===nominee.styleKey)?[...base.top3.slice(0,2),nominee]:base.top3;
 const recommendations:MakeupRecommendation[]=chosen.map(r=>{
  const s=presentationStyle(r.styleKey)!,metadata=scoringMetadata[r.styleKey],preferenceLane=nominee?.styleKey===r.styleKey;
  const source:SuggestionSource=preferenceLane?'preference-based':r.faceScore>0?'face-aware':r.preferenceScore>0?'preference-based':'fallback';
  const basis=preferenceLane?'explicit-effect-slot':r.faceScore>0?'valid-measurements':r.preferenceScore>0?'occasion-intensity':'curated-fallback';
  const effectReasons=preferenceLane?effects.map(e=>`Bạn chọn ${makeupEffects[e].label.toLocaleLowerCase('vi')}; nội dung phong cách này có hiệu ứng tương ứng.`):[];
  const preferenceReasons=r.preferenceContributions.map(p=>p.kind==='occasion'?`Khớp dịp ${scoringOccasionLabels[p.value as keyof typeof scoringOccasionLabels].toLocaleLowerCase('vi')}.`:`Khớp độ đậm ${scoringIntensityLabels[p.value as keyof typeof scoringIntensityLabels].toLocaleLowerCase('vi')}.`);
  const why=source==='preference-based'&&preferenceLane?[...effectReasons,...r.preferenceContributions.map(p=>p.kind==='occasion'?`Khớp dịp ${scoringOccasionLabels[p.value as keyof typeof scoringOccasionLabels].toLocaleLowerCase('vi')}.`:`Khớp độ đậm ${scoringIntensityLabels[p.value as keyof typeof scoringIntensityLabels].toLocaleLowerCase('vi')}.`)].join(' '):source==='fallback'?'Gợi ý khám phá từ thư viện; chưa có tín hiệu cá nhân hóa đủ để ưu tiên phong cách này.':[...new Set(r.ruleContributions.map(c=>c.explanation)),...preferenceReasons].join(' ');
  return {styleKey:s.key,title:s.displayName,displayName:s.displayName,shortDescription:s.shortDescription,whyItFits:why,whyRecommended:why,matchedTechniques:[...new Set(r.ruleContributions.map(c=>c.techniqueKey))],recommendationSource:source==='face-aware'?'local-face-aware':'local-library',makeupFocus:Object.values(s.techniques),detailedTechniques:s.techniques,colorSuggestions:catalogLabels(s,'colorPaletteLabels'),occasionFit:metadata.occasions.map(o=>scoringOccasionLabels[o]),serviceQueryKeywords:[metadata.name,s.displayName,...metadata.tags.slice(0,3)],quickSteps:s.quickSteps,imageKey:s.imageKey,sourceEvidenceStatus:source==='face-aware'?'experimental':source==='preference-based'?'preference-only':'fallback',faceEvidenceStatus:r.faceScore>0?'experimental':'none',suggestionSource:source,selectionBasis:basis,scoringMetadataVersion:metadata.version,scoringIntensity:metadata.intensity,scoringOccasions:metadata.occasions,scoringIntensityLabel:scoringIntensityLabels[metadata.intensity],faceEvidence:r.ruleContributions,preferenceEvidence:r.preferenceContributions,matchedEffects:preferenceLane?effects:[],evidenceStatus:r.faceScore>0?'experimental':'fallback'};
 });
 if(!recommendations.every(validScoringPresentation))throw {code:'E_RECOMMENDATIONS'};
 return {scoringLabels:Object.fromEntries(Object.values(scoringMetadata).map(m=>[m.key,{intensity:scoringIntensityLabels[m.intensity],occasions:m.occasions.map(o=>scoringOccasionLabels[o]),version:m.version}])),source:'local',recommendations,localEvidence:chosen.some(r=>r.faceScore>0)?'experimental':'fallback',engineVersion:(options.measurementRanking??measurementRankingEnabled)?'20-measurements-v2':'20-reviewed-v1',scoringManifestVersion:'scoring-mixed-1.1-1.2',overlayVersion:'reviewed-20-v1',requestedEffects:effects,effectConflict:effects.length>0&&matched.length===0,rankingTrace:{algorithmVersion:(options.measurementRanking??measurementRankingEnabled)?'measurements-v2':'reviewed-v1',measurements:base.measurements,experimentalEnabled:options.experimental??faceAwareExperimental,acceptedFeatures:base.acceptedFeatures,rejectedFeatures:base.rejectedFeatures.map(r=>({...r,reason:r.reason||'unknown'})),activatedRules:base.activatedRules,source:chosen.some(r=>r.faceScore>0)?'face-aware':'fallback',styles:base.scores.map(r=>({...r,selected:chosen.some(x=>x.styleKey===r.styleKey),ruleContributions:r.ruleContributions,selectionReason:nominee?.styleKey===r.styleKey?'explicit-preference':r.selectionReason,selectionBasis:recommendations.find(x=>x.styleKey===r.styleKey)?.selectionBasis}))}};
}
// Validate effect overlay against stable keys at local-engine load time.
for(const e of Object.values(makeupEffects))if(new Set(e.keys).size!==e.keys.length||e.keys.some(k=>!candidates.some(c=>c.key===k)))throw Error('Invalid effect overlay');


