import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useIsFocused } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors as C, Radius } from '../../constants/theme';
import { deleteAiPhoto } from '../../services/aiMakeupPhoto';
import type { AiMakeupPhoto } from '../../types/aiMakeup';

export function AiMakeupCamera({ onClose, onCaptured }: { onClose: () => void; onCaptured: (photo: AiMakeupPhoto) => Promise<void> }) {
  const [permission, requestPermission] = useCameraPermissions();
  const focused = useIsFocused(); const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const camera = useRef<CameraView>(null); const alive = useRef(true); const gate = useRef(false);
  const captureGeneration = useRef(0); const active = useRef(focused && foreground);
  const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { alive.current = true; const sub = AppState.addEventListener('change', next => { captureGeneration.current++; active.current = next === 'active'; setForeground(next === 'active'); setReady(false); }); return () => { alive.current = false; sub.remove(); }; }, []);
  useEffect(() => { active.current = focused && foreground; if (!focused) captureGeneration.current++; }, [focused, foreground]);
  useFocusEffect(useCallback(() => () => { captureGeneration.current++; setReady(false); }, []));
  const capture = async () => {
    if (gate.current || !ready || !camera.current || !active.current) return;
    const stamp = captureGeneration.current;
    gate.current = true; setBusy(true); setError('');
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.9, exif: false, base64: false });
      if (!alive.current || !active.current || stamp !== captureGeneration.current) { await deleteAiPhoto(photo?.uri); return; }
      if (!photo?.uri) throw new Error();
      await onCaptured(photo); if (alive.current) onClose();
    } catch { if (alive.current) setError('Không chụp được ảnh. Hãy thử lại hoặc chọn ảnh từ thư viện.'); }
    finally { if (alive.current) { gate.current = false; setBusy(false); } }
  };
  return <Modal animationType="slide" onRequestClose={onClose}><SafeAreaView style={styles.safe}>
    <Text style={styles.title}>Chụp selfie</Text><Text style={styles.body}>Đưa khuôn mặt vào khung, nhìn thẳng và chọn nơi đủ sáng. Khung chỉ hướng dẫn căn ảnh.</Text>
    {permission?.granted && focused && foreground ? <View style={styles.preview}><CameraView ref={camera} style={StyleSheet.absoluteFill} facing="front" mode="picture" onCameraReady={() => setReady(true)} onMountError={() => { setReady(false); setError('Không mở được camera. Hãy chọn ảnh từ thư viện.'); }} />
      <View pointerEvents="none" style={styles.overlay}><View style={styles.oval} /></View>
    </View> : <View style={styles.permission}><Text style={styles.body}>{permission?.canAskAgain === false ? 'Camera chưa được cấp quyền. Hãy cấp quyền trong Cài đặt hoặc chọn ảnh từ thư viện.' : 'Camera chỉ mở sau khi bạn cấp quyền.'}</Text><TouchableOpacity accessibilityRole="button" onPress={() => void requestPermission().catch(() => setError('Không xin được quyền camera. Hãy kiểm tra Cài đặt.'))} style={styles.button}><Text style={styles.buttonText}>Cho phép dùng camera</Text></TouchableOpacity></View>}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Chụp ảnh selfie" disabled={!ready || busy || !foreground || !focused} onPress={() => void capture()} style={[styles.button, (!ready || busy) && { opacity: 0.5 }]}><Text style={styles.buttonText}>{busy ? 'Đang lưu ảnh…' : 'Chụp ảnh'}</Text></TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" onPress={onClose} style={styles.close}><Text style={styles.body}>Hủy · quay lại chọn ảnh</Text></TouchableOpacity>
  </SafeAreaView></Modal>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: C.bgPrimary, padding: 20 }, title: { color: C.textDark, fontSize: 24, fontWeight: '700', marginVertical: 12 }, body: { color: C.textBody, fontSize: 14, lineHeight: 22, textAlign: 'center' }, preview: { flex: 1, borderRadius: Radius.xl, overflow: 'hidden', marginVertical: 20 }, overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }, oval: { width: '65%', height: '65%', borderRadius: 160, borderWidth: 3, borderColor: C.textWhite }, permission: { flex: 1, justifyContent: 'center' }, button: { minHeight: 50, borderRadius: Radius.base, padding: 16, backgroundColor: C.accentRose, alignItems: 'center', marginTop: 12 }, buttonText: { color: C.textWhite, fontSize: 15, fontWeight: '700' }, close: { padding: 16 }, error: { color: C.statusCancelled, textAlign: 'center', marginVertical: 10 } });
