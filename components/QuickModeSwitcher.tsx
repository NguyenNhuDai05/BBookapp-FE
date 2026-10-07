import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BrandColors, Spacing, Typography } from '../constants/theme';
import { AppBottomSheet } from './ui/AppBottomSheet';
import { useAppMode } from '../hooks/useAppMode';
import type { AppMode } from '../utils/appMode';

const labels = { CUSTOMER: 'Khách hàng', MUA: 'Chuyên viên trang điểm' };

export function QuickModeSwitcher() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const { activeMode, isModeSwitching, hasMuaAccess, selectMode } = useAppMode();
  const select = async (mode: AppMode) => {
    if (isModeSwitching) return;
    if (mode === activeMode) { setVisible(false); return; }
    setVisible(false);
    await selectMode(mode);
  };
  return <View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Chế độ hiện tại: ${labels[activeMode]}`}
      accessibilityHint="Chọn chế độ sử dụng" accessibilityState={{ expanded: visible, disabled: isModeSwitching, busy: isModeSwitching }}
      disabled={isModeSwitching} onPress={() => setVisible(true)} style={styles.trigger}>
      <Text style={styles.label}>{labels[activeMode]}</Text>
      {isModeSwitching ? <ActivityIndicator size="small" color={BrandColors.accentRose} /> : <ChevronDown size={16} color={BrandColors.textDark} />}
    </TouchableOpacity>
    <AppBottomSheet visible={visible} title="Chế độ sử dụng" loading={isModeSwitching} onClose={() => setVisible(false)}>
      {(['CUSTOMER', 'MUA'] as const).map(mode => {
        const onboarding = mode === 'MUA' && !hasMuaAccess;
        const selected = !onboarding && activeMode === mode;
        const label = onboarding ? 'Trở thành chuyên viên trang điểm' : labels[mode];
        return <TouchableOpacity key={mode} accessibilityRole="button" accessibilityLabel={label}
          accessibilityState={{ selected, disabled: isModeSwitching }} disabled={isModeSwitching}
          style={styles.item} onPress={() => {
            if (onboarding) { setVisible(false); router.push('/mua-onboarding'); }
            else void select(mode);
          }}>
          <View style={styles.check}>{selected ? <Check size={21} color={BrandColors.accentRose} /> : null}</View>
          <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>;
      })}
    </AppBottomSheet>
  </View>;
}

const styles = StyleSheet.create({
  trigger: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, alignSelf: 'flex-start', paddingVertical: Spacing.sm },
  label: { flexShrink: 1, fontFamily: Typography.semiBold, fontSize: 14, color: BrandColors.textDark },
  item: { minHeight: 56, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  check: { width: 24, alignItems: 'center' },
});
