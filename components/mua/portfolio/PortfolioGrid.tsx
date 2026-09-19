import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { PortfolioItemDto } from '../../../types/portfolio';
import { BrandColors, Radius, Spacing, Typography } from '../../../constants/theme';
import { Star, Trash2 } from 'lucide-react-native';

interface PortfolioGridProps {
  items: PortfolioItemDto[];
  onDelete: (id: string) => void;
}

export function PortfolioGrid({ items, onDelete }: PortfolioGridProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const numColumns = isDesktop ? 6 : 3;
  const gridGap = 2;
  // Subtracting the Spacing.md * 2 padding that the parent ScrollView applies (32px total)
  const itemSize = Math.floor((width - 40 - (numColumns - 1) * gridGap) / numColumns);

  if (items.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Chưa có ảnh Portfolio.</Text>
        <Text style={styles.emptySubText}>Hãy tải lên các hình ảnh đẹp nhất để thu hút khách hàng.</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {items.map((item, index) => (
        <View 
          key={item.id} 
          style={[
            styles.itemContainer,
            {
              width: itemSize,
              height: itemSize,
              marginBottom: gridGap,
              marginRight: (index + 1) % numColumns === 0 ? 0 : gridGap,
            }
          ]}
        >
          <Image 
            source={item.imageUrl} 
            style={styles.image} 
            contentFit="cover" 
            transition={200}
          />
          
          {/* Overlay Actions */}
          <View style={styles.overlayActions}>
            <TouchableOpacity 
              style={styles.deleteBtn} 
              onPress={() => onDelete(item.id)}
            >
              <Trash2 size={14} color="#FFF" />
            </TouchableOpacity>
          </View>

          {item.isCover && (
            <View style={styles.coverBadge}>
              <Star size={10} color="#FFF" fill="#FFF" />
              <Text style={styles.coverText}>Ảnh bìa</Text>
            </View>
          )}

        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyState: {
    padding: Spacing.xl,
    backgroundColor: BrandColors.bgPink,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    width: '100%',
  },
  emptyText: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.accentRose,
    marginBottom: Spacing.sm,
  },
  emptySubText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: BrandColors.textMuted,
    textAlign: 'center',
  },
  itemContainer: {
    backgroundColor: BrandColors.borderLight,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: BrandColors.statusConfirmed,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    gap: 2,
  },
  coverText: {
    color: '#FFF',
    fontSize: 8,
    fontFamily: Typography.bold,
  },
  overlayActions: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  deleteBtn: {
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 4,
    borderRadius: Radius.sm,
  },
});
