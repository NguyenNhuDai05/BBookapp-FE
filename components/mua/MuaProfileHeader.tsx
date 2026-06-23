import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CheckCircle2, Heart, MessageSquare, Share2, Star } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Shadows } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import type { ArtistDto } from '../../types/ArtistDto';

interface MuaProfileHeaderProps {
  mua: ArtistDto;
  isLiked: boolean;
  onBack: () => void;
  onToggleLike: () => void;
  onBook: () => void;
  onMessage: () => void;
  onShare?: () => void;
}

export function MuaProfileHeader({
  mua,
  isLiked,
  onBack,
  onToggleLike,
  onBook,
  onMessage,
  onShare,
}: MuaProfileHeaderProps) {
  const getAvatarFallback = (name: string) => {
    if (!name) return 'M';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  const initials = getAvatarFallback(mua.name);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[BrandColors.bgPink, BrandColors.bgPrimary, BrandColors.bgCard] as const}
        style={styles.gradient}
      >
        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={onBack} style={styles.navButton}>
            <ArrowLeft size={20} color={BrandColors.accentPink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hồ sơ chuyên gia</Text>
          <View style={styles.navRight}>
            {onShare && (
              <TouchableOpacity onPress={onShare} style={styles.navButton}>
                <Share2 size={18} color={BrandColors.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onToggleLike} style={styles.navButton}>
              <Heart
                size={20}
                color={isLiked ? BrandColors.accentPink : BrandColors.textSecondary}
                fill={isLiked ? BrandColors.accentPink : 'none'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            {mua.avatar ? (
              <Image source={{ uri: mua.avatar }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <LinearGradient
                colors={[BrandColors.gradientStart, BrandColors.gradientEnd] as const}
                style={styles.avatarFallback}
              >
                <Text style={styles.avatarInitials}>{initials}</Text>
              </LinearGradient>
            )}
            <View style={styles.verifiedBadge}>
              <CheckCircle2 size={22} color={BrandColors.textWhite} fill={BrandColors.verified} />
            </View>
          </View>
        </View>

        {/* Name & Title */}
        <Text style={styles.name}>{mua.name}</Text>
        <Text style={styles.title}>
          {mua.specialties.join(' • ').toUpperCase()} • MAKEUP ARTIST
        </Text>

        {/* Badges */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <CheckCircle2 size={12} color={BrandColors.statusConfirmed} />
            <Text style={styles.badgeText}>{Strings.muaVerified}</Text>
          </View>
          <View style={styles.badge}>
            <Star size={12} color={BrandColors.accentGold} fill={BrandColors.accentGold} />
            <Text style={styles.badgeText}>{Strings.muaTopArtist}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              <Star size={14} color={BrandColors.accentPink} /> {mua.rating.toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>{Strings.muaRating}</Text>
          </View>
          <View style={[styles.statItem, styles.statBorder]}>
            <Text style={styles.statValue}>✓ {mua.reviewCount}</Text>
            <Text style={styles.statLabel}>{Strings.muaCompleted}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>📋 {mua.portfolioImages?.length || 0}</Text>
            <Text style={styles.statLabel}>{Strings.muaPortfolio}</Text>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaRow}>
          <TouchableOpacity onPress={onBook} activeOpacity={0.85} style={styles.bookButtonWrapper}>
            <LinearGradient
              colors={[BrandColors.accentPink, BrandColors.accentRose] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookButton}
            >
              <Text style={styles.bookButtonText}>{Strings.muaBookNow}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={onMessage} activeOpacity={0.85} style={styles.messageButton}>
            <MessageSquare size={16} color={BrandColors.accentPink} />
            <Text style={styles.messageButtonText}>{Strings.muaMessage}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gradient: {
    paddingBottom: Spacing.lg,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.textDark,
  },
  navRight: {
    flexDirection: 'row',
    gap: 4,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: BrandColors.gradientStart,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: BrandColors.textWhite,
    fontSize: 36,
    fontWeight: '800',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: BrandColors.bgCard,
    borderRadius: 12,
  },
  name: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
    color: BrandColors.textDark,
    marginTop: Spacing.md,
  },
  title: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.accentPinkMedium,
    letterSpacing: 1,
    marginTop: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BrandColors.bgPink,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.textDark,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.base,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    backgroundColor: BrandColors.bgCard,
    ...Shadows.card,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: BrandColors.borderLight,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.textDark,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.textSecondary,
    marginTop: 2,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.base,
  },
  bookButtonWrapper: {
    flex: 1,
  },
  bookButton: {
    height: 48,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  bookButtonText: {
    color: BrandColors.textWhite,
    fontSize: 15,
    fontWeight: '800',
  },
  messageButton: {
    flex: 1,
    height: 48,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: BrandColors.accentPink,
    backgroundColor: BrandColors.bgCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  messageButtonText: {
    color: BrandColors.accentPink,
    fontSize: 15,
    fontWeight: '800',
  },
});
