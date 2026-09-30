import React, { useRef, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, AlertTriangle, Check, HelpCircle, Info, Trash2, X, type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors, OverlayTokens, Radius, Shadows, Spacing, Typography } from '../../constants/theme';
import { sanitizeUiMessage } from '../../utils/uiMessage';
import { AppOverlay } from './OverlayProvider';

export type ModalVariant = 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'destructive';
export type ModalAction = { label: string; onPress?: () => void | Promise<unknown>; disabled?: boolean; loading?: boolean; destructive?: boolean };
export interface AppModalProps {
  visible: boolean;
  variant?: ModalVariant;
  title: string;
  description?: string;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  additionalActions?: ModalAction[];
  onClose: () => void;
  loading?: boolean;
  dismissOnBackdrop?: boolean;
  icon?: LucideIcon;
  children?: React.ReactNode;
  onShow?: () => void;
  onActionError?: (error: unknown) => void;
  priority?: number;
}
const icons: Record<ModalVariant, LucideIcon> = { info: Info, success: Check, warning: AlertTriangle, error: AlertCircle, confirm: HelpCircle, destructive: Trash2 };

export function AppModal({ visible, variant = 'info', title, description, primaryAction, secondaryAction, additionalActions = [], onClose,
  loading = false, dismissOnBackdrop = variant === 'info' || variant === 'success', icon, children, onShow, onActionError, priority }: AppModalProps) {
  const insets = useSafeAreaInsets();
  const lock = useRef(false);
  const [pending, setPending] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');
  const busy = loading || pending !== null || Boolean(primaryAction?.loading || secondaryAction?.loading || additionalActions.some(action => action.loading));
  const Icon = icon || icons[variant];
  const color = variant === 'destructive' ? OverlayTokens.destructive : OverlayTokens.primary;
  const close = () => { if (!busy && !lock.current) onClose(); };
  const run = async (action: ModalAction, index: number) => {
    if (busy || lock.current || action.disabled) return;
    lock.current = true; setPending(index); setActionError('');
    try { await action.onPress?.(); }
    catch (error) { if (onActionError) onActionError(error); else setActionError(sanitizeUiMessage(error instanceof Error ? error.message : error)); }
    finally { lock.current = false; setPending(null); }
  };
  const actions = [primaryAction, ...additionalActions, secondaryAction].filter((action): action is ModalAction => Boolean(action));
  return <AppOverlay visible={visible} animationType="fade" onRequestClose={close} priority={priority}
    onShow={() => { setActionError(''); onShow?.(); }}>
    {progress => <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismissOnBackdrop ? close : undefined} accessible={false} testID="modal-backdrop" />
      <Animated.View style={[styles.card, { marginTop: insets.top, marginBottom: insets.bottom, transform: [{scale:progress.interpolate({inputRange:[0,1],outputRange:[0.96,1]})}] }]} accessibilityViewIsModal>
        <Pressable accessibilityRole="button" accessibilityLabel="Đóng thông báo" onPress={close} disabled={busy} style={styles.close} hitSlop={4}>
          <X size={20} color={BrandColors.textMuted} />
        </Pressable>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={[styles.icon, variant === 'destructive' && styles.destructiveIcon]}><Icon size={28} color={color} strokeWidth={2} /></View>
          <Text accessibilityRole="header" style={styles.title}>{sanitizeUiMessage(title, 'Thông báo')}</Text>
          {description ? <Text style={styles.description}>{sanitizeUiMessage(description)}</Text> : null}
          {children}
          {actionError ? <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text> : null}
          <View style={styles.actions}>{actions.map((action, index) => {
            const secondary = action === secondaryAction;
            const danger = action.destructive || (!secondary && variant === 'destructive');
            return <Pressable key={`${index}-${action.label}`} accessibilityRole="button" accessibilityLabel={action.label}
              accessibilityState={{ disabled: busy || action.disabled, busy: pending === index || action.loading }}
              disabled={busy || action.disabled} onPress={() => { void run(action, index); }}
              style={({ pressed }) => [styles.button, secondary ? styles.secondary : { backgroundColor: danger ? OverlayTokens.destructive : OverlayTokens.primary },
                (busy || action.disabled || pressed) && styles.disabled]}>
              {pending === index || action.loading ? <ActivityIndicator color={secondary ? OverlayTokens.text : BrandColors.textWhite} /> :
                <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{action.label}</Text>}
            </Pressable>;
          })}</View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>}
  </AppOverlay>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: OverlayTokens.backdrop, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  card: { width: '90%', maxWidth: OverlayTokens.maxWidth, maxHeight: '94%', backgroundColor: BrandColors.bgCard, borderRadius: OverlayTokens.cardRadius, ...Shadows.elevated },
  content: { padding: Spacing.lg }, close: { position: 'absolute', right: 4, top: 4, width: 44, height: 44, zIndex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { width: OverlayTokens.iconSize, height: OverlayTokens.iconSize, borderRadius: Radius.full, backgroundColor: OverlayTokens.light, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: Spacing.base },
  destructiveIcon: { backgroundColor: BrandColors.statusCancelledBg }, title: { fontFamily: Typography.bold, fontSize: 21, lineHeight: 29, color: OverlayTokens.text, textAlign: 'center' },
  description: { fontFamily: Typography.regular, fontSize: 15, lineHeight: 23, color: OverlayTokens.description, textAlign: 'center', marginTop: Spacing.sm },
  actions: { gap: Spacing.sm, marginTop: Spacing.lg }, button: { minHeight: OverlayTokens.buttonHeight, borderRadius: Radius.xxl, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: OverlayTokens.background }, buttonText: { fontFamily: Typography.bold, fontSize: 15, color: BrandColors.textWhite, textAlign: 'center' }, secondaryText: { color: OverlayTokens.text },
  disabled: { opacity: 0.55 }, error: { color: OverlayTokens.destructive, fontFamily: Typography.semiBold, fontSize: 14, lineHeight: 21, marginTop: Spacing.md, textAlign: 'center' },
});
