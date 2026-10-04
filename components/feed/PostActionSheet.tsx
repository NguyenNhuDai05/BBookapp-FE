import React, { useState } from 'react';
import { Flag, UserRoundX } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ActionSheet } from '../ui/ActionSheet';
import { AppModal } from '../ui/AppModal';
import { AppAlert } from '../ui/dialogStore';
import { ReportSheet } from '../moderation/ReportSheet';
import { moderationService, type ReportTarget } from '../../services/moderationService';
import { getApiError } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
type Props = { visible: boolean; authorName?: string; authorId?: string; portfolioId?: string; onClose: () => void; reportOnly?: boolean };
export function PostActionSheet({ visible, authorName = 'người dùng này', authorId, portfolioId, onClose, reportOnly = false }: Props) {
  const [confirmBlock, setConfirmBlock] = useState(false); const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<ReportTarget | null>(null); const cache = useQueryClient();
  const self = useAuthStore(state => state.user?.id);
  const canBlock = !!authorId && authorId.toLowerCase() !== self?.toLowerCase();
  async function block() {
    if (!authorId || busy) return; setBusy(true);
    try { await moderationService.block(authorId); setConfirmBlock(false); await cache.invalidateQueries(); AppAlert.alert('Đã chặn', 'Không thể gửi tin nhắn hoặc tương tác mới với tài khoản này. Booking và nghĩa vụ thanh toán vẫn giữ nguyên.'); }
    catch (error) { AppAlert.alert('Không thể chặn', getApiError(error).message); }
    finally { setBusy(false); }
  }
  return <>
    <ActionSheet visible={visible} title="Tùy chọn nội dung" onClose={onClose} actions={[
      ...(!reportOnly && canBlock ? [{ id: 'block', label: 'Chặn người dùng', icon: UserRoundX, destructive: true, onPress: () => { onClose(); setConfirmBlock(true); } }] : []),
      ...(portfolioId && canBlock ? [{ id: 'report', label: 'Báo cáo bài viết', icon: Flag, onPress: () => { onClose(); setTarget({ type: 'Portfolio', id: portfolioId }); } }] : []),
      ...(canBlock ? [{ id: 'report-user', label: 'Báo cáo người dùng', icon: Flag, onPress: () => { onClose(); setTarget({ type: 'User', id: authorId! }); } }] : []),
    ]} />
    <AppModal visible={confirmBlock} variant="destructive" icon={UserRoundX} title={'Chặn ' + authorName + '?'} description="Ngừng tương tác mới và ẩn bài viết của tài khoản này. Booking và thanh toán đang tồn tại không thay đổi." onClose={() => { if (!busy) setConfirmBlock(false); }} primaryAction={{ label: busy ? 'Đang chặn…' : 'Chặn', onPress: block }} secondaryAction={{ label: 'Hủy', onPress: () => { if (!busy) setConfirmBlock(false); } }} />
    <ReportSheet target={target} onClose={() => setTarget(null)} />
  </>;
}
