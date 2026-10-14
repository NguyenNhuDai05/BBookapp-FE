import {extractFaceFeatures} from '../faceFeatures/extractor';
import {localRecommendations} from '../advisorRecommendation';
import type {Analysis} from '../faceAnalysis';
jest.mock('../flags',()=>({faceAwareExperimental:true,realUserGeminiApproved:false}));
jest.mock('../advisorTransport',()=>({advisorBackendConfigured:false,advisorApi:{get:jest.fn(),post:jest.fn()}}));
const ellipse=(cx:number,cy:number,rx:number,ry:number,n:number)=>Array.from({length:n},(_,i)=>({x:cx+rx*Math.cos(i*2*Math.PI/n),y:cy+ry*Math.sin(i*2*Math.PI/n)}));
function sample():Analysis{return {width:800,height:1000,faceCount:1,faces:[{box:{x:190,y:240,width:420,height:520},angles:{x:0,y:0,z:0},probabilities:{leftEyeOpen:.9,rightEyeOpen:.9,smiling:.1}}],contours:[{type:1,points:ellipse(400,500,200,250,36)},{type:6,points:ellipse(340,450,25,10,16)},{type:7,points:ellipse(460,450,25,10,16)}],latencyMs:1,nativeHeapBeforeBytes:1,nativeHeapAfterBytes:1};}
test('real extractor ratios reach active local ranking and trace; no fake observations or second inference',()=>{
 const extraction=extractFaceFeatures(sample());expect(extraction.status).toBe('valid');
 const r=localRecommendations(extraction);expect(r.localEvidence).toBe('experimental');
 expect(r.rankingTrace!.activatedRules).toContain('spacing-low-outer');expect(r.rankingTrace!.activatedRules).toContain('opening-high-gradient');
 expect(r.rankingTrace!.styles.some(s=>s.faceScore>0)).toBe(true);
 const unknown=localRecommendations({...extraction,features:{},summary:{...extraction.summary,features:{},featureSources:{}}});
 expect(unknown.localEvidence).toBe('fallback');expect(r.recommendations.map(s=>s.styleKey)).not.toEqual(unknown.recommendations.map(s=>s.styleKey));
 const changed=sample();changed.faces[0].probabilities!.leftEyeOpen=.1;
 const closed=localRecommendations(extractFaceFeatures(changed));expect(closed.rankingTrace!.activatedRules).toEqual([]);
 expect(closed.rankingTrace!.rejectedFeatures).toContainEqual({key:'eyeSpacing',reason:'eyes_closed'});
});
