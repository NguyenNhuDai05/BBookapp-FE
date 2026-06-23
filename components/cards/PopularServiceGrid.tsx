import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Scissors, Sparkles, BookOpen, Camera } from 'lucide-react-native';
import { BrandColors, Radius, Spacing } from '../../constants/theme';
import type { PopularService } from '../../types/home';

interface PopularServiceGridProps {
  services: PopularService[];
  onServicePress?: (service: PopularService) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  heart: <Scissors size={26} color={BrandColors.accentPink} />,
  sparkles: <Sparkles size={26} color={BrandColors.accentPink} />,
  'graduation-cap': <BookOpen size={26} color={BrandColors.accentPink} />,
  camera: <Camera size={26} color={BrandColors.accentPink} />,
  star: <Sparkles size={26} color={BrandColors.accentPink} />,
  crown: <Sparkles size={26} color={BrandColors.accentPink} />,
};

export function PopularServiceGrid({ services, onServicePress }: PopularServiceGridProps) {
  const displayServices = services.slice(0, 4);

  return (
    <View style={styles.grid}>
      {displayServices.map((service) => (
        <TouchableOpacity
          key={service.id}
          style={styles.item}
          onPress={() => onServicePress?.(service)}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            {ICON_MAP[service.icon] || <Sparkles size={26} color={BrandColors.accentPink} />}
          </View>
          <Text style={styles.label}>{service.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  item: {
    width: '47%',
    backgroundColor: BrandColors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColors.bgPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.textDark,
  },
});
