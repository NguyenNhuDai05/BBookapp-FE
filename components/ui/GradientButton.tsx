import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, Radius, Shadows } from '../../constants/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
  size?: 'default' | 'small';
}

export function GradientButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  variant = 'primary',
  style,
  size = 'default',
}: GradientButtonProps) {
  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.outlineButton,
          size === 'small' && styles.smallButton,
          disabled && styles.disabled,
          style,
        ]}
      >
        {icon}
        <Text style={[styles.outlineText, size === 'small' && styles.smallText]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={[BrandColors.accentPink, BrandColors.accentRose] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradientButton,
          size === 'small' && styles.smallButton,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={BrandColors.textWhite} />
        ) : (
          <>
            {icon}
            <Text style={[styles.gradientText, size === 'small' && styles.smallText]}>
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradientButton: {
    height: 50,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    ...Shadows.soft,
  },
  smallButton: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: Radius.base,
  },
  gradientText: {
    color: BrandColors.textWhite,
    fontSize: 15,
    fontWeight: '800',
  },
  smallText: {
    fontSize: 13,
  },
  outlineButton: {
    height: 50,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: BrandColors.accentPink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    backgroundColor: BrandColors.bgCard,
  },
  outlineText: {
    color: BrandColors.accentPink,
    fontSize: 15,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.55,
  },
});
