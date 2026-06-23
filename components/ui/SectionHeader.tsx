import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BrandColors, Spacing } from '../../constants/theme';

interface SectionHeaderProps {
  title: string;
  emoji?: string;
  actionText?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, emoji, actionText, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {emoji ? `${emoji} ` : ''}{title}
      </Text>
      {actionText && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.action}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  title: {
    color: BrandColors.textDark,
    fontSize: 18,
    fontWeight: '800',
  },
  action: {
    color: BrandColors.accentPink,
    fontSize: 13,
    fontWeight: '700',
  },
});
