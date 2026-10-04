import React, { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppBottomSheet } from '../ui/AppBottomSheet';
import { AppAlert } from '../ui/dialogStore';
import { getApiError } from '../../services/api';
import { moderationService, type ReportTarget } from '../../services/moderationService';
import { useAuthStore } from '../../store/useAuthStore';
const reasons = { Harassment: 'Quấy rối', Inappropriate: 'Nội dung không phù hợp', Spam: 'Spam', Fraud: 'Lừa đảo', Other: 'Khác' };
export function ReportSheet({ target, onClose }: { target: ReportTarget | null; onClose: () => void }) {
  const demo = useAuthStore(state => state.user?.isDemoAccount === true);
  const [reason, setReason] = useState('Inappropriate'); const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false); const submitting = useRef(false);
  async function submit() {
    if (!target || submitting.current) return;
    submitting.current = true; setBusy(true);
    try { await moderationService.report(target, reason, description.trim()); setDescription(''); onClose(); AppAlert.alert(demo ? 'Đã ghi nhận báo cáo mẫu' : 'Đã gửi báo cáo', demo ? 'Báo cáo mẫu được quản lý riêng, không đưa vào hàng đợi kiểm duyệt người dùng thật.' : 'Bạn có thể chặn người dùng để ngừng tương tác mới trong lúc chờ xem xét.'); }
    catch (error) { AppAlert.alert('Không thể gửi báo cáo', getApiError(error).message); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <AppBottomSheet visible={!!target} title="Báo cáo nội dung" loading={busy} onClose={onClose}><ScrollView keyboardShouldPersistTaps="handled"><Text>Chọn lý do:</Text>{Object.entries(reasons).map(([value, label]) => <TouchableOpacity key={value} disabled={busy} onPress={() => setReason(value)} accessibilityRole="radio" accessibilityState={{ checked: reason === value }} style={{ paddingVertical: 12 }}><Text>{reason === value ? '●' : '○'} {label}</Text></TouchableOpacity>)}<TextInput accessibilityLabel="Mô tả báo cáo" multiline maxLength={1000} value={description} editable={!busy} onChangeText={setDescription} placeholder="Mô tả thêm (không nhập mật khẩu hoặc thông tin ngân hàng)" style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, minHeight: 90 }} /><View style={{ paddingVertical: 16 }}><TouchableOpacity disabled={busy} onPress={() => { void submit(); }} accessibilityRole="button" style={{ backgroundColor: '#C71585', padding: 14, borderRadius: 14, alignItems: 'center' }}>{busy ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Gửi báo cáo</Text>}</TouchableOpacity></View></ScrollView></AppBottomSheet>;
}
