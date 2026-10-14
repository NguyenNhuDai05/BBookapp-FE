import {presentationStyle} from '../presentationCatalog';
import library from '../bbook-makeup-style-library.vi.json';
import {DEFAULT_PREFERENCES,styleLibrary,validLibrary,aliasesFor} from '../styleLibrary';
import {recommendFromLibrary} from '../../../scripts/advisorRegression/unifiedAdapter';
import type {FaceFeatureSummaryV3} from '../faceFeatures/extractor';
test('12 complete unique styles, 20-35 word descriptions, original distinct techniques and five steps',()=>{
 expect(validLibrary(library)).toBe(true);expect(styleLibrary).toHaveLength(12);
 for(const field of ['shortDescription','whyTry'] as const)expect(new Set(styleLibrary.map(s=>s[field])).size).toBe(12);
 for(const field of ['eyes','brows','cheeks','lips'] as const)expect(new Set(styleLibrary.map(s=>s.techniques[field])).size).toBe(12);
 for(const s of styleLibrary){expect(s.quickSteps).toHaveLength(5);expect(s.conditionalTips).toEqual([]);expect(JSON.stringify(s)).not.toMatch(/ML Kit|2D|3D|hiệu chuẩn|undertone|một mí|hai mí|ServiceId|muaId|https?:/);}
 expect(validLibrary({...library,styles:library.styles.slice(1)})).toBe(false);
 expect(validLibrary({...library,styles:library.styles.map((s,i)=>i? s:{...s,key:library.styles[1].key})})).toBe(false);
 expect(validLibrary({...library,styles:library.styles.map((s,i)=>i? s:{...s,techniques:null})})).toBe(false);
});
test.each([
 {occasion:null,intensity:null},
 {occasion:'work',intensity:null},
 {occasion:null,intensity:'bold'},
 {occasion:'wedding',intensity:'medium'},
] as const)('optional preferences %o return three distinct useful styles',p=>{
 const result=recommendFromLibrary(undefined,p);expect(result.source).toBe('local');expect(result.recommendations).toHaveLength(3);
 expect(new Set(result.recommendations.map(r=>r.styleKey)).size).toBe(3);
 expect(result.recommendations.every(r=>r.makeupFocus.length===6&&JSON.stringify(r.quickSteps)===JSON.stringify(presentationStyle(r.styleKey)?.quickSteps))).toBe(true);
});
test('explicit choices influence recommendations; clear returns the deterministic diverse default',()=>{
 const defaultResult=recommendFromLibrary();
 expect(defaultResult.recommendations.map(r=>r.styleKey)).toEqual(['natural','soft-glam','classic-glam']);
 expect(recommendFromLibrary(undefined,{occasion:'wedding',intensity:'medium'}).recommendations.map(r=>r.styleKey)).toContain('bridal-soft-glam');
 const bold=recommendFromLibrary(undefined,{occasion:null,intensity:'bold'});
 expect(bold.recommendations.every(r=>styleLibrary.find(s=>s.key===r.styleKey)?.intensity==='bold')).toBe(true);
 expect(recommendFromLibrary(undefined,{...DEFAULT_PREFERENCES})).toEqual(defaultResult);
 expect(DEFAULT_PREFERENCES).toEqual({occasion:null,intensity:null});
 expect(defaultResult.recommendations.some(r=>r.whyItFits.includes('theo lựa chọn'))).toBe(false);
});
test('unknown or incomplete geometry keeps useful fallback and no unvalidated bucket classification',()=>{
 const summary={schemaVersion:3,analysisMethod:'face_detection',quality:{frontal:false,singleFace:true,expressionLimited:true},detection:null,features:{leftEyeAspect:NaN},featureSources:{},missing:[],limitations:[]} as FaceFeatureSummaryV3;
 expect(recommendFromLibrary(summary).recommendations).toEqual(recommendFromLibrary().recommendations);
});
test('supported eye measurements match experimental techniques only when preview opt-in is explicit',()=>{
 const summary={schemaVersion:3,analysisMethod:'face_detection',quality:{frontal:true,singleFace:true,expressionLimited:false},detection:{faceCount:1,boundingBox:{x:.1,y:.1,width:.8,height:.8},pose:{yaw:0,pitch:0,roll:0}},features:{leftEyeAspect:.2,rightEyeAspect:.22},featureSources:{leftEyeAspect:'face_detection',rightEyeAspect:'face_detection'},missing:[],limitations:[]} as FaceFeatureSummaryV3;
 const r=recommendFromLibrary(summary,DEFAULT_PREFERENCES,{experimental:true});expect(r.recommendations[0].whyItFits).toContain('viền mảnh sát mi');
 expect(r.rankingTrace?.activatedRules).toContain('opening-low-soft');
 expect(r.recommendations.every(r=>r.whyItFits.includes('hai mí'))).toBe(false);
});
test('catalog matching resolves only actual exact names and never invents IDs',()=>{
 expect(aliasesFor('soft-korean')).toContain('Korean');expect(aliasesFor('not-present')).toEqual([]);
 expect(aliasesFor('thai-glam')).not.toContain('Sự kiện');
});



