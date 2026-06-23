import React from 'react';
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { BrandColors } from '../../constants/theme';
import type { PortfolioImageDto } from '../../types/ArtistDto';

interface PortfolioTabProps {
  portfolio: PortfolioImageDto[];
  onItemPress?: (item: PortfolioImageDto) => void;
}

export function PortfolioTab({ portfolio, onItemPress }: PortfolioTabProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const numColumns = isDesktop ? 6 : 3;
  const gridGap = 2; // Instagram-like gap
  // MUA Detail Screen usually has padding. Let's assume full width or we subtract container padding if needed. 
  // Wait, looking at the layout, it might have no padding if we use negative margins, or just use `width` directly.
  const itemSize = Math.floor((width - (numColumns - 1) * gridGap) / numColumns);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {portfolio.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => onItemPress?.(item)}
            activeOpacity={0.9}
            style={[
              styles.gridItem,
              {
                width: itemSize,
                height: itemSize,
                marginBottom: gridGap,
                marginRight: (index + 1) % numColumns === 0 ? 0 : gridGap,
              }
            ]}
          >
            <Image source={{ uri: item.url }} style={styles.gridImage} contentFit="cover" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    backgroundColor: BrandColors.borderLight,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
});
