import React, { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BrandColors, Radius, Spacing } from '../../constants/theme';
import { type MakeupStyle, type StyleSelection, styleDisplayName, styleNameKey, validStyleName, uniqueStyles } from '../../utils/makeupStyles';

type Props = {
  styles: MakeupStyle[];
  historicalStyles?: MakeupStyle[];
  catalogLoaded?: boolean;
  preferredStyleIds?: number[];
  value: StyleSelection;
  onChange: (value: StyleSelection) => void;
  limit: number;
  disabled?: boolean;
  loading?: boolean;
  loadError?: boolean;
  fallbackReason?: string;
  onReload?: () => void;
};
export function MakeupStylePicker({ styles, historicalStyles = [], catalogLoaded = true, preferredStyleIds = [], value, onChange, limit, disabled, loading, loadError, fallbackReason, onReload }: Props) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const input = useRef<TextInput>(null);
  const count = new Set(value.styleIds).size + new Set(value.newStyleNames.map(styleNameKey)).size;
  const catalog = uniqueStyles(styles);
  const known = uniqueStyles([...historicalStyles, ...catalog]);
  const selected = [...new Set(value.styleIds)].map(id => {
    const item = known.find(style => style.styleId === id);
    return { ...item, styleId: id, name: item?.name || `Phong cách #${id}`, isActive: catalog.some(style => style.styleId === id && style.isActive && !style.archivedAt) };
  });
  const blocked = disabled || loading || loadError;
  const change = (next: StyleSelection) => { setError(''); onChange(next); };
  const choose = (id: number) => {
    if (blocked || value.styleIds.includes(id)) return;
    if (count >= limit) { setError(`Chỉ được chọn tối đa ${limit} phong cách.`); return; }
    change({ ...value, styleIds: [...value.styleIds, id] });
  };
  const add = () => {
    if (blocked) return;
    const name = styleDisplayName(query);
    if (!validStyleName(name)) { setError('Tên phong cách từ 1 đến 100 ký tự, không có ký tự điều khiển.'); return; }
    const matches = known.filter(item => styleNameKey(item.name) === styleNameKey(name));
    if (matches.length > 1) { setError('Tên này trùng nhiều phong cách. Hãy chọn mục có đúng mã định danh trong danh sách.'); return; }
    if (matches.length && !catalog.some(item => item.styleId === matches[0].styleId && item.isActive && !item.archivedAt)) { setError('Phong cách này đã ngừng sử dụng.'); return; }
    if (value.newStyleNames.some(item => styleNameKey(item) === styleNameKey(name))) { setQuery(''); return; }
    if (matches.length) choose(matches[0].styleId);
    else if (count < limit) change({ ...value, newStyleNames: [...value.newStyleNames, name] });
    else { setError(`Chỉ được chọn tối đa ${limit} phong cách.`); return; }
    setQuery(''); setCreating(false);
  };
  const candidates = catalog.filter(item => item.isActive && !item.archivedAt && validStyleName(item.name) && !value.styleIds.includes(item.styleId) && !value.newStyleNames.some(name => styleNameKey(name) === styleNameKey(item.name)) && `${styleNameKey(item.name)} ${item.key || ''}`.includes(styleNameKey(query)));
  const preferred = candidates.filter(item => preferredStyleIds.includes(item.styleId));
  const discover = candidates.filter(item => !preferredStyleIds.includes(item.styleId));
  const row = (item: MakeupStyle) => <TouchableOpacity accessibilityRole="button" key={item.styleId} disabled={blocked || count >= limit} accessibilityState={{ selected: false, disabled: !!blocked || count >= limit }} accessibilityLabel={`Chọn ${item.name}`} accessibilityHint={`Mã phong cách ${item.styleId}`} onPress={() => choose(item.styleId)} style={[s.row, (blocked || count >= limit) && s.disabled]}><View style={s.check} /><View style={s.copy}><Text style={s.name}>{item.name}</Text><Text style={s.identity}>{item.key || `#${item.styleId}`}</Text></View></TouchableOpacity>;
  return <View style={s.root}>
    <Text style={s.helper}>Đã chọn {count}/{limit} phong cách</Text>
    {count >= limit && <Text style={s.helper}>{count > limit ? 'Phong cách lịch sử vượt giới hạn được giữ nguyên; bạn có thể bỏ bớt, không thêm mới.' : `Đã đạt giới hạn ${limit} phong cách. Bỏ một mục để chọn mục khác.`}</Text>}
    {!!count && <ScrollView nestedScrollEnabled style={s.selectedList} keyboardShouldPersistTaps="handled" accessibilityLabel="Phong cách đã chọn">{selected.map(item => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: true, disabled: !!disabled }} key={item.styleId} disabled={disabled} accessibilityLabel={`Bỏ ${item.name}`} onPress={() => change({ ...value, styleIds: value.styleIds.filter(id => id !== item.styleId) })} style={[s.row, s.selected]}><Text style={[s.name, s.copy]}>{item.name}{!catalogLoaded ? ' · Chưa xác minh trạng thái' : !item.isActive ? ' · Ngừng sử dụng' : ''} ×</Text></TouchableOpacity>)}
      {value.newStyleNames.map(name => <TouchableOpacity accessibilityRole="button" key={styleNameKey(name)} disabled={disabled} accessibilityState={{ selected: true, disabled: !!disabled }} accessibilityLabel={`Bỏ ${name}`} onPress={() => change({ ...value, newStyleNames: value.newStyleNames.filter(item => item !== name) })} style={[s.row, s.selected]}><Text style={[s.name, s.copy]}>{name} · Mới ×</Text></TouchableOpacity>)}</ScrollView>}
    <TextInput ref={input} accessibilityLabel="Tìm hoặc thêm phong cách" editable={!disabled} value={query} onChangeText={text => { setQuery(text); setError(''); }} maxLength={100} placeholder={creating ? 'Nhập tên phong cách mới...' : 'Tìm tên phong cách...'} placeholderTextColor={BrandColors.textBody} style={s.input} returnKeyType="search" />
    {creating && <Text style={s.helper}>Nhập tên mới rồi bấm Thêm. Nếu đã có tên này, hãy chọn phong cách có sẵn.</Text>}
    {loading && <View style={s.status}><ActivityIndicator color={BrandColors.accentRose} /><Text style={s.helper}>Đang tải phong cách…</Text></View>}
    {loadError && <Text accessibilityRole="alert" style={s.error}>Không tải được phong cách. Các lựa chọn đã lưu vẫn được giữ; hãy thử lại.</Text>}
    {!!fallbackReason && <Text style={s.helper}>{fallbackReason}</Text>}
    {!!onReload && <TouchableOpacity accessibilityRole="button" disabled={disabled || loading} onPress={onReload} style={s.reload}><Text style={s.add}>{loadError ? 'Thử lại phong cách' : 'Tải lại phong cách'}</Text></TouchableOpacity>}
    <ScrollView nestedScrollEnabled style={s.options} keyboardShouldPersistTaps="handled" accessibilityLabel="Danh sách phong cách">
      {!!preferredStyleIds.length && <><Text style={s.group}>Chuyên môn của bạn</Text>{preferred.map(row)}{!preferred.length && !loading && <Text style={s.helper}>Không còn mục phù hợp chưa chọn trong chuyên môn.</Text>}</>}
      <Text style={s.group}>Khám phá toàn bộ phong cách</Text>{discover.map(row)}
      {!candidates.length && !loading && !loadError && <Text style={s.helper}>{query ? 'Không có phong cách phù hợp chưa chọn.' : 'Chưa có phong cách để chọn thêm.'}</Text>}
    </ScrollView>
    {!!query.trim() ? <TouchableOpacity accessibilityRole="button" disabled={blocked || count >= limit} onPress={add} style={s.create}><Text style={s.add}>Thêm “{styleDisplayName(query)}”</Text></TouchableOpacity> : <TouchableOpacity accessibilityRole="button" accessibilityLabel="Thêm phong cách mới" disabled={blocked || count >= limit} onPress={() => { setCreating(true); input.current?.focus(); }} style={s.create}><Text style={s.add}>+ Thêm phong cách mới</Text></TouchableOpacity>}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Text style={s.helper}>Phong cách mới chỉ được lưu khi bạn lưu biểu mẫu.</Text>
  </View>;
}
const s = StyleSheet.create({
  root: { minWidth: 0 }, helper: { color: BrandColors.textBody, fontSize: 12, lineHeight: 18, marginVertical: Spacing.sm },
  selectedList: { maxHeight: 200, marginBottom: Spacing.sm }, options: { maxHeight: 300 },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: BrandColors.borderLight },
  selected: { backgroundColor: BrandColors.bgPink, borderRadius: Radius.sm, marginBottom: 4 },
  copy: { flex: 1, minWidth: 0, flexShrink: 1 }, name: { color: BrandColors.textDark, fontSize: 13, lineHeight: 19, flexShrink: 1 }, identity: { color: BrandColors.textBody, fontSize: 11, marginTop: 2 },
  check: { width: 18, height: 18, borderWidth: 1, borderColor: BrandColors.borderPink, borderRadius: 5 },
  input: { minHeight: 46, borderWidth: 1, borderColor: BrandColors.borderLight, borderRadius: Radius.sm, padding: Spacing.md, color: BrandColors.textDark, fontSize: 14 },
  group: { color: BrandColors.textDark, fontSize: 13, fontWeight: '700', paddingVertical: 12 },
  status: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, reload: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  add: { color: BrandColors.textPrimary, fontWeight: '600', fontSize: 13, lineHeight: 20, flexShrink: 1 }, create: { minHeight: 44, paddingVertical: 12 },
  error: { color: BrandColors.statusCancelled, fontSize: 13, lineHeight: 19, marginVertical: 8 }, disabled: { opacity: .5 },
});
