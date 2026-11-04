import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppCommerce } from '../../hooks/useAppCommerce';
import { appCommerce, commerceMessage } from '../../services/appCommerce';
import { useAuthStore } from '../../store/useAuthStore';

export function PlanPurchase() {
  const catalog = useAppCommerce();
  const owner = useAuthStore(state => state.user?.id);
  const revision = catalog.data?.products.map(p => `${p.id}:${p.version}:${p.amountVnd}`).join('|') || '';
  return <PurchaseBody key={`${owner}:${revision}`} owner={owner} catalog={catalog} />;
}
function PurchaseBody({ owner, catalog }: { owner?: string; catalog: ReturnType<typeof useAppCommerce> }) {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const data = catalog.data;
  const [consentProduct, setConsentProduct] = useState('');
  async function buy(productId: string) {
    if (!owner || !data?.checkoutEnabled || (!consent || consentProduct !== productId) || submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const id = await appCommerce.buy(owner, productId, data.products.find(p => p.id === productId)?.termsVersion || data.termsVersion, data.role === 'MUA');
      if (useAuthStore.getState().user?.id === owner) router.push({ pathname: '/plan-payment', params: { id } } as never);
    } catch (failure) { setError(commerceMessage(failure)); void catalog.refetch(); }
    finally { submitting.current = false; setBusy(false); }
  }
  if (catalog.isPending) return <ActivityIndicator accessibilityLabel="Đang tải gói đăng ký" />;
  if (catalog.isError) return <View style={s.card}><Text>Chưa tải được gói đăng ký.</Text><Pressable accessibilityRole="button" onPress={() => void catalog.refetch()}><Text style={s.action}>Thử lại</Text></Pressable></View>;
  if (!data?.enabled) return null;
  const reasons: Record<string, string> = { ALREADY_PURCHASED: 'Bạn đã sở hữu AI vĩnh viễn.', MANUAL_REVIEW: 'Giao dịch đang được kiểm tra. Không cần thanh toán thêm.', MUA_NOT_ELIGIBLE: 'Hoàn thiện hồ sơ MUA và chờ duyệt để đăng ký quảng bá.', CHECKOUT_DISABLED: 'Đăng ký gói hiện chưa mở.' };
  const mua = data.role === 'MUA';
  const benefits = mua
    ? ['Luân phiên nổi bật trong Khám phá', '1 bài Facebook BBook mỗi chu kỳ', 'Mua thêm nối tiếp thời hạn', 'Hỗ trợ 1 lần chỉnh sửa nội dung']
    : ['Mở khóa quét gương mặt AI', 'Quyền sử dụng trọn đời theo tài khoản', 'Đồng bộ trên các thiết bị', 'Không cần mua lại sau khi kích hoạt'];
  return <View style={s.stack}>
    {!data.products.length && <View style={s.card}><Text style={s.title}>Gói đăng ký đang được cập nhật</Text><Text style={s.note}>Quyền lợi đã mua vẫn được giữ trong tài khoản của bạn.</Text></View>}
    {data.products.map(product => {
      const accepted = consent && consentProduct === product.id;
      return <LinearGradient key={product.id} colors={['#FFFFFF', '#FFF0F6', '#FFE4EF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
        <View style={s.heroTop}><View style={s.badge}><Ionicons name="sparkles" color="#C52C68" size={15} /><Text style={s.badgeText}>{mua ? 'Dành cho MUA' : 'Dành cho khách hàng'}</Text></View>
          {mua ? <View style={s.art}><Ionicons name="color-palette-outline" size={55} color="#D73878" /><Ionicons name="sparkles" size={18} color="#EE9BBB" /></View> : <Image accessible={false} source={require('../../assets/images/advisor/styles/natural.webp')} style={s.portrait} />}
        </View>
        <Text style={s.title}>{product.name}</Text>
        <Text style={s.price}>{product.amountVnd.toLocaleString('vi-VN')}đ <Text style={s.period}>/ {product.days ? `${product.days} ngày` : 'trọn đời'}</Text></Text>
        <View style={s.benefits}>{benefits.map((text, i) => <View key={text} style={s.benefit}><View style={s.check}><Ionicons name={mua ? (['sparkles-outline', 'logo-facebook', 'calendar-outline', 'create-outline'] as const)[i] : 'checkmark'} size={17} color="#D22D70" /></View><Text style={s.benefitText}>{text}</Text></View>)}</View>
        {!!product.description && <Text style={s.description}>{product.description}</Text>}
        <View style={s.divider} />
        <Text style={s.note}>{mua ? 'Không cam kết số booking. Bài Facebook do BBook biên tập và đăng trong 3 ngày làm việc từ đầu chu kỳ.' : 'Trải nghiệm tư vấn và thử makeup cá nhân hóa. Thanh toán một lần, không tự gia hạn.'}</Text>
        {mua && <Text style={s.support}>Liên hệ bbooksupport@gmail.com khi cần hỗ trợ.</Text>}
        {data.checkoutEnabled ? <>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: accepted, disabled: busy }} disabled={busy} onPress={() => { setConsentProduct(product.id); setConsent(!accepted); }} style={s.consent}>
            <Ionicons name={accepted ? 'checkbox' : 'square-outline'} color="#C52C68" size={25} /><Text style={s.consentText}>Tôi đồng ý mua gói với mức giá trên{mua ? ' và cho BBook sử dụng portfolio để quảng bá trong app/Facebook' : ' cho tài khoản BBook này'}.</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !accepted || busy, busy }} disabled={!accepted || busy} onPress={() => void buy(product.id)} style={[s.button, (!accepted || busy) && s.disabled]}>
            <LinearGradient colors={['#F569A6', '#CD276D', '#B81859']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.cta}>{busy ? <ActivityIndicator color="#fff" /> : <Ionicons name={mua ? 'sparkles-outline' : 'cart-outline'} color="#fff" size={23} />}<Text style={s.buttonText}>{busy ? 'Đang tạo đơn…' : mua ? 'Đăng ký và thanh toán' : 'Mua và kích hoạt'}</Text></LinearGradient>
          </Pressable>
        </> : <View style={s.unavailable}><Ionicons name={data.unavailableReason === 'ALREADY_PURCHASED' ? 'checkmark-circle' : 'information-circle-outline'} size={22} color="#C52C68" /><Text style={s.note}>{reasons[data.unavailableReason || ''] || 'Đăng ký gói hiện chưa mở.'}</Text></View>}
      </LinearGradient>;
    })}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  </View>;
}
const s = StyleSheet.create({
  stack: { gap: 20 }, card: { padding: 22, borderRadius: 26, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F5D6E5', gap: 15, shadowColor: '#8F3D63', shadowOffset: { width: 0, height: 7 }, shadowOpacity: .10, shadowRadius: 16, elevation: 3 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, badge: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: '#FFE0ED', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 30, flexShrink: 1 }, badgeText: { fontSize: 12, fontWeight: '700', color: '#BF2864', flexShrink: 1 }, portrait: { width: 75, height: 75, borderRadius: 38, borderWidth: 3, borderColor: '#fff' }, art: { width: 75, height: 75, borderRadius: 38, backgroundColor: '#FFE0ED', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  title: { fontSize: 25, fontWeight: '800', color: '#32152C', letterSpacing: -.6 }, price: { fontSize: 30, fontWeight: '800', color: '#C42C68', letterSpacing: -.8 }, period: { fontSize: 22, fontWeight: '600' }, benefits: { gap: 11, paddingVertical: 7 }, benefit: { flexDirection: 'row', gap: 11, alignItems: 'center' }, check: { width: 29, height: 29, borderRadius: 10, backgroundColor: '#FFDFEC', justifyContent: 'center', alignItems: 'center' }, benefitText: { flex: 1, fontSize: 14, lineHeight: 21, color: '#4C3042' }, divider: { height: 1, backgroundColor: '#F2DCE6' }, description: { fontSize: 14, lineHeight: 22, color: '#694E60' }, note: { fontSize: 13, lineHeight: 21, color: '#7A6373', flexShrink: 1 }, support: { fontSize: 12, color: '#977184', fontStyle: 'italic', lineHeight: 19 }, consent: { flexDirection: 'row', gap: 10, minHeight: 48, alignItems: 'flex-start', paddingVertical: 8 }, consentText: { flex: 1, color: '#BA2863', lineHeight: 22, fontSize: 14 }, button: { borderRadius: 18, overflow: 'hidden' }, cta: { minHeight: 56, padding: 16, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', flexShrink: 1 }, action: { color: '#C42C68', fontWeight: '600' }, disabled: { opacity: .48 }, error: { color: '#A32D48', lineHeight: 22 }, unavailable: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 14, backgroundColor: '#FFFFFFA8', borderRadius: 14 },
});
