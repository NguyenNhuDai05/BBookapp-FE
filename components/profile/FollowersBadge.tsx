import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, Users } from 'lucide-react-native';
import { BrandColors } from '../../constants/theme';

type Props = { count?: number; loading?: boolean; error?: boolean; onPress?: () => void; onRetry?: () => void };
export function FollowersBadge({ count, loading, error, onPress, onRetry }: Props) {
  if (loading && count == null) return <View accessibilityLabel="Đang tải người theo dõi" style={styles.badge}><ActivityIndicator color={BrandColors.accentPink} /></View>;
  if (error) return <TouchableOpacity accessibilityRole="button" onPress={onRetry} style={styles.badge}><Text style={styles.label}>Tải lại số người theo dõi</Text></TouchableOpacity>;
  if (count == null) return null;
  const content = <><View style={styles.icon}><Users size={16} color={BrandColors.accentPink} /></View><Text style={styles.count}>{count.toLocaleString('vi-VN')}</Text><Text style={styles.label}>người theo dõi</Text>{onPress ? <ChevronRight size={16} color={BrandColors.textMuted} /> : null}</>;
  return onPress ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${count} người theo dõi. Xem danh sách`} onPress={onPress} style={styles.badge}>{content}</TouchableOpacity> : <View style={styles.badge}>{content}</View>;
}
const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, paddingVertical: 6, paddingLeft: 6, paddingRight: 14, borderRadius: 22, backgroundColor: '#FFF0F5', borderWidth: 1, borderColor: '#F8DCE6' },
  icon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  count: { fontSize: 14, fontWeight: '700', color: BrandColors.textDark }, label: { fontSize: 13, color: BrandColors.textBody },
});
