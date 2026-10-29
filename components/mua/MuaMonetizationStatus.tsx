import { Text, View } from 'react-native';
import { useMuaMonetization } from '../../hooks/useMuaMonetization';

export function MuaMonetizationStatus() {
  const query = useMuaMonetization(); const state = query.data;
  if (!state?.enabled) return query.isError ? <Text accessibilityRole="alert" style={{ padding: 16, color: '#75646d' }}>Chưa đồng bộ được trạng thái tài khoản. Vui lòng kiểm tra kết nối và làm mới.</Text> : null;
  const review = state.reviewStatus === 'PendingReview' ? 'Chờ xét duyệt' : state.reviewStatus === 'Approved' ? 'Hồ sơ đã được duyệt' : state.reviewStatus === 'Rejected' ? 'Hồ sơ cần cập nhật' : 'Đang hoàn thiện hồ sơ';
  const activation = 'MUA miễn phí đăng ký · Không thu phí kích hoạt';
  const visibility = state.visibilityEndsAt ? `Quảng bá đến ${new Date(state.visibilityEndsAt).toLocaleString('vi-VN')}` : state.visibilityStatus === 'Expired' ? 'Visibility đã hết hạn · vẫn nhận booking thông thường khi tài khoản đủ điều kiện' : 'Chưa có quảng bá đang hoạt động';
  return <View style={{ margin: 16, padding: 18, backgroundColor: '#fff6f8', borderColor: '#efd7e0', borderWidth: 1, borderRadius: 14 }}>
    <Text style={{ color: '#c82264', fontWeight: '700', marginBottom: 6 }}>{activation}</Text>
    <Text style={{ color: '#4b2538' }}>{review}</Text><Text style={{ color: '#75646d', marginTop: 6, fontSize: 12 }}>{visibility}</Text>
    {query.isError && <Text accessibilityRole="alert" style={{ color: '#8f5b25', marginTop: 8, fontSize: 12 }}>Đang hiển thị lần đồng bộ gần nhất; chưa kiểm tra được thay đổi mới.</Text>}
  </View>;
}
