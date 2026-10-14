import catalog from '../bbook-makeup-catalog-20-vi-v1.2.json';
import {recommendFromLibrary} from '../../../scripts/advisorRegression/legacyEngine12';
import {styleLibrary,validLibrary,type LibraryPreferences} from '../styleLibrary';
import {compatibilityRules} from '../techniqueCompatibility';
import type {FaceFeatureSummaryV3} from '../faceFeatures/extractor';
import {writeFileSync} from 'node:fs';
jest.mock('../flags',()=>({faceAwareExperimental:false}));
function summary(features:Record<string,number>):FaceFeatureSummaryV3{return {schemaVersion:3,analysisMethod:'face_detection',quality:{frontal:true,singleFace:true,expressionLimited:false},detection:{faceCount:1,boundingBox:{x:.1,y:.1,width:.8,height:.8},pose:{yaw:0,pitch:0,roll:0}},features,featureSources:Object.fromEntries(Object.keys(features).map(k=>[k,'face_detection'])),missing:[],limitations:[]};}
test('deterministic exhaustive bucket/preference coverage audits the real unchanged engine',()=>{
 const stats=new Map(catalog.styles.map(s=>[s.key,{key:s.key,inCatalog:true,inCandidates:styleLibrary.some(x=>x.key===s.key),ruleIds:styleLibrary.find(x=>x.key===s.key)?.faceCompatibility.ruleIds||[],enabledCount:0,disabledCount:0,noPreferencesCount:0,minScore:Infinity,maxScore:0,example:undefined as unknown}]));
 const preferences:LibraryPreferences[]=[];for(const occasion of [null,'daily','work','school','date','party','photoshoot','wedding'] as const)for(const intensity of [null,'light','medium','bold'] as const)preferences.push({occasion,intensity});
 let cases=0;const defaults=new Map<string,number>();
 for(const spacing of [undefined,.35,.49,.60])for(const opening of [undefined,.15,.4])for(const arch of [undefined,.02,.12])for(const mouth of [undefined,.2,.4]){
  const features:Record<string,number>={};if(spacing!==undefined)features.eyeSpacing=spacing;if(opening!==undefined){features.leftEyeAspect=opening;features.rightEyeAspect=opening;}if(arch!==undefined){features.leftBrowArch=arch;features.rightBrowArch=arch;}if(mouth!==undefined)features.mouthAspect=mouth;
  const s=summary(features);
  for(const prefs of preferences)for(const experimental of [false,true]){
   const r=recommendFromLibrary(s,prefs,{experimental});cases++;
   expect(r.recommendations).toHaveLength(3);expect(new Set(r.recommendations.map(x=>x.styleKey)).size).toBe(3);
   expect(r.recommendations.every(row=>styleLibrary.some(x=>x.key===row.styleKey))).toBe(true);
   for(const row of r.rankingTrace!.styles){const st=stats.get(row.styleKey)!;st.minScore=Math.min(st.minScore,row.finalScore);st.maxScore=Math.max(st.maxScore,row.finalScore);expect(row.faceScore).toBeGreaterThanOrEqual(0);expect(row.faceScore).toBeLessThanOrEqual(1);expect(row.finalScore).toBeCloseTo(row.faceScore+row.preferenceScore);}
   for(const row of r.recommendations){const st=stats.get(row.styleKey)!;if(experimental){st.enabledCount++;if(!st.example)st.example={features,preferences:prefs,score:r.rankingTrace!.styles.find(x=>x.styleKey===row.styleKey)?.finalScore};}else st.disabledCount++;
    if(experimental&&prefs.occasion===null&&prefs.intensity===null)st.noPreferencesCount++;
    const trace=r.rankingTrace!.styles.find(x=>x.styleKey===row.styleKey)!;
    for(const c of trace.ruleContributions)expect(row.whyItFits).toContain(compatibilityRules.find(x=>x.id===c.ruleId)!.explanation);
   }
   if(prefs.occasion===null&&prefs.intensity===null){if(experimental)expect(recommendFromLibrary(s,prefs,{experimental}).recommendations).toEqual(r.recommendations);else{const id=r.recommendations.map(x=>x.styleKey).join(',');defaults.set(id,(defaults.get(id)||0)+1);}}
  }
 }
 expect(cases).toBe(6912);expect([...stats.values()].filter(x=>!x.inCandidates)).toHaveLength(8);expect(validLibrary(catalog)).toBe(false);
 const probes=[{name:'missing',s:summary({})},{name:'pose-rejected',s:{...summary({eyeSpacing:.6}),detection:{...summary({}).detection!,pose:{yaw:25,pitch:0,roll:0}}}},{name:'unknown-source',s:{...summary({eyeSpacing:.6}),featureSources:{}}}].map(p=>({name:p.name,trace:recommendFromLibrary(p.s,undefined,{experimental:true}).rankingTrace}));
 for(const p of probes)expect(p.trace!.activatedRules).toEqual([]);
 if(process.env.CATALOG20_AUDIT_OUTPUT){const rows=[...stats.values()].map(s=>({...s,minScore:Number.isFinite(s.minScore)?s.minScore:null,canAppear:s.enabledCount>0||s.disabledCount>0,conditions:s.ruleIds.map(id=>{const r=compatibilityRules.find(x=>x.id===id)!;return `${r.feature}:${r.observation} -> ${r.techniqueKey}`;})}));writeFileSync(process.env.CATALOG20_AUDIT_OUTPUT,JSON.stringify({syntheticOnly:true,notProbabilities:true,cases,profiles:108,preferences:32,experimentalModes:2,candidateSource:'bbook-makeup-style-library.vi.json (12)',displayCatalog:'bbook-makeup-catalog-20-vi-v1.2.json (20)',fallbackWithoutPreferences:Object.fromEntries(defaults),rows,probes},null,2));}
},60000);

