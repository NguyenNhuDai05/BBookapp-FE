import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState,Platform} from 'react-native';
import {useFocusEffect} from 'expo-router';
import * as Picker from 'expo-image-picker';
import {Analysis,Photo,adoptPickerPhoto,analyze,normalize,removePhoto,removeExpiredAdvisorPhotos,cancelNormalization,nativeAvailable,ensureScanAdmission,logMemoryCheckpoint,waitForCameraAvailability,cameraMemoryCheckpoint,observeCameraMemory,stopCameraObservation,type MemorySnapshot} from './faceAnalysis';
import type {MakeupEffect} from './effects';
import {advisorEnabled} from './flags';
import {adoptCameraPhoto,discardCameraPhoto} from './cameraPhoto';
import {advisorFailure,advisorFailureCode,advisorErrorKind,type AdvisorErrorKind} from './errors';
import {extractFaceFeatures,type Extraction} from './faceFeatures/extractor';
import type {AdvisorResult} from './advisorRecommendation';
import {recommendFaceScan} from './faceScanRecommendations';
import {DEFAULT_PREFERENCES,type LibraryPreferences} from './styleLibrary';
import {diagnosticSession,scanDiagnostic} from './scanDiagnostics';
import {phaseCopy,PROCESSING_TIMEOUT_MS,validationFailure,type ScanFailure,type ScanPhase} from './scanState';
import {INVALID_SCAN_PRESENTATION_MS,waitForScanPresentation} from './scanPresentation';
type CompletedScan={photo:Photo;analysis:Analysis;extraction:Extraction;result:AdvisorResult};
export function useAdvisor(){
 const [photo,setPhoto]=useState<Photo>(),[analysis,setAnalysis]=useState<Analysis>(),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [diagnosticSnapshot,setDiagnosticSnapshot]=useState<MemorySnapshot>();
 const [errorKind,setErrorKind]=useState<AdvisorErrorKind>(),[failure,setFailure]=useState<ScanFailure>();
 const [preferences,setPreferenceState]=useState<LibraryPreferences>({...DEFAULT_PREFERENCES});const preferenceRef=useRef<LibraryPreferences>({...DEFAULT_PREFERENCES});
 const [effects,setEffectState]=useState<MakeupEffect[]>([]);const effectRef=useRef<MakeupEffect[]>([]);
 const [stage,setStage]=useState<'start'|'scanning'|'results'|'error'>('start'),[phase,setPhase]=useState<ScanPhase>('idle'),[result,setResult]=useState<AdvisorResult>(),[extraction,setExtraction]=useState<Extraction>();
 const owned=useRef<Photo|undefined>(undefined),failedPhoto=useRef<Photo|undefined>(undefined),working=useRef<Photo|undefined>(undefined),completed=useRef<CompletedScan|undefined>(undefined),generation=useRef(0),gate=useRef(false),alive=useRef(true),normalizing=useRef(false),scanning=useRef(false),processingActive=useRef(false),deadline=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const clearDeadline=useCallback(()=>{if(deadline.current!==undefined)clearTimeout(deadline.current);deadline.current=undefined;},[]);
 const restore=useCallback(()=>{if(!alive.current)return;const previous=completed.current;setPhoto(previous?.photo||owned.current);setAnalysis(previous?.analysis);setExtraction(previous?.extraction);setResult(previous?.result);setStage(previous?'results':'start');},[]);
 const presentation=useRef<AbortController|undefined>(undefined);
 const invalidate=useCallback(()=>{generation.current++;presentation.current?.abort();presentation.current=undefined;processingActive.current=false;clearDeadline();cancelNormalization();},[clearDeadline]);
 const showFailure=useCallback((value:ScanFailure,current?:Photo)=>{
  if(!alive.current)return;
  if(current){failedPhoto.current=current;setPhoto(current);}else setPhoto(completed.current?.photo);
  setFailure(value);setError([value.main,value.secondary].filter(Boolean).join('. '));setPhase(value.kind==='validation'?'validation_error':'processing_error');setStage('error');
 },[]);
 const reset=useCallback(()=>{
  invalidate();const photos=[owned.current,failedPhoto.current,working.current];owned.current=undefined;failedPhoto.current=undefined;completed.current=undefined;
  effectRef.current=[];if(alive.current){setEffectState([]);setPhoto(undefined);setAnalysis(undefined);setExtraction(undefined);setResult(undefined);setStage('start');setPhase('cancelled');setError('');setFailure(undefined);setDiagnosticSnapshot(undefined);setErrorKind(undefined);}
  for(const p of photos)void removePhoto(p?.uri);
 },[invalidate]);
 const prepareRetry=useCallback(()=>{
  if(gate.current)return;invalidate();const old=failedPhoto.current;failedPhoto.current=undefined;if(old?.uri!==owned.current?.uri)void removePhoto(old?.uri);
  setFailure(undefined);setDiagnosticSnapshot(undefined);setError('');setErrorKind(undefined);setPhase('idle');restore();
 },[invalidate,restore]);
 useEffect(()=>{
  alive.current=true;const memorySubscription=observeCameraMemory?.();if(advisorEnabled){cameraMemoryCheckpoint?.(diagnosticSession(),'advisor_enter');}if(advisorEnabled)void removeExpiredAdvisorPhotos();
  const sub=AppState.addEventListener('change',next=>{if(next!=='active'&&processingActive.current){invalidate();showFailure({code:'PROCESSING_ERROR',kind:'processing',main:'Đã dừng tác vụ khi ứng dụng vào nền',secondary:'Bạn có thể thử lại khi bộ phân tích dừng.'},working.current);setErrorKind('recoverable');}});
  return()=>{alive.current=false;invalidate();sub.remove();memorySubscription?.remove();stopCameraObservation?.();completed.current=undefined;void removePhoto(owned.current?.uri);void removePhoto(failedPhoto.current?.uri);void removePhoto(working.current?.uri);};
 },[invalidate,showFailure]);
 useFocusEffect(useCallback(()=>()=>{reset();stopCameraObservation?.();},[reset]));
 function start(id:number){
  processingActive.current=true;
  setError('');setFailure(undefined);setErrorKind(undefined);setPhoto(working.current);setAnalysis(undefined);setStage('scanning');setPhase('initializing');
  clearDeadline();deadline.current=setTimeout(()=>{
   if(!alive.current||id!==generation.current)return;
   // Stop the UI without releasing the native lease early or publishing a late result.
   invalidate();showFailure({code:'E_PROCESSING_TIMEOUT',kind:'processing',main:'Phân tích đang mất nhiều thời gian',secondary:'Hãy hủy quét. Có thể thử lại khi bộ phân tích dừng.'},working.current);setErrorKind('recoverable');
  },PROCESSING_TIMEOUT_MS);
 }
 function failed(e:unknown,at:'scan'|'pick'){
  setDiagnosticSnapshot(logMemoryCheckpoint?.());
  const code=e&&typeof e==='object'&&'code' in e?e.code:undefined;
  const kind=advisorErrorKind(e),nativeCode=advisorFailureCode(e);setErrorKind(kind);
  const domain:ScanFailure['kind']=kind==='resource-pressure'||nativeCode==='E_CLEANUP_PENDING'?'resource':nativeCode==='E_NORMALIZATION_INPUT'||nativeCode==='E_INPUT'||nativeCode==='E_PICKER_ASSET'?'input':nativeCode==='E_DETECTION'?'native':at==='pick'&&!working.current?'acquisition':'processing';
  showFailure(code==='E_RECOMMENDATIONS'?{code:'E_RECOMMENDATIONS',kind:'recommendation',main:'Chưa tạo được đủ 3 gợi ý makeup',secondary:'Vui lòng thử lại.'}:{code:nativeCode,kind:domain,main:'Chưa thể phân tích ảnh này',secondary:advisorFailure(e,at)},working.current);
 }
 async function run(output:Photo,id:number,log:(event:Parameters<typeof scanDiagnostic>[1])=>void=()=>undefined):Promise<CompletedScan|undefined>{
  if(!alive.current||id!==generation.current)return;
  const startedAt=Date.now(),controller=new AbortController();presentation.current=controller;
  scanning.current=true;setStage('scanning');setPhase('initializing');
  try{
   log('mlkit_start');const r=await analyze(output,observation=>{if(alive.current&&id===generation.current){setAnalysis(observation);setPhase('analyzing');}});
   if(!alive.current||id!==generation.current)return;
   log('mlkit_end');setAnalysis(r);
   const features=extractFaceFeatures(r,next=>{if(alive.current&&id===generation.current)setPhase(next);});
   if(features.status!=='valid'){
    clearDeadline();scanning.current=false;
    await waitForScanPresentation(startedAt,controller.signal,INVALID_SCAN_PRESENTATION_MS);
    if(!alive.current||id!==generation.current)return;
    setErrorKind('recoverable');showFailure(validationFailure(features.errorCode,features.reason),output);return;
   }
   if(!alive.current||id!==generation.current)return;
   setPhase('matching');
   log('recommend_start');const recommendations=recommendFaceScan(features,preferenceRef.current,effectRef.current);
   if(!alive.current||id!==generation.current)return;
   log('recommend_end');
   // Native processing is finished; retain only the presentation before publishing.
   clearDeadline();scanning.current=false;
   await waitForScanPresentation(startedAt,controller.signal);
   if(!alive.current||id!==generation.current)return;
   return {photo:output,analysis:r,extraction:features,result:recommendations};
  }catch(e){if(alive.current&&id===generation.current)failed(e,'scan');}
  finally{scanning.current=false;if(presentation.current===controller)presentation.current=undefined;}
 }
 function commit(value:CompletedScan){completed.current=value;owned.current=value.photo;failedPhoto.current=undefined;setPhoto(value.photo);setAnalysis(value.analysis);setExtraction(value.extraction);setResult(value.result);setFailure(undefined);setError('');setPhase('success');setStage('results');}
 function setPreferences(next:LibraryPreferences){
  if(gate.current)return;const previous=completed.current;
  try{const nextResult=previous?recommendFaceScan(previous.extraction,next,effectRef.current):undefined;preferenceRef.current={...next};setPreferenceState({...next});if(previous&&nextResult){completed.current={...previous,result:nextResult};setResult(nextResult);}}
  catch(e){failed(e,'scan');}
 }
 function setEffects(next:MakeupEffect[]){
  if(gate.current||stage!=='results'||!completed.current)return;const previous=completed.current;
  try{const nextResult=recommendFaceScan(previous.extraction,preferenceRef.current,next);effectRef.current=[...next];setEffectState([...next]);completed.current={...previous,result:nextResult};setResult(nextResult);}
  catch(e){failed(e,'scan');}
 }
 async function acquire(camera=false,captured?:Photo){
  if(gate.current||!advisorEnabled){await discardCameraPhoto(captured);return 'ignored' as const;}
  prepareRetry();gate.current=true;setBusy(true);working.current=undefined;const id=++generation.current;
  let output:Photo|undefined,input:Photo|undefined;let committed=false;const session=diagnosticSession(),started=Date.now();
  const log=(event:Parameters<typeof scanDiagnostic>[1])=>{scanDiagnostic(session,event,started);if(['preprocess_end','mlkit_start','mlkit_end','scan_cleanup'].includes(event))cameraMemoryCheckpoint?.(session,event);};
  try{
   if(camera){const p=await Picker.requestCameraPermissionsAsync();if(!p.granted)throw {code:'E_PERMISSION'};}
   const options={mediaTypes:['images'] as Picker.MediaType[],base64:false,exif:false,quality:1,allowsEditing:false,cameraType:'front' as Picker.CameraType};
   log(captured?'capture_success':'picker_launch');
   const selected=captured?{canceled:false,assets:[captured]}:camera?await Picker.launchCameraAsync(options):await Picker.launchImageLibraryAsync(options);
   if(selected.canceled){log('picker_cancel');return 'cancelled' as const;}
   const asset=selected.assets?.[0];
   if(!asset||typeof asset.uri!=='string'||!asset.uri||!Number.isFinite(asset.width)||!Number.isFinite(asset.height)||asset.width<=0||asset.height<=0)throw {code:'E_PICKER_ASSET'};
   scanDiagnostic(session,'picker_selected',started,{width:asset.width,height:asset.height});
   // Move only the picker/camera cache copy into our namespace before admission.
   // This allocates no decoded image and lets refusal/cancellation delete that copy.
   input=captured?await adoptCameraPhoto(captured):await adoptPickerPhoto(asset);
   if(id!==generation.current||!alive.current){log('scan_cancel');return 'ignored' as const;}
   setPhase('initializing');log('camera_availability_wait');const availability=await waitForCameraAvailability?.(session,camera||!!captured);log(availability==='available'?'camera_availability_confirmed':availability==='not_required'?'camera_availability_not_required':'camera_availability_legacy');
   if(id!==generation.current||!alive.current||AppState.currentState!=='active'){log('scan_cancel');return 'ignored' as const;}
   log('admission_start');ensureScanAdmission();log('admission_allowed');
   start(id);log('preprocess_start');normalizing.current=true;
   if(id!==generation.current||!alive.current)return;
   output=await normalize(input);log('preprocess_end');await removePhoto(input.uri);input=undefined;
   if(!alive.current||id!==generation.current)return;
   working.current=output;setPhoto(output);setAnalysis(undefined);normalizing.current=false;
   const value=await run(output,id,log);
   if(value&&alive.current&&id===generation.current){const old=owned.current;commit(value);committed=true;if(old?.uri!==output.uri)await removePhoto(old?.uri);}
   return 'selected' as const;
  }catch(e){const classified=!captured&&!processingActive.current&&advisorFailureCode(e)==='E_UNKNOWN'?{code:'E_PICKER'}:e;scanDiagnostic(session,'scan_error',started,{code:advisorFailureCode(classified)});if(alive.current&&id===generation.current)failed(classified,'pick');return 'failed' as const;}
  finally{
   log('scan_cleanup');clearDeadline();processingActive.current=false;normalizing.current=false;working.current=undefined;await discardCameraPhoto(captured);await removePhoto(input?.uri);
   if(!committed&&failedPhoto.current?.uri!==output?.uri)await removePhoto(output?.uri);
   gate.current=false;if(alive.current)setBusy(false);
  }
 }
 async function scan(){
  if(gate.current||!owned.current||!advisorEnabled)return;
  prepareRetry();gate.current=true;setBusy(true);const id=++generation.current;working.current=owned.current;start(id);
  try{ensureScanAdmission();const value=await run(owned.current,id);if(value&&alive.current&&id===generation.current)commit(value);}
  catch(e){if(alive.current&&id===generation.current)failed(e,'scan');}
  finally{clearDeadline();processingActive.current=false;working.current=undefined;gate.current=false;if(alive.current)setBusy(false);}
 }
 return {photo,analysis,busy,scanning:stage==='scanning',stage,phase,status:phaseCopy[phase].main,result,extraction,error,errorKind,failure,diagnosticSnapshot,preferences,setPreferences,effects,setEffects,effectsEnabled:stage==='results'&&result?.source==='local',reset,prepareRetry,pick:(camera=false)=>acquire(camera),pickPhoto:(photo:Photo)=>acquire(false,photo),scan,scanAvailable:Platform.OS==='android'&&nativeAvailable&&advisorEnabled};
}

