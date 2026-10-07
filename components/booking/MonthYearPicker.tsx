import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { AppBottomSheet } from '../ui/AppBottomSheet';
import { BrandColors, Spacing } from '../../constants/theme';

export function MonthYearPicker({ month, onSelect, onClose }: { month: Date; onSelect: (date: Date) => void; onClose: () => void }) {
  const [year, setYear] = useState(String(month.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(month.getMonth());
  const validYear = /^\d{4}$/.test(year) && Number(year) >= 1900 && Number(year) <= 9999;
  return <AppBottomSheet visible title="Chọn tháng và năm" onClose={onClose}>
    <View style={styles.yearRow}>
      <TouchableOpacity accessibilityLabel="Năm trước" onPress={() => setYear(String(Math.max(1900, (Number(year) || month.getFullYear()) - 1)))}><Text style={styles.text}>‹</Text></TouchableOpacity>
      <TextInput accessibilityLabel="Năm" keyboardType="number-pad" maxLength={4} value={year} onChangeText={setYear} style={styles.year} />
      <TouchableOpacity accessibilityLabel="Năm sau" onPress={() => setYear(String(Math.min(9999, (Number(year) || month.getFullYear()) + 1)))}><Text style={styles.text}>›</Text></TouchableOpacity>
    </View>
    {!validYear && <Text>Năm hợp lệ từ 1900 đến 9999.</Text>}
    <View style={styles.months}>{Array.from({ length: 12 }, (_, index) => <TouchableOpacity key={index} accessibilityRole="button" accessibilityState={{ selected: index === selectedMonth }} onPress={() => setSelectedMonth(index)} style={[styles.month, index === selectedMonth && { backgroundColor: BrandColors.bgPrimary }]}><Text style={styles.text}>Tháng {index + 1}</Text></TouchableOpacity>)}</View>
    <TouchableOpacity accessibilityRole="button" disabled={!validYear} onPress={() => { onSelect(new Date(Number(year), selectedMonth, 1)); onClose(); }} style={[styles.confirm, { opacity: validYear ? 1 : 0.5 }]}><Text style={{ color: '#FFF', textAlign: 'center' }}>Xem lịch</Text></TouchableOpacity>
  </AppBottomSheet>;
}
const styles = StyleSheet.create({ yearRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }, year: { fontSize: 22, padding: 12, textAlign: 'center', color: BrandColors.textDark }, text: { color: BrandColors.textDark, fontSize: 16 }, months: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: Spacing.md }, month: { width: '33.33%', paddingVertical: 16, alignItems: 'center', borderRadius: 12 }, confirm: { backgroundColor: BrandColors.accentRose, padding: 14, borderRadius: 12, marginBottom: Spacing.md } });
