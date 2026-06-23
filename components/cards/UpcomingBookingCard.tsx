import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Shadows } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import type { UpcomingBooking } from '../../types/home';

interface UpcomingBookingCardProps {
  booking: UpcomingBooking;
  onPress?: () => void;
}

export function UpcomingBookingCard({ booking, onPress }: UpcomingBookingCardProps) {
  const statusColor = booking.status === 'confirmed'
    ? BrandColors.statusConfirmed
    : BrandColors.statusPending;
  const statusBg = booking.status === 'confirmed'
    ? BrandColors.statusConfirmedBg
    : BrandColors.statusPendingBg;
  const statusLabel = booking.status === 'confirmed'
    ? Strings.homeStatusConfirmed
    : Strings.homeStatusPending;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      <View style={styles.imageSection}>
        {booking.imageUrl ? (
          <Image source={{ uri: booking.imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={[BrandColors.gradientStart, BrandColors.gradientEnd] as const}
            style={styles.imagePlaceholder}
          >
            <Text style={styles.placeholderEmoji}>💄</Text>
          </LinearGradient>
        )}
      </View>
      <View style={styles.body}>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <Text style={styles.serviceName} numberOfLines={1}>{booking.serviceName}</Text>
        <Text style={styles.muaName} numberOfLines={1}>& {booking.muaName}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Calendar size={13} color={BrandColors.textSecondary} />
            <Text style={styles.metaLabel}>NGÀY</Text>
            <Text style={styles.metaValue}>{booking.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={13} color={BrandColors.textSecondary} />
            <Text style={styles.metaLabel}>THỜI GIAN</Text>
            <Text style={styles.metaValue}>{booking.time}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
          <LinearGradient
            colors={[BrandColors.accentPink, BrandColors.accentRose] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.detailButton}
          >
            <Text style={styles.detailButtonText}>{Strings.homeViewDetail}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: BrandColors.bgCard,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    overflow: 'hidden',
    ...Shadows.card,
  },
  imageSection: {
    height: 160,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  body: {
    padding: Spacing.base,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.textDark,
  },
  muaName: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  metaItem: {
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.textMuted,
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.textDark,
  },
  detailButton: {
    height: 42,
    borderRadius: Radius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailButtonText: {
    color: BrandColors.textWhite,
    fontSize: 14,
    fontWeight: '800',
  },
});
