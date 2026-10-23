import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BrandColors, Radius, Typography } from '../../../constants/theme';
import { styleNameKey, type MakeupStyle } from '../../../utils/makeupStyles';
import { portfolioTagOptions } from '../../../utils/portfolioTags';

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
  options?: MakeupStyle[];
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  onReload: () => void;
  onDiscardChanges?: () => void;
};

export function PortfolioTaggingFields({ value, onChange, options, disabled, loading, error, onReload, onDiscardChanges }: Props) {
  const [search, setSearch] = useState('');
  const available = portfolioTagOptions(options);
  const matches = available.filter(s => styleNameKey(s.name).includes(styleNameKey(search)));
  const unavailable = error || options === undefined;
  const remove = (tag: string) => onChange(value.filter(t => t !== tag));
  return <View style={styles.container}>
    <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>Thẻ tag</Text><Text style={styles.hint}>{value.length} lựa chọn</Text></View>
    <Text style={styles.hint}>Chọn tag có sẵn. Khi gắn dịch vụ, tag của dịch vụ được điền sẵn; bạn có thể thêm hoặc xóa riêng cho tác phẩm.</Text>
    <View style={styles.chips}>{value.map(tag => <TouchableOpacity key={tag} accessibilityRole="button" accessibilityLabel={`Bỏ ${tag}`} disabled={disabled} onPress={() => remove(tag)} style={styles.selected}><Text style={styles.selectedText}>#{tag}  ×</Text></TouchableOpacity>)}</View>
    {loading ? <View style={styles.heading}><ActivityIndicator color={BrandColors.accentRose} /><Text style={styles.hint}>Đang tải tag…</Text></View> : unavailable ? <View>
      <Text style={styles.hint}>Chưa tải được danh sách tag. Vui lòng thử lại.</Text>
      <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onReload} style={styles.button}><Text style={styles.link}>Tải lại tag</Text></TouchableOpacity>
      {onDiscardChanges && <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onDiscardChanges} style={styles.button}><Text style={styles.link}>Bỏ thay đổi tag, giữ nội dung</Text></TouchableOpacity>}
    </View> : <>
      <TextInput accessibilityLabel="Tìm tag portfolio" value={search} onChangeText={setSearch} editable={!disabled} placeholder="Tìm tag" placeholderTextColor={BrandColors.textMuted} style={styles.search} />
      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.options}>
        <View style={styles.chips}>{matches.map(s => {
          const checked = value.some(tag => styleNameKey(tag) === styleNameKey(s.name));
          return <TouchableOpacity key={s.styleId} accessibilityRole="checkbox" accessibilityLabel={s.name} accessibilityState={{ checked, disabled: Boolean(disabled) }} disabled={disabled} onPress={() => onChange(checked ? value.filter(tag => styleNameKey(tag) !== styleNameKey(s.name)) : [...value, s.name])} style={[styles.option, checked && styles.checked]}><Text style={[styles.optionText, checked && styles.checkedText]}>#{s.name}{checked ? '  ✓' : ''}</Text></TouchableOpacity>;
        })}</View>
        {!matches.length && <Text style={styles.hint}>{available.length ? 'Không có tag phù hợp.' : 'Chưa có tag trong danh sách.'}</Text>}
      </ScrollView>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: 10, paddingVertical: 12 },
  heading: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { fontFamily: Typography.semiBold, fontSize: 18, color: BrandColors.textDark },
  hint: { fontSize: 13, lineHeight: 20, color: BrandColors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selected: { minHeight: 44, maxWidth: '100%', justifyContent: 'center', borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFE8F0' },
  selectedText: { fontSize: 13, color: BrandColors.accentRose, flexShrink: 1 },
  search: { minHeight: 48, paddingHorizontal: 12, borderWidth: 1, borderColor: BrandColors.borderLight, borderRadius: Radius.md, color: BrandColors.textDark },
  options: { maxHeight: 240 },
  option: { minHeight: 44, maxWidth: '100%', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: '#FFF0F5' },
  optionText: { color: BrandColors.textDark, fontSize: 14, flexShrink: 1 },
  checked: { backgroundColor: BrandColors.accentRose },
  checkedText: { color: '#FFF' },
  button: { minHeight: 44, justifyContent: 'center' },
  link: { color: BrandColors.accentRose, fontSize: 13, fontFamily: Typography.semiBold },
});
