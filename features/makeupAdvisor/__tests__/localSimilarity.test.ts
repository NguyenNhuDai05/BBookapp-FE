import {localRecommendations,recommendationGeometry} from '../advisorRecommendation';
import type {Extraction} from '../faceFeatures/extractor';
jest.mock('../advisorTransport',()=>({advisorBackendConfigured:false,advisorApi:{}}));
jest.mock('../flags',()=>({realUserGeminiApproved:false}));
function input(outlineAspect:number,eyeSpacing:number):Extraction{
 return {status:'valid',features:{},summary:{schemaVersion:3,analysisMethod:'face_detection',quality:{frontal:true,singleFace:true,expressionLimited:false},detection:null,features:{outlineAspect,eyeSpacing,mouthWidth:.35,mouthAspect:.2},featureSources:{},missing:[],limitations:[]}};
}
test('different measurements in the same local rule buckets can produce identical recommendations',()=>{
 const a=input(1.25,.48),b=input(1.3,.49);
 expect(a.summary.features).not.toEqual(b.summary.features);
 expect(localRecommendations(a,recommendationGeometry(a)).recommendations).toEqual(localRecommendations(b,recommendationGeometry(b)).recommendations);
});
test('uncalibrated geometry no longer changes style ranking or invents fitting reasons',()=>{
 const a=input(1.05,.4),b=input(1.55,.55);
 const ra=localRecommendations(a,recommendationGeometry(a)),rb=localRecommendations(b,recommendationGeometry(b));
 expect(ra.recommendations).toEqual(rb.recommendations);
 expect(ra.recommendations.map(r=>r.styleKey).sort()).toEqual(rb.recommendations.map(r=>r.styleKey).sort());
});
