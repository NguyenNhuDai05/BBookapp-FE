import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { BrandColors, Radius, Spacing } from '../../constants/theme';

interface CategoryChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function CategoryChip({ label, active = false, onPress, style }: CategoryChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.chip,
        active && styles.chipActive,
        style,
      ]}
    >
      <Text style={[styles.text, active && styles.textActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: BrandColors.borderPink,
    backgroundColor: BrandColors.bgCard,
  },
  chipActive: {
    backgroundColor: BrandColors.accentPink,
    borderColor: BrandColors.accentPink,
  },
  text: {
    color: BrandColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  textActive: {
    color: BrandColors.textWhite,
  },
});
