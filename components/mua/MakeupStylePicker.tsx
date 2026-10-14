import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { type MakeupStyle, type StyleSelection, styleDisplayName, styleNameKey, validStyleName } from '../../utils/makeupStyles';

type Props = {
  styles: MakeupStyle[];
  value: StyleSelection;
  onChange: (value: StyleSelection) => void;
  limit: number;
  disabled?: boolean;
  loading?: boolean;
  loadError?: boolean;
  onReload?: () => void;
};
export function MakeupStylePicker({ styles, value, onChange, limit, disabled, loading, loadError, onReload }: Props) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const count = value.styleIds.length + value.newStyleNames.length;
  const catalog = [...new Map(styles.map(item => [item.styleId, item])).values()];
  const selected = value.styleIds.map(id => {
    const item = catalog.find(style => style.styleId === id);
    return { ...item, styleId: id, name: item?.name || `Phong cách #${id}`, isActive: item?.isActive ?? false };
  });
  const change = (next: StyleSelection) => { setError(''); onChange(next); };
  const add = () => {
    const name = styleDisplayName(query);
    if (!validStyleName(name)) { setError('Tên phong cách từ 1 đến 100 ký tự, không có ký tự điều khiển.'); return; }
    const existing = catalog.find(item => styleNameKey(item.name) === styleNameKey(name));
    if (existing) {
      if (!existing.isActive) { setError('Phong cách này đã ngừng sử dụng.'); return; }
      if (!value.styleIds.includes(existing.styleId) && count < limit) change({ ...value, styleIds: [...value.styleIds, existing.styleId] });
    } else if (count < limit && !value.newStyleNames.some(item => styleNameKey(item) === styleNameKey(name))) {
      change({ ...value, newStyleNames: [...value.newStyleNames, name] });
    }
    setQuery('');
  };
  return <View>
    <Text style={s.helper}>Đã chọn {count}/{limit} phong cách</Text>
    <View style={s.chips}>{selected.map(item => <TouchableOpacity accessibilityRole="button" key={item.styleId} disabled={disabled} accessibilityLabel={`Bỏ ${item.name}`} onPress={() => change({ ...value, styleIds: value.styleIds.filter(id => id !== item.styleId) })} style={[s.chip, s.selected]}><Text>{item.name}{!item.isActive ? ' · Ngừng sử dụng' : ''} ×</Text></TouchableOpacity>)}
      {value.newStyleNames.map(name => <TouchableOpacity accessibilityRole="button" key={styleNameKey(name)} disabled={disabled} accessibilityLabel={`Bỏ ${name}`} onPress={() => change({ ...value, newStyleNames: value.newStyleNames.filter(item => item !== name) })} style={[s.chip, s.selected]}><Text>{name} · Mới ×</Text></TouchableOpacity>)}</View>
    <TextInput accessibilityLabel="Tìm hoặc thêm phong cách" editable={!disabled} value={query} onChangeText={setQuery} maxLength={100} placeholder="Tìm hoặc thêm phong cách..." style={s.input} />
    {loading && <ActivityIndicator />}
    {loadError && <TouchableOpacity accessibilityRole="button" onPress={onReload}><Text style={s.error}>Không tải được phong cách. Bấm để thử lại.</Text></TouchableOpacity>}
    {!!onReload && !loadError && <TouchableOpacity accessibilityRole="button" disabled={disabled || loading} onPress={onReload}><Text style={s.add}>Tải lại phong cách</Text></TouchableOpacity>}
    <View style={s.chips}>{catalog.filter(item => item.isActive && validStyleName(item.name) && !value.styleIds.includes(item.styleId) && styleNameKey(item.name).includes(styleNameKey(query))).map(item => <TouchableOpacity accessibilityRole="button" key={item.styleId} disabled={disabled || count >= limit} accessibilityLabel={`Chọn ${item.name}`} onPress={() => change({ ...value, styleIds: [...value.styleIds, item.styleId] })} style={[s.chip, count >= limit && s.disabled]}><Text>{item.name}</Text></TouchableOpacity>)}</View>
    {!!query.trim() && <TouchableOpacity accessibilityRole="button" disabled={disabled || count >= limit} onPress={add}><Text style={s.add}>Thêm “{styleDisplayName(query)}”</Text></TouchableOpacity>}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Text style={s.helper}>Phong cách mới chỉ được lưu khi bạn lưu biểu mẫu.</Text>
  </View>;
}
const s = StyleSheet.create({
  helper: { color: '#837985', fontSize: 13, marginVertical: 8 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, padding: 12, borderRadius: 20, borderWidth: 1, borderColor: '#E6DCE2', justifyContent: 'center' }, selected: { backgroundColor: '#FFE4EF' },
  input: { minHeight: 50, borderWidth: 1, borderColor: '#E6DCE2', borderRadius: 12, padding: 12, marginVertical: 12 }, add: { color: '#C52663', paddingVertical: 12 }, error: { color: '#B64753', marginVertical: 8 }, disabled: { opacity: .4 },
});
