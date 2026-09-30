import React from 'react';
import { AppModal } from '../ui/AppModal';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};
export function ConfirmDialog({ visible, title, message, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy', destructive = false, loading = false, onCancel, onConfirm }: ConfirmDialogProps) {
  return <AppModal visible={visible} variant={destructive ? 'destructive' : 'confirm'} title={title} description={message}
    loading={loading} onClose={onCancel} primaryAction={{ label: confirmLabel, onPress: onConfirm, loading }}
    secondaryAction={{ label: cancelLabel, onPress: onCancel }} />;
}
