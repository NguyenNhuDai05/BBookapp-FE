import { requireOptionalNativeModule } from 'expo-modules-core';
import * as Manipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

export type Photo = { uri: string; width: number; height: number };
export type Analysis = {
  width: number; height: number; faceCount: number;
  faces: { box: { x: number; y: number; width: number; height: number }; angles: { x: number; y: number; z: number } }[];
  contours: { type: number; points: { x: number; y: number }[] }[];
  latencyMs: number; nativeHeapBeforeBytes: number; nativeHeapAfterBytes: number;
};
const native = requireOptionalNativeModule<{ analyze(uri: string): Promise<Analysis>; memoryMark?(id: string, stage: string): void; instrumentationVersion?(): string; normalizeBounded?(uri: string, width: number, height: number): Promise<Photo>; cancelNormalization?(): void; prepareMemoryGuard?(): boolean }>('BBookFaceAnalysis');
export function prepareMemoryGuard() { return native?.prepareMemoryGuard?.() === true; }
export type NormalizerMode = 'native' | 'legacy';
export function cancelNormalization() { native?.cancelNormalization?.(); }
export async function normalize(asset: Photo, mode: NormalizerMode = 'native'): Promise<Photo> {
  if (mode === 'legacy') return normalizeLegacy(asset);
  if (!native?.normalizeBounded) throw new Error('Cần APK bounded-normalizer-v1.');
  // Native bounds are authoritative; picker metadata is diagnostic only.
  return native.normalizeBounded(asset.uri, Number.isInteger(asset.width) ? asset.width : 0, Number.isInteger(asset.height) ? asset.height : 0);
}
export function instrumentationVersion() { try { return native?.instrumentationVersion?.() ?? 'APK chưa có instrumentation'; } catch { return 'không khả dụng'; } }
let normalizationId = 0;
function memoryMark(id: string, stage: string) {
  if (__DEV__) { try { native?.memoryMark?.(id, stage); } catch { /* diagnostics never change result */ } }
}
export const nativeAvailable = typeof native?.normalizeBounded === 'function' && typeof native?.prepareMemoryGuard === 'function';
export async function analyze(photo: Photo) {
  if (!native) throw new Error('Cần APK PoC có module Kotlin; Expo Go không chạy được detector này.');
  return native.analyze(photo.uri);
}
export async function removePhoto(uri?: string) {
  if (uri && FileSystem.cacheDirectory && uri.startsWith(FileSystem.cacheDirectory)) {
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
  }
}
// Recover our own expired temporary files after a process kill. Never sweep the
// shared picker/cache directories or remove a recent file owned by another view.
export async function removeExpiredAdvisorPhotos(nowMs = Date.now()) {
  const cache = FileSystem.cacheDirectory;
  if (!cache) return;
  try {
    const names = await FileSystem.readDirectoryAsync(cache);
    await Promise.all(names.filter(name => /^bbook-normalized-[a-zA-Z0-9_-]+\.jpg$/.test(name)).map(async name => {
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
