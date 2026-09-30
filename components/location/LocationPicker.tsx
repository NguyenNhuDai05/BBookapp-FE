import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import * as Crypto from 'expo-crypto';
import { AppBottomSheet } from '../ui/AppBottomSheet';
import AreaMap from './AreaMap';
import { DeviceLocationError, getDeviceLocation, locationService, resolveDeviceLocation } from '../../services/locationService';
import { getApiError } from '../../services/api';
import type { SelectedLocation } from '../../types/location';
export function LocationPicker({ visible, value, onClose, onSelect, allowAddressSearch = true }: { visible: boolean; value?: SelectedLocation; onClose: () => void; onSelect: (point: SelectedLocation) => void; allowAddressSearch?: boolean }) {
  const [search, setSearch] = useState(''); const [candidate, setCandidate] = useState<SelectedLocation>();
  const [suggestions, setSuggestions] = useState<{ id: string; label: string }[]>([]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [blocked, setBlocked] = useState(false);
  const session = useRef(''); const generation = useRef(0); const busyLock = useRef(false);
  useEffect(() => {
    generation.current++; busyLock.current = false; setBusy(false);
    if (visible) { session.current = Crypto.randomUUID(); setCandidate(value); setSearch(''); setSuggestions([]); setError(''); setBlocked(false); }
    return () => { generation.current++; };
  }, [visible]);
  useEffect(() => {
    if (!visible || !allowAddressSearch || search.trim().length < 2) { setSuggestions([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      locationService.search(search.trim(), session.current, controller.signal).then(rows => {
        if (!controller.signal.aborted) { setSuggestions(rows); setError(rows.length ? '' : 'Không tìm thấy địa điểm. Hãy thử tên cụ thể hơn.'); }
      }).catch(e => { if (!controller.signal.aborted) { setSuggestions([]); setError(getApiError(e).message); } });
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [visible, search, allowAddressSearch]);
  const run = async (action: () => Promise<SelectedLocation>, endSearch = false) => {
    if (busyLock.current) return;
    const current = generation.current; busyLock.current = true; setBusy(true); setError(''); setBlocked(false);
    try { const point = await action(); if (current === generation.current) { setCandidate(point); if (endSearch) { session.current = Crypto.randomUUID(); setSearch(''); } } }
    catch (e) { if (current === generation.current) { setError(e instanceof DeviceLocationError ? e.message : getApiError(e).message); setBlocked(e instanceof DeviceLocationError && e.code === 'BLOCKED'); } }
    finally { if (current === generation.current) { busyLock.current = false; setBusy(false); } }
  };
  return <AppBottomSheet visible={visible} title="Chọn vị trí" onClose={onClose}>
    <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 550 }}>
      {allowAddressSearch && <TextInput accessibilityLabel="Tìm địa điểm" value={search} onChangeText={setSearch} placeholder="Nhập địa điểm hoặc địa chỉ..." style={s.input} />}
      {suggestions.map(row => <TouchableOpacity key={row.id} style={s.row} disabled={busy} onPress={() => run(() => locationService.select(row.id, session.current), true)}><Text>{row.label}</Text></TouchableOpacity>)}
      {suggestions.length > 0 && <Text style={s.helper}>Google Maps</Text>}
      <TouchableOpacity disabled={busy} style={s.secondary} onPress={() => run(async () => resolveDeviceLocation(await getDeviceLocation()))}><Text style={s.link}>Sử dụng vị trí hiện tại</Text></TouchableOpacity>
      {busy && <ActivityIndicator color="#D82D75" />}{!!error && <Text style={s.error}>{error}</Text>}
      {blocked && Platform.OS !== 'web' && <TouchableOpacity onPress={() => { void Linking.openSettings(); }}><Text style={s.link}>Mở cài đặt quyền vị trí</Text></TouchableOpacity>}
      <AreaMap center={candidate || { latitude: 10.7769, longitude: 106.7009 }} points={candidate ? [{ ...candidate, id: 'origin', title: candidate.label }] : []} onPick={point => { generation.current++; busyLock.current = false; setBusy(false); setError(''); setBlocked(false); setCandidate({ ...point, label: 'Điểm đã chọn trên bản đồ' }); }} />
      <Text style={s.helper}>Chạm bản đồ để điều chỉnh. Vị trí chỉ được lưu khi bạn xác nhận.</Text>{candidate && <Text style={s.row}>{candidate.label}</Text>}
    </ScrollView>
    <TouchableOpacity accessibilityRole="button" disabled={!candidate || busy} style={[s.button, (!candidate || busy) && { opacity: .4 }]} onPress={() => { if (candidate) onSelect(candidate); onClose(); }}><Text style={s.white}>Xác nhận vị trí</Text></TouchableOpacity>
  </AppBottomSheet>;
}
const s = StyleSheet.create({ input: { borderWidth: 1, borderColor: '#E5DCE0', borderRadius: 12, padding: 12, minHeight: 48 }, row: { paddingVertical: 12 }, helper: { color: '#756A70', fontSize: 12, paddingVertical: 8 }, error: { color: '#B3261E', paddingVertical: 8 }, link: { color: '#C5165D', fontWeight: '600' }, secondary: { paddingVertical: 15 }, button: { padding: 15, backgroundColor: '#D82D75', borderRadius: 16, alignItems: 'center', marginTop: 12 }, white: { color: 'white', fontWeight: '700' } });
