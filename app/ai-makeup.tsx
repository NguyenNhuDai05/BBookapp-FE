import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Camera, ImagePlus, Sparkles } from 'lucide-react-native';
import { BrandColors as C, Radius } from '../constants/theme';
import { useAiMakeup } from '../hooks/useAiMakeup';
import { exploreService } from '../services/exploreService';
import { ExploreServiceCard } from '../components/explore/ExploreCards';
import { ExploreFilterSheet } from '../components/explore/ExploreFilterSheet';
import { AiMakeupCamera } from '../components/aiMakeup/AiMakeupCamera';
import type { ExploreFilters, ExploreService } from '../types/explore';

const invalidImage = { no_face: 'Chưa thấy khuôn mặt rõ ràng.', multiple_faces: 'Hãy chọn ảnh chỉ có một khuôn mặt.', blurry: 'Ảnh còn mờ hoặc thiếu sáng.', occluded: 'Khuôn mặt đang bị che khuất.', insufficient: 'Ảnh chưa đủ rõ để tư vấn.' };
function Button({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.button, disabled && { opacity: 0.45 }]}><Text style={styles.buttonText}>{title}</Text></TouchableOpacity>;
}
export default function AiMakeupScreen() {
  const ai = useAiMakeup(); const router = useRouter();
  const focused = useIsFocused(); const [cameraOpen, setCameraOpen] = useState(false);
  useFocusEffect(useCallback(() => () => setCameraOpen(false), []));
  const [filters, setFilters] = useState<ExploreFilters>({}); const [filterVisible, setFilterVisible] = useState(false);
  const home = useQuery({ queryKey: ['ai-makeup-catalog'], queryFn: ({ signal }) => exploreService.home(signal), retry: false });
  const matches = useQuery({ queryKey: ['ai-makeup-services', filters], queryFn: ({ signal }) => exploreService.search('services', filters, '', undefined, signal), enabled: !!filters.styleId, retry: false });
  const currentStyle = home.data?.styles.find(s => s.id === filters.styleId);
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><TouchableOpacity accessibilityLabel="Quay lại" accessibilityRole="button" onPress={() => router.back()} style={styles.back}><ArrowLeft color={C.textDark} /></TouchableOpacity><Text style={styles.eyebrow}>BBOOK · AI MAKEUP ADVISOR</Text></View>
    <Text style={styles.title}>Đẹp theo cách của bạn</Text><Text style={styles.body}>Một ảnh selfie, ba gợi ý phong cách và các dịch vụ thật từ BBook.</Text>
    {ai.capabilities.isLoading ? <ActivityIndicator color={C.accentRose} /> : !ai.capabilities.data?.enabled ? <View style={styles.card}><Text style={styles.subtitle}>Tư vấn AI chưa sẵn sàng</Text><Text style={styles.body}>Bạn vẫn có thể tìm phong cách và MUA trong Khám phá.</Text><Button title="Kiểm tra lại" onPress={() => void ai.capabilities.refetch()} /></View> : <>
      {!ai.result ? <>
        <View style={styles.card}>{ai.photo ? <Image source={{ uri: ai.photo.uri }} style={styles.preview} resizeMode="contain" /> :
          <View style={styles.guide}><View style={styles.oval}><Sparkles size={38} color={C.accentRose} /></View><Text style={styles.body}>Một khuôn mặt nhìn thẳng, đủ sáng, không che mắt hoặc môi.</Text></View>}
          <View style={styles.row}><Camera size={20} color={C.accentRose} /><View style={{ flex: 1 }}><Button title={ai.photo ? 'Chụp lại selfie' : 'Chụp selfie'} disabled={ai.busy} onPress={() => setCameraOpen(true)} /></View></View>
          <View style={styles.row}><ImagePlus size={20} color={C.accentRose} /><View style={{ flex: 1 }}><Button title="Chọn ảnh từ thư viện" disabled={ai.busy} onPress={() => void ai.choosePhoto(false)} /></View></View>
        </View>
        {ai.photo ? <View style={styles.card}>
          <Text style={styles.subtitle}>Sở thích của bạn (không bắt buộc)</Text><TextInput accessibilityLabel="Sở thích makeup" placeholder="Ví dụ: nhẹ nhàng, tông hồng" value={ai.preferences} onChangeText={ai.setPreferences} maxLength={200} editable={!ai.busy} style={styles.input} />
          <TextInput accessibilityLabel="Dịp makeup" placeholder="Dịp sử dụng: đi chơi, dự tiệc..." value={ai.occasion} onChangeText={ai.setOccasion} maxLength={100} editable={!ai.busy} style={styles.input} />
          <Text style={styles.subtitle}>Bạn quyết định việc sử dụng ảnh</Text><Text style={styles.body}>BBook gửi ảnh đã nén đến dịch vụ Gemini của Google để quan sát đặc điểm khuôn mặt và gợi ý makeup. BBook xử lý ảnh trong bộ nhớ, không lưu ảnh trên máy chủ, không gửi cho MUA và không tạo dữ liệu nhận diện khuôn mặt. Bản ảnh tạm do tính năng tạo trên thiết bị được xóa khi hoàn tất hoặc rời màn hình; ảnh gốc trong thư viện được giữ lại.</Text>
          <Text style={styles.body}>Google Paid Tier không dùng nội dung này để cải thiện sản phẩm, nhưng có thể giữ dữ liệu trong thời gian giới hạn để chống lạm dụng và đáp ứng yêu cầu pháp lý. BBook không cam kết Google xóa ảnh ngay lập tức.</Text>
          <TouchableOpacity onPress={() => router.push('/policy')} accessibilityRole="link"><Text style={styles.link}>Đọc Chính sách quyền riêng tư (ảnh tạm sẽ được xóa khi rời màn hình)</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: ai.consent }} disabled={ai.busy} onPress={() => ai.setConsent(!ai.consent)} style={styles.consent}><Text style={styles.body}>{ai.consent ? '☑' : '☐'} Tôi đủ 18 tuổi, có quyền sử dụng ảnh này và đồng ý cho BBook gửi ảnh đến Google để tư vấn makeup.</Text></TouchableOpacity>
          <Button title="Đồng ý và phân tích" disabled={!ai.consent || ai.busy} onPress={() => void ai.analyze()} /><Button title="Hủy và xóa ảnh tạm" disabled={ai.busy} onPress={ai.reset} />
        </View> : null}
      </> : ai.result.imageStatus !== 'valid' ? <View style={styles.card}><Text style={styles.subtitle}>{invalidImage[ai.result.imageStatus]}</Text><Text style={styles.body}>Nhận xét của AI có thể chưa chính xác. Hãy thử ảnh rõ, đủ sáng và chỉ có bạn.</Text><Button title="Chọn ảnh khác" onPress={ai.reset} /></View> : <>
        <View style={styles.card}><Text style={styles.subtitle}>Gợi ý dành cho bạn</Text>{ai.result.observations.map((o, i) => <Text key={i} style={styles.body}>{o.description}</Text>)}<Text style={styles.body}>{ai.result.notice}</Text></View>
        {ai.result.recommendations.map(r => <View key={r.styleId} style={styles.card}><Text style={styles.subtitle}>{r.styleName}</Text><Text style={styles.body}>{r.reason}</Text>{r.makeupTips.map((tip, i) => <Text key={i} style={styles.body}>• {tip}</Text>)}<Button title={filters.styleId === r.styleId ? 'Đang chọn phong cách này' : 'Tìm MUA theo phong cách này'} onPress={() => setFilters({ ...filters, styleId: r.styleId })} /></View>)}
        <View style={styles.card}><Text style={styles.body}>Nếu gợi ý có nội dung không phù hợp, bạn có thể mô tả và gửi báo cáo trong app. Không cần gửi lại selfie.</Text><Button title="Báo cáo gợi ý không phù hợp" onPress={() => router.push('/feedback')} /></View>
        <Button title="Thử ảnh mới" onPress={() => { ai.reset(); setFilters({}); }} />
      </>}
      {ai.busy ? <View accessibilityLiveRegion="polite" style={styles.card}><ActivityIndicator color={C.accentRose} /><Text style={styles.body}>Đang xử lý yêu cầu của bạn…</Text><Text style={styles.body}>Không cần gửi lại ảnh. Nếu rời màn hình, yêu cầu đã gửi vẫn có thể được tính lượt.</Text></View> : null}
      {ai.error ? <View accessibilityRole="alert" style={styles.card}><Text style={styles.error}>{ai.error}</Text></View> : null}
    </>}
    {home.data?.styles.length ? <View style={styles.card}><Text style={styles.subtitle}>Hoặc tự chọn phong cách</Text><ScrollView horizontal contentContainerStyle={{ gap: 8 }}>{home.data.styles.map(s => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: filters.styleId === s.id }} key={s.id} onPress={() => setFilters({ ...filters, styleId: s.id })} style={styles.chip}><Text style={styles.link}>{s.name}</Text></TouchableOpacity>)}</ScrollView></View> : null}
    {filters.styleId ? <View style={styles.card}><Text style={styles.subtitle}>Dịch vụ · {currentStyle?.name || 'Phong cách đã chọn'}</Text><Text style={styles.body}>Dịch vụ đang hoạt động từ MUA công khai, phù hợp chuyên môn hoặc thẻ phong cách. Sắp xếp theo giá tăng dần. Lịch trống được kiểm tra khi đặt lịch.</Text><Button title="Lọc khu vực và ngân sách" onPress={() => setFilterVisible(true)} />
      {matches.isFetching ? <ActivityIndicator color={C.accentRose} /> : matches.isError ? <><Text style={styles.error}>Chưa tải được dịch vụ. Kiểm tra kết nối và thử lại.</Text><Button title="Tải lại dịch vụ" onPress={() => void matches.refetch()} /></> : matches.data?.items.length ? <>
        {(matches.data.items as ExploreService[]).map(s => <View key={s.id} style={{ marginTop: 16 }}><ExploreServiceCard item={s} onPress={() => router.push({ pathname: '/mua-detail', params: { id: s.muaId, tab: 'Dịch vụ', serviceId: s.id } })} /></View>)}
        {matches.data.nextCursor ? <Text style={styles.body}>Còn dịch vụ khác. Mở Khám phá để xem thêm với các bộ lọc.</Text> : null}
      </> : <Text style={styles.body}>Chưa có dịch vụ phù hợp. Thử phong cách khác hoặc mở rộng khu vực và ngân sách.</Text>}
    </View> : null}
    <Button title="Về Khám phá" onPress={() => router.replace('/(tabs)/explore')} />
  </ScrollView>{cameraOpen && focused && ai.capabilities.data?.enabled ? <AiMakeupCamera onClose={() => setCameraOpen(false)} onCaptured={ai.acceptCapture} /> : null}<ExploreFilterSheet visible={filterVisible} filters={filters} provinces={home.data?.provinces || []} onClose={() => setFilterVisible(false)} onApply={next => { setFilters(next); setFilterVisible(false); }} /></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: C.bgPrimary }, content: { padding: 20, gap: 16, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }, header: { flexDirection: 'row', alignItems: 'center', gap: 10 }, back: { padding: 10 }, eyebrow: { color: C.textSecondary, fontSize: 11, fontWeight: '700' }, title: { color: C.textDark, fontSize: 28, fontWeight: '800' }, subtitle: { color: C.textDark, fontSize: 18, fontWeight: '700', marginBottom: 8 }, body: { color: C.textBody, fontSize: 14, lineHeight: 22, marginVertical: 6 }, card: { backgroundColor: C.bgCard, borderRadius: Radius.xl, padding: 20, borderWidth: 1, borderColor: C.borderLight }, button: { minHeight: 48, borderRadius: Radius.base, backgroundColor: C.accentRose, padding: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 }, buttonText: { color: C.textWhite, fontSize: 14, fontWeight: '700' }, preview: { width: '100%', height: 320, borderRadius: Radius.lg }, guide: { alignItems: 'center', padding: 12 }, oval: { width: 150, height: 190, borderRadius: 90, borderWidth: 2, borderStyle: 'dashed', borderColor: C.borderPink, alignItems: 'center', justifyContent: 'center' }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, input: { borderWidth: 1, borderColor: C.borderLight, borderRadius: Radius.base, padding: 14, color: C.textDark, marginBottom: 10 }, consent: { paddingVertical: 12 }, link: { color: C.accentRose, fontSize: 14, fontWeight: '600', marginVertical: 8 }, error: { color: C.statusCancelled, fontSize: 14, lineHeight: 22 }, chip: { borderWidth: 1, borderColor: C.borderPink, borderRadius: Radius.base, paddingHorizontal: 14 } });
