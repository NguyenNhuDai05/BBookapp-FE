import {getRecommendations} from '../advisorRecommendation';
import type {Extraction} from '../faceFeatures/extractor';
import {advisorApi} from '../advisorTransport';
jest.mock('../flags',()=>({advisorEnabled:true,realUserGeminiApproved:false}));
jest.mock('../advisorTransport',()=>({advisorBackendConfigured:true,advisorApi:{get:jest.fn(),post:jest.fn()}}));
test('cloud disabled still returns local recommendations even when retry consent is true',async()=>{
 const e={status:'valid',features:{},summary:{features:{},limitations:[]}} as unknown as Extraction;
 const value=await getRecommendations(e,undefined,true,'synthetic-retry',new AbortController().signal);
 expect(value.source).toBe('local');expect(value.recommendations).toHaveLength(3);
 expect(advisorApi.get).not.toHaveBeenCalled();expect(advisorApi.post).not.toHaveBeenCalled();
});
