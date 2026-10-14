import data from './bbook-makeup-style-library.vi.json';
import {knowledge} from './knowledge';
import {compatibilityRules,techniqueTaxonomy,TechniqueKey} from './techniqueCompatibility';
export type Occasion='daily'|'work'|'school'|'date'|'party'|'photoshoot'|'wedding';
export type Intensity='light'|'medium'|'bold';
export type LibraryPreferences={occasion:Occasion|null;intensity:Intensity|null};
export const DEFAULT_PREFERENCES:LibraryPreferences={occasion:null,intensity:null};
export type LibraryStyle={key:string;name:string;displayName:string;shortDescription:string;signatureLook:string;intensity:Intensity;occasions:Occasion[];tags:string[];colorPalette:string[];techniques:Record<'base'|'eyes'|'brows'|'cheeks'|'lips'|'contourHighlight',string>;quickSteps:string[];whyTry:string;conditionalTips:{feature:string;observation:string;tip:string;reason:string}[];imageKey:string;imageBrief:string;visualFocus:string;faceCompatibility:{techniqueKeys:TechniqueKey[];ruleIds:string[];evidenceStatus:'experimental';reviewStatus:'pending'}};
export function validLibrary(value:unknown):value is {schemaVersion:'1.1';language:'vi-VN';catalogType:'makeup-style-library';styles:LibraryStyle[]}{
 try{
 if(!value||typeof value!=='object')return false;
 const v=value as typeof data;
 const text=(s:unknown)=>typeof s==='string'&&s.trim().length>0;
 const occasions=['daily','work','school','date','party','photoshoot','wedding'];
 return v.schemaVersion==='1.1'&&v.language==='vi-VN'&&v.catalogType==='makeup-style-library'&&Array.isArray(v.styles)&&v.styles.length===12&&new Set(v.styles.map(s=>s.key)).size===12&&v.styles.every(s=>
  /^[a-z]+(?:-[a-z]+)*$/.test(s.key)&&[s.name,s.displayName,s.shortDescription,s.signatureLook,s.whyTry,s.imageBrief,s.visualFocus].every(text)&&
  s.shortDescription.trim().split(/\s+/).length>=20&&s.shortDescription.trim().split(/\s+/).length<=35&&
  ['light','medium','bold'].includes(s.intensity)&&s.occasions.length>0&&s.occasions.every(o=>occasions.includes(o))&&s.tags.length>0&&s.tags.every(t=>/^[a-z]+(?:-[a-z]+)*$/.test(t))&&s.colorPalette.length>0&&s.colorPalette.every(text)&&
  ['base','eyes','brows','cheeks','lips','contourHighlight'].every(k=>text((s.techniques as Record<string,unknown>)[k]))&&s.quickSteps.length>=4&&s.quickSteps.length<=6&&s.quickSteps.every(text)&&
  s.conditionalTips.length<=3&&s.conditionalTips.every((t:{feature:string;observation:string;tip:string;reason:string})=>['eyeSpacing','eyeAspect','browArch','outlineAspect','mouthWidth','mouthAspect'].includes(t.feature)&&['relatively_low','relatively_high','balanced'].includes(t.observation)&&text(t.tip)&&text(t.reason))&&s.imageKey===`${s.key}.webp`&&
  s.faceCompatibility.evidenceStatus==='experimental'&&s.faceCompatibility.reviewStatus==='pending'&&Array.isArray(s.faceCompatibility.techniqueKeys)&&new Set(s.faceCompatibility.techniqueKeys).size===s.faceCompatibility.techniqueKeys.length&&s.faceCompatibility.techniqueKeys.every(k=>Object.prototype.hasOwnProperty.call(techniqueTaxonomy,k))&&Array.isArray(s.faceCompatibility.ruleIds)&&new Set(s.faceCompatibility.ruleIds).size===s.faceCompatibility.ruleIds.length&&s.faceCompatibility.ruleIds.every(id=>compatibilityRules.some(r=>r.id===id&&s.faceCompatibility.techniqueKeys.includes(r.techniqueKey))));
 }catch{return false;}
}
if(!validLibrary(data))throw new Error('Invalid BBook makeup style library');
export const styleLibrary=data.styles as LibraryStyle[];
export function aliasesFor(key:string):readonly string[]{
 const legacy=knowledge.find(k=>k.key===key);if(legacy)return legacy.aliases;
 const s=styleLibrary.find(s=>s.key===key);if(!s)return [];
 return [s.name,s.displayName,...(key==='soft-korean'?['Korean']:[])];
}
