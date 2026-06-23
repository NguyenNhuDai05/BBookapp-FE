import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { ChevronRight } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography } from '../constants/theme';
import type { SelectedServiceDto } from '../types/booking';

interface BookingServiceListProps {
  services: SelectedServiceDto[];
}

export function BookingServiceList({ services }: BookingServiceListProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  
  if (!services || services.length === 0) return null;

  const handleScrollRight = () => {
    scrollViewRef.current?.scrollTo({ x: 300, animated: true }); // arbitrary scroll amount
  };

  const getValidImageUrl = (url?: string) => {
    if (!url || url === 'null' || url === 'undefined' || url.trim() === '') {
      return 'https://images.unsplash.com/photo-1512496015851-a1c8ce9015c3?q=80&w=200&auto=format&fit=crop';
    }
    return url;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {services.map((s, idx) => (
          <View key={s.id || idx} style={styles.serviceItem}>
            <Image 
              source={getValidImageUrl(s.imageUrl)} 
              style={styles.serviceImage} 
              contentFit="cover"
              transition={200}
            />
            <Text style={styles.serviceName} numberOfLines={2}>
              {s.name || 'Dịch vụ'} (x{s.participantsCount || 1})
            </Text>
          </View>
        ))}
      </ScrollView>
      {services.length > 3 && (
        <TouchableOpacity 
          style={styles.arrowButton} 
          onPress={handleScrollRight}
          activeOpacity={0.7}
        >
          <View style={styles.arrowCircle}>
            <ChevronRight size={16} color={BrandColors.textDark} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  scrollContent: {
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  serviceItem: {
    width: 80,
    alignItems: 'flex-start',
    marginRight: Spacing.sm,
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    backgroundColor: BrandColors.bgPrimary,
    marginBottom: 6,
  },
  serviceName: {
    fontFamily: Typography.medium,
    fontSize: 12,
    color: BrandColors.textDark,
    lineHeight: 16,
    textAlign: 'left',
  },
  arrowButton: {
    position: 'absolute',
    right: -10,
    top: 30, // vertically center relative to the 80px image
    zIndex: 10,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
