import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, CheckCircle2, ChevronRight, Circle } from 'lucide-react-native';
import { BrandColors, Radius, Shadows, Spacing, Typography } from '../../constants/theme';
import type { MuaEligibility } from '../../types/muaEligibility';

interface Props {
  eligibility: MuaEligibility;
  onContinue: () => void;
  compact?: boolean;
}

export function MuaCompletionCard({ eligibility, onContinue, compact = false }: Props) {
  const suspended = eligibility.profileStatus === 'SUSPENDED';
  const ready = eligibility.canReceiveBookings;
  const nextItems = eligibility.missingRequirements.slice(0, compact ? 2 : 3);

  if (suspended) {
    return (
      <View style={[styles.card, styles.warningCard]}>
        <View style={styles.titleRow}><AlertTriangle size={21} color={BrandColors.statusCancelled} /><Text style={styles.title}>Tài khoản MUA đang tạm ngưng</Text></View>
        <Text style={styles.description}>Bạn hiện không thể nhận booking. Vui lòng kiểm tra thông báo tài khoản hoặc liên hệ hỗ trợ.</Text>
      </View>
    );
  }

  if (ready) {
    return (
      <View style={[styles.card, styles.successCard]}>
        <View style={styles.titleRow}><CheckCircle2 size={21} color={BrandColors.statusConfirmed} /><Text style={styles.title}>Hồ sơ đang hoạt động</Text></View>
        <Text style={styles.description}>Bạn đã sẵn sàng nhận booking từ khách hàng.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.progressHeader}>
        <View><Text style={styles.eyebrow}>HOÀN THIỆN HỒ SƠ</Text><Text style={styles.title}>Sẵn sàng để khách hàng tìm thấy bạn</Text></View>
        <Text style={styles.percent}>{eligibility.completionPercentage}%</Text>
      </View>
      <View style={styles.track}><View style={[styles.fill, { width: `${eligibility.completionPercentage}%` }]} /></View>
      <Text style={styles.description}>Hồ sơ của bạn chưa được công khai. Hoàn thành các mục còn thiếu để bắt đầu nhận booking.</Text>
      {nextItems.map(item => (
        <View key={item.key} style={styles.requirementRow}>
          <Circle size={15} color={BrandColors.textMuted} />
          <Text style={styles.requirementText} numberOfLines={2}>{item.label}{item.current != null && item.required != null ? `  ${item.current}/${item.required}` : ''}</Text>
        </View>
      ))}
      <TouchableOpacity style={styles.button} onPress={onContinue} activeOpacity={0.82} accessibilityRole="button">
        <Text style={styles.buttonText}>Tiếp tục hoàn thiện</Text><ChevronRight size={19} color={BrandColors.textWhite} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: BrandColors.bgCard, borderRadius: Radius.base, padding: Spacing.base, borderWidth: 1, borderColor: BrandColors.borderPink, ...Shadows.sm },
  successCard: { backgroundColor: BrandColors.statusConfirmedBg, borderColor: '#B9E5D2' },
  warningCard: { backgroundColor: BrandColors.statusCancelledBg, borderColor: '#F0CACA' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md },
  eyebrow: { fontFamily: Typography.bold, color: BrandColors.accentRose, fontSize: 11, letterSpacing: 0.7, marginBottom: 4 },
  title: { flex: 1, fontFamily: Typography.bold, color: BrandColors.textDark, fontSize: 17, lineHeight: 22 },
  percent: { fontFamily: Typography.extraBold, color: BrandColors.accentRose, fontSize: 20 },
  track: { height: 8, borderRadius: Radius.full, backgroundColor: BrandColors.bgPink, overflow: 'hidden', marginTop: Spacing.md },
  fill: { height: '100%', borderRadius: Radius.full, backgroundColor: BrandColors.accentPink },
  description: { fontFamily: Typography.regular, color: BrandColors.textBody, fontSize: 13, lineHeight: 19, marginTop: Spacing.md },
  requirementRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  requirementText: { flex: 1, fontFamily: Typography.medium, color: BrandColors.textBody, fontSize: 13 },
  button: { minHeight: 46, marginTop: Spacing.base, borderRadius: Radius.md, backgroundColor: BrandColors.accentRose, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  buttonText: { fontFamily: Typography.bold, color: BrandColors.textWhite, fontSize: 14 },
});
