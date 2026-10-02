import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';
import { complaintService } from '../../../services/complaintService';
import { getApiError } from '../../../services/api';

import { complaintCategories, complaintLabels } from '../../../types/complaint';

const money = (value: number) => `${value.toLocaleString('vi-VN')}đ`;
const time = (value?: string) => value ? new Date(value).toLocaleString('vi-VN') : '';
const refundState = (value: number | string) => ({ 0: 'Chờ xử lý', 1: 'Chờ chuyển tiền', 2: 'Đang hoàn tiền', 3: 'Đã hoàn tiền', 4: 'Hoàn tiền chưa thành công', 5: 'Cần tài khoản nhận hoàn tiền', Completed: 'Đã hoàn tiền', AwaitingDestination: 'Cần tài khoản nhận hoàn tiền' }[String(value)] || 'Đang xử lý hoàn tiền');

export default function ComplaintScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter(); const cache = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>(); const [newForm, setNewForm] = useState(false);
  const [category, setCategory] = useState('Quality'); const [outcome, setOutcome] = useState('Support');
  const [amount, setAmount] = useState(''); const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [error, setError] = useState(''); const [preview, setPreview] = useState<string>();
  const overview = useQuery({ queryKey: ['complaints', id], queryFn: async () => ({ eligibility: await complaintService.eligibility(id), history: await complaintService.list(id) }), enabled: !!id, retry: false });
  const complaintId = selectedId || overview.data?.history[0]?.id;
  const detail = useQuery({ queryKey: ['complaint-detail', complaintId], queryFn: () => complaintService.detail(complaintId!), enabled: !!complaintId && !newForm, retry: false, refetchInterval: q => q.state.data?.isOpen || (q.state.data?.refund && ![3, 'Completed'].includes(q.state.data.refund.status)) ? 20000 : false });
  const { refetch: refetchOverview } = overview; const { refetch: refetchDetail } = detail;
  useFocusEffect(useCallback(() => { void refetchOverview(); if (complaintId && !newForm) void refetchDetail(); }, [refetchOverview, refetchDetail, complaintId, newForm]));
  const creating = newForm || (!complaintId && !!overview.data?.eligibility.canCreateComplaint);
  const canWrite = creating || detail.data?.isOpen === true;

  async function submit() {
    if (lock.current || !canWrite) return;
    setError('');
    if (body.trim().length < (creating ? 10 : 1)) { setError(creating ? 'Mô tả vấn đề cần ít nhất 10 ký tự.' : 'Vui lòng nhập nội dung phản hồi.'); return; }
    const requested = Number(amount);
    if (creating && outcome === 'PartialRefund' && (!Number.isFinite(requested) || requested <= 0 || requested > (overview.data?.eligibility.paidAmount || 0))) { setError('Số tiền yêu cầu không được vượt khoản đã thanh toán qua B-Book.'); return; }
    lock.current = true; setBusy(true);
    try {
      const urls: string[] = [];
      if (creating) {
        const result = await complaintService.create(id, { category, description: body.trim(), requestedOutcome: outcome, requestedAmount: outcome === 'PartialRefund' ? requested : undefined, imageUrls: urls });
        setSelectedId(result.id); setNewForm(false);
      } else await complaintService.message(complaintId!, { body: body.trim(), imageUrls: urls });
      setBody('');
      await Promise.all([cache.invalidateQueries({ queryKey: ['complaints', id] }), cache.invalidateQueries({ queryKey: ['complaint-detail'] }), cache.invalidateQueries({ queryKey: ['bookingDetail', id] }), cache.invalidateQueries({ queryKey: ['userBookings'] }), cache.invalidateQueries({ queryKey: ['mua-bookings'] }), cache.invalidateQueries({ queryKey: ['mua-earnings'] })]);
    } catch (err) { setError(getApiError(err).message || 'Chưa gửi được hồ sơ. Vui lòng thử lại.'); void overview.refetch(); }
    finally { lock.current = false; setBusy(false); }
  }
  function select(value: string) { if (busy) return; setSelectedId(value); setNewForm(false); setBody(''); setError(''); }
  const c = detail.data;
  return <SafeAreaView style={s.screen}>
    <View style={s.header}><TouchableOpacity accessibilityLabel="Quay lại" onPress={() => router.back()} disabled={busy}><ArrowLeft size={24} color="#302330" /></TouchableOpacity><Text style={s.heading}>Hỗ trợ & Khiếu nại</Text><View style={{ width: 24 }} /></View>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.muted}>Booking #{id?.slice(0, 8).toUpperCase()}</Text>
        {overview.isLoading ? <ActivityIndicator color="#EF3D80" /> : overview.isError ? <View style={s.card}><Text style={s.error}>{getApiError(overview.error).message}</Text><TouchableOpacity onPress={() => overview.refetch()}><Text style={s.link}>Thử lại</Text></TouchableOpacity></View> : <>
          {!!overview.data?.history.length && <View style={s.card}><Text style={s.title}>Hồ sơ đã gửi</Text>{overview.data.history.map(item => <TouchableOpacity disabled={busy} key={item.id} onPress={() => select(item.id)} style={[s.history, complaintId === item.id && !newForm && s.selected]}><Text style={s.text}>{complaintLabels[item.status] || item.status}</Text><Text style={s.muted}>{time(item.createdAt)}</Text></TouchableOpacity>)}
            {overview.data.eligibility.canCreateComplaint && !creating && <TouchableOpacity disabled={busy} onPress={() => { setNewForm(true); setBody(''); setError(''); }}><Text style={s.link}>+ Báo vấn đề khác</Text></TouchableOpacity>}</View>}
          {creating ? <>
            <View style={s.card}><Text style={s.title}>Báo vấn đề với booking</Text><Text style={s.muted}>B-Book tiếp nhận thông tin và đối chiếu với MUA trước khi đưa ra quyết định.</Text>
              {!!overview.data?.eligibility.complaintDeadline && <Text style={s.muted}>Hạn gửi: {time(overview.data.eligibility.complaintDeadline)}</Text>}
              <Text style={s.label}>Loại vấn đề *</Text><View style={s.chips}>{Object.entries(complaintCategories).map(([key, label]) => <TouchableOpacity disabled={busy} key={key} style={[s.chip, category === key && s.selected]} onPress={() => setCategory(key)}><Text style={s.text}>{label}</Text></TouchableOpacity>)}</View>
              <Text style={s.label}>Bạn mong muốn được hỗ trợ thế nào?</Text>{[['Support', 'Hỗ trợ giải quyết'], ['PartialRefund', 'Hoàn một phần'], ['FullRefund', 'Hoàn toàn bộ khoản đã thanh toán']].map(([key, label]) => <TouchableOpacity key={key} disabled={busy} onPress={() => setOutcome(key)} style={[s.choice, outcome === key && s.selected]}><Text style={s.text}>{outcome === key ? '●' : '○'} {label}</Text></TouchableOpacity>)}
              <Text style={s.muted}>Đã thanh toán qua B-Book: {money(overview.data?.eligibility.paidAmount || 0)}. Khoản thanh toán trực tiếp cho MUA cần admin đối soát riêng.</Text>
              {outcome === 'PartialRefund' && <TextInput editable={!busy} style={s.input} keyboardType="number-pad" value={amount} onChangeText={text => setAmount(text.replace(/\D/g, ''))} placeholder="Số tiền muốn hoàn (VND)" maxLength={12} />}
            </View>
          </> : complaintId ? detail.isLoading ? <ActivityIndicator color="#EF3D80" /> : detail.isError ? <View style={s.card}><Text style={s.error}>{getApiError(detail.error).message}</Text><TouchableOpacity onPress={() => detail.refetch()}><Text style={s.link}>Tải lại hồ sơ</Text></TouchableOpacity></View> : c && <>
            <View style={s.card}><Text style={s.title}>{complaintLabels[c.status] || c.status}</Text><Text style={s.muted}>{complaintCategories[c.category]} • {time(c.createdAt)}</Text><Text style={s.text}>{c.booking.customerName} ↔ {c.booking.muaName}</Text>
              {c.requestedAmount != null && <Text style={s.text}>Yêu cầu hoàn: {money(c.requestedAmount)}</Text>}
              {c.isOpen && <Text style={s.muted}>Hồ sơ đang được xử lý. Bạn có thể bổ sung nội dung và bằng chứng bên dưới.</Text>}
              {!!c.responseDeadline && <Text style={s.muted}>Hạn phản hồi đề xuất: {time(c.responseDeadline)}</Text>}
              {!!c.decisionReason && <View style={s.decision}><Text style={s.label}>Quyết định của Admin</Text><Text style={s.text}>{c.decisionReason}</Text></View>}
              {c.needsFinancialReconciliation && <Text style={s.muted}>Khoản chi trả cần admin đối soát trước khi xử lý hoàn tiền.</Text>}
              {!!c.refund && <View style={s.decision}><Text style={s.title}>{refundState(c.refund.status)}</Text><Text style={s.text}>Số tiền: {money(c.refund.amount)}</Text>{c.viewerRole === 'Customer' && (c.refund.status === 5 || c.refund.status === 'AwaitingDestination') && <TouchableOpacity onPress={() => router.push({ pathname: '/refund-destination', params: { refundId: c.refund!.refundId, bookingId: id } })}><Text style={s.link}>Thiết lập tài khoản nhận hoàn tiền →</Text></TouchableOpacity>}</View>}
            </View>
            <View style={s.card}><Text style={s.title}>Lịch sử xử lý</Text>{c.messages.map(message => <View key={message.id} style={s.event}><Text style={s.label}>{message.authorRole === 'Customer' ? 'Khách hàng' : message.authorRole === 'MUA' ? 'Makeup Artist' : 'Admin'}</Text><Text style={s.muted}>{time(message.createdAt)}</Text><Text style={s.text}>{message.body}</Text></View>)}</View>
          </> : <View style={s.card}><Text style={s.text}>{overview.data?.eligibility.unavailableReason || 'Chưa có hồ sơ khiếu nại.'}</Text></View>}
          {canWrite && (creating || !detail.isError) && <View style={s.card}><Text style={s.title}>{creating ? 'Mô tả vấn đề *' : c?.viewerRole === 'MUA' ? 'Phản hồi / Giải trình' : 'Bổ sung thông tin'}</Text>
            <TextInput editable={!busy} multiline maxLength={2000} style={[s.input, s.textarea]} value={body} onChangeText={setBody} placeholder={creating ? 'Mô tả điều đã xảy ra, thời điểm và mong muốn của bạn...' : 'Nhập phản hồi hoặc thông tin bổ sung...'} /><Text style={s.counter}>{body.length}/2000</Text>
            <Text style={s.muted}>Ảnh bằng chứng đang tạm ngưng để bảo vệ dữ liệu riêng tư. Bạn vẫn có thể gửi nội dung văn bản.</Text>

            <TouchableOpacity disabled={busy || !body.trim()} style={[s.primary, (busy || !body.trim()) && s.disabled]} onPress={submit}><Text style={s.primaryText}>{busy ? 'Đang gửi...' : creating ? 'Gửi khiếu nại' : 'Gửi phản hồi'}</Text></TouchableOpacity>
          </View>}
        </>}
        {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
    <Modal visible={!!preview} transparent onRequestClose={() => setPreview(undefined)}><View style={s.preview}><TouchableOpacity style={s.closePreview} onPress={() => setPreview(undefined)}><Text style={s.primaryText}>Đóng ×</Text></TouchableOpacity><Image source={preview} style={{ width: '100%', height: '80%' }} contentFit="contain" /></View></Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FFF7FA' }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 }, heading: { fontSize: 18, fontWeight: '700', color: '#302330' }, content: { padding: 18, gap: 16, paddingBottom: 50 }, card: { padding: 18, backgroundColor: '#FFF', borderRadius: 20, gap: 12 }, title: { fontSize: 17, fontWeight: '700', color: '#302330' }, label: { fontSize: 14, fontWeight: '600', color: '#302330', marginTop: 6 }, text: { fontSize: 14, lineHeight: 22, color: '#302330' }, muted: { fontSize: 12, lineHeight: 19, color: '#857580' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { padding: 10, borderWidth: 1, borderColor: '#EADCE4', borderRadius: 18 }, selected: { borderColor: '#EF3D80', backgroundColor: '#FFE7F0' }, choice: { padding: 12, borderWidth: 1, borderColor: '#EADCE4', borderRadius: 12 }, input: { borderWidth: 1, borderColor: '#EADCE4', padding: 12, borderRadius: 12, fontSize: 14, color: '#302330' }, textarea: { minHeight: 130, textAlignVertical: 'top' }, counter: { textAlign: 'right', color: '#857580', fontSize: 12 }, images: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, thumbnail: { width: 82, height: 100, borderRadius: 10, backgroundColor: '#F4E8EF' }, remove: { position: 'absolute', right: 2, top: 2, width: 25, height: 25, borderRadius: 13, backgroundColor: '#796B76', alignItems: 'center', justifyContent: 'center' }, row: { flexDirection: 'row', gap: 10 }, secondary: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#FFF0F5', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }, link: { color: '#B92063', fontWeight: '600', fontSize: 13 }, primary: { padding: 16, backgroundColor: '#EF3D80', borderRadius: 16, alignItems: 'center', marginTop: 6 }, primaryText: { color: '#FFF', fontWeight: '700' }, disabled: { opacity: .45 }, error: { color: '#AF304D', fontSize: 14, lineHeight: 21 }, event: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2E5EC', gap: 7 }, decision: { backgroundColor: '#FFF0F5', borderRadius: 12, padding: 12, gap: 8 }, history: { borderWidth: 1, borderColor: '#EADCE4', borderRadius: 12, padding: 12, gap: 5 }, preview: { flex: 1, backgroundColor: '#181019EE', justifyContent: 'center' }, closePreview: { alignSelf: 'flex-end', padding: 22 } });
