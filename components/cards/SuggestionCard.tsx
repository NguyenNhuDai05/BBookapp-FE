import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, Radius, Shadows } from '../../constants/theme';
import type { SuggestionItem } from '../../types/home';

interface SuggestionCardProps {
  item: SuggestionItem;
  onPress?: () => void;
}

export function SuggestionCard({ item, onPress }: SuggestionCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" />
      ) : (
        <LinearGradient
          colors={[BrandColors.gradientStart, BrandColors.accentPinkMedium] as const}
          style={styles.image}
        >
          {item.title ? <Text style={styles.fallbackText}>{item.title}</Text> : null}
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47.5%',
    aspectRatio: 0.85,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.card,
  },
  image: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: BrandColors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
});
