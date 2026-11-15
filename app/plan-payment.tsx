import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appCommerce, commerceMessage, terminalOrder } from '../services/appCommerce';
import { useAuthStore } from '../store/useAuthStore';

const labels: Record<string, string> = { PaymentPending: 'Chờ thanh toán', PaidAwaitingFulfillment: 'Đã nhận tiền · Đang cấp quyền', Fulfilled: 'Đã hoàn tất', ManualReview: 'Giao dịch cần được hỗ trợ kiểm tra', Cancelled: 'Đơn đã hủy hoặc hết hạn', Refunded: 'Đã ghi nhận hoàn tiền', Revoked: 'Quyền đã thu hồi' };
export default function PlanPaymentScreen() {
  const user = useAuthStore(state => state.user);
  const params = useLocalSearchParams<{ id?: string; open?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  return <PaymentBody key={String(user?.id) + ':' + id} owner={user?.id} demo={user?.isDemoAccount === true} id={id} autoOpen={params.open === '1'} />;
}
function PaymentBody({ owner, demo, id, autoOpen }: { owner?: string; demo: boolean; id: string; autoOpen: boolean }) {
  const router = useRouter(); const client = useQueryClient();
  const [notice, setNotice] = useState(''); const [opening, setOpening] = useState(false);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [now, setNow] = useState(() => Date.now());
  const started = useRef(now); const opened = useRef(false); const openingLock = useRef(false);
  const enabled = !!owner && !demo && /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(id);
  const key = ['app-commerce-order', owner, id] as const;
  const query = useQuery({ queryKey: key, queryFn: () => appCommerce.order(owner!, id), enabled, retry: 1,
    refetchInterval: state => active && Date.now() - started.current < 300000 && (!state.state.data || ['PaymentPending', 'PaidAwaitingFulfillment'].includes(state.state.data.state)) ? 5000 : false,
    refetchIntervalInBackground: false });
  const sync = useMutation({ mutationFn: () => appCommerce.order(owner!, id, true), onSuccess: data => {
    if (useAuthStore.getState().user?.id === owner) client.setQueryData(key, data);
  } });
  const syncRef = useRef(sync);
  useEffect(() => { syncRef.current = sync; }, [sync]);
  const order = query.data;
  const state = order?.state;
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      setActive(state === 'active');
      if (state === 'active' && enabled && !syncRef.current.isPending) { started.current = Date.now(); syncRef.current.mutate(); }
    }); return () => listener.remove();
  }, [enabled]);
  useEffect(() => {
    if (!active || !enabled || state && (terminalOrder(state) || state === 'ManualReview')) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const interval = setInterval(() => { if (Date.now() - started.current < 300000 && !syncRef.current.isPending) syncRef.current.mutate(); }, 30000);
    return () => { clearInterval(tick); clearInterval(interval); };
  }, [active, enabled, state]);
  useEffect(() => {
    if (!owner || !order || !['Fulfilled', 'Revoked', 'Refunded'].includes(order.state)) return;
    for (const queryKey of [['account-plans', owner], ['customer-ai-access', owner], ['mua-monetization', owner], ['app-commerce-catalog', owner], ['sponsored-muas']]) void client.invalidateQueries({ queryKey });
  }, [owner, order, client]);
  const expired = !!order && (!Number.isFinite(new Date(order.expiresAt).getTime()) || new Date(order.expiresAt).getTime() <= now);
  const canOpen = enabled && !!order?.checkoutUrl && order.state === 'PaymentPending' && !expired && !query.isError && !sync.isError;
  const openCheckout = useCallback(async () => {
    if (!canOpen || !owner || !order || openingLock.current) return;
    openingLock.current = true; setOpening(true); setNotice('');
    try { await appCommerce.openCheckout(owner, order); if (useAuthStore.getState().user?.id === owner) { started.current = Date.now(); syncRef.current.mutate(); } }
    catch (error) { setNotice(commerceMessage(error)); }
    finally { openingLock.current = false; setOpening(false); }
  }, [canOpen, owner, order]);
  useEffect(() => { if (autoOpen && canOpen && !opened.current) { opened.current = true; void openCheckout(); } }, [autoOpen, canOpen, openCheckout]);
  const busy = query.isFetching || sync.isPending;
  return <SafeAreaView style={s.page}>
    <View style={s.header}><Pressable accessibilityLabel="Quay lại" onPress={() => router.back()} style={s.back}><Text style={s.backText}>‹</Text></Pressable><Text style={s.title}>Thanh toán gói</Text></View>
    <ScrollView contentContainerStyle={s.body}>
      {!enabled && <Text style={s.note}>Mở đơn từ lịch sử giao dịch của tài khoản đã đăng nhập.</Text>}
      {enabled && query.isPending && <ActivityIndicator accessibilityLabel="Đang tải đơn" />}
      {(query.isError || sync.isError) && <Text accessibilityRole="alert" style={s.error}>{commerceMessage(query.error || sync.error)}</Text>}
      {order && <View style={s.card}>
        <Text style={s.price}>{order.amountVnd.toLocaleString('vi-VN')}đ</Text><Text style={s.status}>{labels[order.state] || 'Đang cập nhật'}</Text><Text selectable style={s.note}>Mã đơn: {order.id}</Text>
        {order.state === 'PaymentPending' && <>
          <Text style={s.note}>{expired ? 'Đã qua hạn thanh toán. Hãy kiểm tra trạng thái trước khi tạo đơn mới.' : 'Thanh toán trên trang payOS. Bạn có thể quét mã QR hoặc làm theo hướng dẫn tại đó.'}</Text>
          {canOpen ? <Pressable accessibilityRole="button" disabled={opening} onPress={() => void openCheckout()} style={s.button}><Text style={s.buttonText}>{opening ? 'Đang mở payOS…' : 'Thanh toán qua payOS'}</Text></Pressable> : !expired && !query.isError && !sync.isError ? <Text style={s.note}>Đang chuẩn bị đường dẫn thanh toán payOS…</Text> : null}
        </>}
        {order.state === 'Fulfilled' && <Text style={s.note}>Thanh toán đã được xác nhận. Quyền lợi đã được mở cho tài khoản của bạn.</Text>}
        {order.state === 'PaidAwaitingFulfillment' && <Text style={s.note}>Đã nhận tiền và đang cấp quyền. Không thanh toán thêm.</Text>}
        {order.state === 'ManualReview' && <Text style={s.note}>Giữ mã đơn và liên hệ bbooksupport@gmail.com để được hỗ trợ. Không thanh toán lại.</Text>}
      </View>}
      {enabled && <Pressable accessibilityRole="button" disabled={busy} onPress={() => { started.current = Date.now(); sync.mutate(); }} style={[s.button, busy && s.disabled]}><Text style={s.buttonText}>{busy ? 'Đang kiểm tra…' : 'Kiểm tra thanh toán'}</Text></Pressable>}
      {!!notice && <Text accessibilityRole="alert" style={s.error}>{notice}</Text>}
      <Text style={s.note}>Quay lại app sau khi thanh toán để cập nhật quyền lợi. Đóng trang payOS không tự hủy đơn; bạn có thể mở lại trong lịch sử giao dịch.</Text>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({ page: { flex: 1, backgroundColor: '#FFF8FB' }, header: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, backText: { fontSize: 34, color: '#A82E62' }, title: { fontSize: 19, fontWeight: '700', color: '#2B1B2A' }, body: { padding: 20, paddingBottom: 48, gap: 16 }, card: { backgroundColor: '#fff', padding: 20, borderWidth: 1, borderColor: '#F1D7E3', borderRadius: 25, gap: 14 }, price: { fontSize: 32, fontWeight: '800', color: '#C42C68' }, status: { color: '#A82E62', fontSize: 16, lineHeight: 24 }, note: { color: '#75646d', lineHeight: 22, fontSize: 14 }, button: { padding: 16, backgroundColor: '#C42C68', alignItems: 'center', borderRadius: 18 }, buttonText: { color: '#fff', fontWeight: '700' }, disabled: { opacity: .5 }, error: { color: '#9D3140', lineHeight: 22 } });
