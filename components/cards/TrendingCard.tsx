import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Bookmark } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Shadows } from '../../constants/theme';
import type { TrendingItem } from '../../types/home';

interface TrendingCardProps {
  item: TrendingItem;
  onPress?: () => void;
}

export function TrendingCard({ item, onPress }: TrendingCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={[BrandColors.gradientStart, BrandColors.accentRose] as const}
            style={styles.image}
          />
        )}
        <View style={styles.heartBadge}>
          <Heart size={12} color={BrandColors.textWhite} fill={BrandColors.accentPink} />
          <Text style={styles.heartCount}>
            {item.likesCount >= 1000
              ? `${(item.likesCount / 1000).toFixed(1)}k`
              : item.likesCount}
          </Text>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Bookmark size={16} color={BrandColors.textMuted} />
        </View>
        <View style={[styles.tag, { backgroundColor: item.categoryColor || BrandColors.bgPink }]}>
          <Text style={styles.tagText}>{item.categoryTag}</Text>
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
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  heartCount: {
    color: BrandColors.textWhite,
    fontSize: 11,
    fontWeight: '800',
  },
  body: {
    padding: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.textDark,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.accentPink,
  },
});
