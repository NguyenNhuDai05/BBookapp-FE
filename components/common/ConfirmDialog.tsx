import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';

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
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={loading ? undefined : onCancel}>
    <View style={styles.overlay}>
      <View style={styles.card} accessibilityViewIsModal>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={loading}><Text style={styles.cancelText}>{cancelLabel}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.confirmButton, destructive && styles.destructiveButton, loading && styles.disabled]} onPress={onConfirm} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF"/> : <Text style={styles.confirmText}>{confirmLabel}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(48,23,38,.45)',alignItems:'center',justifyContent:'center',padding:Spacing.base},
  card:{width:'100%',maxWidth:440,backgroundColor:'#FFF',borderRadius:Radius.xl,padding:Spacing.lg},
  title:{fontFamily:Typography.bold,fontSize:19,color:BrandColors.textDark},
  message:{fontFamily:Typography.regular,fontSize:14,lineHeight:21,color:BrandColors.textSecondary,marginTop:Spacing.sm},
  actions:{flexDirection:'row',gap:Spacing.sm,marginTop:Spacing.lg},
  cancelButton:{flex:1,minHeight:48,alignItems:'center',justifyContent:'center',borderRadius:Radius.full,backgroundColor:'#F3F0F2'},
  cancelText:{fontFamily:Typography.bold,color:BrandColors.textDark},
  confirmButton:{flex:1,minHeight:48,alignItems:'center',justifyContent:'center',borderRadius:Radius.full,backgroundColor:BrandColors.accentRose},
  destructiveButton:{backgroundColor:BrandColors.statusCancelled},
  confirmText:{fontFamily:Typography.bold,color:'#FFF'},
  disabled:{opacity:.6},
});
