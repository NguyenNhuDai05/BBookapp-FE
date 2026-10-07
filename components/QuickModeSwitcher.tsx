import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AccountMenuTokens, BrandColors, Radius } from '../constants/theme';
import { AccountAvatar } from './AccountAvatar';
import { AccountModeSheet } from './AccountModeSheet';
import { useAppMode } from '../hooks/useAppMode';
import { useAuthStore } from '../store/useAuthStore';

export function QuickModeSwitcher({ avatarUrl, onProfilePress }: { avatarUrl?: string; onProfilePress?: () => void }) {
  const [visible, setVisible] = useState(false);
  const user = useAuthStore(state => state.user);
  const uri = avatarUrl || user?.avatarUrl || user?.avatar;
  const { isModeSwitching } = useAppMode();
  return <View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mở tài khoản và chuyển chế độ"
      accessibilityState={{ expanded: visible, disabled: isModeSwitching, busy: isModeSwitching }}
      disabled={isModeSwitching} onPress={() => setVisible(true)} style={styles.trigger}>
      {isModeSwitching ? <ActivityIndicator size="small" color={BrandColors.accentRose} /> : <AccountAvatar uri={uri} />}
    </TouchableOpacity>
    <AccountModeSheet visible={visible} onClose={() => setVisible(false)} avatarUrl={uri} onProfilePress={onProfilePress} />
  </View>;
}

const styles = StyleSheet.create({
  trigger: { width: AccountMenuTokens.touchSize, height: AccountMenuTokens.touchSize, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full, backgroundColor: BrandColors.bgCard },
});
