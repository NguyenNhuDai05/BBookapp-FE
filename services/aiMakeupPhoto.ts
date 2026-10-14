import * as Picker from 'expo-image-picker';
import * as Manipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import type { AiMakeupPhoto } from '../types/aiMakeup';

export async function deleteAiPhoto(uri?: string) {
  // Only delete files produced in Expo's cache, never the user's original library asset.
  if (Platform.OS !== 'web' && uri && FileSystem.cacheDirectory && uri.startsWith(FileSystem.cacheDirectory))
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
}
export async function pickAiPhoto(camera: boolean, maxBytes: number): Promise<AiMakeupPhoto | null> {
  if (camera) {
    const permission = await Picker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('Bạn chưa cho phép dùng camera. Hãy cấp quyền trong Cài đặt hoặc chọn ảnh từ thư viện.');
  }
  // Android Photo Picker grants access to the selected item without broad library permission.
  if (!camera && Platform.OS === 'ios') {
    const permission = await Picker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new Error('Bạn chưa cho phép chọn ảnh. Hãy cấp quyền trong Cài đặt.');
  }
  const result = camera ? await Picker.launchCameraAsync({ mediaTypes: ['images'], cameraType: Picker.CameraType.front, quality: 0.9, exif: false, base64: false }) :
    await Picker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 0.9, exif: false, base64: false });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return prepareAiPhoto(asset, maxBytes);
}
export async function prepareAiPhoto(asset: AiMakeupPhoto | undefined, maxBytes: number): Promise<AiMakeupPhoto> {
  if (!asset || asset.width < 128 || asset.height < 128) { await deleteAiPhoto(asset?.uri); throw new Error('Ảnh quá nhỏ. Vui lòng chọn ảnh rõ hơn.'); }
  let photo: AiMakeupPhoto | undefined;
  try {
    const scale = Math.min(1, 1280 / Math.max(asset.width, asset.height));
    photo = await Manipulator.manipulateAsync(asset.uri, [{ resize: { width: Math.round(asset.width * scale), height: Math.round(asset.height * scale) } }], { compress: 0.82, format: Manipulator.SaveFormat.JPEG });
    const size = Platform.OS === 'web' ? (await (await fetch(photo.uri)).blob()).size :
      ((await FileSystem.getInfoAsync(photo.uri)) as { size?: number }).size;
    if (!size || size > maxBytes) throw new Error('Ảnh sau nén vẫn quá lớn. Hãy chọn ảnh khác.');
    return photo;
  } catch (error) { await deleteAiPhoto(photo?.uri); throw error; }
  finally { await deleteAiPhoto(asset.uri); }
}
