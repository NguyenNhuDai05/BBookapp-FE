import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, Radius, Spacing, Shadows } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import type { Promotion } from '../../types/home';

interface PromotionBannerProps {
  promotion: Promotion;
  onPress?: () => void;
}

export function PromotionBanner({ promotion, onPress }: PromotionBannerProps) {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[BrandColors.bgPink, BrandColors.bgPinkLight] as const}
        style={styles.gradient}
      >
        <Text style={styles.title}>{promotion.title}</Text>
        <Text style={styles.description}>{promotion.description}</Text>
        <View style={styles.footer}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{promotion.code}</Text>
            <Text style={styles.copyIcon}>📋</Text>
          </View>
          <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
            <LinearGradient
              colors={[BrandColors.accentPink, BrandColors.accentRose] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>{Strings.homeUseNow}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BrandColors.borderPink,
    ...Shadows.card,
  },
  gradient: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: BrandColors.accentRose,
    lineHeight: 26,
  },
  description: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.textBody,
    marginTop: Spacing.sm,
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.base,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: BrandColors.accentPink,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '900',
    color: BrandColors.accentPink,
  },
  copyIcon: {
    fontSize: 14,
  },
  ctaButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  ctaText: {
    color: BrandColors.textWhite,
    fontSize: 13,
    fontWeight: '800',
  },
});
