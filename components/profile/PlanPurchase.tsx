import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppCommerce } from '../../hooks/useAppCommerce';
import { appCommerce, commerceMessage } from '../../services/appCommerce';
import { useAuthStore } from '../../store/useAuthStore';

export function PlanPurchase() {
  const catalog = useAppCommerce();
  const owner = useAuthStore(state => state.user?.id);
  return <PurchaseBody key={owner} owner={owner} catalog={catalog} />;
}
function PurchaseBody({ owner, catalog }: { owner?: string; catalog: ReturnType<typeof useAppCommerce> }) {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const data = catalog.data;
  async function buy(productId: string) {
    if (!owner || !data?.checkoutEnabled || !consent || submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const id = await appCommerce.buy(owner, productId, data.termsVersion, data.role === 'MUA');
      if (useAuthStore.getState().user?.id === owner) router.push({ pathname: '/plan-payment', params: { id } } as never);
    } catch (failure) { setError(commerceMessage(failure)); void catalog.refetch(); }
    finally { submitting.current = false; setBusy(false); }
  }
  if (catalog.isPending) return <ActivityIndicator accessibilityLabel="Đang tải gói đăng ký" />;
  if (catalog.isError) return <View style={s.card}><Text>Chưa tải được gói đăng ký.</Text><Pressable accessibilityRole="button" onPress={() => void catalog.refetch()}><Text style={s.action}>Thử lại</Text></Pressable></View>;
  if (!data?.enabled) return null;
  const reasons: Record<string, string> = { ALREADY_PURCHASED: 'Bạn đã sở hữu AI vĩnh viễn.', MANUAL_REVIEW: 'Giao dịch đang được kiểm tra. Không cần thanh toán thêm.', MUA_NOT_ELIGIBLE: 'Hoàn thiện hồ sơ MUA và chờ duyệt để đăng ký quảng bá.', CHECKOUT_DISABLED: 'Đăng ký gói hiện chưa mở.' };
  return <View style={s.card}>
    {data.products.map(product => <View key={product.id} style={s.content}>
      <Text style={s.title}>{product.name}</Text><Text style={s.price}>{product.amountVnd.toLocaleString('vi-VN')}đ / {product.days ? `${product.days} ngày` : 'vĩnh viễn'}</Text>
      <Text style={s.note}>{data.role === 'MUA' ? 'Quảng bá luân phiên trong Khám phá và một bài Facebook BBook mỗi chu kỳ. Mua thêm nối tiếp thời hạn. Không cam kết số booking; bài Facebook do BBook biên tập và đăng.' : 'Quyền AI gắn với tài khoản BBook, thanh toán một lần và không tự gia hạn.'}</Text>
      {data.role === 'MUA' && <Text style={s.note}>Bài Facebook dự kiến trong 3 ngày làm việc từ đầu chu kỳ; hỗ trợ một lần chỉnh sửa. Liên hệ bbooksupport@gmail.com khi cần kiểm tra hoặc hỗ trợ hoàn tiền.</Text>}
      {data.checkoutEnabled ? <>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent, disabled: busy }} disabled={busy} onPress={() => setConsent(value => !value)} style={s.consent}>
          <Text style={s.action}>{consent ? '☑' : '☐'} Tôi đồng ý mua gói với mức giá trên{data.role === 'MUA' ? ' và cho BBook sử dụng portfolio để quảng bá trong app/Facebook' : ''}.</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !consent || busy, busy }} disabled={!consent || busy} onPress={() => void buy(product.id)} style={[s.button, (!consent || busy) && s.disabled]}><Text style={s.buttonText}>{busy ? 'Đang tạo đơn…' : 'Đăng ký và thanh toán'}</Text></Pressable>
      </> : <Text style={s.note}>{reasons[data.unavailableReason || ''] || 'Đăng ký gói hiện chưa mở.'}</Text>}
    </View>)}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  </View>;
}
const s = StyleSheet.create({ card: { padding: 20, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EED4DF', gap: 12 }, content: { gap: 12 }, title: { fontSize: 18, fontWeight: '700', color: '#2B1B2A' }, price: { fontSize: 20, fontWeight: '700', color: '#A82E62' }, note: { fontSize: 14, lineHeight: 22, color: '#75646d' }, consent: { minHeight: 48, justifyContent: 'center' }, action: { color: '#A82E62', lineHeight: 23 }, button: { backgroundColor: '#C42A64', borderRadius: 12, padding: 16, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '700' }, disabled: { opacity: .5 }, error: { color: '#9D3140', lineHeight: 22 } });
