import React, { useState } from 'react';
import { QuickModeSwitcher } from '../QuickModeSwitcher';
import { Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, CircleUserRound } from 'lucide-react-native';
import { BrandColors, Radius, Spacing } from '../../constants/theme';

interface HomeFeedHeaderProps {
  avatarUrl?: string;
  unreadCount: number;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
}

export function HomeFeedHeader({ avatarUrl, unreadCount, onNotificationsPress, onProfilePress }: HomeFeedHeaderProps) {
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const logoWidth = Math.max(84, Math.min(166, width - Spacing.base * 4 - 104));
  const logoScale = logoWidth / 166;
  const showAvatar = Boolean(avatarUrl && failedAvatar !== avatarUrl);
  return (
    <LinearGradient colors={[BrandColors.gradientHeaderStart, BrandColors.gradientHeaderEnd]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
      {/* B.png has generous transparent margins. Clip those margins in layout without modifying the asset. */}
      <View style={styles.identity}>
      <View style={[styles.logoFrame, { width: logoWidth, height: 70 * logoScale }]} accessible accessibilityRole="image" accessibilityLabel="B-Book">
        <Image source={require('../../assets/images/B.png')} resizeMode="contain"
          style={{ position: 'absolute', width: 265 * logoScale, height: 265 * logoScale, left: -46 * logoScale, top: -101.7 * logoScale }} />
      </View>
      <QuickModeSwitcher />
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={onNotificationsPress} accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Thông báo'}>
          <Bell size={22} color={BrandColors.accentPink} />
          {unreadCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View> : null}
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onProfilePress} accessibilityRole="button" accessibilityLabel="Tài khoản của bạn">
          {showAvatar ? <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" onError={() => setFailedAvatar(avatarUrl || null)} />
            : <CircleUserRound size={27} color={BrandColors.accentPink} />}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { marginHorizontal: Spacing.base, marginTop: Spacing.sm, marginBottom: Spacing.base, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  identity: { flex: 1 },
  logoFrame: { overflow: 'hidden', flexShrink: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 0 },
  button: { width: 44, height: 44, borderRadius: Radius.full, backgroundColor: BrandColors.bgCard, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 44, height: 44, borderRadius: Radius.full },
  badge: { position: 'absolute', right: -4, top: -5, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: Radius.full,
    backgroundColor: BrandColors.accentRose, borderWidth: 2, borderColor: BrandColors.bgCard, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: BrandColors.textWhite, fontSize: 10, fontWeight: '700' },
});
