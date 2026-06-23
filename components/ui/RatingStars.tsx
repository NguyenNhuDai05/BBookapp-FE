import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { BrandColors } from '../../constants/theme';

interface RatingStarsProps {
  rating: number;
  size?: number;
  color?: string;
}

export function RatingStars({
  rating,
  size = 14,
  color = BrandColors.accentGold,
}: RatingStarsProps) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={size}
          color={color}
          fill={value <= Math.round(rating) ? color : 'transparent'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
