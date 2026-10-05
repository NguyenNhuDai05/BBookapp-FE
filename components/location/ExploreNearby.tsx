import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LocationPicker } from './LocationPicker';
import { AppBottomSheet } from '../ui/AppBottomSheet';
import { locationService } from '../../services/locationService';
import { getApiError } from '../../services/api';
import { operatingCatalog } from '../../utils/operatingAreas';
import { normalizeAreaName } from '../../utils/muaAreas';
import type { SelectedLocation } from '../../types/location';

export function ExploreNearby({ onOpenArtist, searchQuery }: { onOpenArtist: (id: string) => void; searchQuery: string }) {
  const [location, setLocation] = useState<SelectedLocation>();
  const [provinceCode, setProvinceCode] = useState<number>(); const [areaId, setAreaId] = useState<string>();
  const [picker, setPicker] = useState(false); const [areaSheet, setAreaSheet] = useState(false); const [areaSearch, setAreaSearch] = useState('');
  const [radius, setRadius] = useState(10); const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState(searchQuery);
  useEffect(() => { const timer = setTimeout(() => { setKeyword(searchQuery.trim()); setPage(1); }, 400); return () => clearTimeout(timer); }, [searchQuery]);
  const province = operatingCatalog.provinces.find(p => p.code === provinceCode);
  const query = useQuery({ queryKey: ['nearby-muas', location?.latitude, location?.longitude, provinceCode, areaId, radius, page, keyword],
    queryFn: ({ signal }) => locationService.nearby({ latitude: location?.latitude, longitude: location?.longitude, radiusKm: radius, provinceCode, areaId, page, q: keyword || undefined }, signal),
    enabled: !!location || !!provinceCode, staleTime: 30000, retry: 1 });
  const items = query.data?.items || [];
  return <View style={s.container}>
    <Text style={s.title}>Tìm MUA quanh bạn</Text>
    <TouchableOpacity style={s.input} onPress={() => setPicker(true)}><Text style={s.pink}>{location ? 'Đã chọn vị trí GPS · Cập nhật' : 'Dùng vị trí hiện tại'} ▾</Text></TouchableOpacity>
    <TouchableOpacity style={s.areaButton} onPress={() => { setAreaSearch(''); setAreaSheet(true); }}><Text>{province ? `${province.name}${areaId ? ` · ${province.areas.find(a => a.id === areaId)?.name || ''}` : ''}` : 'Hoặc chọn tỉnh/thành, khu vực'} ▾</Text></TouchableOpacity>
    {location && <View style={s.controls}>{[5,10,20,50].map(km => <TouchableOpacity key={km} style={[s.chip, radius === km && s.active]} onPress={() => { setRadius(km); setPage(1); }}><Text style={radius === km ? s.white : s.pink}>{km} km</Text></TouchableOpacity>)}</View>}
    {(location || provinceCode) && <>
      <View style={s.controls}>
      <TouchableOpacity style={s.chip} onPress={() => { setLocation(undefined); setProvinceCode(undefined); setAreaId(undefined); setPage(1); }}><Text>Xóa vị trí</Text></TouchableOpacity></View>
      <Text style={s.helper}>{location ? 'Khoảng cách ước tính theo đường thẳng từ vị trí GPS đã chọn, không phải quãng đường đi xe.' : 'Đang tìm theo khu vực; chưa tính khoảng cách.'}</Text>
      {query.isFetching && <ActivityIndicator color="#C5165D" />}
      {query.isError && <TouchableOpacity onPress={() => { void query.refetch(); }}><Text style={s.error}>{getApiError(query.error).message} · Chạm để thử lại</Text></TouchableOpacity>}
      {!query.isFetching && !query.isError && items.length === 0 && <Text style={s.helper}>Chưa có MUA phù hợp. Hãy tăng bán kính hoặc chọn khu vực khác.</Text>}
      {items.map(artist => <View key={artist.muaId} style={s.card}>
        <TouchableOpacity style={s.artist} onPress={() => onOpenArtist(artist.muaId)}>
          {artist.avatarUrl ? <Image source={{ uri: artist.avatarUrl }} style={s.avatar} /> : <View style={[s.avatar, { backgroundColor: '#FCE1EC' }]} />}
          <View style={{ flex: 1 }}><Text style={s.name}>{artist.fullName}</Text><Text style={s.helper}>{artist.distanceKm != null ? `Cách khoảng ${artist.distanceKm.toFixed(1).replace('.', ',')} km` : artist.city}</Text>
          <Text>{artist.minPrice != null ? `Từ ${artist.minPrice.toLocaleString('vi-VN')} đ` : 'Liên hệ'}</Text></View>
        </TouchableOpacity>
        <View style={s.controls}><TouchableOpacity style={s.chip} onPress={() => onOpenArtist(artist.muaId)}><Text style={s.pink}>Xem hồ sơ</Text></TouchableOpacity></View>
      </View>)}
      {!!query.data && query.data.total > query.data.pageSize && <View style={s.controls}>
        <TouchableOpacity disabled={page <= 1 || query.isFetching} style={s.chip} onPress={() => setPage(p => p - 1)}><Text>Trước</Text></TouchableOpacity><Text>Trang {page} / {Math.ceil(query.data.total / query.data.pageSize)}</Text>
        <TouchableOpacity disabled={page * query.data.pageSize >= query.data.total || query.isFetching} style={s.chip} onPress={() => setPage(p => p + 1)}><Text>Sau</Text></TouchableOpacity>
      </View>}
    </>}
    <LocationPicker visible={picker} value={location} onClose={() => setPicker(false)} onSelect={point => { setLocation(point); setProvinceCode(undefined); setAreaId(undefined); setPage(1); }} />
    <AppBottomSheet visible={areaSheet} title="Chọn khu vực tìm MUA" onClose={() => setAreaSheet(false)}>
      <TextInput placeholder="Tìm khu vực..." value={areaSearch} onChangeText={setAreaSearch} style={s.input} />
      {province && <View style={s.controls}><TouchableOpacity style={s.chip} onPress={() => setProvinceCode(undefined)}><Text>Đổi tỉnh/thành</Text></TouchableOpacity><TouchableOpacity style={s.chip} onPress={() => { setAreaId(undefined); setLocation(undefined); setPage(1); setAreaSheet(false); }}><Text>Toàn tỉnh/thành</Text></TouchableOpacity></View>}
      <ScrollView style={{ maxHeight: 350 }} keyboardShouldPersistTaps="handled">
        {!province ? operatingCatalog.provinces.filter(p => normalizeAreaName(p.name).includes(normalizeAreaName(areaSearch))).map(p => <TouchableOpacity key={p.code} style={s.areaButton} onPress={() => { setProvinceCode(p.code); setAreaId(undefined); setLocation(undefined); setAreaSearch(''); setPage(1); }}><Text>{p.name}</Text></TouchableOpacity>) : province.areas.filter(a => normalizeAreaName(a.name).includes(normalizeAreaName(areaSearch))).map(a => <TouchableOpacity key={a.id} style={s.areaButton} onPress={() => { setAreaId(a.id); setLocation(undefined); setPage(1); setAreaSheet(false); }}><Text>{a.name}{a.kind === 'legacy-district' ? ' · khu vực cũ' : ''}</Text></TouchableOpacity>)}
      </ScrollView>
    </AppBottomSheet>
  </View>;
}
const s = StyleSheet.create({ container: { marginTop: 12, marginBottom: 20, borderRadius: 18, backgroundColor: 'white', padding: 14 }, title: { fontSize: 18, fontWeight: '700', marginBottom: 12 }, input: { borderWidth: 1, borderColor: '#E5DCE0', padding: 12, borderRadius: 12, minHeight: 48 }, areaButton: { paddingVertical: 14 }, pink: { color: '#C5165D' }, controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginVertical: 8 }, chip: { borderRadius: 12, padding: 9, backgroundColor: '#FFF0F5' }, active: { backgroundColor: '#C5165D' }, white: { color: 'white' }, helper: { color: '#756A70', fontSize: 12, marginVertical: 6 }, error: { color: '#B3261E', paddingVertical: 8 }, card: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0E7EB' }, artist: { flexDirection: 'row', gap: 12, alignItems: 'center' }, avatar: { width: 60, height: 60, borderRadius: 14 }, name: { fontSize: 16, fontWeight: '600' } });
