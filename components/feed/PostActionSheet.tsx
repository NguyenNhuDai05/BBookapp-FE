import React, { useState } from 'react';
import { EyeOff, Flag, UserRoundX } from 'lucide-react-native';
import { ActionSheet } from '../ui/ActionSheet';
import { AppModal } from '../ui/AppModal';
import { AppAlert } from '../ui/dialogStore';


type Props = { visible: boolean; authorName?: string; onClose: () => void; reportOnly?: boolean };
export function PostActionSheet({ visible, authorName = 'người dùng này', onClose, reportOnly = false }: Props) {
  const [confirmBlock, setConfirmBlock] = useState(false);
  // TODO: Wire moderation actions only when an explicit hide/block/report API is available.
  // The current portfolio contract supports owner visibility, not viewer moderation.
  const unavailable = () => { onClose(); AppAlert.alert('Thông báo', 'Tính năng này đang được phát triển. Vui lòng quay lại sau.'); };
  return <>
    <ActionSheet visible={visible} title="Tùy chọn bài viết" description="Các thao tác với bài viết này" onClose={onClose} actions={[
      ...(!reportOnly ? [
        { id: 'hide', label: 'Ẩn bài viết', description: 'Không hiển thị bài viết này nữa', icon: EyeOff, onPress: unavailable },
        { id: 'block', label: 'Chặn người dùng', description: 'Bạn sẽ không thấy nội dung từ tài khoản này', icon: UserRoundX, destructive: true, onPress: () => { onClose(); setConfirmBlock(true); } },
      ] : []),
      { id: 'report', label: 'Báo cáo bài viết', description: 'Báo cáo nội dung không phù hợp', icon: Flag, onPress: unavailable },
    ]} />
    <AppModal visible={confirmBlock} variant="destructive" icon={UserRoundX} title={`Chặn ${authorName}?`}
      description="Thao tác chặn hiện chưa được hỗ trợ. Tài khoản này sẽ chưa bị chặn khi bạn đóng thông báo."
      onClose={() => setConfirmBlock(false)} primaryAction={{ label: 'Đã hiểu', onPress: () => setConfirmBlock(false) }}
      secondaryAction={{ label: 'Hủy', onPress: () => setConfirmBlock(false) }} />
  </>;
}
