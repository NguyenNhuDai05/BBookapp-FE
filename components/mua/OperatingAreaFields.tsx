import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppBottomSheet } from '../ui/AppBottomSheet';
import { LocationPicker } from '../location/LocationPicker';
import { operatingCatalog, restoreOperatingArea } from '../../utils/operatingAreas';
import { normalizeAreaName } from '../../utils/muaAreas';
import { locationService } from '../../services/locationService';
import type { OperatingArea } from '../../types/location';
export type { OperatingArea } from '../../types/location';

export function OperatingAreaFields({ value, onChange }: { value: OperatingArea; onChange: (area: OperatingArea) => void }) {
  const catalog = useQuery({ queryKey: ['operating-area-catalog'], queryFn: ({ signal }) => locationService.catalog(signal), staleTime: 86400000, retry: 1 }).data || operatingCatalog;
  const [sheet, setSheet] = useState<'province' | 'district' | null>(null);
  const [search, setSearch] = useState(''); const [locationOpen, setLocationOpen] = useState(false);
  const area = restoreOperatingArea(value);
  const province = catalog.provinces.find(p => p.code === area.operatingProvinceCode);
  const ids = area.operatingAreaIds || [];
  const open = (kind: typeof sheet) => { setSearch(''); setSheet(kind); };
  const toggle = (id: string) => onChange({ ...area, operatingAreaIds: ids.includes(id) ? ids.filter(v => v !== id) : ids.length < 100 ? [...ids, id] : ids });
  return <>
    <Text style={s.label}>Tỉnh / Thành phố *</Text><TouchableOpacity accessibilityRole="button" style={s.input} onPress={() => open('province')}><Text>{province?.name || 'Chọn tỉnh / thành phố'} ▾</Text></TouchableOpacity>
    <Text style={s.label}>Khu vực nhận khách *</Text>
    <Text style={s.helper}>Chọn nhiều quận/huyện quen thuộc hoặc phường/xã hiện tại. Đổi tỉnh sẽ xóa khu vực và điểm hoạt động đã chọn.</Text>
    <View style={s.chips}>{ids.map(id => <TouchableOpacity key={id} style={s.chip} accessibilityLabel={`Bỏ ${province?.areas.find(a => a.id === id)?.name || id}`} onPress={() => toggle(id)}><Text style={s.pink}>{province?.areas.find(a => a.id === id)?.name || id} ×</Text></TouchableOpacity>)}</View>
    <TouchableOpacity disabled={!province} style={s.input} onPress={() => open('district')}><Text>{ids.length ? `Chọn thêm khu vực (${ids.length})` : 'Chọn quận / huyện'}</Text></TouchableOpacity>
    <Text style={s.label}>Điểm hoạt động chính</Text>
    <TouchableOpacity style={s.input} onPress={() => setLocationOpen(true)}><Text style={s.pink}>{area.operatingLocationConfirmed ? area.operatingLocationLabel || 'Điểm đã xác nhận' : 'Chọn trên bản đồ / Sử dụng vị trí hiện tại'}</Text></TouchableOpacity>
    <Text style={s.helper}>Không bắt buộc. Xác nhận điểm này để xuất hiện trong MUA gần bạn; vị trí mặc định chỉ hiển thị gần đúng.</Text>
    {area.operatingLocationConfirmed && <>
      <View style={s.row}><Text style={{ flex: 1 }}>Đây là studio / điểm hẹn công khai</Text><Switch value={!!area.publicMeetingPoint} onValueChange={publicMeetingPoint => onChange({ ...area, publicMeetingPoint })} trackColor={{ true: '#D82D75' }} /></View>
      {area.publicMeetingPoint && <TextInput style={s.input} placeholder="Tên studio hoặc địa điểm công khai" value={area.operatingLocationLabel} maxLength={300} onChangeText={operatingLocationLabel => onChange({ ...area, operatingLocationLabel })} />}
      <TouchableOpacity onPress={() => onChange({ ...area, latitude: undefined, longitude: undefined, operatingLocationConfirmed: false, publicMeetingPoint: false, operatingLocationLabel: undefined, clearOperatingLocation: true })}><Text style={s.pink}>Xóa điểm hoạt động</Text></TouchableOpacity>
    </>}
    <AppBottomSheet visible={sheet !== null} title={sheet === 'district' ? 'Chọn khu vực nhận khách' : 'Chọn tỉnh / thành phố'} onClose={() => setSheet(null)}>
      <TextInput style={s.input} placeholder="Tìm khu vực..." value={search} onChangeText={setSearch} />
      {sheet === 'district' && <Text style={s.helper}>Đã chọn {ids.length}/100 · Quận/huyện cũ và phường/xã mới là các phạm vi riêng.</Text>}
      <ScrollView keyboardShouldPersistTaps="handled" style={s.list}>
        {sheet === 'province' ? catalog.provinces.filter(p => normalizeAreaName(p.name).includes(normalizeAreaName(search))).map(p => <TouchableOpacity key={p.code} style={s.row} onPress={() => {
          onChange({ city: p.name, operatingProvinceCode: p.code, operatingAreaIds: [], clearOperatingLocation: true }); setSheet(null);
        }}><Text>{p.name}</Text></TouchableOpacity>) : province?.areas.filter(a => normalizeAreaName(`${a.name} ${a.legacyProvinceName || ''}`).includes(normalizeAreaName(search))).map(a => <TouchableOpacity key={a.id} accessibilityRole="checkbox" accessibilityState={{ checked: ids.includes(a.id), disabled: !ids.includes(a.id) && ids.length >= 100 }} disabled={!ids.includes(a.id) && ids.length >= 100} style={s.row} onPress={() => toggle(a.id)}>
          <Text style={{ flex: 1 }}>{a.name}<Text style={s.helper}>{a.kind === 'legacy-district' ? ` · khu vực cũ${a.legacyProvinceName ? ` (${a.legacyProvinceName})` : ''}` : ''}</Text></Text><Text style={s.pink}>{ids.includes(a.id) ? '✓' : '○'}</Text>
        </TouchableOpacity>)}
      </ScrollView>
      {sheet === 'district' && <TouchableOpacity style={s.done} onPress={() => setSheet(null)}><Text style={{ color: 'white', fontWeight: '700' }}>Xong</Text></TouchableOpacity>}
    </AppBottomSheet>
    <LocationPicker allowAddressSearch={false} visible={locationOpen} onClose={() => setLocationOpen(false)} value={area.operatingLocationConfirmed && area.latitude != null && area.longitude != null ? { latitude: area.latitude, longitude: area.longitude, label: area.operatingLocationLabel || 'Điểm hoạt động' } : undefined}
      onSelect={point => {
        const nextProvince = !province && point.provinceCode ? catalog.provinces.find(p => p.code === point.provinceCode) : province;
        onChange({ ...area, city: nextProvince?.name || area.city, operatingProvinceCode: nextProvince?.code,
          operatingAreaIds: point.areaId && nextProvince?.areas.some(a => a.id === point.areaId) && !ids.includes(point.areaId) ? [...ids, point.areaId].slice(0,100) : ids,
          latitude: point.latitude, longitude: point.longitude, operatingLocationConfirmed: true, operatingLocationLabel: area.operatingLocationLabel || 'Điểm hoạt động đã xác nhận', clearOperatingLocation: false });
      }} />
  </>;
}
const s = StyleSheet.create({ label: { marginTop: 16, marginBottom: 8, fontSize: 14, fontWeight: '600', color: '#251D24' }, input: { minHeight: 50, justifyContent: 'center', borderWidth: 1, borderColor: '#E5DCE0', borderRadius: 12, paddingHorizontal: 14 }, list: { maxHeight: 320 }, row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5DCE0', paddingVertical: 8 }, helper: { fontSize: 12, color: '#756A70', marginBottom: 8 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }, chip: { padding: 8, borderRadius: 12, backgroundColor: '#FFF0F5' }, pink: { color: '#C5165D' }, done: { padding: 14, backgroundColor: '#D82D75', borderRadius: 12, alignItems: 'center', marginTop: 12 } });
