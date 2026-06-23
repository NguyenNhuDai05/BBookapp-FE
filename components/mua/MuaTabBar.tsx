import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BrandColors, Spacing } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import type { MuaDetailTab } from '../../types/mua';

interface MuaTabBarProps {
  activeTab: MuaDetailTab;
  onTabChange: (tab: MuaDetailTab) => void;
}

const TABS: { key: MuaDetailTab; label: string }[] = [
  { key: 'portfolio', label: Strings.muaTabPortfolio },
  { key: 'services', label: Strings.muaTabServices },
  { key: 'reviews', label: Strings.muaTabReviews },
  { key: 'info', label: Strings.muaTabInfo },
];

export function MuaTabBar({ activeTab, onTabChange }: MuaTabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.8}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
    marginHorizontal: Spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: BrandColors.accentPink,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.textMuted,
  },
  tabTextActive: {
    color: BrandColors.accentPink,
    fontWeight: '800',
  },
});
