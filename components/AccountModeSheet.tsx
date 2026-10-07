import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AccountMenuTokens, BrandColors, Radius, Spacing, Typography } from '../constants/theme';
import { AppBottomSheet } from './ui/AppBottomSheet';
import { AccountAvatar } from './AccountAvatar';
import { useAppMode } from '../hooks/useAppMode';
import { useAuthStore } from '../store/useAuthStore';
import type { AppMode } from '../utils/appMode';

const labels = { CUSTOMER: 'Khách hàng', MUA: 'Chuyên viên trang điểm' };
const descriptions = { CUSTOMER: 'Đặt lịch và khám phá chuyên viên', MUA: 'Quản lý lịch và khách hàng' };

export function AccountModeSheet({ visible, onClose, avatarUrl, onProfilePress }: { visible: boolean; onClose: () => void; avatarUrl?: string; onProfilePress?: () => void }) {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const uri = avatarUrl || user?.avatarUrl || user?.avatar;
  const { activeMode, isModeSwitching, hasMuaAccess, selectMode } = useAppMode();
  const select = async (mode: AppMode) => {
    if (isModeSwitching) return;
    if (mode === activeMode) { onClose(); return; }
    onClose();
    await selectMode(mode);
  };
  const openAccount = () => {
    onClose();
    if (onProfilePress) onProfilePress();
    else router.push(activeMode === 'MUA' ? '/(mua)/profile' : '/(tabs)/profile');
  };
  return (
    <AppBottomSheet visible={visible} title="Tài khoản" loading={isModeSwitching} onClose={() => onClose()}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.identity}>
          <AccountAvatar uri={uri} />
          <View style={styles.copy}>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{user?.name || 'Tài khoản của bạn'}</Text>
            {user?.email ? <Text style={styles.description} numberOfLines={1} ellipsizeMode="middle">{user.email}</Text> : null}
          </View>
        </View>
        <Text style={styles.section}>Đang sử dụng</Text>
        {(['CUSTOMER', 'MUA'] as const).filter(mode => mode === 'CUSTOMER' || hasMuaAccess).map(mode => {
          const selected = activeMode === mode;
          return <TouchableOpacity key={mode} accessibilityRole="button" accessibilityLabel={labels[mode]}
            accessibilityState={{ selected, disabled: isModeSwitching, busy: isModeSwitching }} disabled={isModeSwitching}
            style={[styles.item, selected && styles.selected]} onPress={() => { void select(mode); }}>
            <View style={styles.check}>{selected ? <Check size={21} color={BrandColors.accentRose} /> : null}</View>
            <View style={styles.copy}><Text style={styles.label}>{labels[mode]}</Text><Text style={styles.description}>{descriptions[mode]}</Text></View>
          </TouchableOpacity>;
        })}
        <View style={styles.divider} />
        {!hasMuaAccess ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Trở thành chuyên viên trang điểm"
          accessibilityState={{ disabled: isModeSwitching }} disabled={isModeSwitching} style={styles.item}
          onPress={() => { onClose(); router.push('/mua-onboarding'); }}>
          <View style={styles.copy}><Text style={styles.label}>Trở thành chuyên viên trang điểm</Text>
            <Text style={styles.description}>Tạo hồ sơ và bắt đầu nhận booking</Text></View>
          <ChevronRight size={19} color={BrandColors.textSecondary} />
        </TouchableOpacity> : null}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Tài khoản" disabled={isModeSwitching}
          accessibilityState={{ disabled: isModeSwitching }} style={styles.item} onPress={openAccount}>
          <Text style={[styles.label, styles.copy]}>Tài khoản</Text><ChevronRight size={19} color={BrandColors.textSecondary} />
        </TouchableOpacity>
        {activeMode === 'MUA' ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cài đặt" disabled={isModeSwitching}
          accessibilityState={{ disabled: isModeSwitching }} style={styles.item}
          onPress={() => { onClose(); router.push('/(mua)/settings'); }}>
          <Text style={[styles.label, styles.copy]}>Cài đặt</Text><ChevronRight size={19} color={BrandColors.textSecondary} />
        </TouchableOpacity> : null}
      </ScrollView>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.base },
  copy: { flex: 1, minWidth: 0 },
  name: { fontFamily: Typography.bold, fontSize: 17, color: BrandColors.textDark },
  section: { fontFamily: Typography.semiBold, fontSize: 12, color: BrandColors.textSecondary, marginBottom: Spacing.sm },
  label: { flexShrink: 1, fontFamily: Typography.semiBold, fontSize: 14, color: BrandColors.textDark },
  description: { fontFamily: Typography.regular, fontSize: 12, color: BrandColors.textBody, marginTop: Spacing.xs },
  item: { minHeight: AccountMenuTokens.rowHeight, paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.md },
  selected: { backgroundColor: BrandColors.bgPinkLight },
  check: { width: 24, alignItems: 'center' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: BrandColors.borderLight, marginVertical: Spacing.sm },
});
