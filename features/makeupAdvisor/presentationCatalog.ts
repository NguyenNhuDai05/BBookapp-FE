import labelReference from './catalogLabelReference.json';
import data from './bbook-makeup-catalog-20-vi-v1.2.json';
import type {MakeupRecommendation} from './advisorRecommendation';
import type {Extraction} from './faceFeatures/extractor';
import {buildFaceProfile} from './faceFeatures/profileV2';
import {aliasesFor} from './styleLibrary';
import type {Intensity,Occasion} from './styleLibrary';
export type CatalogStyle={key:string;name:string;displayName:string;shortDescription:string;signatureLook:string;intensity:Intensity;intensityLabel:string;occasions:Occasion[];occasionLabels:string[];tags:string[];tagLabels:string[];colorPalette:string[];colorPaletteLabels:string[];techniques:Record<'base'|'eyes'|'brows'|'cheeks'|'lips'|'contourHighlight',string>;quickSteps:string[];whyTry:string;conditionalTips:{feature:string;observation:string;tip:string;reason:string}[];imageKey:string;imageBrief:string;visualFocus:string};
export type CatalogIssue={styleKey:string;field:string;code:string;message:string};
const occasions:Record<string,string>={daily:'Hằng ngày',work:'Đi làm',school:'Đi học',date:'Hẹn hò',party:'Dự tiệc',photoshoot:'Chụp ảnh',wedding:'Đám cưới'};
const intensities:Record<string,string>={light:'Nhẹ nhàng',medium:'Vừa phải',bold:'Đậm nét'};
const text=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;
const list=(v:unknown):v is string[]=>Array.isArray(v)&&v.length>0&&v.every(text);
export function validateCatalog(value:unknown):{styles:CatalogStyle[];issues:CatalogIssue[];valid:boolean}{
 const issues:CatalogIssue[]=[],styles:CatalogStyle[]=[];
 const fail=(styleKey:string,field:string,code:string,message:string)=>issues.push({styleKey,field,code,message});
 if(!value||typeof value!=='object'){fail('*','catalog','SCHEMA','Catalog không phải object');return {styles,issues,valid:false};}
 const root=value as {schemaVersion?:unknown;language?:unknown;catalogType?:unknown;styles?:unknown};
 if(root.schemaVersion!=='1.2'||root.language!=='vi-VN'||root.catalogType!=='makeup-style-library'||!Array.isArray(root.styles)||root.styles.length!==20){fail('*','catalog','SCHEMA','Cần catalog v1.2 vi-VN gồm đúng 20 kiểu');return {styles,issues,valid:false};}
 const seen=new Set<string>();
 for(const raw of root.styles){
  if(!raw||typeof raw!=='object'){fail('*','style','SHAPE','Phong cách không phải object');continue;}
  const s=raw as CatalogStyle,key=text(s.key)?s.key:'*';const before=issues.length;
  if(!/^[a-z]+(?:-[a-z]+)*$/.test(key)||seen.has(key))fail(key,'key','KEY','Key thiếu, trùng hoặc không hợp lệ');seen.add(key);
  for(const field of ['name','displayName','shortDescription','signatureLook','whyTry','imageBrief','visualFocus'] as const)if(!text(s[field]))fail(key,field,'TEXT','Nội dung bắt buộc còn thiếu');
  if(!Object.prototype.hasOwnProperty.call(intensities,s.intensity)||!text(s.intensityLabel))fail(key,'intensity','ENUM','Độ đậm hoặc nhãn không hợp lệ');
  for(const field of ['occasions','tags','colorPalette','quickSteps'] as const)if(!list(s[field]))fail(key,field,'LIST','Danh sách thiếu hoặc không hợp lệ');
  if(Array.isArray(s.occasions)&&s.occasions.some(o=>!Object.prototype.hasOwnProperty.call(occasions,o)))fail(key,'occasions','ENUM','Mã dịp không được hỗ trợ');
  if(!s.techniques||['base','eyes','brows','cheeks','lips','contourHighlight'].some(k=>!text((s.techniques as Record<string,unknown>)[k])))fail(key,'techniques','SHAPE','Thiếu kỹ thuật');
  if(!Array.isArray(s.conditionalTips)||s.conditionalTips.some(t=>!t||![t.feature,t.observation,t.tip,t.reason].every(text)))fail(key,'conditionalTips','SHAPE','Tip không hợp lệ');
  if(s.imageKey!==`${key}.webp`)fail(key,'imageKey','KEY','imageKey phải khớp key.webp');
  // Invalid core records are quarantined. Label errors disable only that label group.
  if(issues.length!==before)continue;
  styles.push(s);
  for(const [codes,labels] of [['occasions','occasionLabels'],['tags','tagLabels'],['colorPalette','colorPaletteLabels']] as const){
   if(!list(s[labels])||s[labels].length!==s[codes].length){fail(key,labels,'LABEL_LENGTH',`${s[codes].length} mã nhưng ${Array.isArray(s[labels])?s[labels].length:0} nhãn; không ghép theo vị trí`);continue;}
   if(codes!=='occasions'){const reference=labelReference[codes] as Record<string,string>;if(s[codes].some((c,i)=>!reference[c]||reference[c]!==s[labels][i]))fail(key,labels,'LABEL_ORDER','Nhãn không khớp ý nghĩa hoặc thứ tự mã');}
   if(codes==='occasions'&&s[codes].some((c,i)=>occasions[c]!==s[labels][i]))fail(key,labels,'LABEL_ORDER','Thứ tự nhãn dịp không khớp mã');
   if(codes==='colorPalette'&&s[labels].some(l=>['warm brown','soft peach'].includes(l.toLowerCase())))fail(key,labels,'LABEL_LANGUAGE','Nhãn màu còn tiếng Anh; không tự sửa dữ liệu nguồn');
  }
  if(s.intensityLabel!==intensities[s.intensity])fail(key,'intensityLabel','LABEL_ORDER','Nhãn độ đậm không khớp mã');
 }
 return {styles,issues,valid:issues.length===0};
}
export const catalogValidation=validateCatalog(data);
export const presentationCatalog=catalogValidation.styles;
export function presentationStyle(key:string){return presentationCatalog.find(s=>s.key===key);}
export function displayTitle(row:MakeupRecommendation){return presentationStyle(row.styleKey)?.displayName||row.title;}
export function catalogLabels(style:CatalogStyle,field:'occasionLabels'|'tagLabels'|'colorPaletteLabels'){
 return catalogValidation.issues.some(i=>i.styleKey===style.key&&i.field===field)?[]:style[field];
}
// Never alter, re-rank or mutate the engine output. This is a view projection by stable key.
export function presentRecommendation(row:MakeupRecommendation):MakeupRecommendation{
 const s=presentationStyle(row.styleKey);if(!s)return row;
 return {...row,title:s.displayName,displayName:s.displayName,shortDescription:s.shortDescription,colorSuggestions:catalogLabels(s,'colorPaletteLabels'),occasionFit:row.scoringMetadataVersion?row.occasionFit:catalogLabels(s,'occasionLabels'),quickSteps:s.quickSteps};
}
export function conditionalTipsFor(style:CatalogStyle,extraction?:Extraction){
 if(!extraction||extraction.status!=='valid')return [];
 const profile=buildFaceProfile(extraction.summary,extraction.features,extraction.qualityContext);
 return style.conditionalTips.filter(t=>{const m=profile.measurements[t.feature];return m?.quality==='provisional'&&m.observation!=='unknown'&&m.observation!=='neutral'&&m.observation===t.observation;});
}

export function catalogIntensityLabel(style:CatalogStyle){return catalogValidation.issues.some(i=>i.styleKey===style.key&&i.field==='intensityLabel')?[]:[style.intensityLabel];}

export function presentationAliasesFor(key:string,includeCatalog=false){if(!includeCatalog)return [...aliasesFor(key)];const s=presentationStyle(key);return [...new Set([...aliasesFor(key),...(s?[s.name,s.displayName]:[])])];}

export function validScoringPresentation(row:MakeupRecommendation){if(!row.scoringMetadataVersion)return true;return ['1.1','1.2'].includes(row.scoringMetadataVersion)&&!!row.scoringIntensity&&intensities[row.scoringIntensity]===row.scoringIntensityLabel&&Array.isArray(row.scoringOccasions)&&row.occasionFit.length===row.scoringOccasions.length&&row.scoringOccasions.every((o,i)=>occasions[o]===row.occasionFit[i]);}
