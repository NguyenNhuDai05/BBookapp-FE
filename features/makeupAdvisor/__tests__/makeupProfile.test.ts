import {makeupProfile} from '../makeupProfile';
import {cloudSummary} from '../cloudSummary';
import type {FaceFeatureSummaryV3} from '../faceFeatures/extractor';

const fixture=():FaceFeatureSummaryV3=>({schemaVersion:3,analysisMethod:'face_mesh',quality:{frontal:true,singleFace:true,expressionLimited:false},detection:{faceCount:1,boundingBox:{x:.12345,y:.23456,width:.5,height:.6},pose:{yaw:2.123,pitch:1.234,roll:0}},features:{outlineAspect:1.25,eyeSpacing:.32,mouthWidth:.35},featureSources:{outlineAspect:'face_mesh',eyeSpacing:'face_mesh',mouthWidth:'face_mesh'},missing:[],limitations:['Số đo tương đối 2D của ảnh, chưa hiệu chuẩn; không phải phân loại dáng mặt.']});
test('different real measurements produce different profile signals without style recommendations',()=>{
 const a=fixture(),b=fixture();b.features={outlineAspect:1.6,eyeSpacing:.6,mouthWidth:.5};
 const first=makeupProfile(a),second=makeupProfile(b);
 expect(first.regions.eyes.signals).not.toEqual(second.regions.eyes.signals);expect(first.regions.cheeks.signals).not.toEqual(second.regions.cheeks.signals);expect(first.regions.lips.signals).not.toEqual(second.regions.lips.signals);
 expect(first.schemaVersion).toBe(1);expect(first.regions.brows.evidence).toBe('unknown');
 expect(JSON.stringify(first)).not.toMatch(/boundingBox|pose|recommendations|confidence|userId|landmarks|triangles|embedding|base64/);
});
test('missing and non-finite evidence stays unknown and expression prevents lip descriptors',()=>{
 const s=fixture();s.features={eyeSpacing:NaN};expect(makeupProfile(s).evidenceStatus).toBe('unknown');
 const smiling=fixture();smiling.quality.expressionLimited=true;expect(makeupProfile(smiling).regions.lips.evidence).toBe('unknown');
});
test('cloud summary rebuilds only contract fields and coarse numbers without mutating local data',()=>{
 const s=fixture();s.features.eyeSpacing=.321234;const malicious={...s,uri:'file:///selfie',image:'base64',userId:'private',features:{...s.features,embedding:1234},detection:{...s.detection!,landmarks:[1,2]}};
 const safe=cloudSummary(malicious);expect(safe.features.eyeSpacing).toBe(.321);expect(safe.detection?.boundingBox.x).toBe(.123);expect(safe.detection?.pose.yaw).toBe(2.1);expect(s.features.eyeSpacing).toBe(.321234);
 expect(JSON.stringify(safe)).not.toMatch(/uri|image|userId|embedding|landmarks/);
 expect(makeupProfile(safe).regions.eyes.sourceFeatures).toEqual(['eyeSpacing']);
});
