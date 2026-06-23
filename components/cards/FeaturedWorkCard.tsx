import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, Radius, Spacing, Shadows } from '../../constants/theme';
import type { FeaturedWork } from '../../types/home';

interface FeaturedWorkCardProps {
  work: FeaturedWork;
  onPress?: () => void;
}

export function FeaturedWorkCard({ work, onPress }: FeaturedWorkCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      {work.imageUrl ? (
        <Image source={{ uri: work.imageUrl }} style={styles.image} contentFit="cover" />
      ) : (
        <LinearGradient
          colors={['#2A1B35', '#8D6674'] as const}
          style={styles.image}
        />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)'] as const}
        style={styles.overlay}
      >
        <Text style={styles.subtitle} numberOfLines={1}>{work.subtitle}</Text>
        <Text style={styles.title} numberOfLines={2}>{work.title}</Text>
        <Text style={styles.author} numberOfLines={1}>by {work.authorName}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    height: 200,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    paddingTop: Spacing.xl,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: BrandColors.textWhite,
    marginTop: 2,
  },
  author: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.xs,
  },
});
