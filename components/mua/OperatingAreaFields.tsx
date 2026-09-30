import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { AppBottomSheet } from '../ui/AppBottomSheet';
import { muaAreas, normalizeAreaName } from '../../utils/muaAreas';
import { BrandColors } from '../../constants/theme';

export interface OperatingArea {
  city: string;
  district?: string;
  provinceCode?: number;
  districtCode?: number;
}
export function OperatingAreaFields({ value, onChange }: { value: OperatingArea; onChange: (area: OperatingArea) => void }) {
  const [sheet, setSheet] = useState<'province' | 'district' | null>(null);
  const [search, setSearch] = useState('');
  const province = muaAreas.find(item => item.code === value.provinceCode);
  const choices = sheet === 'district' ? province?.districts || [] : muaAreas;
  const open = (kind: typeof sheet) => { setSearch(''); setSheet(kind); };
  return <>
    <Text style={s.label}>Tỉnh / Thành phố</Text><TouchableOpacity style={s.input} onPress={() => open('province')}><Text>{value.city || 'Chọn tỉnh / thành phố'} ▾</Text></TouchableOpacity>
    <Text style={s.label}>Quận / Huyện</Text><TouchableOpacity disabled={!province} style={s.input} onPress={() => open('district')}><Text>{value.district || 'Chọn quận / huyện'} ▾</Text></TouchableOpacity>
    <AppBottomSheet visible={sheet !== null} title={sheet === 'district' ? 'Chọn quận / huyện' : 'Chọn tỉnh / thành phố'} onClose={() => setSheet(null)}>
      <TextInput style={s.input} placeholder="Tìm khu vực..." value={search} onChangeText={setSearch} />
      <ScrollView keyboardShouldPersistTaps="handled" style={s.list}>
        {choices.filter(item => normalizeAreaName(item.name).includes(normalizeAreaName(search))).map(item => <TouchableOpacity key={item.code} style={s.row} onPress={() => {
          onChange(sheet === 'province' ? { city: item.name, provinceCode: item.code } : { ...value, district: item.name, districtCode: item.code }); setSheet(null);
        }}><Text>{item.name}</Text></TouchableOpacity>)}
      </ScrollView>
    </AppBottomSheet>
  </>;
}
const s = StyleSheet.create({ label: { marginTop: 16, marginBottom: 8, fontSize: 14, fontWeight: '600', color: BrandColors.textDark }, input: { minHeight: 50, justifyContent: 'center', borderWidth: 1, borderColor: BrandColors.borderLight, borderRadius: 12, paddingHorizontal: 14 }, list: { maxHeight: 360 }, row: { minHeight: 48, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: BrandColors.borderLight } });
