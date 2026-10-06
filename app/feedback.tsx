import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { ArrowLeft, MessageSquare } from 'lucide-react-native';
import { feedbackService, type FeedbackCategory } from '../services/feedbackService';
import { getApiError } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { BrandColors } from '../constants/theme';

export default function FeedbackScreen() {
  const router = useRouter();
  const demo = useAuthStore((state) => state.user?.isDemoAccount === true);
  const [category, setCategory] = useState<FeedbackCategory>('Suggestion');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const lock = useRef(false);
  const pending = useRef<{ submissionId: string; category: FeedbackCategory; body: string } | null>(null);
  async function send() {
    if (lock.current || demo) return;
    const content = body.trim();
    if (content.length < 10) { setError('Vui lòng nhập nội dung từ 10 đến 2.000 ký tự.'); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      // Retain the ID after a network failure so retries cannot create duplicate feedback.
      if (!pending.current || pending.current.body !== content || pending.current.category !== category) pending.current = { submissionId: randomUUID(), category, body: content };
      const result = await feedbackService.create(pending.current);
      setReceipt(result.id); pending.current = null;
    } catch (err) { setError(getApiError(err).message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <SafeAreaView style={styles.screen}><View style={styles.header}><TouchableOpacity accessibilityLabel="Quay lại" disabled={busy} onPress={() => router.back()}><ArrowLeft color={BrandColors.textDark} size={24} /></TouchableOpacity><Text style={styles.title}>Góp ý & báo lỗi</Text></View><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.card}><MessageSquare color={BrandColors.accentPink} size={28} /><Text style={styles.heading}>{receipt ? 'Đã nhận phản hồi của bạn' : 'Giúp B-Book tốt hơn mỗi ngày'}</Text><Text style={styles.copy}>{receipt ? 'Cảm ơn bạn. Đội ngũ B-Book sẽ xem xét phản hồi.' : 'Chia sẻ góp ý, lỗi gặp phải hoặc tính năng bạn mong muốn.'}</Text>
    {receipt ? <><Text selectable style={styles.copy}>Mã phản hồi: {receipt}</Text><TouchableOpacity style={styles.button} onPress={() => router.back()}><Text style={styles.buttonText}>Hoàn tất</Text></TouchableOpacity></> : <>
      {demo && <Text style={styles.error}>Tài khoản trải nghiệm không thể gửi feedback. Vui lòng dùng tài khoản cá nhân.</Text>}
      <Text style={styles.label}>Loại phản hồi</Text><View style={styles.categories}>{([['Suggestion', 'Góp ý'], ['Bug', 'Báo lỗi'], ['Other', 'Khác']] as const).map(([key, label]) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: category === key, disabled: busy || demo }} disabled={busy || demo} key={key} onPress={() => setCategory(key)} style={[styles.chip, category === key && styles.selected]}><Text style={styles.chipText}>{label}</Text></TouchableOpacity>)}</View>
      <Text style={styles.label}>Nội dung</Text><TextInput accessibilityLabel="Nội dung phản hồi" multiline maxLength={2000} editable={!busy && !demo} value={body} onChangeText={setBody} placeholder="Mô tả chi tiết góp ý hoặc các bước gặp lỗi…" placeholderTextColor={BrandColors.textMuted} style={styles.input} textAlignVertical="top" /><Text style={styles.count}>{body.length}/2.000 ký tự</Text>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Gửi phản hồi" accessibilityState={{ busy, disabled: busy || demo }} disabled={busy || demo} style={[styles.button, (busy || demo) && styles.disabled]} onPress={() => { void send(); }}>{busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Gửi phản hồi</Text>}</TouchableOpacity>
    </>}
    </View>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.bgPrimary }, flex: { flex: 1 },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }, title: { fontSize: 20, fontWeight: '700', color: BrandColors.textDark },
  content: { padding: 20, paddingTop: 4 }, card: { backgroundColor: '#FFF', borderRadius: 20, padding: 22, gap: 14 },
  heading: { fontSize: 22, fontWeight: '700', color: BrandColors.textDark }, copy: { fontSize: 14, lineHeight: 22, color: BrandColors.textBody },
  label: { fontSize: 14, fontWeight: '600', color: BrandColors.textDark, marginTop: 8 }, categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { borderWidth: 1, borderColor: '#EADDE3', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10 }, selected: { backgroundColor: BrandColors.bgPink, borderColor: BrandColors.accentPink }, chipText: { color: BrandColors.textDark },
  input: { minHeight: 170, borderWidth: 1, borderColor: '#EADDE3', borderRadius: 12, padding: 14, color: BrandColors.textDark, fontSize: 15, lineHeight: 22 }, count: { textAlign: 'right', color: BrandColors.textMuted, fontSize: 12 },
  error: { color: '#B34444', fontSize: 14, lineHeight: 22 }, button: { alignItems: 'center', justifyContent: 'center', minHeight: 50, borderRadius: 12, backgroundColor: BrandColors.accentPink, marginTop: 8 }, buttonText: { color: '#FFF', fontSize: 15, fontWeight: '700' }, disabled: { opacity: 0.5 },
});
