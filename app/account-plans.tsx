import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAccountPlans } from '../hooks/useAccountPlans';

const states: Record<string, string> = { PaymentPending: 'Chờ xác nhận thanh toán', PaidAwaitingFulfillment: 'Đã nhận tiền · Đang cấp quyền', Fulfilled: 'Đã hoàn tất', ManualReview: 'Đang được hỗ trợ kiểm tra', Cancelled: 'Đã hủy hoặc hết hạn', Refunded: 'Đã hoàn tiền', Revoked: 'Quyền đã thu hồi' };
const name = (id: string) => id === 'bbook_customer_ai_lifetime_v1' ? 'AI quét mặt vĩnh viễn' : id === 'bbook_visibility_30d_v1' ? 'Quảng bá MUA 30 ngày' : 'Giao dịch trước đây';
const date = (value: string) => new Date(value).toLocaleString('vi-VN');
export default function AccountPlansScreen() {
  const router = useRouter();
  const query = useAccountPlans();
  const data = query.data;
  const busy = query.isFetching || query.sync.isPending;
  return <SafeAreaView style={s.page}>
    <View style={s.header}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.back()} style={s.back}><Text style={s.backText}>‹</Text></TouchableOpacity><Text style={s.title}>Gói và quyền lợi</Text></View>
    <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={query.sync.isPending} onRefresh={() => { if (!busy && query.enabled) query.sync.mutate(); }} />}>
      <Text style={s.intro}>Quyền lợi được gắn với tài khoản BBook của bạn và đồng bộ khi đăng nhập trên thiết bị khác.</Text>
      {!query.enabled ? <Text style={s.note}>Đăng nhập tài khoản cá nhân để xem quyền lợi.</Text> : query.isPending ? <ActivityIndicator accessibilityLabel="Đang tải quyền lợi" color="#C42A64" /> : null}
      {(query.isError || query.sync.isError) && <Text accessibilityRole="alert" style={s.error}>Chưa đồng bộ được quyền lợi. Vui lòng kiểm tra kết nối và thử lại. Dữ liệu cũ có thể chưa phản ánh giao dịch mới nhất.</Text>}
      {data && <>
        <View style={s.card}><Text style={s.cardTitle}>AI quét mặt</Text><Text style={s.status}>{data.ai.purchased ? 'Đã mở khóa vĩnh viễn' : data.ai.hasAccess ? 'Tính năng hiện sẵn dùng' : 'Chưa có quyền sử dụng'}</Text><Text style={s.note}>{data.ai.purchased ? 'Không giới hạn thời hạn sử dụng theo tài khoản.' : 'Trạng thái được xác nhận từ hệ thống BBook.'}</Text></View>
        {data.role === 'MUA' && <View style={s.card}><Text style={s.cardTitle}>Quảng bá MUA</Text><Text style={s.status}>{data.mua?.visibilityEndsAt ? `Có hiệu lực đến ${date(data.mua.visibilityEndsAt)}` : data.mua?.visibilityStatus === 'Expired' ? 'Đã hết thời hạn quảng bá' : 'Chưa có quảng bá đang hoạt động'}</Text><Text style={s.note}>Đăng ký MUA miễn phí. Hết quảng bá vẫn nhận booking thông thường khi hồ sơ đủ điều kiện.</Text></View>}
        <Text style={s.section}>Lịch sử giao dịch</Text>
        {data.orders.length === 0 && <View style={s.card}><Text style={s.note}>Chưa có giao dịch được ghi nhận trên tài khoản này.</Text></View>}
        {data.orders.map(order => <View style={s.card} key={order.id}><Text style={s.cardTitle}>{name(order.productId)}</Text><Text style={s.amount}>{order.amountVnd.toLocaleString('vi-VN')}đ</Text><Text style={s.status}>{states[order.state] || 'Đang cập nhật'}</Text><Text style={s.note}>{date(order.createdAt)}</Text><Text selectable style={s.reference}>Mã đơn: {order.id}</Text>{order.state === 'ManualReview' && <Text style={s.note}>Giữ mã đơn để được hỗ trợ kiểm tra giao dịch. Không cần thanh toán lại.</Text>}</View>)}
        <Text style={s.note}>Cập nhật: {date(data.evaluatedAt)}</Text>
      </>}
      <TouchableOpacity accessibilityRole="button" disabled={!query.enabled || busy} accessibilityState={{ disabled: !query.enabled || busy, busy }} onPress={() => query.sync.mutate()} style={[s.button, (!query.enabled || busy) && s.disabled]}><Text style={s.buttonText}>{busy ? 'Đang đồng bộ…' : 'Đồng bộ quyền lợi'}</Text></TouchableOpacity>
      {query.sync.isSuccess && <Text accessibilityLiveRegion="polite" style={s.note}>Đã đồng bộ trạng thái mới nhất từ máy chủ.</Text>}
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF9FB' }, header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }, back: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }, backText: { fontSize: 34, color: '#A82E62' }, title: { fontSize: 23, fontWeight: '700', color: '#2B1B2A' }, body: { padding: 20, gap: 16, paddingBottom: 40 }, intro: { fontSize: 15, color: '#75646d', lineHeight: 23 }, card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EED4DF', borderRadius: 16, padding: 20, gap: 9 }, cardTitle: { fontWeight: '700', color: '#2B1B2A', fontSize: 17 }, status: { color: '#A82E62', fontSize: 15, lineHeight: 22 }, note: { color: '#75646d', fontSize: 13, lineHeight: 21 }, reference: { color: '#75646d', fontSize: 11 }, amount: { color: '#2B1B2A', fontWeight: '600', fontSize: 19 }, section: { fontSize: 18, fontWeight: '700', color: '#2B1B2A', marginTop: 8 }, error: { color: '#9D3140', fontSize: 13, lineHeight: 21 }, button: { backgroundColor: '#C42A64', padding: 16, alignItems: 'center', borderRadius: 12 }, buttonText: { color: '#FFF', fontWeight: '700' }, disabled: { opacity: .5 },
});
