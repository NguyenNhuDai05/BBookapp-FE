import {candidates} from '../recommendationCore';
import {buildFaceProfile} from '../faceFeatures/profileV2';
import {compatibilityRules,validCompatibility} from '../techniqueCompatibility';
import {recommendFromLibrary} from '../../../scripts/advisorRegression/unifiedAdapter';
import {DEFAULT_PREFERENCES,validLibrary} from '../styleLibrary';
import library from '../bbook-makeup-style-library.vi.json';
import type {FaceFeatureSummaryV3} from '../faceFeatures/extractor';
import {writeFileSync} from 'node:fs';
jest.mock('../flags',()=>({faceAwareExperimental:false}));
function summary(features:Record<string,number>={}):FaceFeatureSummaryV3{return {schemaVersion:3,analysisMethod:'face_detection',quality:{frontal:true,singleFace:true,expressionLimited:false},detection:{faceCount:1,boundingBox:{x:.1,y:.1,width:.8,height:.8},pose:{yaw:0,pitch:0,roll:0}},features,featureSources:Object.fromEntries(Object.keys(features).map(k=>[k,'face_detection'])),missing:[],limitations:[]};}
const run=(s:FaceFeatureSummaryV3,p=DEFAULT_PREFERENCES)=>recommendFromLibrary(s,p,{experimental:true});
const cases=[
 {name:'A',description:'Eye spacing cao, brow arch thấp',s:summary({eyeSpacing:.6,leftBrowArch:.02,rightBrowArch:.02})},
 {name:'B',description:'Eye aspect thấp, eye spacing thấp',s:summary({eyeSpacing:.35,leftEyeAspect:.15,rightEyeAspect:.16})},
 {name:'C',description:'Brow arch cao, mouth aspect thấp',s:summary({leftBrowArch:.12,rightBrowArch:.12,mouthAspect:.2})},
 {name:'D',description:'Outline khác, feature ranking unknown',s:summary({outlineAspect:1.6,outlineLowerWidth:.7})},
 {name:'E',description:'Tất cả feature unknown',s:summary()},
 {name:'F',description:'A, thêm party/bold',s:summary({eyeSpacing:.6,leftBrowArch:.02,rightBrowArch:.02}),p:{occasion:'party',intensity:'bold'} as const},
];
test('profile retains only normalized finite sourced in-range measurements and provisional status',()=>{
 const s=summary({eyeSpacing:.6,mouthAspect:.2,leftEyeAspect:.2,rightEyeAspect:.21,leftBrowArch:.03,rightBrowArch:.04,chinWidth:NaN,leftEyeWidth:Infinity,noseBaseWidth:3});
 const p=buildFaceProfile(s);expect(p.schemaVersion).toBe(2);expect(p.measurements.eyeSpacing.observation).toBe('relatively_high');
 expect(p.measurements.eyeAspect.value).toBe(.2);expect(p.measurements.browArch.value).toBeCloseTo(.035);
 for(const key of ['chinWidth','leftEyeWidth','noseBaseWidth'])expect(p.measurements[key].value).toBeNull();
 expect(Object.values(p.measurements).every(m=>m.calibration==='provisional')).toBe(true);
 expect(JSON.stringify(p)).not.toMatch(/points|triangles|uri|image|confidence|identity/);
});
test('expression, source, missing and head pose filter only eligible measurements',()=>{
 const s=summary({eyeSpacing:.6,mouthAspect:.2,leftBrowArch:.05,rightBrowArch:.05});s.quality.expressionLimited=true;s.missing=['leftBrowArch'];
 const p=buildFaceProfile(s);expect(p.measurements.mouthAspect.reason).toBe('expression');expect(p.measurements.eyeSpacing.quality).toBe('provisional');expect(p.measurements.browArch.value).toBeNull();
 delete s.featureSources.eyeSpacing;expect(buildFaceProfile(s).measurements.eyeSpacing.reason).toBe('missing_source');
 s.detection!.pose.yaw=25;expect(buildFaceProfile(s).measurements.rightBrowArch.reason).toBe('quality_or_pose');
});
test('closed-eye local evidence rejects eye geometry but preserves unrelated lip measurements',()=>{
 const s=summary({eyeSpacing:.6,mouthAspect:.2});
 const p=buildFaceProfile(s,undefined,{eyesClosed:true});
 expect(p.measurements.eyeSpacing.reason).toBe('eyes_closed');expect(p.measurements.mouthAspect.quality).toBe('provisional');
 expect(recommendFromLibrary(s,DEFAULT_PREFERENCES,{experimental:true,qualityContext:{eyesClosed:true}}).rankingTrace!.activatedRules).toEqual(['lip-low-outline']);
});
test('experimental rules are preview opt-in and no fabricated verified rule is accepted',()=>{
 const s=cases[0].s;expect(recommendFromLibrary(s).rankingTrace!.activatedRules).toEqual([]);
 expect(run(s).rankingTrace!.activatedRules.length).toBeGreaterThan(0);expect(validCompatibility(compatibilityRules)).toBe(true);
 expect(validCompatibility([{...compatibilityRules[0],evidenceStatus:'verified',reviewStatus:'pending'}])).toBe(false);
 expect(validCompatibility([{...compatibilityRules[0],techniqueKey:'fake'}])).toBe(false);
 expect(validCompatibility([{...compatibilityRules[0],techniqueKey:'__proto__'}])).toBe(false);
 const bad=JSON.parse(JSON.stringify(library));bad.styles[0].faceCompatibility.ruleIds.push('fake');expect(validLibrary(bad)).toBe(false);
});
test.each(cases)('synthetic $name: face rules precede selection, explanations follow contribution',c=>{
 const r=run(c.s,c.p||DEFAULT_PREFERENCES);expect(r.recommendations).toHaveLength(3);expect(new Set(r.recommendations.map(r=>r.styleKey)).size).toBe(3);
 const trace=r.rankingTrace!;
 for(const row of r.recommendations){const entry=trace.styles.find(x=>x.styleKey===row.styleKey)!;
  expect(entry.selected).toBe(true);expect(entry.finalScore).toBeCloseTo(entry.faceScore+entry.preferenceScore);
  expect(entry.ruleContributions.reduce((total,x)=>total+x.contribution,0)).toBeCloseTo(entry.faceScore);
  for(const x of entry.ruleContributions)expect(row.whyRecommended).toContain(compatibilityRules.find(r=>r.id===x.ruleId)!.explanation);
  expect(row.whyRecommended).not.toMatch(/98%|95%|mặt trái xoan|gò má cao|hai mí|da dầu/);
 }
 if(c.name==='D'||c.name==='E')expect(trace.source).toBe('fallback');else expect(trace.source).toBe('face-aware');
 expect(run(c.s,c.p||DEFAULT_PREFERENCES)).toEqual(r);
});
test.each<{feature:string;a:Record<string,number>;b:Record<string,number>}>([
 {feature:'eyeSpacing',a:{eyeSpacing:.35},b:{eyeSpacing:.6}},
 {feature:'eyeAspect',a:{leftEyeAspect:.15,rightEyeAspect:.15},b:{leftEyeAspect:.4,rightEyeAspect:.4}},
 {feature:'browArch',a:{leftBrowArch:.02,rightBrowArch:.02},b:{leftBrowArch:.12,rightBrowArch:.12}},
 {feature:'mouthAspect',a:{mouthAspect:.2},b:{mouthAspect:.4}},
])('counterfactual $feature changes activated techniques and style scores',c=>{
 const a=run(summary(c.a)),b=run(summary(c.b));
 expect(a.rankingTrace!.activatedRules).not.toEqual(b.rankingTrace!.activatedRules);
 const scores=(r:typeof a)=>Object.fromEntries(r.rankingTrace!.styles.map(s=>[s.styleKey,s.faceScore]));
 expect(scores(a)).not.toEqual(scores(b));
 expect(a.recommendations.map(r=>r.styleKey)).not.toEqual(b.recommendations.map(r=>r.styleKey));
});
test('unsupported features do not secretly score; JSON order and duplicate rule coverage do not inflate scores',()=>{
 const a=run(summary({eyeSpacing:.6})),b=run(summary({eyeSpacing:.6,noseBaseWidth:.3,outlineAspect:1.7}));
 expect(a.recommendations).toEqual(b.recommendations);
 expect(a.rankingTrace!.styles.map(s=>[s.styleKey,s.finalScore])).toEqual(b.rankingTrace!.styles.map(s=>[s.styleKey,s.finalScore]));
 candidates.reverse();try{expect(run(summary({eyeSpacing:.6}))).toEqual(a);}finally{candidates.reverse();}
 const natural=candidates.find(s=>s.key==='natural')!,saved=natural.ruleIds;
 natural.ruleIds=[...saved,...saved];try{expect(run(summary({eyeSpacing:.6}))).toEqual(a);}finally{natural.ruleIds=saved;}
 expect(a.rankingTrace!.styles.every(s=>s.faceScore>=0&&s.faceScore<=1)).toBe(true);
});
test('no rules has no negative penalty, preference is bounded and clearing restores face ranking',()=>{
 const p=cases[0].s,a=run(p),b=run(p,{occasion:'party',intensity:'bold'});
 expect(a.rankingTrace!.activatedRules).toEqual(b.rankingTrace!.activatedRules);
 expect(b.rankingTrace!.styles.every(s=>s.preferenceScore<=.2)).toBe(true);
 expect(run(p,{occasion:null,intensity:null})).toEqual(a);
 const style=candidates.find(s=>s.key==='natural')!,saved=style.ruleIds;style.ruleIds=[];
 try{const row=run(p).rankingTrace!.styles.find(s=>s.styleKey==='natural')!;expect(row.faceScore).toBe(0);expect(row.finalScore).toBe(0);}finally{style.ruleIds=saved;}
});
test('export synthetic-only acceptance matrix when explicitly requested',()=>{
 if(!process.env.BBOOK_SYNTHETIC_REPORT)return;
 const report=cases.map(c=>{const r=run(c.s,c.p||DEFAULT_PREFERENCES);return {profile:c.name,description:c.description,source:r.rankingTrace!.source,activatedRules:r.rankingTrace!.activatedRules,top3:r.recommendations.map(s=>s.styleKey),reasons:r.recommendations.map(s=>s.whyRecommended),trace:r.rankingTrace};});
 writeFileSync(process.env.BBOOK_SYNTHETIC_REPORT,JSON.stringify({syntheticOnly:true,profiles:report},null,2));
});



