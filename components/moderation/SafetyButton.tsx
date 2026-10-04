import React, { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { AppAlert } from '../ui/dialogStore';
import { ActionSheet } from '../ui/ActionSheet';
import { Flag, UserRoundX } from 'lucide-react-native';
import { ReportSheet } from './ReportSheet';
import { moderationService, type ReportTarget } from '../../services/moderationService';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiError } from '../../services/api';
export function SafetyButton({ target, ownerId }: { target: ReportTarget; ownerId: string }) {
  const self = useAuthStore(state => state.user?.id); const cache = useQueryClient();
  const [open, setOpen] = useState(false); const [report, setReport] = useState<ReportTarget | null>(null);
  if (!self || ownerId.toLowerCase() === self.toLowerCase()) return null;
  function block() {
    setOpen(false);
    AppAlert.alert('Chặn người dùng?', 'Booking và nghĩa vụ thanh toán vẫn giữ nguyên.', [{ text: 'Hủy', style: 'cancel' }, { text: 'Chặn', style: 'destructive', onPress: async () => {
      try { await moderationService.block(ownerId); await cache.invalidateQueries(); AppAlert.alert('Đã chặn', 'Bạn có thể bỏ chặn trong danh sách người dùng bị chặn.'); }
      catch (error) { AppAlert.alert('Không thể chặn', getApiError(error).message); }
    } }]);
  }
  return <><TouchableOpacity accessibilityRole="button" accessibilityLabel="Báo cáo hoặc chặn người dùng" onPress={() => setOpen(true)} style={{ paddingVertical: 8 }}><Text style={{ color: '#C71585', fontSize: 12 }}>Báo cáo / Chặn</Text></TouchableOpacity><ActionSheet visible={open} title="An toàn nội dung" onClose={() => setOpen(false)} actions={[
    { id: 'content', label: 'Báo cáo nội dung', icon: Flag, onPress: () => { setOpen(false); setReport(target); } },
    { id: 'user', label: 'Báo cáo người dùng', icon: Flag, onPress: () => { setOpen(false); setReport({ type: 'User', id: ownerId }); } },
    { id: 'block', label: 'Chặn người dùng', icon: UserRoundX, destructive: true, onPress: block },
  ]} /><ReportSheet target={report} onClose={() => setReport(null)} /></>;
}
