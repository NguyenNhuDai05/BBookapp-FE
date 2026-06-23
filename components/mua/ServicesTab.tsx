import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, ArrowRight } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Shadows } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import type { ServiceDto } from '../../types/ServiceDto';

interface ServicesTabProps {
  services: ServiceDto[];
  onBookService: (service: ServiceDto) => void;
}

export function ServicesTab({
  services,
  onBookService,
}: ServicesTabProps) {
  return (
    <View style={styles.container}>
      {services.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{Strings.muaNoServices}</Text>
        </View>
      ) : (
        services.map((service) => (
          <View key={service.id} style={styles.card}>
            <View style={styles.cardInner}>
              <View style={styles.thumbnail}>
                <LinearGradient
                  colors={[BrandColors.gradientStart, BrandColors.accentPinkMedium] as const}
                  style={styles.thumbnailGradient}
                >
                  <Text style={styles.thumbnailEmoji}>💄</Text>
                </LinearGradient>
              </View>
              <View style={styles.info}>
                <Text style={styles.serviceName} numberOfLines={2}>{service.name}</Text>
                <View style={styles.durationRow}>
                  <Clock size={13} color={BrandColors.textMuted} />
                  <Text style={styles.durationText}>{service.durationMinutes} {"ph\u00FAt"}</Text>
                </View>
                <Text style={styles.price}>{service.price.toLocaleString('vi-VN')}đ</Text>
              </View>
              <TouchableOpacity
                onPress={() => onBookService(service)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[BrandColors.accentPink, BrandColors.accentRose] as const}
                  style={styles.chooseButton}
                >
                  <Text style={styles.chooseText}>Đặt lịch</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    paddingBottom: 100,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: BrandColors.textMuted,
    fontWeight: '500',
  },
  card: {
    backgroundColor: BrandColors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginRight: Spacing.base,
  },
  thumbnailGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailEmoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.textDark,
    marginBottom: 4,
    lineHeight: 20,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  durationText: {
    fontSize: 12,
    color: BrandColors.textMuted,
    marginLeft: 4,
    fontWeight: '500',
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.accentPink,
  },
  chooseButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    minWidth: 86,
    alignItems: 'center',
    ...Shadows.card,
  },
  chooseText: {
    color: BrandColors.textWhite,
    fontSize: 13,
    fontWeight: '800',
  },
});
