import {cloudSummary} from '../cloudSummary';
import {extractFaceFeatures} from '../faceFeatures/extractor';
import type {Analysis} from '../faceAnalysis';
import {getRecommendations} from '../advisorRecommendation';
import {advisorApi as api} from '../advisorTransport';
jest.mock('../flags',()=>({advisorEnabled:true,realUserGeminiApproved:true}));
jest.mock('../advisorTransport',()=>({advisorBackendConfigured:true,advisorApi:{get:jest.fn(),post:jest.fn()}}));
const ellipse=(cx:number,cy:number,rx:number,ry:number,n:number)=>Array.from({length:n},(_,i)=>({x:cx+rx*Math.cos(i*2*Math.PI/n),y:cy+ry*Math.sin(i*2*Math.PI/n)}));
function fixture():Analysis{
 const contours=[{type:1,points:ellipse(400,500,200,250,36)},{type:6,points:ellipse(340,450,25,10,16)},{type:7,points:ellipse(460,450,25,10,16)}];
 const points=contours.flatMap(c=>c.points).map((p,index)=>({...p,index,z:0}));
 const regions={outline:Array.from({length:36},(_,i)=>i),leftEye:Array.from({length:16},(_,i)=>i+36),rightEye:Array.from({length:16},(_,i)=>i+52)};
 while(points.length<468)points.push({x:400,y:500,z:0,index:points.length});
 return {width:800,height:1000,faceCount:1,faces:[{box:{x:190,y:240,width:420,height:520},angles:{x:0,y:0,z:0}}],contours,mesh:{points,regions,triangles:[[0,1,2]]},latencyMs:1,nativeHeapBeforeBytes:1,nativeHeapAfterBytes:1};
}
const row=(styleKey:string)=>({styleKey,title:'Provider style',shortDescription:'Provider description',whyItFits:'Provider explanation',makeupFocus:['Provider eyes','Provider brows','Provider cheeks','Provider lips'],colorSuggestions:['Pink'],occasionFit:['Event'],serviceQueryKeywords:['Sự kiện']});
beforeEach(()=>{jest.clearAllMocks();jest.mocked(api.get).mockResolvedValue({data:{featureSummaryEnabled:true,schemaVersion:3}});jest.mocked(api.post).mockResolvedValue({data:{recommendations:[row('korean'),row('event'),row('portrait')]}});});
test('approved path sends actual extractor values/sources and consumes provider output unchanged',async()=>{
 const e=extractFaceFeatures(fixture()),signal=new AbortController().signal;
 const result=await getRecommendations(e,undefined,true,'synthetic-uuid',signal);
 expect(result.source).toBe('gemini');expect(result.recommendations[0].makeupFocus[0]).toBe('Provider eyes');
 expect(api.post).toHaveBeenCalledTimes(1);
 const body=jest.mocked(api.post).mock.calls[0][1] as any;
 expect(body).toEqual({requestId:'synthetic-uuid',consent:true,summary:cloudSummary(e.summary)});
 expect(body.summary.features.eyeSpacing).toBeCloseTo(.3);expect(body.summary.featureSources.eyeSpacing).toBe('face_mesh');
 expect(JSON.stringify(body)).not.toMatch(/uri|points|triangles|recommendations|image|email/);
});
test('different measured input is forwarded without constants or local suggestions',async()=>{
 const a=fixture();a.mesh!.points.filter(p=>p.index>=52&&p.index<68).forEach(p=>p.x+=15);
 const e=extractFaceFeatures(a);await getRecommendations(e,undefined,true,'different',new AbortController().signal);
 const body=jest.mocked(api.post).mock.calls[0][1] as any;expect(body.summary.features.eyeSpacing).toBeCloseTo(.3375);
 expect(body.summary.features).toEqual(cloudSummary(e.summary).features);
});
test('missing consent or backend capability prevents POST despite approved build',async()=>{
 const e=extractFaceFeatures(fixture());expect((await getRecommendations(e,undefined,false,'a',new AbortController().signal)).source).toBe('local');
 expect(api.get).not.toHaveBeenCalled();jest.mocked(api.get).mockResolvedValue({data:{featureSummaryEnabled:false}});
 expect((await getRecommendations(e,undefined,true,'b',new AbortController().signal)).source).toBe('local');expect(api.post).not.toHaveBeenCalled();
});
test.each([429,503,404,'timeout','invalid'])('provider %s falls back once with correct source',async error=>{
 if(error==='invalid')jest.mocked(api.post).mockResolvedValue({data:{recommendations:[row('fake'),row('event'),row('portrait')]}});
 else jest.mocked(api.post).mockRejectedValue({status:error});
 const result=await getRecommendations(extractFaceFeatures(fixture()),undefined,true,'c',new AbortController().signal);
 expect(result.source).toBe('local');expect(api.post).toHaveBeenCalledTimes(1);
});
test.each(['Bạn có khuôn mặt tròn.','Your face is oval.','Bạn là nữ.','Phù hợp 99%.','Khoảng cách mắt 0.32.'])('unsupported response claim %s is never shown as Gemini',async claim=>{
 jest.mocked(api.post).mockResolvedValue({data:{recommendations:[{...row('korean'),whyItFits:claim},row('event'),row('portrait')]}});
 expect((await getRecommendations(extractFaceFeatures(fixture()),undefined,true,'d',new AbortController().signal)).source).toBe('local');
});
test('exactly 3 recommendations and all 8 fields required; extras never reach result',async()=>{
 for(const recommendations of [[row('korean'),row('event')],[{...row('korean'),image:'base64'},row('event'),row('portrait')],[{...row('korean'),colorSuggestions:[]},row('event'),row('portrait')]]){
  jest.mocked(api.post).mockResolvedValue({data:{recommendations}});
  const result=await getRecommendations(extractFaceFeatures(fixture()),undefined,true,'schema',new AbortController().signal);
  expect(result.source).toBe('local');expect(result.recommendations).toHaveLength(3);expect(result.fallbackReason).toBe('unavailable');
 }
});
test('bounding box and Euler pose forwarded only as real normalized summary',async()=>{
 const a=fixture();a.faces[0].angles={x:4,y:-5,z:3};const e=extractFaceFeatures(a);
 await getRecommendations(e,undefined,true,'pose',new AbortController().signal);
 const body=jest.mocked(api.post).mock.calls[0][1] as any;
 expect(body.summary.schemaVersion).toBe(3);expect(body.summary.detection).toEqual(cloudSummary(e.summary).detection);
});
test('old backend capability schema never receives facial summary',async()=>{jest.mocked(api.get).mockResolvedValue({data:{featureSummaryEnabled:true,schemaVersion:2}});const result=await getRecommendations(extractFaceFeatures(fixture()),undefined,true,'old-backend',new AbortController().signal);expect(result.source).toBe('local');expect(api.post).not.toHaveBeenCalled();});
test.each([false,'false',null,1])('capability must be boolean true, not %s',async flag=>{jest.mocked(api.get).mockResolvedValue({data:{featureSummaryEnabled:flag,schemaVersion:3}});expect((await getRecommendations(extractFaceFeatures(fixture()),undefined,true,'capability',new AbortController().signal)).source).toBe('local');expect(api.post).not.toHaveBeenCalled();});
test('blocked provider input preserves local fallback without admitting any face measurements or network',async()=>{const a=fixture();a.faceCount=0;a.faces=[];const e=extractFaceFeatures(a);expect(e.status).toBe('blocked');const result=await getRecommendations(e,undefined,true,'blocked',new AbortController().signal);expect(result.source).toBe('local');expect(result.recommendations).toHaveLength(3);expect(result.recommendations.every(r=>r.suggestionSource==='fallback'&&r.faceEvidence?.length===0)).toBe(true);expect(api.get).not.toHaveBeenCalled();expect(api.post).not.toHaveBeenCalled();});
