import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { AppBottomSheet } from '../ui/AppBottomSheet';
import { DeviceLocationError, getDeviceLocation } from '../../services/locationService';
import type { SelectedLocation } from '../../types/location';

type LocationPickerProps = {
  visible: boolean;
  value?: SelectedLocation;
  onClose: () => void;
  onSelect: (point: SelectedLocation) => void;
};
export function LocationPicker({ visible, value, onClose, onSelect }: LocationPickerProps) {
  return <AppBottomSheet visible={visible} title="Vị trí hiện tại" onClose={onClose}>
    {visible ? <GpsPickerContent value={value} onClose={onClose} onSelect={onSelect} /> : null}
  </AppBottomSheet>;
}
function GpsPickerContent({ value, onClose, onSelect }: Omit<LocationPickerProps, 'visible'>) {
  const [candidate, setCandidate] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const mounted = useRef(true);
  const busyLock = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const locate = async () => {
    if (busyLock.current) return;
    busyLock.current = true; setBusy(true); setError(''); setBlocked(false);
    try {
      const point = await getDeviceLocation();
      if (mounted.current) setCandidate({ ...point, label: 'Vị trí GPS đã xác nhận' });
    } catch (e) {
      if (mounted.current) {
        setError(e instanceof DeviceLocationError ? e.message : 'Không thể lấy vị trí hiện tại. Bạn vẫn có thể chọn khu vực thủ công.');
        setBlocked(e instanceof DeviceLocationError && e.code === 'BLOCKED');
      }
    } finally {
      busyLock.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return <>
    <Text style={s.helper}>GPS chỉ xác định vị trí, không tạo hoặc thay đổi địa chỉ. Vị trí chỉ được chọn khi bạn xác nhận.</Text>
    <TouchableOpacity accessibilityRole="button" disabled={busy} style={s.secondary} onPress={() => { void locate(); }}>
      <Text style={s.link}>{candidate ? 'Dùng lại vị trí hiện tại' : 'Dùng vị trí hiện tại'}</Text>
    </TouchableOpacity>
    {busy && <ActivityIndicator color="#D82D75" />}
    {!!error && <Text style={s.error}>{error}</Text>}
    {blocked && Platform.OS !== 'web' && <TouchableOpacity onPress={() => { void Linking.openSettings(); }}><Text style={s.link}>Mở cài đặt quyền vị trí</Text></TouchableOpacity>}
    {candidate && <Text style={s.helper}>✓ Đã xác nhận vị trí GPS</Text>}
    <TouchableOpacity accessibilityRole="button" disabled={!candidate || busy} style={[s.button, (!candidate || busy) && { opacity: .4 }]} onPress={() => { if (candidate) { onSelect(candidate); onClose(); } }}>
      <Text style={s.white}>Xác nhận vị trí</Text>
    </TouchableOpacity>
  </>;
}
const s = StyleSheet.create({ helper: { color: '#756A70', fontSize: 13, paddingVertical: 8 }, error: { color: '#B3261E', paddingVertical: 8 }, link: { color: '#C5165D', fontWeight: '600' }, secondary: { paddingVertical: 15 }, button: { padding: 15, backgroundColor: '#D82D75', borderRadius: 16, alignItems: 'center', marginTop: 12 }, white: { color: 'white', fontWeight: '700' } });
