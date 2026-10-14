import { requireOptionalNativeModule } from 'expo-modules-core';
import Constants from 'expo-constants';
import * as Manipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

export type Photo = { uri: string; width: number; height: number };
const ownedUris = new Set<string>();
const ownedFilename=/^(bbook-normalized-[a-zA-Z0-9_-]+\.jpg|bbook-advisor-input-[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)$/;
// Installed Expo ImagePicker creates a fresh cache/ImagePicker file per selection.
// Adopt only that returned copy into our own namespace; never move a gallery original.
export async function adoptPickerPhoto(photo:Photo):Promise<Photo>{
  const cache=FileSystem.cacheDirectory;
  const relative=cache&&photo.uri.startsWith(cache)?photo.uri.slice(cache.length):'';
  if(!cache||!/^ImagePicker\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(relative))return photo;
  const uri=cache+'bbook-advisor-input-'+relative.slice('ImagePicker/'.length);
  try{await FileSystem.moveAsync({from:photo.uri,to:uri});ownedUris.add(uri);return {...photo,uri};}
  catch(error){await removePhoto(uri);throw error;}
}
export type Point = { x: number; y: number };
export type MeshPoint = Point & { index: number; z: number };
export type Analysis = {
  width: number; height: number; faceCount: number;
  faces: { box: { x: number; y: number; width: number; height: number }; angles: { x: number; y: number; z: number }; probabilities?: {leftEyeOpen:number|null;rightEyeOpen:number|null;smiling:number|null}; landmarks?: (Point & {type:number})[] }[];
  mesh?: {points:MeshPoint[];triangles:number[][];regions?:Record<string,number[]>} | null;
  meshStatus?: 'available' | 'unavailable';
  contours: { type: number; points: { x: number; y: number }[] }[];
  latencyMs: number; nativeHeapBeforeBytes: number; nativeHeapAfterBytes: number;
};
export type AdmissionReason = 'allowed'|'busy'|'system_pressure'|'insufficient_budget'|'cleanup_incomplete'|'unavailable';
export type AdmissionDecision = {allowed:boolean;reason:AdmissionReason};
const native = requireOptionalNativeModule<{ analyze(uri: string): Promise<Analysis>; addListener?(event:string,listener:(analysis:Analysis)=>void):{remove():void}; memoryMark?(id: string, stage: string): void; instrumentationVersion?(): string; normalizeBounded?(uri: string, width: number, height: number): Promise<Photo>; cancelNormalization?(): void; prepareMemoryGuard?(): boolean; beginCameraObservation?():void; stopCameraObservation?():void; awaitCameraAvailable?(session:string,required:boolean):Promise<string>; memorySnapshot?(session:string,checkpoint:string):Record<string,unknown>; memoryDiagnostics?(): Record<string,unknown>; admissionDecision?():AdmissionDecision }>('BBookFaceAnalysis');
export type MemorySnapshot=Record<string,number|string|boolean>;
const memoryHistory:MemorySnapshot[]=[];let advisorStartupSnapshot:MemorySnapshot|undefined;const sessionStarted=new Map<string,number>();
const memoryStages=['advisor_enter','camera_mount','camera_ready','capture_start','capture_success','camera_unmount','camera_availability','preprocess_end','mlkit_start','mlkit_end','scan_cleanup','frontend_admission','normalize_admission','normalize_checkpoint','analyze_admission','analyze_checkpoint','mesh_admission'];
function publishMemory(snapshot:Record<string,unknown>):MemorySnapshot{
  const fields=['timestampMs','breakdownTimestampMs','pssKB','limitKB','requiredHeadroomKB','availableKB','systemThresholdKB','coldBaselinePssKB','warmedIdlePssKB','memoryInfoPssKB','dalvikPssKB','nativePssKB','otherPssKB','graphicsKB','javaUsedKB','javaMaxKB','nativeAllocKB','memoryClassMiB','largeMemoryClassMiB','inferenceStarted','inferenceEnded','sdkProcessCalls','detectorsCreated','detectorCloseCalls','cameraTrackedCount','cameraKnownCount','cameraUnavailableCount','cameraUnavailableTimestampMs','cameraAvailableTimestampMs'];
  const safe:MemorySnapshot={};
  for(const key of fields)if(typeof snapshot[key]==='number'&&Number.isFinite(snapshot[key]))safe[key]=snapshot[key] as number;
  for(const key of ['systemLowMemory','cleanupComplete','debuggable','warmBaselineMeasured','cameraAvailable','cameraAvailabilityTransitionObserved'])if(typeof snapshot[key]==='boolean')safe[key]=snapshot[key] as boolean;
  if(memoryStages.includes(String(snapshot.checkpoint)))safe.checkpoint=String(snapshot.checkpoint);
  if(['allowed','busy','system_pressure','insufficient_budget','cleanup_incomplete','unavailable'].includes(String(snapshot.reason)))safe.reason=String(snapshot.reason);
  if(typeof snapshot.session==='string'&&/^s[0-9]+$/.test(snapshot.session))safe.session=snapshot.session;
  if(typeof safe.session==='string'&&typeof safe.timestampMs==='number'){if(!sessionStarted.has(safe.session)){sessionStarted.set(safe.session,safe.timestampMs);if(sessionStarted.size>24)sessionStarted.delete(sessionStarted.keys().next().value!);}safe.elapsedMs=safe.timestampMs-(sessionStarted.get(safe.session)??safe.timestampMs);}
  if(safe.checkpoint==='advisor_enter'&&!advisorStartupSnapshot)advisorStartupSnapshot={...safe};
  if(Object.keys(safe).length){memoryHistory.push(safe);if(memoryHistory.length>24)memoryHistory.shift();console.info('BBookMemoryCheckpoint',JSON.stringify(safe));}
  return safe;
}
const memoryDiagnosticsEnabled=()=>__DEV__||Constants.expoConfig?.extra?.advisorDiagnosticMode===true;
export function memoryTrace(){return memoryDiagnosticsEnabled()?(advisorStartupSnapshot?[advisorStartupSnapshot,...memoryHistory.filter(row=>row.checkpoint!=='advisor_enter')]:memoryHistory).map(row=>({...row})):[];}
export function logMemoryCheckpoint(){
  if(!memoryDiagnosticsEnabled())return;
  try{const snapshot=native?.memoryDiagnostics?.();if(snapshot)return publishMemory(snapshot);}
  catch{/* Diagnostics cannot alter admission or scan results. */}
}
export function cameraMemoryCheckpoint(session:string,checkpoint:string){
  if(!memoryDiagnosticsEnabled()||!memoryStages.includes(checkpoint))return;
  try{const snapshot=native?.memorySnapshot?.(session,checkpoint);if(snapshot)publishMemory(snapshot);}catch{/* diagnostics only */}
}
export function observeCameraMemory(){
  if(!memoryDiagnosticsEnabled())return;
  return native?.addListener?.('onCameraAvailability',value=>publishMemory(value as unknown as Record<string,unknown>));
}
export function beginCameraObservation(){try{native?.beginCameraObservation?.();}catch{/* availability failure is handled by the handoff */}}
export function stopCameraObservation(){try{native?.stopCameraObservation?.();}catch{/* listener cleanup is best effort */}}
export type CameraAvailabilityOutcome='available'|'not_required'|'legacy_unavailable';
export async function waitForCameraAvailability(session:string,required=false):Promise<CameraAvailabilityOutcome>{
  // Older binaries retain their existing memory guard; never fabricate availability.
  if(!native?.awaitCameraAvailable)return 'legacy_unavailable';
  const state=await native.awaitCameraAvailable(session,required);
  if(state!=='available'&&state!=='not_required')throw {code:'E_CAMERA_RELEASE_PENDING'};
  return state;
}
export function prepareMemoryGuard() { return native?.prepareMemoryGuard?.() === true; }
export function ensureScanAdmission() {
  // A legacy APK can still use its native guard, but cannot report a reason.
  const d=native?.admissionDecision?.();logMemoryCheckpoint();
  if(d?.allowed===true)return;
  if(!d&&prepareMemoryGuard())return;
  const codes:Record<AdmissionReason,string>={allowed:'E_NATIVE_UNAVAILABLE',busy:'E_BUSY',system_pressure:'E_SYSTEM_MEMORY_PRESSURE',insufficient_budget:'E_MEMORY_BUDGET',cleanup_incomplete:'E_CLEANUP_PENDING',unavailable:'E_NATIVE_UNAVAILABLE'};
  throw {code:d?codes[d.reason]||'E_NATIVE_UNAVAILABLE':'E_ADVISOR_LIMIT'};
}
export type NormalizerMode = 'native' | 'legacy';
export function cancelNormalization() { native?.cancelNormalization?.(); }
export async function normalize(asset: Photo, mode: NormalizerMode = 'native'): Promise<Photo> {
  if (mode === 'legacy') return normalizeLegacy(asset);
  if (!native?.normalizeBounded) throw new Error('Cần APK bounded-normalizer-v1.');
  // Native bounds are authoritative; picker metadata is diagnostic only.
  const photo = await native.normalizeBounded(asset.uri, Number.isInteger(asset.width) ? asset.width : 0, Number.isInteger(asset.height) ? asset.height : 0);
  ownedUris.add(photo.uri);
  return photo;
}
export function instrumentationVersion() { try { return native?.instrumentationVersion?.() ?? 'APK chưa có instrumentation'; } catch { return 'không khả dụng'; } }
let normalizationId = 0;
function memoryMark(id: string, stage: string) {
  if (__DEV__) { try { native?.memoryMark?.(id, stage); } catch { /* diagnostics never change result */ } }
}
export const nativeAvailable = typeof native?.analyze === 'function' && typeof native?.normalizeBounded === 'function' && typeof native?.prepareMemoryGuard === 'function';
export async function analyze(photo: Photo, onObservation?: (analysis:Analysis)=>void) {
  if (typeof native?.analyze !== 'function') throw {code:'E_NATIVE_UNAVAILABLE'};
  const subscription=onObservation?native.addListener?.('onDetection',onObservation):undefined;
  try { return await native.analyze(photo.uri); } finally { subscription?.remove(); }
}
export async function removePhoto(uri?: string) {
  if (uri && FileSystem.cacheDirectory && uri.startsWith(FileSystem.cacheDirectory) && (ownedUris.has(uri) || ownedFilename.test(uri.slice(FileSystem.cacheDirectory.length)))) {
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
    ownedUris.delete(uri);
  }
}
// Recover our own expired temporary files after a process kill. Never sweep the
// shared picker/cache directories or remove a recent file owned by another view.
export async function removeExpiredAdvisorPhotos(nowMs = Date.now()) {
  const cache = FileSystem.cacheDirectory;
  if (!cache) return;
  try {
    const names = await FileSystem.readDirectoryAsync(cache);
    await Promise.all(names.filter(name => ownedFilename.test(name)).map(async name => {
      const info = await FileSystem.getInfoAsync(cache + name);
      if (info.exists && !info.isDirectory && info.modificationTime && nowMs / 1000 - info.modificationTime > 3600) await removePhoto(cache + name);
    }));
  } catch { /* Cache eviction is best effort and never blocks advisor access. */ }
}
// Adapted from the Gemini candidate's normalization; no base64, fetch, or upload.
export async function normalizeLegacy(asset: Photo): Promise<Photo> {
  if (!Number.isInteger(asset.width) || !Number.isInteger(asset.height) ||
    asset.width * asset.height > 40_000_000) throw new Error('Ảnh quá lớn hoặc kích thước không hợp lệ cho PoC. Hãy chọn ảnh dưới 40 MP.');
  if (asset.width < 128 || asset.height < 128) throw new Error('Ảnh quá nhỏ.');
  const scale = Math.min(1, 1280 / Math.max(asset.width, asset.height));
  // The installed manipulateAsync wrapper releases objects only on success.
  // Keep its resize/save behavior, but release on render/save/info failures too.
  const requestId = `n${++normalizationId}`;
  memoryMark(requestId, "normalization_start");
  let context: ReturnType<typeof Manipulator.ImageManipulator.manipulate> | undefined;
  let image: Manipulator.ImageRef | undefined;
  let photo: Photo | undefined;
  try {
    context = Manipulator.ImageManipulator.manipulate(asset.uri);
    context.resize({ width: Math.round(asset.width * scale), height: Math.round(asset.height * scale) });
    image = await context.renderAsync();
    photo = await image.saveAsync({ format: Manipulator.SaveFormat.JPEG, compress: 0.9 });
    ownedUris.add(photo.uri);
    const info = await FileSystem.getInfoAsync(photo.uri);
    if (!info.exists || !info.size || info.size > 5 * 1024 * 1024) throw new Error('Ảnh vượt giới hạn 5 MiB.');
    memoryMark(requestId, "normalization_end");
    return photo;
  } catch (error) {
    await removePhoto(photo?.uri);
    throw error;
  } finally {
    try { context?.release(); } finally { try { image?.release(); } finally { memoryMark(requestId, "normalization_release"); } }
  }
}
export function warnings(result: Analysis): string[] {
  if (result.faceCount === 0) return ['Không phát hiện mặt; thử ảnh rõ, chính diện.'];
  if (result.faceCount !== 1) return ['Nhiều mặt: không chạy contours, hãy chọn ảnh một người.'];
  const face = result.faces[0];
  const flags: string[] = [];
  if (Math.abs(face.angles.x) > 15 || Math.abs(face.angles.y) > 15 || Math.abs(face.angles.z) > 10)
    flags.push('Mặt nghiêng: các ngưỡng PoC chưa được hiệu chuẩn.');
  if (Math.min(face.box.width, face.box.height) < 200) flags.push('Mặt nhỏ: contours có thể thiếu chính xác.');
  if (!result.contours.length) flags.push('Không lấy được contours.');
  flags.push('Detector không xác nhận ảnh đủ sáng, nét hoặc không bị che; cần kiểm tra bằng mắt trong PoC.');
  return flags;
}
