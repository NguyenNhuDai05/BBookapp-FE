import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, ImagePlus, UserRound } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PrivateMediaImage } from '../../components/PrivateMediaImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMuaIdentity, useSaveMuaIdentity } from '../../hooks/useMuaEligibility';
import { uploadVerificationImage } from '../../services/verificationMediaService';
import { getApiError } from '../../services/api';
import type { MuaIdentityVerificationRequestDto, MuaIdentitySubmission } from '../../types/onboarding';

export default function IdentityVerificationScreen() {
  const query = useMuaIdentity();
  const router = useRouter();
  if (query.isPending) return <SafeAreaView style={s.center}><ActivityIndicator color="#FF4E91" /><Text>Đang tải ảnh xác minh...</Text></SafeAreaView>;
  if (query.isError || !query.data) return <SafeAreaView style={s.center}><Text>Không thể tải ảnh xác minh.</Text><TouchableOpacity onPress={() => query.refetch()}><Text style={s.link}>Thử lại</Text></TouchableOpacity><TouchableOpacity onPress={() => router.back()}><Text style={s.link}>Quay lại</Text></TouchableOpacity></SafeAreaView>;
  return <IdentityForm initial={query.data} />;
}
function IdentityForm({ initial }: { initial: MuaIdentityVerificationRequestDto }) {
  const router = useRouter();
  const save = useSaveMuaIdentity();
  const [images, setImages] = useState(initial);
  const [step, setStep] = useState<1 | 2>(1);
  const [source, setSource] = useState<'identityFrontUrl' | 'identityBackUrl' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const ready = !!(images.identityFrontUrl && images.identityBackUrl && images.portraitUrl);
  const capture = async (field: 'identityFrontUrl' | 'identityBackUrl' | 'portraitUrl', camera: boolean) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { setError(camera ? 'Cần quyền camera để chụp ảnh. Bạn có thể bật quyền trong cài đặt thiết bị.' : 'Cần quyền thư viện để chọn ảnh từ máy.'); return; }
      const result = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: .9, allowsEditing: false, cameraType: field === 'portraitUrl' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: .9, allowsEditing: false });
      if (!result.canceled && result.assets[0]) setImages(current => ({ ...current, [field]: result.assets[0].uri,
        [field === 'identityFrontUrl' ? 'identityFrontMediaId' : field === 'identityBackUrl' ? 'identityBackMediaId' : 'portraitMediaId']: null }));
      setSource(null);
    } catch { setError('Không thể mở camera hoặc thư viện ảnh. Vui lòng thử lại.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const submit = async () => {
    if (lock.current || !ready) return;
    lock.current = true; setBusy(true); setError('');
    try {
      // Reuse durable IDs, never submit signed preview URLs. Persist each successful
      // upload in local state so retrying another failed photo does not upload it again.
      const ensure = async (url: string, id: string | null | undefined, purpose: 'identity-front' | 'identity-back' | 'portrait', key: 'identityFrontMediaId' | 'identityBackMediaId' | 'portraitMediaId') => {
        if (id) return id;
        const uploaded = await uploadVerificationImage(url, purpose);
        setImages(current => ({ ...current, [key]: uploaded }));
        return uploaded;
      };
      const identityFrontMediaId = await ensure(images.identityFrontUrl, images.identityFrontMediaId, 'identity-front', 'identityFrontMediaId');
      const identityBackMediaId = await ensure(images.identityBackUrl, images.identityBackMediaId, 'identity-back', 'identityBackMediaId');
      const portraitMediaId = await ensure(images.portraitUrl, images.portraitMediaId, 'portrait', 'portraitMediaId');
      const request: MuaIdentitySubmission = { identityFrontMediaId, identityBackMediaId, portraitMediaId, certificateMediaIds: images.certificateMediaIds || [] };
      await save.mutateAsync(request);
      router.replace('/mua-onboarding/setup');
    } catch (err) { setError(getApiError(err).message || 'Không thể lưu xác minh. Vui lòng thử lại.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const document = (label: string, field: 'identityFrontUrl' | 'identityBackUrl') => <View style={s.document}>
    {images[field] ? <PrivateMediaImage uri={images[field]} mediaId={field === 'identityFrontUrl' ? images.identityFrontMediaId : images.identityBackMediaId} style={s.documentImage} /> : <View style={s.placeholder}><ImagePlus size={30} color="#FF4E91" /></View>}
    <View style={s.documentCopy}><Text style={s.label}>{label}</Text><Text style={s.helper}>Chụp hoặc tải ảnh</Text><TouchableOpacity disabled={busy} accessibilityLabel={`Thay ảnh ${label}`} onPress={() => setSource(source === field ? null : field)}><Text style={s.link}>{images[field] ? 'Thay ảnh' : 'Thêm ảnh'}</Text></TouchableOpacity></View>
    {source === field && <View style={s.sources}><TouchableOpacity disabled={busy} onPress={() => capture(field, true)}><Text style={s.link}>Chụp ảnh</Text></TouchableOpacity><TouchableOpacity disabled={busy} onPress={() => capture(field, false)}><Text style={s.link}>Chọn từ máy</Text></TouchableOpacity></View>}
  </View>;
  return <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
    <View style={s.header}><TouchableOpacity disabled={busy} accessibilityLabel="Quay lại" onPress={() => step === 2 ? setStep(1) : router.back()} style={s.back}><ArrowLeft size={22} color="#291E2D" /></TouchableOpacity><Text style={s.title}>{step === 1 ? 'Xác minh CCCD' : 'Xác minh khuôn mặt'}</Text><View style={s.back} /></View>
    <View style={s.steps}><View style={s.step}><Text style={s.stepNumber}>1</Text><Text style={s.stepLabel}>CCCD</Text></View><View style={s.track} /><View style={s.step}><Text style={[s.stepNumber, step === 1 && s.inactive]}>2</Text><Text style={s.stepLabel}>Khuôn mặt</Text></View></View>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {step === 1 ? <View style={s.card}><Text style={s.heading}>Chụp ảnh CCCD</Text><Text style={s.helper}>Ảnh rõ nét, không bị lóa, đầy đủ bốn góc.</Text>{document('Mặt trước', 'identityFrontUrl')}{document('Mặt sau', 'identityBackUrl')}<View style={s.notice}><Text style={s.noticeTitle}>Lưu ý:</Text><Text style={s.helper}>• Không dùng ảnh chụp màn hình{ '\n' }• Thông tin phải còn hiệu lực{ '\n' }• Giấy tờ chỉ dùng để xét duyệt, không hiển thị công khai</Text></View></View> : <View style={s.card}>
        <Text style={s.heading}>Chụp ảnh khuôn mặt</Text><Text style={s.helper}>Chụp ảnh chính diện để admin đối chiếu với ảnh trên CCCD.</Text><View style={s.face}>{images.portraitUrl ? <PrivateMediaImage uri={images.portraitUrl} mediaId={images.portraitMediaId} style={s.faceImage} /> : <UserRound size={90} color="#E7A3BC" />}</View>
        <Text style={s.guidance}>✓ Giữ khuôn mặt chính diện, rõ toàn bộ khuôn mặt{ '\n' }✓ Đảm bảo ánh sáng đầy đủ{ '\n' }✓ Không đeo kính hoặc khẩu trang</Text>
        <TouchableOpacity disabled={busy} onPress={() => capture('portraitUrl', true)} style={s.capture}><Camera size={18} color="#FF4E91" /><Text style={s.link}>{images.portraitUrl ? 'Chụp lại khuôn mặt' : 'Chụp ảnh khuôn mặt'}</Text></TouchableOpacity>
        <Text style={s.helper}>Ảnh đã chụp chưa đồng nghĩa với danh tính đã được xác thực. Admin sẽ kiểm tra khi bạn gửi hồ sơ.</Text>
      </View>}
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    </ScrollView>
    <View style={s.footer}><TouchableOpacity accessibilityLabel={step === 1 ? 'Tiếp theo' : 'Lưu xác minh'} disabled={busy || (step === 1 ? !images.identityFrontUrl || !images.identityBackUrl : !ready)} onPress={() => step === 1 ? (setSource(null), setError(''), setStep(2)) : submit()} style={[s.primary, (busy || (step === 1 ? !images.identityFrontUrl || !images.identityBackUrl : !ready)) && s.disabled]}>{busy ? <ActivityIndicator color="#FFF" /> : <Text style={s.primaryText}>{step === 1 ? 'Tiếp theo' : 'Lưu xác minh'}</Text>}</TouchableOpacity><Text style={s.footerNote}>Lưu giấy tờ trước, gửi hồ sơ cho admin tại checklist.</Text></View>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF5F8' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }, header: { flexDirection: 'row', alignItems: 'center', minHeight: 60, paddingHorizontal: 16 }, back: { width: 40, height: 44, justifyContent: 'center' }, title: { flex: 1, textAlign: 'center', fontSize: 19, fontWeight: '700', color: '#291E2D' }, steps: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 60 }, step: { alignItems: 'center', gap: 7 }, stepNumber: { width: 26, height: 26, borderRadius: 13, textAlign: 'center', lineHeight: 26, backgroundColor: '#FF4E91', color: '#FFF', fontWeight: '700' }, inactive: { backgroundColor: '#DCD5DB' }, stepLabel: { color: '#817785', fontSize: 12 }, track: { height: 2, flex: 1, backgroundColor: '#E9CCD8', marginTop: 12, marginHorizontal: 6 }, content: { padding: 18, gap: 16, width: '100%', maxWidth: 650, alignSelf: 'center' }, card: { backgroundColor: '#FFF', borderRadius: 20, padding: 18 }, heading: { fontSize: 18, fontWeight: '700', color: '#291E2D', marginBottom: 8 }, helper: { color: '#817785', fontSize: 12, lineHeight: 19 }, document: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#FFC5D8', backgroundColor: '#FFF9FB', padding: 14, borderRadius: 14, marginTop: 16, gap: 14 }, documentImage: { width: 95, height: 70, borderRadius: 10 }, placeholder: { width: 75, height: 70, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFE8F0' }, documentCopy: { flex: 1 }, label: { fontSize: 15, fontWeight: '600', color: '#291E2D' }, link: { color: '#FF4E91', fontWeight: '600', paddingVertical: 10 }, sources: { width: '100%', flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#FFE0EB' }, notice: { marginTop: 20, backgroundColor: '#FFF5F8', padding: 14, borderRadius: 12 }, noticeTitle: { color: '#FF4E91', fontWeight: '700', marginBottom: 5 }, face: { width: 230, height: 230, borderRadius: 115, borderWidth: 3, borderColor: '#FF4E91', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: 28, backgroundColor: '#FFF5F8' }, faceImage: { width: '100%', height: '100%' }, guidance: { fontSize: 13, lineHeight: 26, color: '#534857' }, capture: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginVertical: 16, borderWidth: 1, borderColor: '#FFBCD4', borderRadius: 24 }, footer: { padding: 16, backgroundColor: '#FFF5F8' }, primary: { minHeight: 50, backgroundColor: '#FF4E91', borderRadius: 25, justifyContent: 'center', alignItems: 'center' }, primaryText: { color: '#FFF', fontSize: 15, fontWeight: '700' }, footerNote: { fontSize: 11, textAlign: 'center', color: '#817785', marginTop: 8 }, disabled: { opacity: .45 }, error: { color: '#B63F58', fontSize: 13, lineHeight: 20 },
});
