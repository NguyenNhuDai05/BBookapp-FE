import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Shadows } from '../../constants/theme';
import type { NearbySalon } from '../../types/home';

interface NearbySalonCardProps {
  salon: NearbySalon;
  onPress?: () => void;
}

export function NearbySalonCard({ salon, onPress }: NearbySalonCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      <View style={styles.imageContainer}>
        {salon.imageUrl ? (
          <Image source={{ uri: salon.imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={[BrandColors.bgPinkSoft, BrandColors.gradientStart] as const}
            style={styles.image}
          />
        )}
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{salon.distance}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{salon.name}</Text>
        <View style={styles.ratingRow}>
          <Star size={12} color={BrandColors.accentGold} fill={BrandColors.accentGold} />
          <Text style={styles.ratingText}>{salon.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({salon.reviewCount} đánh giá)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 172,
    backgroundColor: BrandColors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    overflow: 'hidden',
    ...Shadows.card,
  },
  imageContainer: {
    height: 130,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  distanceBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: BrandColors.accentPink,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  distanceText: {
    color: BrandColors.textWhite,
    fontSize: 11,
    fontWeight: '800',
  },
  body: {
    padding: Spacing.md,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.textDark,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.textDark,
  },
  reviewCount: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.textMuted,
  },
});
