import raw from '../bbook-makeup-catalog-20-vi-v1.2.json';
import {catalogLabels,catalogValidation,conditionalTipsFor,presentationCatalog,presentRecommendation,validateCatalog} from '../presentationCatalog';
import type {Extraction} from '../faceFeatures/extractor';
import {styleImages,colorFor} from '../styleImages';
import type {MakeupRecommendation} from '../advisorRecommendation';
const clone=()=>JSON.parse(JSON.stringify(raw));
const row={styleKey:'peach',title:'Sắc đào mềm mại',shortDescription:'engine description',whyItFits:'Engine evidence',makeupFocus:['Engine tips'],colorSuggestions:['Hồng'],occasionFit:[],serviceQueryKeywords:['old engine keyword']} as MakeupRecommendation;
test('approved corrected catalog validates all 20 without changing stable keys',()=>{expect(presentationCatalog).toHaveLength(20);expect(catalogValidation.valid).toBe(true);expect(catalogValidation.issues).toEqual([]);expect(catalogLabels(presentationCatalog.find(s=>s.key==='classic-glam')!,'tagLabels')).toHaveLength(5);expect(presentationCatalog.map(s=>s.key)).toEqual(raw.styles.map(s=>s.key));});
test('validation rejects duplicate keys, missing labels and wrong positional occasion labels',()=>{
 const bad=clone();bad.styles[1].key=bad.styles[0].key;expect(validateCatalog(bad).issues.some(i=>i.code==='KEY')).toBe(true);
 const untranslated=clone();untranslated.styles.find((s:any)=>s.key==='soft-glam').colorPaletteLabels[1]='warm brown';expect(validateCatalog(untranslated).issues.some(i=>i.code==='LABEL_LANGUAGE')).toBe(true);
 const missing=clone();delete missing.styles[0].tagLabels;expect(validateCatalog(missing).issues.some(i=>i.field==='tagLabels')).toBe(true);
 const palette=clone();palette.styles[0].colorPaletteLabels.reverse();expect(validateCatalog(palette).issues.some(i=>i.styleKey==='soft-korean'&&i.field==='colorPaletteLabels'&&i.code==='LABEL_ORDER')).toBe(true);
 const tags=clone();tags.styles[0].tagLabels.reverse();expect(validateCatalog(tags).issues.some(i=>i.styleKey==='soft-korean'&&i.field==='tagLabels'&&i.code==='LABEL_ORDER')).toBe(true);
 const order=clone();order.styles[0].occasionLabels.reverse();expect(validateCatalog(order).issues.some(i=>i.code==='LABEL_ORDER')).toBe(true);
});
test('display projection uses catalog displayName, keeps ranking evidence and never mutates engine record or machine fields',()=>{
 const before=JSON.stringify(row),view=presentRecommendation(row);expect(view.title).toBe('Trang điểm tông đào ngọt ngào');expect(view.styleKey).toBe('peach');expect(view.whyItFits).toBe(row.whyItFits);expect(view.serviceQueryKeywords).toBe(row.serviceQueryKeywords);expect(JSON.stringify(row)).toBe(before);expect(view.colorSuggestions).toEqual(raw.styles.find(s=>s.key==='peach')!.colorPaletteLabels);
});
test('all imageKey values have explicit local slots; safe localized palettes have illustrative swatches',()=>{
 expect(Object.keys(styleImages).sort()).toEqual(raw.styles.map(s=>s.imageKey).sort());
 for(const s of presentationCatalog)for(const label of catalogLabels(s,'colorPaletteLabels'))expect(colorFor(label)).toMatch(/^#[0-9a-f]{6}$/i);
});
function extraction(features:Record<string,number>):Extraction{return {status:'valid',features:{},summary:{schemaVersion:3,analysisMethod:'face_detection',quality:{frontal:true,singleFace:true,expressionLimited:false},detection:{faceCount:1,boundingBox:{x:.1,y:.1,width:.8,height:.8},pose:{yaw:0,pitch:0,roll:0}},features,featureSources:Object.fromEntries(Object.keys(features).map(k=>[k,'face_detection'])),missing:[],limitations:[]}};}
test('conditional tips require actual valid matching observations; unsupported wide/outline/mouth-width buckets remain hidden',()=>{
 const peach=presentationCatalog.find(s=>s.key==='peach')!,soft=presentationCatalog.find(s=>s.key==='soft-korean')!,latte=presentationCatalog.find(s=>s.key==='latte')!;
 const low=extraction({leftEyeAspect:.15,rightEyeAspect:.16,eyeSpacing:.6,outlineAspect:1.8});expect(conditionalTipsFor(peach,low)).toHaveLength(1);expect(conditionalTipsFor(soft,low)).toEqual([]);expect(conditionalTipsFor(latte,low)).toEqual([]);
 expect(conditionalTipsFor(peach,{...low,qualityContext:{eyesClosed:true}})).toEqual([]);expect(conditionalTipsFor(peach,extraction({}))).toEqual([]);expect(conditionalTipsFor(peach,{...low,status:'blocked'})).toEqual([]);
});
