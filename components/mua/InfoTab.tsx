import React, { useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Briefcase, Calendar, ChevronRight, ExternalLink, Globe, Camera, MapPin, Shield, Clock, Info, ShieldCheck } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Shadows } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import type { ArtistDto } from '../../types/ArtistDto';

interface InfoTabProps {
  mua: ArtistDto;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const AVAILABLE_DAYS = [true, true, true, true, true, true, false]; // Mon-Sat available

export function InfoTab({ mua }: InfoTabProps) {
  const [bioExpanded, setBioExpanded] = useState(false);

  const bio = mua.bio;

  return (
    <View style={styles.container}>
      {/* Bio Section */}
      <Text style={styles.sectionTitle}>{Strings.muaBio}</Text>
      <View style={styles.bioCard}>
        <Text style={styles.bioText} numberOfLines={bioExpanded ? undefined : 3}>
          {bio}
        </Text>
        <TouchableOpacity onPress={() => setBioExpanded(!bioExpanded)}>
          <Text style={styles.seeMoreText}>
            {bioExpanded ? 'Thu gọn' : Strings.muaSeeMore}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Specialties */}
      <Text style={styles.sectionTitle}>{Strings.muaSpecialties}</Text>
      <View style={styles.chipRow}>
        {mua.specialties.map((style) => (
          <View key={style} style={styles.chip}>
            <Briefcase size={13} color={BrandColors.accentPink} />
            <Text style={styles.chipText}>{style}</Text>
          </View>
        ))}
      </View>

      {/* Service Area */}
      <Text style={styles.sectionTitle}>{Strings.muaServiceArea}</Text>
      <View style={styles.mapCard}>
        <View style={styles.mapPlaceholder}>
          <MapPin size={32} color={BrandColors.accentPink} />
          <Text style={styles.mapText}>Bản đồ khu vực</Text>
        </View>
        <View style={styles.mapInfo}>
          <View style={styles.mapInfoRow}>
            <MapPin size={14} color={BrandColors.accentPink} />
            <Text style={styles.mapInfoText}>{mua.city}</Text>
          </View>
          <Text style={styles.mapSubText}>Di chuyển trong bán kính 15km</Text>
        </View>
      </View>

      {/* Schedule */}
      <Text style={styles.sectionTitle}>{Strings.muaSchedule}</Text>
      <View style={styles.scheduleCard}>
        <View style={styles.daysRow}>
          {WEEKDAYS.map((day, index) => (
            <View
              key={day}
              style={[
                styles.dayCircle,
                AVAILABLE_DAYS[index] && styles.dayAvailable,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  AVAILABLE_DAYS[index] && styles.dayTextAvailable,
                ]}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.scheduleNote}>Thứ 2 - Thứ 7: 9:00 - 18:00</Text>
      </View>

      {/* Policies */}
      <Text style={styles.sectionTitle}>{Strings.muaPolicies}</Text>
      <View style={styles.policyCard}>
        <View style={styles.policyItem}>
          <Shield size={18} color={BrandColors.accentPink} />
          <View style={styles.policyInfo}>
            <Text style={styles.policyTitle}>Đặt cọc 30%</Text>
            <Text style={styles.policyDesc}>Khách hàng cần đặt cọc 30% khi xác nhận lịch</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.policyItem}>
          <Calendar size={18} color={BrandColors.accentPink} />
          <View style={styles.policyInfo}>
            <Text style={styles.policyTitle}>Hủy trước 24h</Text>
            <Text style={styles.policyDesc}>Hoàn tiền 100% nếu hủy trước 24 giờ</Text>
          </View>
        </View>
      </View>

      {/* Social Links */}
      <Text style={styles.sectionTitle}>{Strings.muaSocial}</Text>
      <View style={styles.socialCard}>
        <TouchableOpacity style={styles.socialRow} onPress={() => Linking.openURL('https://instagram.com')}>
          <Camera size={18} color="#E4405F" />
          <Text style={styles.socialText}>Instagram</Text>
          <ExternalLink size={14} color={BrandColors.textMuted} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.socialRow} onPress={() => Linking.openURL('https://facebook.com')}>
          <Globe size={18} color="#1877F2" />
          <Text style={styles.socialText}>Facebook</Text>
          <ExternalLink size={14} color={BrandColors.textMuted} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.socialRow} onPress={() => Linking.openURL('https://example.com')}>
          <Globe size={18} color={BrandColors.textSecondary} />
          <Text style={styles.socialText}>Website</Text>
          <ExternalLink size={14} color={BrandColors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.textDark,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  bioCard: {
    backgroundColor: BrandColors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    padding: Spacing.base,
  },
  bioText: {
    fontSize: 14,
    color: BrandColors.textBody,
    lineHeight: 22,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.accentPink,
    marginTop: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.bgPinkLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: BrandColors.borderPink,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.textPrimary,
  },
  mapCard: {
    backgroundColor: BrandColors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    height: 120,
    backgroundColor: '#FDECF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    marginTop: Spacing.sm,
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.accentPink,
  },
  mapInfo: {
    padding: Spacing.base,
  },
  mapInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  mapInfoText: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.textDark,
    marginLeft: Spacing.sm,
  },
  mapSubText: {
    fontSize: 13,
    color: BrandColors.textMuted,
    marginLeft: 22,
  },
  scheduleCard: {
    backgroundColor: BrandColors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    padding: Spacing.base,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.borderDivider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayAvailable: {
    backgroundColor: BrandColors.bgPinkLight,
    borderWidth: 1,
    borderColor: BrandColors.borderPink,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.textMuted,
  },
  dayTextAvailable: {
    color: BrandColors.accentPink,
  },
  scheduleNote: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  policyCard: {
    backgroundColor: BrandColors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
  },
  policyItem: {
    flexDirection: 'row',
    padding: Spacing.base,
    alignItems: 'flex-start',
  },
  policyInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.textDark,
    marginBottom: 4,
  },
  policyDesc: {
    fontSize: 13,
    color: BrandColors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: BrandColors.borderDivider,
    marginHorizontal: Spacing.base,
  },
  socialCard: {
    backgroundColor: BrandColors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
  },
  socialText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: BrandColors.textDark,
    marginLeft: Spacing.md,
  },
});
