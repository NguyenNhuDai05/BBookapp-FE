import {recommendFaceScan,validFaceScanResult} from '../faceScanRecommendations';
import {extractFaceFeatures} from '../faceFeatures/extractor';
import type {Analysis} from '../faceAnalysis';
import {recommendFromLibrary} from '../localEngine';
import * as Engine from '../localEngine';
jest.mock('../flags',()=>({faceAwareExperimental:true,realUserGeminiApproved:true}));
jest.mock('../advisorRecommendation',()=>{throw new Error('Local scan must not import Gemini');});
jest.mock('../advisorTransport',()=>{throw new Error('Local scan must not import HTTP');});
const ellipse=(cx:number,cy:number,rx:number,ry:number,n:number)=>Array.from({length:n},(_,i)=>({x:cx+rx*Math.cos(i*2*Math.PI/n),y:cy+ry*Math.sin(i*2*Math.PI/n)}));
function sample():Analysis{return {width:800,height:1000,faceCount:1,faces:[{box:{x:190,y:240,width:420,height:520},angles:{x:0,y:0,z:0},probabilities:{leftEyeOpen:.9,rightEyeOpen:.9,smiling:.1}}],contours:[{type:1,points:ellipse(400,500,200,250,36)},{type:6,points:ellipse(340,450,25,10,16)},{type:7,points:ellipse(460,450,25,10,16)}],latencyMs:1,nativeHeapBeforeBytes:1,nativeHeapAfterBytes:1};}
test('unified reviewed engine scoring and ordering are used with no key or cloud transport',()=>{const extraction=extractFaceFeatures(sample());const actual=recommendFaceScan(extraction);expect(actual).toEqual(recommendFromLibrary(extraction));expect(actual.recommendations).toHaveLength(3);expect(actual.source).toBe('local');expect(actual.rankingTrace?.source).toBe('face-aware');});
test('two, duplicate or invalid recommendations cannot be considered success',()=>{const result=recommendFaceScan(extractFaceFeatures(sample()));expect(validFaceScanResult({...result,recommendations:result.recommendations.slice(0,2)})).toBe(false);expect(validFaceScanResult({...result,recommendations:[result.recommendations[0],result.recommendations[0],result.recommendations[2]]})).toBe(false);expect(validFaceScanResult({...result,source:'gemini'})).toBe(false);});
test.each(['FACE_NOT_FOUND','MULTIPLE_FACES','FACE_TOO_SMALL','FACE_NOT_FRONTAL'])('extractor supplies existing %s validation as metadata without new heuristics',code=>{const a=sample();if(code==='FACE_NOT_FOUND'){a.faceCount=0;a.faces=[];}if(code==='MULTIPLE_FACES')a.faceCount=2;if(code==='FACE_TOO_SMALL')a.faces[0].box.width=100;if(code==='FACE_NOT_FRONTAL')a.faces[0].angles.y=20;const phases:string[]=[];const value=extractFaceFeatures(a,p=>phases.push(p));expect(value.status).toBe('blocked');expect(value.errorCode).toBe(code);expect(phases).toEqual(['validating']);});
test('invalid/out-of-bounds detector data is processing error, never labeled face-too-small or blurry',()=>{const a=sample();a.faces[0].box.x=-1;expect(extractFaceFeatures(a).errorCode).toBe('PROCESSING_ERROR');});
test('measurement phase begins only after mandatory quality validation',()=>{const phases:string[]=[];expect(extractFaceFeatures(sample(),p=>phases.push(p)).status).toBe('valid');expect(phases).toEqual(['validating','analyzing']);});

test('local adapter rejects an incomplete engine response instead of claiming success',()=>{const extraction=extractFaceFeatures(sample()),result=recommendFaceScan(extraction);const spy=jest.spyOn(Engine,'recommendFromLibrary').mockReturnValueOnce({...result,recommendations:result.recommendations.slice(0,2)});expect(()=>recommendFaceScan(extraction)).toThrow();spy.mockRestore();});
test('negative detector dimensions are bad data rather than a confident face-size diagnosis',()=>{const a=sample();a.faces[0].box.width=-10;expect(extractFaceFeatures(a).errorCode).toBe('PROCESSING_ERROR');});

