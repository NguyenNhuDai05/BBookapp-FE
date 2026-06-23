import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Shadows } from '../../constants/theme';
import type { FavoriteMUA } from '../../types/home';

interface FavoriteMUACardProps {
  mua: FavoriteMUA;
  onPress?: () => void;
}

export function FavoriteMUACard({ mua, onPress }: FavoriteMUACardProps) {
  const initials = mua.name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      <View style={styles.avatarWrapper}>
        {mua.avatarUrl ? (
          <Image source={{ uri: mua.avatarUrl }} style={styles.avatar} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={[BrandColors.gradientStart, BrandColors.gradientEnd] as const}
            style={styles.avatarFallback}
          >
            <Text style={styles.initials}>{initials}</Text>
          </LinearGradient>
        )}
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.name} numberOfLines={1}>{mua.name}</Text>
        <View style={styles.ratingPill}>
          <Star size={11} color={BrandColors.accentGold} fill={BrandColors.accentGold} />
          <Text style={styles.ratingText}>{mua.rating.toFixed(1)}</Text>
        </View>
      </View>
      <Text style={styles.specialty} numberOfLines={1}>{mua.specialty}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 152,
    backgroundColor: BrandColors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    padding: Spacing.md,
    ...Shadows.card,
  },
  avatarWrapper: {
    width: 128,
    height: 120,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: BrandColors.textWhite,
    fontSize: 28,
    fontWeight: '900',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.textDark,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.textDark,
  },
  specialty: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.textSecondary,
    marginTop: 2,
  },
});
