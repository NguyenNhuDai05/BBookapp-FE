import { Check } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppBottomSheet } from '../ui/AppBottomSheet';
import type { ExploreFilters, ExploreProvince } from '../../types/explore';
import { EXPLORE_PINK } from './ExploreCards';

export function ExploreFilterSheet({ visible, filters, provinces, onClose, onApply }: { visible: boolean; filters: ExploreFilters; provinces: ExploreProvince[]; onClose: () => void; onApply: (next: ExploreFilters) => void }) {
  const [provinceCode, setProvinceCode] = useState<number | undefined>();
  const [min, setMin] = useState(''); const [max, setMax] = useState(''); const [error, setError] = useState('');
  const [provinceSearch, setProvinceSearch] = useState('');
  const initialize = () => { setProvinceCode(filters.provinceCode); setMin(filters.minPrice?.toString() || ''); setMax(filters.maxPrice?.toString() || ''); setError(''); setProvinceSearch(''); };
  const apply = () => {
    const minPrice = min === '' ? undefined : Number(min); const maxPrice = max === '' ? undefined : Number(max);
    if ((minPrice != null && minPrice > 1_000_000_000) || (maxPrice != null && maxPrice > 1_000_000_000)) { setError('Giá tối đa là 1.000.000.000đ.'); return; }
    if (minPrice != null && maxPrice != null && minPrice > maxPrice) { setError('Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa.'); return; }
    onApply({ ...filters, provinceCode, minPrice, maxPrice });
  };
  return <AppBottomSheet visible={visible} title="Tìm lựa chọn phù hợp" description="Lọc theo khu vực hoạt động và ngân sách" onClose={onClose} onShow={initialize}>
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
      <Text style={styles.label}>Khu vực hoạt động</Text>
      <TextInput value={provinceSearch} onChangeText={setProvinceSearch} placeholder="Tìm tỉnh / thành phố..." style={styles.input} />
      <View style={styles.provinces}><TouchableOpacity onPress={() => setProvinceCode(undefined)} style={styles.option}><Text style={styles.optionText}>Tất cả khu vực</Text>{provinceCode == null ? <Check size={18} color={EXPLORE_PINK} /> : null}</TouchableOpacity>
        {provinces.filter(p => p.name.toLocaleLowerCase('vi').includes(provinceSearch.trim().toLocaleLowerCase('vi'))).map(p => <TouchableOpacity key={p.code} onPress={() => setProvinceCode(p.code)} style={styles.option}>
          <Text style={[styles.optionText, p.code === provinceCode && { color: EXPLORE_PINK, fontWeight: '700' }]}>{p.name}</Text>{p.code === provinceCode ? <Check size={18} color={EXPLORE_PINK} /> : null}</TouchableOpacity>)}
      </View>
      {!provinces.length ? <Text style={styles.meta}>Chưa có khu vực hoạt động để lọc.</Text> : null}
      <Text style={styles.label}>Ngân sách (VNĐ)</Text><View style={styles.priceInputs}>
        <TextInput accessibilityLabel="Giá tối thiểu" value={min} onChangeText={text => { setMin(text.replace(/\D/g, '').slice(0, 10)); setError(''); }} keyboardType="number-pad" placeholder="Từ" style={[styles.input, { flex: 1 }]} />
        <TextInput accessibilityLabel="Giá tối đa" value={max} onChangeText={text => { setMax(text.replace(/\D/g, '').slice(0, 10)); setError(''); }} keyboardType="number-pad" placeholder="Đến" style={[styles.input, { flex: 1 }]} />
      </View><Text style={styles.meta}>Lọc chuyên gia có dịch vụ trong khoảng giá đã chọn.</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </ScrollView>
    <View style={styles.actions}><TouchableOpacity onPress={() => { setProvinceCode(undefined); setMin(''); setMax(''); setError(''); }} style={styles.reset}><Text style={styles.resetText}>Đặt lại</Text></TouchableOpacity>
      <TouchableOpacity style={styles.apply} onPress={apply}><Text style={styles.applyText}>Áp dụng bộ lọc</Text></TouchableOpacity></View>
  </AppBottomSheet>;
}
const styles = StyleSheet.create({
  label: { color: '#4C2D40', fontSize: 14, fontWeight: '700', marginBottom: 10, marginTop: 12 }, input: { minHeight: 46, borderWidth: 1, borderColor: '#EAD9E2', borderRadius: 13, paddingHorizontal: 12, color: '#4C2D40', backgroundColor: '#FFF' },
  provinces: { marginTop: 7, marginBottom: 7 }, option: { minHeight: 40, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, optionText: { fontSize: 13, color: '#705267' },
  priceInputs: { flexDirection: 'row', gap: 12, marginBottom: 7 }, meta: { color: '#8B6E7D', fontSize: 11, lineHeight: 17 }, error: { color: '#AA3050', fontSize: 12, marginTop: 9 }, actions: { flexDirection: 'row', gap: 12, paddingTop: 17, paddingBottom: 3 },
  reset: { minHeight: 46, borderWidth: 1, borderColor: '#E9CBDA', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, justifyContent: 'center', alignItems: 'center' }, resetText: { color: EXPLORE_PINK, fontWeight: '700', fontSize: 12 },
  apply: { minHeight: 46, backgroundColor: EXPLORE_PINK, borderRadius: 16, paddingHorizontal: 15, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flex: 1 }, applyText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});
