import { AppBottomSheet } from '../ui/AppBottomSheet';
import React, { useMemo } from 'react';
import {StyleSheet, Text, TouchableOpacity, ScrollView} from 'react-native';

import {Calendar as CalendarIcon} from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DatePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function DatePickerSheet({ visible, onClose, selectedDate, onSelectDate }: DatePickerSheetProps) {

  const dates = useMemo(() => {
    const list = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const value = `${year}-${month}-${day}`;

      let label = '';
      if (i === 0) {
        label = 'Hôm nay';
      } else if (i === 1) {
        label = 'Ngày mai';
      } else {
        const days = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        label = `${days[d.getDay()]}, ${day}/${month}`;
      }

      list.push({ label, value });
    }
    return list;
  }, []);

  return (
    <AppBottomSheet visible={visible} title="Chọn ngày thực hiện" onClose={onClose}   >

<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {dates.map((date) => {
              const isSelected = selectedDate === date.value;
              return (
                <TouchableOpacity
                  key={date.value}
                  style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                  onPress={() => {
                    onSelectDate(date.value);
                    onClose();
                  }}
                >
                  <CalendarIcon
                    size={18}
                    color={isSelected ? BrandColors.accentPink : BrandColors.textSecondary}
                  />
                  <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>
                    {date.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

<SafeAreaView edges={['bottom']} />
</AppBottomSheet>
  );
}

const styles = StyleSheet.create({
content: {
    paddingBottom: 40,
  },
dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
dateItemSelected: {
    backgroundColor: BrandColors.bgPinkLight,
    borderRadius: Radius.lg,
    borderBottomWidth: 0,
    paddingHorizontal: Spacing.md,
    marginHorizontal: -Spacing.md,
  },
dateText: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: BrandColors.textDark,
    marginLeft: Spacing.sm,
  },
dateTextSelected: {
    fontFamily: Typography.bold,
    color: BrandColors.accentPink,
  }
});
