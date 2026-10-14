import {advisorApi,advisorBackendConfigured} from './advisorTransport';
import {recommendFaceScan} from './faceScanRecommendations';
import {DEFAULT_PREFERENCES,LibraryPreferences} from './styleLibrary';
import type {Extraction} from './faceFeatures/extractor';
import type {Geometry} from './faceGeometry';
import {knowledge} from './knowledge';
import {unsupportedClaims} from './responseClaims';
import {realUserGeminiApproved} from './flags';
import {cloudSummary} from './cloudSummary';
export type MakeupRecommendation={sourceEvidenceStatus?:'experimental'|'preference-only'|'fallback';faceEvidenceStatus?:'experimental'|'none';suggestionSource?:import('./effects').SuggestionSource;selectionBasis?:string;scoringMetadataVersion?:string;scoringIntensity?:import('./styleLibrary').Intensity;scoringOccasions?:import('./styleLibrary').Occasion[];scoringIntensityLabel?:string;faceEvidence?:import('./recommendationCore').StyleScore['ruleContributions'];preferenceEvidence?:import('./recommendationCore').StyleScore['preferenceContributions'];matchedEffects?:import('./effects').MakeupEffect[];styleKey:string;title:string;shortDescription:string;whyItFits:string;makeupFocus:string[];colorSuggestions:string[];occasionFit:string[];serviceQueryKeywords:string[];quickSteps?:string[];imageKey?:string;displayName?:string;whyRecommended?:string;matchedTechniques?:string[];recommendationSource?:'local-face-aware'|'local-library';evidenceStatus?:'experimental'|'fallback';detailedTechniques?:Record<string,string>};
export type AdvisorResult={scoringLabels?:Record<string,{intensity:string;occasions:string[];version:string}>;engineVersion?:string;scoringManifestVersion?:string;overlayVersion?:string;requestedEffects?:import('./effects').MakeupEffect[];effectConflict?:boolean;source:'local'|'gemini';recommendations:MakeupRecommendation[];fallbackReason?:'unavailable';localEvidence?:'experimental'|'fallback';rankingTrace?:import('./recommendationCore').RankingTrace};
export {realUserGeminiApproved} from './flags';
export function recommendationGeometry(e:Extraction):Geometry|undefined{
 const f=e.summary.features;
 if(e.status!=='valid'||[f.outlineAspect,f.eyeSpacing,f.mouthWidth].some(v=>v==null||!Number.isFinite(v)))return undefined;
 return {status:'measured',ratios:{outlineHeightToWidth:f.outlineAspect,eyeCenterDistanceToWidth:f.eyeSpacing,mouthWidthToWidth:f.mouthWidth},reasons:e.summary.limitations};
}
export function localRecommendations(e:Extraction,_g?:Geometry,preferences:LibraryPreferences=DEFAULT_PREFERENCES):AdvisorResult{return recommendFaceScan(e,preferences,[],{fallbackForBlocked:true});}
export function validRecommendations(value:unknown,_e?:Extraction):value is {recommendations:MakeupRecommendation[]}{
 if(!value||typeof value!=='object')return false;
 const rows=(value as {recommendations?:unknown}).recommendations;
 const text=(v:unknown,max=500)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!/[\u0000-\u001f]/.test(v)&&!v.includes('```');
 const list=(v:unknown,max:number,length:number,min=1)=>Array.isArray(v)&&v.length>=min&&v.length<=length&&v.every(s=>text(s,max)&&!/[\r\n\u0000-\u001f]/.test(s));
 const keys=['styleKey','title','shortDescription','whyItFits','makeupFocus','colorSuggestions','occasionFit','serviceQueryKeywords'];
 return Object.keys(value).length===1&&Array.isArray(rows)&&rows.length===3&&new Set(rows.map(r=>r?.styleKey)).size===3&&rows.every(r=>r&&Object.keys(r).length===keys.length&&Object.keys(r).every(k=>keys.includes(k))&&knowledge.some(k=>k.key===r.styleKey)&&text(r.title,100)&&text(r.shortDescription)&&text(r.whyItFits)&&list(r.makeupFocus,500,5,4)&&list(r.colorSuggestions,80,5)&&list(r.occasionFit,100,4)&&list(r.serviceQueryKeywords,60,5)&&!unsupportedClaims([r.title,r.shortDescription,r.whyItFits,...r.makeupFocus,...r.colorSuggestions,...r.occasionFit,...r.serviceQueryKeywords].join(' ')));
}
export async function getRecommendations(e:Extraction,g:Geometry|undefined,consent:boolean,requestId:string,signal:AbortSignal):Promise<AdvisorResult>{
 const fallback=localRecommendations(e,g);
 if(!consent||!realUserGeminiApproved||e.status!=='valid')return fallback;
 const unavailable:AdvisorResult={...fallback,fallbackReason:'unavailable'};
 if(!advisorBackendConfigured)return unavailable;
 try{
  const capability=await advisorApi.get<{featureSummaryEnabled:boolean;schemaVersion:number}>('/MakeupAdvisor/capabilities',{signal,timeout:8000});
  if(capability.data.featureSummaryEnabled!==true||capability.data.schemaVersion!==3)return unavailable;
  const {data}=await advisorApi.post<unknown>('/MakeupAdvisor/recommend',{requestId,consent:true,summary:cloudSummary(e.summary)},{signal,timeout:25000});
  return validRecommendations(data,e)?{source:'gemini',recommendations:data.recommendations}:unavailable;
 }catch{return unavailable;}
}

