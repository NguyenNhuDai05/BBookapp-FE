import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, MapPin, CalendarCheck } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Shadows } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import type { FeaturedExpert } from '../../types/home';

interface ExpertCardProps {
  expert: FeaturedExpert;
  onPress?: () => void;
}

export function ExpertCard({ expert, onPress }: ExpertCardProps) {
  const initials = expert.name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatarWrapper}>
          {expert.avatarUrl ? (
            <Image source={{ uri: expert.avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <LinearGradient
              colors={[BrandColors.gradientStart, BrandColors.gradientEnd] as const}
              style={styles.avatarFallback}
            >
              <Text style={styles.initials}>{initials}</Text>
            </LinearGradient>
          )}
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{expert.name}</Text>
            <View style={styles.ratingBadge}>
              <Star size={12} color={BrandColors.accentGold} fill={BrandColors.accentGold} />
              <Text style={styles.ratingText}>{expert.rating.toFixed(1)}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <CalendarCheck size={13} color={BrandColors.textSecondary} />
            <Text style={styles.metaText}>{expert.bookingsCount}+ {Strings.bookings}</Text>
          </View>
          <View style={styles.metaRow}>
            <MapPin size={13} color={BrandColors.textSecondary} />
            <Text style={styles.metaText}>{expert.location}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.profileButton}>
        <Text style={styles.profileButtonText}>{Strings.exploreViewProfile}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    backgroundColor: BrandColors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    padding: Spacing.base,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: BrandColors.textWhite,
    fontSize: 20,
    fontWeight: '900',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.textDark,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: BrandColors.bgPink,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '900',
    color: BrandColors.accentPink,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.textSecondary,
  },
  profileButton: {
    marginTop: Spacing.md,
    alignSelf: 'flex-end',
    borderWidth: 1.5,
    borderColor: BrandColors.accentPink,
    borderRadius: Radius.base,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  profileButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.accentPink,
  },
});
