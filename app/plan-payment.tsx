import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Svg, { Path, Rect } from 'react-native-svg';
import { toQR } from 'toqr';
import { appCommerce, commerceMessage, terminalOrder } from '../services/appCommerce';
import { useAuthStore } from '../store/useAuthStore';

const labels: Record<string, string> = { PaymentPending: 'Chờ thanh toán', PaidAwaitingFulfillment: 'Đã nhận tiền · Đang cấp quyền', Fulfilled: 'Đã hoàn tất', ManualReview: 'Giao dịch cần được hỗ trợ kiểm tra', Cancelled: 'Đơn đã hủy hoặc hết hạn', Refunded: 'Đã ghi nhận hoàn tiền', Revoked: 'Quyền đã thu hồi' };

export default function PlanPaymentScreen() {
  const user = useAuthStore(state => state.user);
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = typeof params.id === 'string' ? params.id : '';
  return <PaymentBody key={`${user?.id}:${id}`} owner={user?.id} demo={user?.isDemoAccount === true} id={id} />;
}

function PaymentBody({ owner, demo, id }: { owner?: string; demo: boolean; id: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const svg = useRef<Svg>(null);
  const [notice, setNotice] = useState('');
  const [sharing, setSharing] = useState(false);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [now, setNow] = useState(Date.now());
  const started = useRef(Date.now());
  const enabled = !!owner && !demo && /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(id);
  const key = ['app-commerce-order', owner, id] as const;
  const query = useQuery({ queryKey: key, queryFn: () => appCommerce.order(owner!, id), enabled, retry: 1,
    refetchInterval: state => active && Date.now() - started.current < 300_000 && (!state.state.data || ['PaymentPending', 'PaidAwaitingFulfillment'].includes(state.state.data.state)) ? 5000 : false,
    refetchIntervalInBackground: false });
  const sync = useMutation({ mutationFn: () => appCommerce.order(owner!, id, true), onSuccess: data => {
    if (useAuthStore.getState().user?.id === owner) client.setQueryData(key, data);
  } });
  const syncRef = useRef(sync);
  syncRef.current = sync;
  const order = query.data;
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      setActive(state === 'active');
      if (state === 'active' && enabled && !syncRef.current.isPending) { started.current = Date.now(); syncRef.current.mutate(); }
    });
    return () => listener.remove();
  }, [enabled]);
  useEffect(() => {
    if (!active || !enabled || order && (terminalOrder(order.state) || order.state === 'ManualReview')) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const reconcile = setInterval(() => {
      if (Date.now() - started.current < 300_000 && !syncRef.current.isPending) syncRef.current.mutate();
    }, 30_000);
    return () => { clearInterval(tick); clearInterval(reconcile); };
  }, [active, enabled, order?.state]);
  useEffect(() => {
    if (!owner || !order || !['Fulfilled', 'Revoked', 'Refunded'].includes(order.state)) return;
    for (const queryKey of [['account-plans', owner], ['customer-ai-access', owner], ['mua-monetization', owner], ['app-commerce-catalog', owner], ['sponsored-muas'], ['mua']]) void client.invalidateQueries({ queryKey });
  }, [owner, order?.state, client]);

  const expired = !!order && new Date(order.expiresAt).getTime() <= now;
  const payment = order?.state === 'PaymentPending' && !expired && !query.isError && !sync.isError ? order.payment : null;
  const qr = useMemo(() => {
    if (!payment?.qrCode) return null;
    try {
      const cells = toQR(payment.qrCode); const side = Math.sqrt(cells.length);
      let path = '';
      for (let i = 0; i < cells.length; i++) if (cells[i]) path += `M${i % side + 4},${Math.floor(i / side) + 4}h1v1h-1z`;
      return { side: side + 8, path };
    } catch { return null; }
  }, [payment?.qrCode]);
  async function copy(value: string) {
    try { await Clipboard.setStringAsync(value); setNotice('Đã sao chép.'); }
    catch { setNotice('Chưa sao chép được. Bạn có thể nhấn giữ thông tin để sao chép.'); }
  }
  async function shareQr() {
    if (!svg.current || sharing) return;
    setSharing(true); setNotice('');
    let file: string | undefined;
    try {
      if (!await Sharing.isAvailableAsync() || !FileSystem.cacheDirectory) throw new Error('Thiết bị chưa hỗ trợ chia sẻ ảnh QR.');
      const image = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Chưa tạo được ảnh QR.')), 10_000);
        svg.current!.toDataURL(value => { clearTimeout(timeout); resolve(value); });
      });
      file = `${FileSystem.cacheDirectory}bbook-payment-${id}.png`;
      await FileSystem.writeAsStringAsync(file, image, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(file, { mimeType: 'image/png', dialogTitle: 'Lưu hoặc chia sẻ QR thanh toán', UTI: 'public.png' });
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Chưa chia sẻ được ảnh QR.'); }
    finally { if (file) await FileSystem.deleteAsync(file, { idempotent: true }).catch(() => {}); setSharing(false); }
  }
  const pending = query.isFetching || sync.isPending;
  return <SafeAreaView style={s.page}>
    <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.back()} style={s.back}><Text style={s.backText}>‹</Text></Pressable><Text style={s.title}>Thanh toán gói</Text></View>
    <ScrollView contentContainerStyle={s.body}>
      {!enabled && <Text style={s.error}>Đơn không hợp lệ hoặc tài khoản chưa được đăng nhập.</Text>}
      {query.isPending && enabled && <ActivityIndicator accessibilityLabel="Đang tải đơn thanh toán" />}
      {(query.isError || sync.isError) && <Text accessibilityRole="alert" style={s.error}>{commerceMessage(sync.error || query.error)} Dữ liệu đang hiển thị có thể chưa cập nhật; không chuyển khoản lại nếu đã trả tiền.</Text>}
      {order && <View style={s.card}>
        <Text style={s.title}>{order.productId === 'bbook_customer_ai_lifetime_v1' ? 'AI quét mặt vĩnh viễn' : 'Quảng bá MUA 30 ngày'}</Text>
        <Text style={s.price}>{order.amountVnd.toLocaleString('vi-VN')}đ</Text>
        <Text accessibilityLiveRegion="polite" style={s.status}>{labels[order.state] || 'Đang cập nhật'}</Text>
        <Text selectable style={s.note}>Mã đơn: {order.id}</Text>
        {payment && <>
          {qr ? <View style={s.qr}><Svg ref={svg} width={260} height={260} viewBox={`0 0 ${qr.side} ${qr.side}`} accessibilityLabel="QR thanh toán payOS"><Rect width={qr.side} height={qr.side} fill="#fff" /><Path d={qr.path} fill="#000" /></Svg></View> : <Text style={s.error}>Chưa hiển thị được QR. Vui lòng kiểm tra lại đơn.</Text>}
          {qr && <Pressable accessibilityRole="button" disabled={sharing} onPress={() => void shareQr()} style={s.secondary}><Text style={s.action}>{sharing ? 'Đang tạo ảnh…' : 'Lưu / chia sẻ ảnh QR'}</Text></Pressable>}
          <Text style={s.note}>Quét QR từ ứng dụng ngân hàng trên thiết bị khác, hoặc lưu ảnh rồi chọn ảnh QR trong ngân hàng của bạn. Kiểm tra đúng người nhận, số tiền và nội dung trước khi chuyển.</Text>
          <Text selectable style={s.note}>Ngân hàng (BIN): {payment.bankBin}</Text><Text selectable style={s.title}>{payment.accountName}</Text>
          <Pressable accessibilityRole="button" onPress={() => void copy(payment.accountNumber)} style={s.secondary}><Text selectable style={s.action}>Tài khoản: {payment.accountNumber} · Sao chép</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => void copy(payment.description)} style={s.secondary}><Text selectable style={s.action}>Nội dung: {payment.description} · Sao chép</Text></Pressable>
          <Text style={s.note}>Hạn thanh toán: {new Date(order.expiresAt).toLocaleString('vi-VN')}</Text>
        </>}
        {order.state === 'PaymentPending' && !payment && <Text style={s.note}>{expired ? 'Đã qua hạn thanh toán. Không chuyển khoản theo QR cũ; hãy kiểm tra lại trạng thái đơn.' : 'Chưa có QR để thanh toán. Hệ thống đang chuẩn bị hoặc tạm dừng thanh toán. Hãy kiểm tra lại; nếu đây là đơn cũ trên website, đợi đơn hết hạn trước khi tạo đơn mới.'}</Text>}
        {order.state === 'Fulfilled' && <Text style={s.note}>Quyền lợi đã được ghi nhận theo tài khoản. Bạn có thể quay lại sử dụng.</Text>}
        {order.state === 'PaidAwaitingFulfillment' && <Text style={s.note}>Đã xác minh tiền. Hệ thống đang cấp quyền; không thanh toán thêm.</Text>}
        {order.state === 'ManualReview' && <Text style={s.note}>Giữ mã đơn và liên hệ bbooksupport@gmail.com để được hỗ trợ. Không thanh toán lại.</Text>}
      </View>}
      {enabled && <Pressable accessibilityRole="button" accessibilityState={{ disabled: pending, busy: pending }} disabled={pending} onPress={() => { started.current = Date.now(); sync.mutate(); }} style={[s.button, pending && s.disabled]}><Text style={s.buttonText}>{pending ? 'Đang kiểm tra…' : 'Kiểm tra thanh toán'}</Text></Pressable>}
      {!!notice && <Text accessibilityLiveRegion="polite" style={s.note}>{notice}</Text>}
      <Text style={s.note}>Đóng màn hình không hủy đơn. Bạn có thể mở lại trong lịch sử giao dịch. BBook chỉ cấp quyền khi máy chủ xác minh thanh toán.</Text>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({ page: { flex: 1, backgroundColor: '#FFF9FB' }, header: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, backText: { fontSize: 34, color: '#A82E62' }, title: { fontSize: 19, fontWeight: '700', color: '#2B1B2A' }, body: { padding: 20, paddingBottom: 48, gap: 16 }, card: { backgroundColor: '#fff', padding: 20, borderWidth: 1, borderColor: '#EED4DF', borderRadius: 16, gap: 14 }, price: { fontSize: 28, fontWeight: '700', color: '#A82E62' }, status: { color: '#A82E62', fontSize: 16, lineHeight: 24 }, note: { color: '#75646d', lineHeight: 22, fontSize: 14 }, qr: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: 12 }, action: { color: '#A82E62', lineHeight: 23 }, secondary: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#EED4DF', minHeight: 48 }, button: { padding: 16, backgroundColor: '#C42A64', alignItems: 'center', borderRadius: 12 }, buttonText: { color: '#fff', fontWeight: '700' }, disabled: { opacity: .5 }, error: { color: '#9D3140', lineHeight: 22 } });
