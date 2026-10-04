import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { api, getApiError } from '../../services/api';
import { AppAlert } from '../../components/ui/dialogStore';
type Report = { id: string; targetType: string; reason: string; status: string; description?: string; content?: string; canRemove?: boolean; decisionNote?: string; imageUrls?: string[]; hasPrivateImage?: boolean };
const labels: Record<string, string> = { Pending: 'Chờ xử lý', Reviewed: 'Đã xem xét', Dismissed: 'Không xác định vi phạm', Removed: 'Đã ẩn nội dung' };
export default function ModerationScreen() {
  const router = useRouter(); const cache = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null); const [status, setStatus] = useState('Pending'); const [page, setPage] = useState(1);
  const [note, setNote] = useState(''); const [busy, setBusy] = useState(false); const [image, setImage] = useState<string | null>(null);
  const list = useQuery<{ items: Report[]; total: number }>({ queryKey: ['admin-moderation', status, page], queryFn: async () => (await api.get('/admin/moderation/reports', { params: { status, page } })).data });
  const detail = useQuery<Report>({ queryKey: ['admin-moderation-detail', selected], enabled: !!selected, queryFn: async () => (await api.get(`/admin/moderation/reports/${selected}`)).data });
  async function decide(action: string) {
    if (!selected || busy || !note.trim()) return; setBusy(true);
    try { await api.post(`/admin/moderation/reports/${selected}/decision`, { action, note: note.trim() }); setNote(''); await cache.invalidateQueries({ queryKey: ['admin-moderation'] }); await detail.refetch(); }
    catch (err) { AppAlert.alert('Không thể xử lý', getApiError(err).message); } finally { setBusy(false); }
  }
  async function loadImage() {
    if (!selected || busy) return; setBusy(true);
    try { setImage((await api.get(`/admin/moderation/reports/${selected}/image`)).data.url); }
    catch (err) { AppAlert.alert('Không thể tải ảnh', getApiError(err).message); } finally { setBusy(false); }
  }
  const current = selected ? detail : list;
  return <SafeAreaView style={{ flex: 1, backgroundColor: 'white', padding: 20 }}><TouchableOpacity disabled={busy} onPress={() => { if (selected) { setSelected(null); setNote(''); setImage(null); } else router.back(); }}><Text>← Quay lại</Text></TouchableOpacity><Text style={{ fontSize: 24, fontWeight: '700', marginVertical: 20 }}>Báo cáo nội dung</Text>{current.isLoading ? <ActivityIndicator /> : current.error ? <TouchableOpacity onPress={() => current.refetch()}><Text>{getApiError(current.error).message} — Thử lại</Text></TouchableOpacity> : <ScrollView>{selected && detail.data ? <><Text>{detail.data.targetType} • {detail.data.reason} • {labels[detail.data.status]}</Text><Text style={{ marginVertical: 15 }}>{detail.data.description}</Text><Text>{detail.data.content || '(Không có văn bản)'}</Text>{detail.data.imageUrls?.map(url => <Image key={url} source={{ uri: url }} style={{ height: 240, marginVertical: 12 }} contentFit="contain" />)}{detail.data.hasPrivateImage && <TouchableOpacity disabled={busy} onPress={loadImage}><Text style={{ color: '#C71585', paddingVertical: 15 }}>Xem / Làm mới ảnh tin nhắn được báo cáo</Text></TouchableOpacity>}{image && <Image source={{ uri: image }} style={{ height: 240 }} contentFit="contain" />}{detail.data.status === 'Pending' ? <><TextInput multiline maxLength={1000} editable={!busy} value={note} onChangeText={setNote} placeholder="Căn cứ xử lý" style={{ borderWidth: 1, borderColor: '#ddd', padding: 12, marginVertical: 16 }} />{['Dismissed', 'Reviewed', ...(detail.data.canRemove ? ['Removed'] : [])].map(action => <TouchableOpacity key={action} disabled={busy || !note.trim()} style={{ padding: 15, opacity: busy || !note.trim() ? .5 : 1 }} onPress={() => AppAlert.alert('Xác nhận quyết định', labels[action], [{ text: 'Hủy', style: 'cancel' }, { text: 'Xác nhận', onPress: () => decide(action) }])}><Text>{labels[action]}</Text></TouchableOpacity>)}<Text>Không thay đổi booking hoặc tài chính.</Text></> : <Text style={{ marginTop: 20 }}>{detail.data.decisionNote}</Text>}</> : <><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{Object.entries(labels).map(([value, label]) => <TouchableOpacity key={value} onPress={() => { setStatus(value); setPage(1); }} style={{ padding: 10 }}><Text style={{ color: status === value ? '#C71585' : '#555' }}>{label}</Text></TouchableOpacity>)}</View>{!list.data?.items.length && <Text>Chưa có báo cáo.</Text>}{list.data?.items.map(row => <TouchableOpacity key={row.id} style={{ paddingVertical: 18, borderBottomWidth: 1, borderColor: '#eee' }} onPress={() => setSelected(row.id)}><Text>{row.targetType} • {row.reason}</Text><Text>{labels[row.status]} →</Text></TouchableOpacity>)}<View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20 }}><TouchableOpacity disabled={page === 1} onPress={() => setPage(p => p - 1)}><Text>Trước</Text></TouchableOpacity><Text>Trang {page}</Text><TouchableOpacity disabled={page * 20 >= (list.data?.total || 0)} onPress={() => setPage(p => p + 1)}><Text>Sau</Text></TouchableOpacity></View></>}</ScrollView>}</SafeAreaView>;
}
