import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { BrandColors, Radius, Spacing } from '../../constants/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = Radius.md,
  style,
}: SkeletonLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as number, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

/** Skeleton list for loading states */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <View key={`skeleton-${i}`} style={styles.card}>
          <SkeletonLoader width={72} height={72} borderRadius={Radius.lg} />
          <View style={styles.cardBody}>
            <SkeletonLoader width="70%" height={16} />
            <SkeletonLoader width="50%" height={12} style={{ marginTop: Spacing.sm }} />
            <SkeletonLoader width="40%" height={12} style={{ marginTop: Spacing.sm }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Skeleton for card-style sections */
export function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <SkeletonLoader height={140} borderRadius={Radius.xl} />
      <SkeletonLoader width="60%" height={16} style={{ marginTop: Spacing.md }} />
      <SkeletonLoader width="40%" height={12} style={{ marginTop: Spacing.sm }} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: BrandColors.borderLight,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: BrandColors.bgCard,
  },
  cardBody: {
    flex: 1,
  },
  skeletonCard: {
    padding: Spacing.base,
    borderRadius: Radius.xl,
    backgroundColor: BrandColors.bgCard,
  },
});
