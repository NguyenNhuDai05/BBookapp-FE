import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { complaintService } from '../../services/complaintService';

export function ComplaintEntry({ bookingId, customer = false, open = false }: { bookingId: string; customer?: boolean; open?: boolean }) {
  const router = useRouter();
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ['complaints', bookingId], queryFn: async () => ({ eligibility: await complaintService.eligibility(bookingId), history: await complaintService.list(bookingId) }), retry: false });
  const { refetch } = query;
  useFocusEffect(useCallback(() => { void refetch(); }, [refetch]));
  const active = query.data?.eligibility.activeComplaintId;
  useEffect(() => { if (query.data && open !== !!active) void cache.invalidateQueries({ queryKey: ['bookingDetail', bookingId] }); }, [cache, bookingId, open, active, query.data]);
  if (query.isLoading) return <View style={s.card}><Text style={s.copy}>Đang tải hỗ trợ booking...</Text></View>;
  if (query.isError) return <TouchableOpacity style={s.card} onPress={() => query.refetch()}><Text style={s.copy}>Chưa tải được hỗ trợ booking. Chạm để thử lại.</Text></TouchableOpacity>;
  const { eligibility, history } = query.data!;
  if (!customer && !history.length) return null;
  if (customer && !eligibility.canCreateComplaint && !history.length) return null;
  return <View style={s.card}>
    <Text style={s.title}>{open || eligibility.activeComplaintId ? 'Booking đang có khiếu nại' : 'Hỗ trợ booking'}</Text>
    <Text style={s.copy}>{open || eligibility.activeComplaintId ? 'Bạn có thể theo dõi và bổ sung bằng chứng. Việc hủy hoặc xác nhận hoàn tất tạm dừng trong lúc admin xử lý.' : eligibility.complaintDeadline ? `Có thể khiếu nại đến ${new Date(eligibility.complaintDeadline).toLocaleString('vi-VN')}.` : 'Báo vấn đề để B-Book hỗ trợ giải quyết.'}</Text>
    <TouchableOpacity style={s.button} onPress={() => router.push({ pathname: '/booking/[id]/complaint', params: { id: bookingId } })}><Text style={s.buttonText}>{history.length ? 'Xem hồ sơ khiếu nại' : 'Báo vấn đề / Khiếu nại'}</Text></TouchableOpacity>
  </View>;
}
const s = StyleSheet.create({ card: { marginVertical: 12, padding: 18, borderRadius: 18, backgroundColor: '#FFF0F5', gap: 10 }, title: { fontSize: 16, fontWeight: '700', color: '#332331' }, copy: { fontSize: 14, lineHeight: 21, color: '#786774' }, button: { backgroundColor: '#EF3D80', padding: 14, borderRadius: 14, alignItems: 'center' }, buttonText: { color: '#FFF', fontWeight: '700' } });
