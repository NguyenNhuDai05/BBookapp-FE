import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { BrandColors, Radius, Spacing } from '../../constants/theme';
import { Strings } from '../../constants/strings';

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={styles.message}>{message || Strings.errorDefault}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton} activeOpacity={0.8}>
          <RefreshCw size={15} color={BrandColors.textWhite} />
          <Text style={styles.retryText}>{Strings.errorRetry}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.base,
    borderRadius: Radius.xl,
    backgroundColor: BrandColors.bgCard,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
  },
  message: {
    color: BrandColors.statusCancelled,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  retryButton: {
    marginTop: Spacing.base,
    backgroundColor: BrandColors.accentPink,
    borderRadius: Radius.base,
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  retryText: {
    color: BrandColors.textWhite,
    fontSize: 13,
    fontWeight: '900',
  },
});
