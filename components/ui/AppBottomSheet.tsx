import React, { useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors, OverlayTokens, Shadows, Spacing, Typography } from '../../constants/theme';
import { AppOverlay } from './OverlayProvider';
import { GestureHandlerRootView, PanGestureHandler, State, type PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';

export interface AppBottomSheetProps {
  visible: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  loading?: boolean;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  onShow?: () => void;
  draggable?: boolean;
  closeAccessibilityLabel?: string;
}
export function AppBottomSheet({ visible, title, description, onClose, loading = false, children, contentStyle, onShow, draggable = false, closeAccessibilityLabel = 'Đóng bảng tùy chọn' }: AppBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const {height} = useWindowDimensions();
  const close = () => { if (!loading) onClose(); };
  if (draggable) return <AppOverlay visible={visible} animationType="slide" onRequestClose={close} onShow={onShow}>
    {progress => visible ? <DraggableSheet progress={progress} height={height} bottom={Math.max(insets.bottom, Spacing.base)} title={title} description={description} close={close} loading={loading} closeLabel={closeAccessibilityLabel} contentStyle={contentStyle}>{children}</DraggableSheet> : null}
  </AppOverlay>;
  return <AppOverlay visible={visible} animationType="slide" onRequestClose={close} onShow={onShow}>
    {progress => <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} accessible={false} testID="sheet-backdrop" />
      <Animated.View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.base), marginTop: insets.top, transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[height,0]})}] }, contentStyle]} accessibilityViewIsModal>
        <View style={styles.handle} />
        {title ? <View style={styles.header}><View style={styles.copy}><Text accessibilityRole="header" style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}</View>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng bảng tùy chọn" disabled={loading} style={styles.close} onPress={close}><X size={21} color={BrandColors.textMuted} /></Pressable>
        </View> : null}
        {children}
      </Animated.View>
    </KeyboardAvoidingView>}
  </AppOverlay>;
}

/** Drag only the header: native scroll/input gestures in the body keep ownership. */
function DraggableSheet({ progress, height, bottom, title, description, close, loading, closeLabel, children, contentStyle }: { progress: Animated.Value; height: number; bottom: number; title?: string; description?: string; close: () => void; loading: boolean; closeLabel: string; children: React.ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  const [offset] = useState(() => new Animated.Value(0));
  const dismissing = useRef(false);
  const threshold = Math.min(140, height * .18);
  const translation = offset.interpolate({ inputRange: [0, height], outputRange: [0, height], extrapolate: 'clamp' });
  const gestureEvent = Animated.event([{ nativeEvent: { translationY: offset } }], { useNativeDriver: true });
  const finishDrag = (event: PanGestureHandlerStateChangeEvent) => {
    const { state, oldState, translationY, velocityY } = event.nativeEvent;
    if (oldState !== State.ACTIVE || dismissing.current) return;
    if (state === State.END && (translationY >= threshold || (translationY >= 24 && velocityY > 900))) {
      dismissing.current = true;
      Animated.timing(offset, { toValue: height, duration: 180, useNativeDriver: true }).start(({ finished }) => { if (finished) close(); });
    } else Animated.spring(offset, { toValue: 0, damping: 24, stiffness: 260, useNativeDriver: true }).start();
  };
  return <GestureHandlerRootView style={{ flex: 1 }}>
    <KeyboardAvoidingView style={[styles.overlay, { backgroundColor: 'transparent' }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: OverlayTokens.backdrop, opacity: offset.interpolate({ inputRange: [0, height * .8], outputRange: [1, .15], extrapolate: 'clamp' }) }]} />
      <Pressable style={StyleSheet.absoluteFill} onPress={close} accessible={false} testID="sheet-backdrop" />
      <Animated.View style={{ width: '100%', maxWidth: 640, alignSelf: 'center', maxHeight: height * .8, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) }] }}>
        <Animated.View style={[styles.sheet, { maxHeight: height * .8, paddingBottom: bottom, flexShrink: 1, transform: [{ translateY: translation }] }, contentStyle]} accessibilityViewIsModal>
          <PanGestureHandler testID="operating-location-sheet-pan" enabled={!loading} activeOffsetY={8} failOffsetX={[-24, 24]} onGestureEvent={gestureEvent} onHandlerStateChange={finishDrag}><Animated.View testID="sheet-drag-header" collapsable={false}>
            <View style={[styles.handle, { marginVertical: Spacing.sm }]} />
            <View style={styles.header}><View style={styles.copy}>
              <Text accessibilityRole="header" style={styles.title}>{title}</Text>
              {!!description && <Text style={styles.description}>{description}</Text>}
            </View><Pressable accessibilityRole="button" accessibilityLabel={closeLabel} disabled={loading} style={styles.close} onPress={close}><X size={21} color={BrandColors.textMuted} /></Pressable></View>
          </Animated.View></PanGestureHandler>
          {children}
        </Animated.View>
      </Animated.View>
    </KeyboardAvoidingView>
  </GestureHandlerRootView>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: OverlayTokens.backdrop },
  sheet: { width: '100%', maxWidth: 640, maxHeight: '92%', alignSelf: 'center', backgroundColor: BrandColors.bgCard, borderTopLeftRadius: OverlayTokens.sheetRadius, borderTopRightRadius: OverlayTokens.sheetRadius, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, ...Shadows.elevated },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: BrandColors.borderSoft, alignSelf: 'center', marginBottom: Spacing.base },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.base }, copy: { flex: 1 },
  title: { fontFamily: Typography.bold, fontSize: 21, lineHeight: 29, color: OverlayTokens.text },
  description: { fontFamily: Typography.regular, fontSize: 14, lineHeight: 21, color: OverlayTokens.description, marginTop: Spacing.xs },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -Spacing.md, marginTop: -Spacing.sm },
});
