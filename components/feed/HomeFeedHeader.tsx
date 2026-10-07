import React from 'react';
import { QuickModeSwitcher } from '../QuickModeSwitcher';
import { Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell } from 'lucide-react-native';
import { AccountMenuTokens, BrandColors, Radius, Spacing } from '../../constants/theme';

interface HomeFeedHeaderProps {
  avatarUrl?: string;
  unreadCount: number;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
}

export function HomeFeedHeader({ avatarUrl, unreadCount, onNotificationsPress, onProfilePress }: HomeFeedHeaderProps) {
  const { width } = useWindowDimensions();
  const actionsWidth = AccountMenuTokens.touchSize * 2 + Spacing.sm;
  const logoWidth = Math.max(0, Math.min(166, width - Spacing.base * 4 - actionsWidth - Spacing.sm));
  const logoScale = logoWidth / 166;
  return (
    <LinearGradient colors={[BrandColors.gradientHeaderStart, BrandColors.gradientHeaderEnd]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
      {/* B.png has generous transparent margins. Clip those margins in layout without modifying the asset. */}
      <View style={[styles.logoFrame, { width: logoWidth, height: 70 * logoScale }]} accessible accessibilityRole="image" accessibilityLabel="B-Book">
        <Image source={require('../../assets/images/B.png')} resizeMode="contain"
          style={{ position: 'absolute', width: 265 * logoScale, height: 265 * logoScale, left: -46 * logoScale, top: -101.7 * logoScale }} />
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={onNotificationsPress} accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Thông báo'}>
          <Bell size={22} color={BrandColors.accentPink} />
          {unreadCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View> : null}
        </TouchableOpacity>
        <QuickModeSwitcher avatarUrl={avatarUrl} onProfilePress={onProfilePress} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { marginHorizontal: Spacing.base, marginTop: Spacing.sm, marginBottom: Spacing.base, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  logoFrame: { overflow: 'hidden', flexShrink: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 0 },
  button: { width: AccountMenuTokens.touchSize, height: AccountMenuTokens.touchSize, borderRadius: Radius.full, backgroundColor: BrandColors.bgCard, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: -4, top: -5, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: Radius.full,
    backgroundColor: BrandColors.accentRose, borderWidth: 2, borderColor: BrandColors.bgCard, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: BrandColors.textWhite, fontSize: 10, fontWeight: '700' },
});
