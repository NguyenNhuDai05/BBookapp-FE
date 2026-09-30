import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, View, type ModalProps } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OverlayTokens } from '../../constants/theme';

type Entry = { id: string; content: React.ReactNode; onRequestClose?: ModalProps['onRequestClose']; priority: number };
type Registry = { update: (entry: Entry, existingOnly?: boolean) => void; remove: (id: string) => void };
const Context = createContext<Registry | null>(null);
let nextId = 0;

/** One native modal prevents iOS presentation conflicts between forms, alerts and sheets. */
export function OverlayProvider({ children }: React.PropsWithChildren) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const update = useCallback((entry: Entry, existingOnly = false) => setEntries(current => {
    const index = current.findIndex(item => item.id === entry.id);
    if (index < 0) return existingOnly ? current : [...current, entry];
    const copy = [...current]; copy[index] = entry; return copy;
  }), []);
  const remove = useCallback((id: string) => setEntries(current => current.some(entry => entry.id === id) ? current.filter(entry => entry.id !== id) : current), []);
  const registry = useMemo(() => ({ update, remove }), [update, remove]);
  const ordered = [...entries].sort((a, b) => a.priority - b.priority);
  const top = ordered[ordered.length - 1];
  return <Context.Provider value={registry}>
    {children}
    <Modal testID="app-overlay-host" visible={Boolean(top)} transparent animationType="none" statusBarTranslucent navigationBarTranslucent
      onRequestClose={event => top?.onRequestClose?.(event)} presentationStyle="overFullScreen">
      <SafeAreaProvider>
        {ordered.map(entry => <View key={entry.id} style={[StyleSheet.absoluteFill, entry !== top && styles.hidden]}
          pointerEvents={entry === top ? 'auto' : 'none'} accessibilityElementsHidden={entry !== top}
          importantForAccessibility={entry === top ? 'yes' : 'no-hide-descendants'}>{entry.content}</View>)}
      </SafeAreaProvider>
    </Modal>
  </Context.Provider>;
}

export type AppOverlayProps = Omit<ModalProps, 'onShow' | 'children'> & { children: React.ReactNode | ((progress: Animated.Value) => React.ReactNode); priority?: number; onShow?: () => void };

/** Compatibility surface for content overlays; registration keeps React context at the host. */
export function AppOverlay({ visible = true, animationType = 'fade', onShow, onDismiss, onRequestClose, children, priority = 0 }: AppOverlayProps) {
  const registry = useContext(Context);
  if (!registry) throw new Error('AppOverlay must be rendered inside OverlayProvider.');
  const [id] = useState(() => `overlay-${++nextId}`);
  const [progress] = useState(() => new Animated.Value(0));
  const wasVisible = useRef(false);
  const callbacks = useRef({ onShow, onDismiss });
  useLayoutEffect(() => { callbacks.current = { onShow, onDismiss }; }, [onShow, onDismiss]);
  useLayoutEffect(() => {
    registry.update({ id, priority, onRequestClose: visible ? onRequestClose : () => {}, content:
      <Animated.View style={[styles.surface, { opacity: progress, transform: typeof children === 'function' ? undefined : animationType === 'slide'
        ? [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [32, 0] }) }]
        : [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }]}>{typeof children === 'function' ? children(progress) : children}</Animated.View> }, !visible);
  });
  useLayoutEffect(() => {
    if (!visible && !wasVisible.current) return;
    wasVisible.current = visible;
    if (visible) callbacks.current.onShow?.();
    const animation = Animated.timing(progress, { toValue: visible ? 1 : 0, duration: OverlayTokens.duration, useNativeDriver: true });
    animation.start(({ finished }) => {
      if (!finished) return;
      if (!visible) { registry.remove(id); callbacks.current.onDismiss?.(); }
    });
    return () => animation.stop();
  }, [visible, progress, registry, id]);
  useLayoutEffect(() => () => registry.remove(id), [registry, id]);
  return null;
}

const styles = StyleSheet.create({ surface: { flex: 1 }, hidden: { display: 'none' } });
