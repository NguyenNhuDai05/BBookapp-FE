import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BrandColors, Radius, Typography } from '../../../constants/theme';
import type { CatalogTerm, MuaStyleCatalog } from '../../../repositories/IMuaStyleRepository';
import type { PortfolioTaggingDto } from '../../../types/portfolio';
import { selectableTerms, type PortfolioTagDraft } from '../../../utils/portfolioTagging';

type Props = { value: PortfolioTagDraft; onChange: (value: PortfolioTagDraft) => void; history?: PortfolioTaggingDto;
  catalog?: MuaStyleCatalog; supported: boolean; disabled?: boolean; loading?: boolean; error?: boolean;
  onReload: () => void; onDiscardChanges?: () => void };
type Panel = 'occasion' | 'primary' | 'secondary' | 'intensity' | 'color-tone' | 'effect';

export function PortfolioTaggingFields({ value, onChange, history, catalog, supported, disabled, loading, error, onReload, onDiscardChanges }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [search, setSearch] = useState('');
  const terms = selectableTerms(catalog);
  const locked = disabled || !supported;
  const historicalStyles = [history?.primaryStyle, ...(history?.secondaryStyles || [])].filter(Boolean);
  const historicalTerms = [...(history?.occasions || []), ...(history?.colorTones || []), ...(history?.effects || []), ...(history?.intensity ? [history.intensity] : [])];
  const styleLabel = (id: number) => catalog?.styles.find(s => s.styleId === id)?.name || historicalStyles.find(s => s?.styleId === id)?.name || `Phong cách #${id}`;
  const termLabel = (kind: string, key: string) => catalog?.terms?.find(t => t.kind === kind && t.key === key)?.label || historicalTerms.find(t => t.kind === kind && t.key === key)?.label || key;
  const total = Number(value.primaryStyleId != null) + value.secondaryStyleIds.length + value.occasionKeys.length + Number(value.intensityKey != null) + value.colorToneKeys.length + value.effectKeys.length;
  const togglePanel = (next: Panel) => { setSearch(''); setPanel(panel === next ? null : next); };
  const chip = (label: string, remove: () => void, key: string, inactive = false) => <TouchableOpacity key={key} accessibilityRole="button" accessibilityLabel={`Bỏ ${label}`} disabled={disabled || !supported} onPress={remove} style={styles.selected}>
    <Text style={styles.selectedText}>#{label}{inactive ? ' · Ngừng dùng' : ''}  ×</Text>
  </TouchableOpacity>;
  function termSection(kind: 'occasion' | 'intensity' | 'color-tone' | 'effect', title: string, selected: string[], limit: number) {
    const options = terms.filter(t => t.kind === kind);
    const groups = catalog?.terms?.filter(t => t.kind === (kind === 'occasion' ? 'occasion-group' : 'effect-group')) || [];
    const pick = (key: string) => {
      const next = selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key];
      if (kind === 'intensity') onChange({ ...value, intensityKey: selected.includes(key) ? null : key });
      else onChange({ ...value, [kind === 'occasion' ? 'occasionKeys' : kind === 'effect' ? 'effectKeys' : 'colorToneKeys']: next });
    };
    const row = (term: CatalogTerm) => {
      const checked = selected.includes(term.key);
      const blocked = Boolean(locked || (kind !== 'intensity' && !checked && selected.length >= limit));
      return <TouchableOpacity key={term.id} accessibilityRole={kind === 'intensity' ? 'radio' : 'checkbox'} accessibilityLabel={term.label} accessibilityState={{ checked, disabled: blocked }} disabled={blocked} onPress={() => pick(term.key)} style={[styles.option, checked && styles.checked, blocked && !checked && styles.dim]}>
        <Text style={[styles.optionLabel, checked && styles.checkedText]}>#{term.label}</Text><Text style={[styles.mark, checked && styles.checkedText]}>{checked ? '✓' : '○'}</Text>
      </TouchableOpacity>;
    };
    return <View style={styles.section}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Chọn ${title.toLowerCase()}`} accessibilityState={{ expanded: panel === kind, disabled: Boolean(locked) }} disabled={locked} onPress={() => togglePanel(kind)} style={styles.heading}>
        <Text style={styles.label}>{title}</Text><Text style={styles.count}>{selected.length}/{limit}  {panel === kind ? '⌃' : '⌄'}</Text>
      </TouchableOpacity>
      <View style={styles.chips}>{selected.map(key => chip(termLabel(kind, key), () => pick(key), key, !options.some(t => t.key === key)))}</View>
      {panel === kind && supported && <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.options}>
        {!options.length && <Text style={styles.hint}>Chưa có lựa chọn trong danh mục.</Text>}
        {groups.filter(g => options.some(t => t.groupId === g.id)).map(g => <View key={g.id}><Text style={styles.group}>{g.label}</Text><View style={styles.chips}>{options.filter(t => t.groupId === g.id).map(row)}</View></View>)}
        <View style={styles.chips}>{options.filter(t => t.groupId == null).map(row)}</View>
      </ScrollView>}
    </View>;
  }
  const primary = value.primaryStyleId;
  const options = catalog?.styles.filter(s => `${s.name || ''} ${s.key || ''} #${s.styleId}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())) || [];
  return <View style={styles.container}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Thẻ tag" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={styles.heading}><Text accessibilityRole="header" style={styles.title}>Thẻ tag</Text><View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><Text style={styles.count}>{total} lựa chọn</Text>{expanded ? <ChevronUp size={20} color="#9891A4" /> : <ChevronDown size={20} color="#9891A4" />}</View></TouchableOpacity>
    {expanded && <View style={styles.tagCard}>
    <Text style={styles.hint}>Thêm thông tin để khách dễ tìm thấy phong cách makeup của bạn. Không bắt buộc.</Text>
    {loading && <View style={styles.status}><ActivityIndicator color={BrandColors.accentRose} /><Text style={styles.hint}>Đang tải danh mục…</Text></View>}
    {(!supported || error) && <View style={styles.notice}><Text style={styles.hint}>{error ? 'Chưa tải được danh mục tag. Các lựa chọn hiện có được giữ nguyên.' : catalog?.taggingUnavailableReason || catalog?.fallbackReason || 'Chưa thể chỉnh tag trên máy chủ này. Bạn vẫn có thể lưu tác phẩm không tag.'}</Text>
      <TouchableOpacity accessibilityRole="button" disabled={disabled || loading} onPress={onReload} style={styles.reload}><Text style={styles.link}>Tải lại danh mục</Text></TouchableOpacity>
      {onDiscardChanges && <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onDiscardChanges} style={styles.reload}><Text style={styles.link}>Bỏ thay đổi tag, giữ nội dung</Text></TouchableOpacity>}
    </View>}
    {termSection('occasion', 'Dịp phù hợp', value.occasionKeys, 3)}
    <View style={styles.section}>
      <Text style={styles.label}>Phong cách makeup</Text>
      <View style={styles.heading}><Text style={styles.hint}>Chính · {primary == null ? 0 : 1}/1</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Chọn phong cách chính" disabled={locked} onPress={() => togglePanel('primary')} style={styles.reload}><Text style={styles.link}>Chọn chính</Text></TouchableOpacity></View>
      {primary != null && chip(styleLabel(primary), () => onChange({ ...value, primaryStyleId: null, secondaryStyleIds: [] }), String(primary), !catalog?.styles.some(s => s.styleId === primary))}
      <View style={styles.heading}><Text style={styles.hint}>Phụ · {value.secondaryStyleIds.length}/2</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Chọn phong cách phụ" accessibilityState={{ disabled: Boolean(locked || primary == null) }} disabled={locked || primary == null} onPress={() => togglePanel('secondary')} style={styles.reload}><Text style={[styles.link, primary == null && styles.dim]}>Chọn phụ</Text></TouchableOpacity></View>
      <View style={styles.chips}>{value.secondaryStyleIds.map(id => chip(styleLabel(id), () => onChange({ ...value, secondaryStyleIds: value.secondaryStyleIds.filter(s => s !== id) }), String(id), !catalog?.styles.some(s => s.styleId === id)))}</View>
      {primary == null && <Text style={styles.hint}>Chọn phong cách chính để thêm phong cách phụ.</Text>}
      {(panel === 'primary' || panel === 'secondary') && supported && <View>
        <TextInput accessibilityLabel="Tìm phong cách portfolio" editable={!disabled} value={search} onChangeText={setSearch} placeholder="Tìm tên hoặc mã phong cách" placeholderTextColor={BrandColors.textMuted} style={styles.search} />
        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.options}>
          {!options.length && <Text style={styles.hint}>Không có phong cách phù hợp.</Text>}
          {options.map(s => {
            const checked = panel === 'primary' ? primary === s.styleId : value.secondaryStyleIds.includes(s.styleId);
            const blocked = Boolean(locked || !s.isActive || s.archivedAt || (panel === 'secondary' && (primary == null || primary === s.styleId || (!checked && value.secondaryStyleIds.length >= 2))));
            return <TouchableOpacity key={s.styleId} accessibilityRole={panel === 'primary' ? 'radio' : 'checkbox'} accessibilityLabel={s.name || `Phong cách #${s.styleId}`} accessibilityState={{ checked, disabled: blocked }} disabled={blocked} onPress={() => {
              if (panel === 'primary') { onChange({ ...value, primaryStyleId: checked ? null : s.styleId, secondaryStyleIds: checked ? [] : value.secondaryStyleIds.filter(id => id !== s.styleId) }); }
              else onChange({ ...value, secondaryStyleIds: checked ? value.secondaryStyleIds.filter(id => id !== s.styleId) : [...value.secondaryStyleIds, s.styleId] });
            }} style={[styles.option, checked && styles.checked, blocked && !checked && styles.dim]}><View style={styles.copy}><Text style={[styles.optionLabel, checked && styles.checkedText]}>{s.name || `Phong cách #${s.styleId}`}</Text><Text style={styles.small}>{s.key || `#${s.styleId}`}</Text></View><Text style={styles.mark}>{checked ? '✓' : '○'}</Text></TouchableOpacity>;
          })}
        </ScrollView>
      </View>}
    </View>
    {termSection('intensity', 'Mức độ trang điểm', value.intensityKey ? [value.intensityKey] : [], 1)}
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: advanced }} disabled={disabled} onPress={() => { setAdvanced(!advanced); setPanel(null); }} style={styles.heading}><Text style={styles.link}>Thêm tông màu và hiệu ứng</Text><Text style={styles.count}>{value.colorToneKeys.length + value.effectKeys.length}  {advanced ? '⌃' : '⌄'}</Text></TouchableOpacity>
    {advanced && <View>{termSection('color-tone', 'Tông màu', value.colorToneKeys, 3)}{termSection('effect', 'Hiệu ứng makeup', value.effectKeys, 4)}</View>}
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  tagCard: { padding: 12, gap: 10, borderWidth: 1, borderColor: '#FFD0E0', borderRadius: 16, backgroundColor: '#FFFAFC' },
  container: { gap: 8, paddingVertical: 12 }, heading: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontFamily: Typography.semiBold, fontSize: 18, color: BrandColors.textDark }, label: { fontFamily: Typography.semiBold, fontSize: 14, color: BrandColors.textDark, flexShrink: 1 },
  hint: { fontSize: 13, lineHeight: 20, color: BrandColors.textMuted }, count: { fontSize: 12, color: BrandColors.textMuted },
  section: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BrandColors.borderLight, paddingBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, selected: { minHeight: 44, maxWidth: '100%', justifyContent: 'center', borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFE8F0' },
  selectedText: { fontSize: 13, color: BrandColors.accentRose, flexShrink: 1 }, options: { maxHeight: 240, backgroundColor: '#FFF5F9', borderRadius: 14 },
  option: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, margin: 3, borderRadius: 24, backgroundColor: '#FFEAF2', flexDirection: 'row', gap: 8, alignItems: 'center' }, optionLabel: { flexShrink: 1, flexGrow: 1, color: BrandColors.textDark, fontSize: 14, lineHeight: 20 },
  checked: { backgroundColor: '#EF4A83', borderRadius: 24 }, checkedText: { color: '#FFF' }, mark: { color: BrandColors.accentRose, fontSize: 18 }, dim: { opacity: 0.5 },
  group: { color: BrandColors.textMuted, fontSize: 12, paddingHorizontal: 10, paddingTop: 10 }, search: { minHeight: 48, paddingHorizontal: 10, borderWidth: 1, borderColor: BrandColors.borderLight, borderRadius: Radius.md, color: BrandColors.textDark },
  copy: { flex: 1 }, small: { color: BrandColors.textMuted, fontSize: 11, marginTop: 2 }, status: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  notice: { padding: 10, borderRadius: Radius.md, backgroundColor: BrandColors.bgPinkLight }, reload: { minHeight: 44, justifyContent: 'center' }, link: { color: BrandColors.accentRose, fontSize: 13, fontFamily: Typography.semiBold },
});
