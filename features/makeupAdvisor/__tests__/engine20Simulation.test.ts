import {simulateEngine20,candidates,simulationWeights,tieBreakOrder,validateSimulationConfiguration} from '../../../scripts/advisorSimulation/engine20';
import {recommendFromLibrary,scoringPolicy} from '../../../scripts/advisorRegression/legacyEngine12';
import legacy from '../bbook-makeup-style-library.vi.json';
import catalog from '../bbook-makeup-catalog-20-vi-v1.2.json';
import {catalogValidation} from '../presentationCatalog';
import type {FaceFeatureSummaryV3,Extraction} from '../faceFeatures/extractor';
import type {LibraryPreferences} from '../styleLibrary';
import {existsSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
jest.mock('../flags',()=>({faceAwareExperimental:false}));
function summary(features:Record<string,number>):FaceFeatureSummaryV3{return {schemaVersion:3,analysisMethod:'face_detection',quality:{frontal:true,singleFace:true,expressionLimited:false},detection:{faceCount:1,boundingBox:{x:.1,y:.1,width:.8,height:.8},pose:{yaw:0,pitch:0,roll:0}},features,featureSources:Object.fromEntries(Object.keys(features).map(k=>[k,'face_detection'])),missing:[],limitations:[]};}
const prefs:LibraryPreferences[]=[];for(const occasion of [null,'daily','work','school','date','party','photoshoot','wedding'] as const)for(const intensity of [null,'light','medium','bold'] as const)prefs.push({occasion,intensity});
const profiles:FaceFeatureSummaryV3[]=[];
for(const spacing of [undefined,.35,.49,.60])for(const opening of [undefined,.15,.4])for(const arch of [undefined,.02,.12])for(const mouth of [undefined,.2,.4]){
 const f:Record<string,number>={};if(spacing!==undefined)f.eyeSpacing=spacing;if(opening!==undefined){f.leftEyeAspect=opening;f.rightEyeAspect=opening;}if(arch!==undefined){f.leftBrowArch=arch;f.rightBrowArch=arch;}if(mouth!==undefined)f.mouthAspect=mouth;profiles.push(summary(f));
}
function close(a:number,b:number){if(Math.abs(a-b)>1e-10)throw Error(`Score mismatch ${a}/${b}`);}
test('phase A corrections are synchronized and every legacy ranking/search machine field stays untouched',()=>{
 expect(catalogValidation.valid).toBe(true);expect(catalogValidation.styles).toHaveLength(20);
 expect(readFileSync('docs/advisor/input/bbook-makeup-catalog-20-vi-v1.2.json').equals(readFileSync('features/makeupAdvisor/bbook-makeup-catalog-20-vi-v1.2.json'))).toBe(true);
 for(const old of legacy.styles){const c=candidates.find(s=>s.key===old.key)!;for(const field of ['key','name','intensity','occasions','tags','colorPalette'] as const)expect(c[field]).toEqual(old[field]);expect(c.ruleIds).toEqual(old.faceCompatibility.ruleIds);}
 expect(simulationWeights).toEqual(scoringPolicy);expect(candidates).toHaveLength(20);
 const hashes=JSON.parse(readFileSync(existsSync('docs/advisor/INTEGRATION-PROTECTED-HASHES.json')?'docs/advisor/INTEGRATION-PROTECTED-HASHES.json':existsSync('docs/advisor/CONSOLIDATION-PROTECTED-HASHES.json')?'docs/advisor/CONSOLIDATION-PROTECTED-HASHES.json':existsSync('docs/advisor/PHASE-D-PROTECTED-HASHES.json')?'docs/advisor/PHASE-D-PROTECTED-HASHES.json':'docs/advisor/PHASE-AB-PROTECTED-HASHES.json','utf8'));for(const [p,h] of Object.entries(hashes))expect(createHash('sha256').update(readFileSync(p)).digest('hex')).toBe(String(h).toLowerCase());
});
test('explicit tie order rejects missing/duplicate keys and invalid rule overlays',()=>{
 expect(()=>validateSimulationConfiguration(candidates,tieBreakOrder)).not.toThrow();expect(()=>validateSimulationConfiguration(candidates,tieBreakOrder.slice(1))).toThrow();expect(()=>validateSimulationConfiguration(candidates,[...tieBreakOrder.slice(1),tieBreakOrder[1]])).toThrow();expect(()=>validateSimulationConfiguration([{...candidates[0],ruleIds:['fake']},...candidates.slice(1)],tieBreakOrder)).toThrow();
 const a=simulateEngine20(profiles[43]);candidates.reverse();try{expect(simulateEngine20(profiles[43])).toEqual(a);}finally{candidates.reverse();}
});
test('simulation module is absent from every application import path',()=>{
 const visit=(p:string)=>{for(const item of readdirSync(p,{withFileTypes:true})){if(item.name==='__tests__')continue;const file=join(p,item.name);if(item.isDirectory())visit(file);else if(/\.[cm]?[jt]sx?$/.test(item.name))expect(readFileSync(file,'utf8')).not.toMatch(/(?:from\s*|require\s*\(|import\s*\()\s*['"][^'"]*advisorSimulation/);}};
 for(const dir of ['app','features','services','hooks','components'])if(existsSync(dir))visit(dir);
});
test('6912 paired deterministic cases provide coverage, score distribution, regression and exact explanations',()=>{
 const stats=Object.fromEntries(candidates.map(s=>[s.key,{key:s.key,metadataSource:s.metadataSource,mappingReview:s.mappingReview,ruleIds:s.ruleIds,techniqueKeys:s.techniqueKeys,selectedOn:0,selectedOff:0,noPreferencesOn:0,noPreferencesOff:0,baselineSelectedOn:0,baselineSelectedOff:0,positionChangeCount:0,positions12:[0,0,0],positions20:[0,0,0],candidateCount:0,scoreMin:Infinity,scoreMax:0,scoreTotal:0,scoreHistogram:{} as Record<string,number>,faceHistogram:{} as Record<string,number>,preferenceHistogram:{} as Record<string,number>,example:undefined as unknown,scoreRegressionCount:0}]));
 const regression={on:{cases:0,orderedChanged:0,setChanged:0,overlap:[0,0,0,0],noPreferences:{cases:0,orderedChanged:0,setChanged:0}},off:{cases:0,orderedChanged:0,setChanged:0,overlap:[0,0,0,0],noPreferences:{cases:0,orderedChanged:0,setChanged:0}}};
 let cases=0,parityCases=0,explanationsChecked=0,sunkissedDominatorsMin=Infinity;const curatedExamples:Record<string,unknown>={};const examples:unknown[]=[];const defaults={on:{} as Record<string,number>,off:{} as Record<string,number>};
 for(const [profileId,s] of profiles.entries())for(const p of prefs)for(const experimental of [true,false]){
  const old=recommendFromLibrary(s,p,{experimental}),baseline=simulateEngine20(s,p,{experimental,legacyOnly:true}),next=simulateEngine20(s,p,{experimental});cases++;
  const oldKeys=old.recommendations.map(r=>r.styleKey),baseKeys=baseline.top3.map(r=>r.styleKey),newKeys=next.top3.map(r=>r.styleKey);
  if(JSON.stringify(old.rankingTrace!.activatedRules)!==JSON.stringify(baseline.activatedRules)||JSON.stringify(baseline.activatedRules)!==JSON.stringify(next.activatedRules))throw Error('Active rule regression');
  if(JSON.stringify(oldKeys)!==JSON.stringify(baseKeys))throw Error('Legacy-only ranking drift');parityCases++;
  if(new Set(newKeys).size!==3)throw Error('Duplicate or incomplete Top 3');
  const sun=next.scores.find(r=>r.styleKey==='sunkissed')!;const preceding=next.scores.filter(r=>r.styleKey!=='sunkissed'&&candidates.find(c=>c.key===r.styleKey)!.intensity==='medium'&&(r.finalScore>sun.finalScore||r.finalScore===sun.finalScore&&tieBreakOrder.indexOf(r.styleKey)<tieBreakOrder.indexOf('sunkissed')));sunkissedDominatorsMin=Math.min(sunkissedDominatorsMin,preceding.length);
  for(const row of old.rankingTrace!.styles){const b=baseline.scores.find(r=>r.styleKey===row.styleKey)!;const n=next.scores.find(r=>r.styleKey===row.styleKey)!;for(const field of ['faceScore','preferenceScore','finalScore'] as const){close(row[field],b[field]);close(row[field],n[field]);}}
  const mode=experimental?'on':'off',reg=regression[mode];reg.cases++;const ordered=JSON.stringify(oldKeys)!==JSON.stringify(newKeys),setChanged=JSON.stringify([...oldKeys].sort())!==JSON.stringify([...newKeys].sort());if(ordered)reg.orderedChanged++;if(setChanged)reg.setChanged++;reg.overlap[newKeys.filter(k=>oldKeys.includes(k)).length]++;
  const noPref=p.occasion===null&&p.intensity===null;if(noPref){reg.noPreferences.cases++;if(ordered)reg.noPreferences.orderedChanged++;if(setChanged)reg.noPreferences.setChanged++;defaults[mode][newKeys.join(',')]=(defaults[mode][newKeys.join(',')]||0)+1;if(JSON.stringify(next)!==JSON.stringify(simulateEngine20(s,p,{experimental})))throw Error('Non-deterministic result');}
  for(const r of next.scores){const st=stats[r.styleKey];st.candidateCount++;st.scoreMin=Math.min(st.scoreMin,r.finalScore);st.scoreMax=Math.max(st.scoreMax,r.finalScore);st.scoreTotal+=r.finalScore;for(const [field,target] of [['finalScore','scoreHistogram'],['faceScore','faceHistogram'],['preferenceScore','preferenceHistogram']] as const){const bin=r[field].toFixed(6);st[target][bin]=(st[target][bin]||0)+1;}
   close(r.ruleContributions.reduce((sum,c)=>sum+c.contribution,0),r.faceScore);close(r.preferenceContributions.reduce((sum,c)=>sum+c.contribution,0),r.preferenceScore);close(r.faceScore+r.preferenceScore,r.finalScore);
   const expected=[...new Set(r.ruleContributions.map(c=>c.explanation)),...r.preferenceContributions.map(c=>c.explanation)];if(JSON.stringify(expected)!==JSON.stringify(r.explanations))throw Error('Unsupported explanation');explanationsChecked++;
  }
  oldKeys.forEach((key,i)=>{const st=stats[key];if(experimental)st.baselineSelectedOn++;else st.baselineSelectedOff++;st.positions12[i]++;if(newKeys.indexOf(key)!==i)st.positionChangeCount++;});
  next.top3.forEach((row,i)=>{const st=stats[row.styleKey];if(experimental)st.selectedOn++;else st.selectedOff++;st.positions20[i]++;if(noPref){if(experimental)st.noPreferencesOn++;else st.noPreferencesOff++;}if(!st.example)st.example={profileId,features:s.features,preferences:p,experimental,baselineTop3:oldKeys,simulationTop3:newKeys,selectedRow:row};});
  const store=(label:string)=>{if(!curatedExamples[label])curatedExamples[label]={profileId,input:s,preferences:p,experimental,baselineTop3:old.recommendations.map(r=>({key:r.styleKey,score:old.rankingTrace!.styles.find(x=>x.styleKey===r.styleKey)?.finalScore,explanation:r.whyItFits})),simulationTop3:next.top3};};
  if(experimental&&noPref&&profileId===0)store('fallback-no-features-no-preferences');if(experimental&&noPref&&ordered)store('no-preferences-ranking-change');if(experimental&&ordered&&newKeys.every(k=>!oldKeys.includes(k)))store('zero-overlap-regression');if(experimental&&next.top3.some(r=>r.styleKey==='igari'))store('preference-only-igari');if(experimental&&next.top3.some(r=>r.styleKey==='western-glam'))store('experimental-western-glam');if(experimental&&Object.keys(s.features).length===6&&noPref)store('full-measurements-no-preferences');
  if(examples.length<12&&ordered&&experimental)examples.push({profileId,input:s,preferences:p,experimental,baselineTop3:old.recommendations.map(r=>({key:r.styleKey,score:old.rankingTrace!.styles.find(x=>x.styleKey===r.styleKey)?.finalScore,explanation:r.whyItFits})),simulationTop3:next.top3});
 }
 expect(cases).toBe(6912);expect(parityCases).toBe(cases);expect(Object.values(stats).every(s=>s.scoreRegressionCount===0)).toBe(true);
 const rows=Object.values(stats).map(s=>({...s,scoreMin:Number.isFinite(s.scoreMin)?s.scoreMin:null,scoreMean:s.candidateCount?s.scoreTotal/s.candidateCount:null,canAppear:s.selectedOn+s.selectedOff>0,neverSelectedReason:s.selectedOn+s.selectedOff>0?null:s.ruleIds.length?'Dominated/tied behind existing candidates under current mappings and order':'Preference-only; existing candidates win equal scores; no unsupported face bonus'}));
 if(process.env.PHASE_B_REPORT){writeFileSync(process.env.PHASE_B_REPORT,JSON.stringify({simulationOnly:true,productionChanged:false,syntheticOnly:true,countsAreNotProbabilities:true,cases,profiles:108,preferences:32,modes:2,weights:simulationWeights,tieBreakOrder,legacyMetadataPreserved:true,legacyOnlyParityCases:parityCases,legacyScoreChanges:0,explanationsChecked,sunkissedDominance:{minimumEarlierSameIntensityDominators:sunkissedDominatorsMin,interpretation:"At least this many eligible medium candidates score higher or tie ahead; equal-intensity diversity cannot rescue sunkissed"},regression,defaults,rows,examples,curatedExamples,catalogKeys:catalog.styles.map(s=>s.key)},null,2));}
},90000);
test('quality gates reject unavailable/rejected inputs without inventing rules or explanations',()=>{
 const f={eyeSpacing:.6,leftEyeAspect:.15,rightEyeAspect:.15,leftBrowArch:.12,rightBrowArch:.12,mouthAspect:.2};
 const valid=summary(f);const probes:{name:string;s:FaceFeatureSummaryV3;qualityContext?:Extraction['qualityContext'];expectedRejected:string[]}[]=[
 {name:'missing',s:summary({}),expectedRejected:[]},
 {name:'pose',s:{...valid,detection:{...valid.detection!,pose:{yaw:25,pitch:0,roll:0}}},expectedRejected:['eyeSpacing']},
 {name:'unknown-source',s:{...valid,featureSources:{}},expectedRejected:['eyeSpacing']},
 {name:'nonfinite',s:summary({eyeSpacing:NaN}),expectedRejected:['eyeSpacing']},
 {name:'out-of-range',s:summary({eyeSpacing:2}),expectedRejected:['eyeSpacing']},
 {name:'declared-missing',s:{...valid,missing:Object.keys(f)},expectedRejected:['eyeSpacing']},
 {name:'eyes-closed',s:valid,qualityContext:{eyesClosed:true},expectedRejected:['eyeSpacing','leftEyeAspect','rightEyeAspect']},
 {name:'expression',s:{...valid,quality:{...valid.quality,expressionLimited:true}},expectedRejected:['mouthAspect']},
 ];
 const output=probes.map(p=>{const old=recommendFromLibrary(p.s,undefined,{experimental:true,qualityContext:p.qualityContext}),next=simulateEngine20(p.s,undefined,{experimental:true,qualityContext:p.qualityContext});expect(next.activatedRules).toEqual(old.rankingTrace!.activatedRules);for(const key of p.expectedRejected)expect(next.rejectedFeatures.some(r=>r.key===key)).toBe(true);return {name:p.name,baselineTop3:old.recommendations.map(r=>r.styleKey),simulationTop3:next.top3,activatedRules:next.activatedRules,rejectedFeatures:next.rejectedFeatures};});
 if(process.env.PHASE_B_REPORT)writeFileSync(resolve(process.env.PHASE_B_REPORT,'../PHASE-B-QUALITY-PROBES.json'),JSON.stringify(output,null,2));
});


