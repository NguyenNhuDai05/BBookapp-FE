import React from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors, OverlayTokens, Shadows, Spacing, Typography } from '../../constants/theme';
import { AppOverlay } from './OverlayProvider';

export interface AppBottomSheetProps {
  visible: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  loading?: boolean;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  onShow?: () => void;
}
export function AppBottomSheet({ visible, title, description, onClose, loading = false, children, contentStyle, onShow }: AppBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const {height} = useWindowDimensions();
  const close = () => { if (!loading) onClose(); };
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
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: OverlayTokens.backdrop },
  sheet: { width: '100%', maxWidth: 640, maxHeight: '92%', alignSelf: 'center', backgroundColor: BrandColors.bgCard, borderTopLeftRadius: OverlayTokens.sheetRadius, borderTopRightRadius: OverlayTokens.sheetRadius, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, ...Shadows.elevated },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: BrandColors.borderSoft, alignSelf: 'center', marginBottom: Spacing.base },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.base }, copy: { flex: 1 },
  title: { fontFamily: Typography.bold, fontSize: 21, lineHeight: 29, color: OverlayTokens.text },
  description: { fontFamily: Typography.regular, fontSize: 14, lineHeight: 21, color: OverlayTokens.description, marginTop: Spacing.xs },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -Spacing.md, marginTop: -Spacing.sm },
});
