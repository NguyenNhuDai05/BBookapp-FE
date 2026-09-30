import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { BrandColors, OverlayTokens, Radius, Spacing, Typography } from '../../constants/theme';
import { sanitizeUiMessage } from '../../utils/uiMessage';
import { AppBottomSheet } from './AppBottomSheet';

export type SheetAction = { id: string; label: string; description?: string; icon?: LucideIcon; destructive?: boolean; disabled?: boolean; onPress: () => void | Promise<unknown> };
export interface ActionSheetProps { visible: boolean; title: string; description?: string; actions: SheetAction[]; onClose: () => void; loading?: boolean; cancelLabel?: string }
export function ActionSheet({ visible, title, description, actions, onClose, loading = false, cancelLabel = 'Hủy' }: ActionSheetProps) {
  const lock = useRef(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const busy = loading || pending !== null;
  const run = async (action: SheetAction) => {
    if (lock.current || busy || action.disabled) return;
    lock.current = true; setPending(action.id); setError('');
    try { await action.onPress(); }
    catch (value) { setError(sanitizeUiMessage(value instanceof Error ? value.message : value)); }
    finally { lock.current = false; setPending(null); }
  };
  return <AppBottomSheet visible={visible} title={title} description={description} onClose={onClose} loading={busy} onShow={() => setError('')}>
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {actions.map(action => {
        const Icon = action.icon;
        const color = action.destructive ? OverlayTokens.destructive : OverlayTokens.primary;
        return <TouchableOpacity key={action.id} accessibilityRole="button" accessibilityLabel={action.label} accessibilityHint={action.description} activeOpacity={0.75}
          accessibilityState={{ disabled: busy || action.disabled, busy: pending === action.id }} disabled={busy || action.disabled}
          onPress={() => { void run(action); }} style={[styles.action, (busy || action.disabled) && styles.disabled]}>
          {Icon ? <View style={styles.icon}><Icon size={22} color={color} /></View> : null}
          <View style={styles.copy}><Text style={[styles.label, action.destructive && styles.danger]}>{action.label}</Text>
            {action.description ? <Text style={styles.description}>{action.description}</Text> : null}</View>
          {pending === action.id ? <ActivityIndicator color={color} /> : <ChevronRight size={20} color={BrandColors.textMuted} />}
        </TouchableOpacity>;
      })}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={cancelLabel} style={styles.cancel} disabled={busy} onPress={onClose}><Text style={styles.cancelText}>{cancelLabel}</Text></Pressable>
    </ScrollView>
  </AppBottomSheet>;
}
const styles = StyleSheet.create({
  action: { minHeight: 64, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md, borderWidth: 1, borderColor: BrandColors.borderDivider, borderRadius: Radius.base, marginBottom: Spacing.sm },
  icon: { width: 40, height: 40, borderRadius: Radius.full, backgroundColor: OverlayTokens.background, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 },
  label: { fontFamily: Typography.bold, fontSize: 15, color: OverlayTokens.text }, description: { fontFamily: Typography.regular, fontSize: 13, lineHeight: 19, color: OverlayTokens.description, marginTop: Spacing.xs },
  danger: { color: OverlayTokens.destructive }, disabled: { opacity: 0.55 }, cancel: { minHeight: OverlayTokens.buttonHeight, backgroundColor: OverlayTokens.light, borderRadius: Radius.xxl, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm, padding: Spacing.md },
  cancelText: { fontFamily: Typography.bold, fontSize: 15, color: OverlayTokens.text }, error: { fontFamily: Typography.regular, color: OverlayTokens.destructive, marginVertical: Spacing.sm },
});
