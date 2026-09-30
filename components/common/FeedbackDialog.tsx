import React from 'react';
import { AppModal } from '../ui/AppModal';

type Props = { visible: boolean; title: string; message: string; buttonLabel?: string; error?: boolean; onClose: () => void };
export function FeedbackDialog({ visible, title, message, buttonLabel = 'Đóng', error = false, onClose }: Props) {
  return <AppModal visible={visible} variant={error ? 'error' : 'success'} title={title} description={message}
    onClose={onClose} primaryAction={{ label: buttonLabel, onPress: onClose }} />;
}
