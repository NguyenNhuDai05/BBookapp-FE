import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAccountPlans } from '../hooks/useAccountPlans';
import { PlanPurchase } from '../components/profile/PlanPurchase';

const states: Record<string, string> = { PaymentPending: 'Chờ xác nhận thanh toán', PaidAwaitingFulfillment: 'Đã nhận tiền · Đang cấp quyền', Fulfilled: 'Đã hoàn tất', ManualReview: 'Đang được hỗ trợ kiểm tra', Cancelled: 'Đã hủy hoặc hết hạn', Refunded: 'Đã hoàn tiền', Revoked: 'Quyền đã thu hồi' };
const name = (id: string) => id === 'bbook_customer_ai_lifetime_v1' ? 'AI quét mặt vĩnh viễn' : id === 'bbook_visibility_30d_v1' ? 'Quảng bá MUA 30 ngày' : 'Giao dịch trước đây';
const date = (value: string) => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
export default function AccountPlansScreen() {
  const router = useRouter();
  const query = useAccountPlans();
  const data = query.data;
  const busy = query.isFetching || query.sync.isPending;
  return <SafeAreaView style={s.page}>
    <View style={s.header}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={27} color="#C42A64" /></TouchableOpacity><Text style={s.title}>Gói và quyền lợi</Text></View>
    <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={query.sync.isPending} onRefresh={() => { if (!busy && query.enabled) query.sync.mutate(); }} />}>
      <Text style={s.intro}>Quyền lợi được gắn với tài khoản BBook của bạn và đồng bộ khi đăng nhập trên thiết bị khác.</Text>
      {!query.enabled ? <Text style={s.note}>Đăng nhập tài khoản cá nhân để xem quyền lợi.</Text> : query.isPending ? <ActivityIndicator accessibilityLabel="Đang tải quyền lợi" color="#C42A64" /> : null}
      {(query.isError || query.sync.isError) && <Text accessibilityRole="alert" style={s.error}>Chưa đồng bộ được quyền lợi. Vui lòng kiểm tra kết nối và thử lại. Dữ liệu cũ có thể chưa phản ánh giao dịch mới nhất.</Text>}
      {data && <>
        <PlanPurchase />
        <View style={s.card}><View style={s.cardHeading}><View style={s.iconBox}><Ionicons name="ribbon-outline" size={26} color="#D53577" /></View><Text style={s.cardTitle}>Trạng thái quyền lợi AI</Text></View><Text style={s.status}>{data.ai.purchased ? 'Đã mở khóa vĩnh viễn' : data.ai.hasAccess ? 'Tính năng hiện sẵn dùng' : 'Chưa kích hoạt'}</Text><Text style={s.note}>{data.ai.purchased ? 'Không giới hạn thời hạn sử dụng theo tài khoản.' : 'Trạng thái được xác nhận từ hệ thống BBook.'}</Text></View>
        {data.role === 'MUA' && <View style={s.card}><View style={s.cardHeading}><View style={s.iconBox}><Ionicons name="megaphone-outline" size={26} color="#D53577" /></View><Text style={s.cardTitle}>Quảng bá MUA</Text></View><Text style={s.status}>{data.mua?.visibilityEndsAt ? `Có hiệu lực đến ${date(data.mua.visibilityEndsAt)}` : data.mua?.visibilityStatus === 'Expired' ? 'Đã hết thời hạn quảng bá' : 'Chưa có quảng bá đang hoạt động'}</Text><Text style={s.note}>Đăng ký MUA miễn phí. Hết quảng bá vẫn nhận booking thông thường khi hồ sơ đủ điều kiện.</Text></View>}
        <Text style={s.section}>Lịch sử giao dịch</Text>
        {data.orders.length === 0 && <View style={[s.card, s.empty]}><View style={s.emptyIcon}><Ionicons name="receipt-outline" size={43} color="#DF4A88" /></View><Text style={s.note}>Chưa có giao dịch nào</Text><Text style={s.emptyNote}>Giao dịch của bạn sẽ được lưu tại đây.</Text></View>}
        {data.orders.map(order => <View style={s.card} key={order.id}><View style={s.receiptLabel}><Ionicons name="receipt-outline" size={16} color="#C42A64" /><Text style={s.receiptText}>GIAO DỊCH BBOOK</Text></View><Text style={s.cardTitle}>{order.productName || name(order.productId)}</Text><Text style={s.amount}>{order.amountVnd.toLocaleString('vi-VN')}đ</Text><Text style={s.status}>{states[order.state] || 'Đang cập nhật'}</Text><Text style={s.note}>{date(order.createdAt)}</Text><Text selectable style={s.reference}>Mã đơn: {order.id}</Text>{order.state === 'ManualReview' && <Text style={s.note}>Giữ mã đơn để được hỗ trợ kiểm tra giao dịch. Không cần thanh toán lại.</Text>}<TouchableOpacity accessibilityRole="button" onPress={() => router.push({ pathname: '/plan-payment', params: { id: order.id } } as never)} style={s.detailButton}><View style={s.cardHeading}><Text style={s.detailLink}>Xem chi tiết</Text><Ionicons name="arrow-forward" size={17} color="#C42A64" /></View></TouchableOpacity></View>)}
        <Text style={s.note}>Cập nhật: {date(data.evaluatedAt)}</Text>
      </>}
      <TouchableOpacity accessibilityRole="button" disabled={!query.enabled || busy} accessibilityState={{ disabled: !query.enabled || busy, busy }} onPress={() => query.sync.mutate()} style={[s.button, (!query.enabled || busy) && s.disabled]}><LinearGradient colors={['#EA5A98', '#BF1C5F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.syncInner}><Ionicons name="sync-outline" size={23} color="#fff" /><Text style={s.buttonText}>{busy ? 'Đang đồng bộ…' : 'Đồng bộ quyền lợi'}</Text></LinearGradient></TouchableOpacity>
      {query.sync.isSuccess && <Text accessibilityLiveRegion="polite" style={s.note}>Đã đồng bộ trạng thái mới nhất từ máy chủ.</Text>}
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF8FB' }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 }, back: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }, title: { fontSize: 25, fontWeight: '800', color: '#30162C', letterSpacing: -.6 }, body: { padding: 18, gap: 19, paddingBottom: 44 }, intro: { fontSize: 14, color: '#7F6877', lineHeight: 23, paddingHorizontal: 4, marginBottom: 4 },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1D7E3', borderRadius: 23, padding: 21, gap: 11, shadowColor: '#994A70', shadowOpacity: .06, shadowOffset: { width: 0, height: 5 }, shadowRadius: 13, elevation: 1 }, cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 }, iconBox: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#FFE8F1', alignItems: 'center', justifyContent: 'center' }, cardTitle: { flexShrink: 1, fontWeight: '700', color: '#35172F', fontSize: 17 }, status: { color: '#C32C6B', fontSize: 15, fontWeight: '600', lineHeight: 23 }, note: { color: '#846F7D', fontSize: 13, lineHeight: 21 }, reference: { color: '#9D8593', fontSize: 11, lineHeight: 18 }, amount: { color: '#38192F', fontWeight: '800', fontSize: 23 }, section: { fontSize: 21, fontWeight: '800', color: '#35172F', marginTop: 10 }, error: { color: '#9D3140', fontSize: 13, lineHeight: 21 }, button: { borderRadius: 19, overflow: 'hidden', marginTop: 5 }, syncInner: { padding: 17, minHeight: 56, flexDirection: 'row', gap: 11, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' }, disabled: { opacity: .5 }, empty: { alignItems: 'center', paddingVertical: 28 }, emptyIcon: { backgroundColor: '#FFF0F6', padding: 18, borderRadius: 28, marginBottom: 5 }, emptyNote: { fontSize: 12, color: '#AE92A2' }, receiptLabel: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 }, receiptText: { fontSize: 10, letterSpacing: 1.7, color: '#B57591', fontWeight: '700' }, detailButton: { minHeight: 44, justifyContent: 'center', borderTopWidth: 1, borderColor: '#F7E6ED', marginTop: 3 }, detailLink: { color: '#C42A64', fontWeight: '600', fontSize: 13 },
});
