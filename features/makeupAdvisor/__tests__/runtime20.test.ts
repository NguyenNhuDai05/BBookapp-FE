import {recommendFaceScan,recommendFaceScan as recommendTwenty} from '../faceScanRecommendations';
import {recommendFromLibrary} from '../../../scripts/advisorRegression/legacyEngine12';
import {evaluateRanking as evaluateEngine20} from '../recommendationCore';
import {simulateEngine20} from '../../../scripts/advisorSimulation/engine20';
import {scoringMetadata,validScoringManifest} from '../scoringMetadata';
import manifest from '../scoringMetadataManifest.json';
import legacy from '../bbook-makeup-style-library.vi.json';
import {presentRecommendation,validScoringPresentation,catalogValidation} from '../presentationCatalog';
import {makeupEffects,type MakeupEffect} from '../effects';
import type {Extraction} from '../faceFeatures/extractor';
import type {LibraryPreferences} from '../styleLibrary';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Independent approved CommonJS research oracle.
const {choose}=require('../../../scripts/advisorSimulation/alternatives.cjs');
let mockExperimental=true;jest.mock('../flags',()=>({get faceAwareExperimental(){return mockExperimental;}}));
jest.mock('../advisorTransport',()=>{throw Error('No cloud allowed');});
function extraction(f:Record<string,number>={}):Extraction{return {status:'valid',features:{},summary:{schemaVersion:3,analysisMethod:'face_detection',quality:{frontal:true,singleFace:true,expressionLimited:false},detection:{faceCount:1,boundingBox:{x:.1,y:.1,width:.8,height:.8},pose:{yaw:0,pitch:0,roll:0}},features:f,featureSources:Object.fromEntries(Object.keys(f).map(k=>[k,'face_detection'])),missing:[],limitations:[]}};}
beforeEach(()=>{mockExperimental=true;});
test('20 metadata records validated; old scoring machine fields unchanged and bad UI labels rejected',()=>{
 expect(catalogValidation.valid).toBe(true);expect(Object.keys(scoringMetadata)).toHaveLength(20);expect(validScoringManifest(manifest)).toBe(true);
 for(const old of legacy.styles)for(const k of ['name','intensity','occasions','tags','colorPalette'] as const)expect(scoringMetadata[old.key][k]).toEqual(old[k]);
 const bad=JSON.parse(JSON.stringify(manifest));bad.styles.douyin.intensity='bold';expect(validScoringManifest(bad)).toBe(false);
 const result=recommendTwenty(extraction(),{occasion:null,intensity:null});expect(result.scoringLabels?.douyin.intensity).toBe('Vừa phải');expect(result.scoringLabels?.['soft-glam'].occasions).toContain('Đám cưới');const row=result.recommendations[0];expect(validScoringPresentation(row)).toBe(true);expect(validScoringPresentation({...row,scoringIntensityLabel:'Wrong'})).toBe(false);expect(presentRecommendation(row).occasionFit).toEqual(row.occasionFit);
});
test('runtime no-effect/B output matches approved research across 108×32×2 cases and optional effects',()=>{
 const preferences:LibraryPreferences[]=[];for(const occasion of [null,'daily','work','school','date','party','photoshoot','wedding'] as const)for(const intensity of [null,'light','medium','bold'] as const)preferences.push({occasion,intensity});
 let cases=0,baselineRegressions=0;
 for(const spacing of [undefined,.35,.49,.6])for(const opening of [undefined,.15,.4])for(const arch of [undefined,.02,.12])for(const mouth of [undefined,.2,.4]){
 const f:Record<string,number>={};if(spacing!==undefined)f.eyeSpacing=spacing;if(opening!==undefined){f.leftEyeAspect=opening;f.rightEyeAspect=opening;}if(arch!==undefined){f.leftBrowArch=arch;f.rightBrowArch=arch;}if(mouth!==undefined)f.mouthAspect=mouth;
 const e=extraction(f);for(const p of preferences)for(const experimental of [true,false]){mockExperimental=experimental;const research=simulateEngine20(e.summary,p,{experimental});const legacy12=recommendFromLibrary(e.summary,p,{experimental});const core12=simulateEngine20(e.summary,p,{experimental,legacyOnly:true});if(JSON.stringify(legacy12.recommendations.map(r=>r.styleKey))!==JSON.stringify(core12.top3.map(r=>r.styleKey)))throw Error('Legacy regression');for(const r of legacy12.rankingTrace!.styles){const matched=core12.scores.find(x=>x.styleKey===r.styleKey)!;if(Math.abs(matched.finalScore-r.finalScore)>1e-10)throw Error('Legacy score drift');}const requests:MakeupEffect[][]=[[],['flushed-blush'],['bronzed-glow'],['gradient-lips'],['bronzed-glow','flushed-blush']];
 for(const effects of requests){const actual=recommendTwenty(e,p,effects),expected=choose(research,effects,'B');cases++;const keys=actual.recommendations.map(r=>r.styleKey);if(JSON.stringify(keys)!==JSON.stringify(expected.top3.map((r:any)=>r.styleKey)))throw Error('Research/runtime ranking mismatch');if(new Set(keys).size!==3)throw Error('Duplicate Top 3');
 for(const row of actual.recommendations){if(!validScoringPresentation(row))throw Error('Wrong scoring labels');const expectedRow=expected.top3.find((r:any)=>r.styleKey===row.styleKey);if(row.suggestionSource!==expectedRow.source)throw Error('Source mismatch');if(row.suggestionSource==='face-aware'&&!row.faceEvidence?.length)throw Error('False face attribution');if(['igari','sunkissed'].includes(row.styleKey)&&row.faceEvidence?.length)throw Error('Forbidden face rule');for(const rule of row.faceEvidence||[])if(row.suggestionSource==='face-aware'&&!row.whyItFits.includes(rule.explanation))throw Error('Missing rule explanation');}
 if(!effects.length&&experimental&&JSON.stringify(keys)!==JSON.stringify(research.top3.map(r=>r.styleKey)))baselineRegressions++;
 }} }
 expect(cases).toBe(34560);expect(baselineRegressions).toBe(71);
},90000);
test('AND conflict keeps reviewed baseline and clearing effect restores deterministic result',()=>{const e=extraction({eyeSpacing:.35,leftEyeAspect:.15,rightEyeAspect:.15,leftBrowArch:.02,rightBrowArch:.02,mouthAspect:.2}),p={occasion:'daily',intensity:'medium'} as const;const base=recommendTwenty(e,p);const changed=recommendTwenty(e,p,['bronzed-glow']);expect(changed.recommendations[2].styleKey).toBe('sunkissed');expect(changed.recommendations[2].suggestionSource).toBe('preference-based');expect(changed.recommendations[2].faceEvidence).toEqual([]);const conflict=recommendTwenty(e,p,['bronzed-glow','flushed-blush']);expect(conflict.effectConflict).toBe(true);expect(conflict.recommendations.map(r=>r.styleKey)).toEqual(base.recommendations.map(r=>r.styleKey));expect(recommendTwenty(e,p)).toEqual(base);});
test('quality/source rejection cannot manufacture face recommendations; Ulzzang high-eye gradient removed',()=>{const e=extraction({leftEyeAspect:.4,rightEyeAspect:.4}),p={occasion:null,intensity:'medium'} as const;const r=recommendTwenty(e,p,['gradient-lips']);expect(r.recommendations.find(r=>r.styleKey==='ulzzang')?.faceEvidence).toEqual([]);const bad={...e,summary:{...e.summary,featureSources:{}}};expect(recommendTwenty(bad,p).recommendations.every(r=>!r.faceEvidence?.length)).toBe(true);expect(()=>recommendTwenty({...e,status:'blocked'},p)).toThrow();expect(()=>recommendTwenty(e,p,['invalid' as MakeupEffect])).toThrow();expect(Object.keys(makeupEffects)).toHaveLength(9);expect(evaluateEngine20(e.summary,p).scores.find(r=>r.styleKey==='ulzzang')?.faceScore).toBe(0);});

test('one gateway always uses the reviewed 20-style engine without local engine flags',()=>{expect(recommendFaceScan(extraction()).engineVersion).toBe('20-reviewed-v1');});


