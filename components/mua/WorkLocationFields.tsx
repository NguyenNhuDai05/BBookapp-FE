import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DeviceLocationError, getDeviceLocation } from '../../services/locationService';
import type { OperatingArea } from '../../types/location';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';

export function WorkLocationFields({ value, onChange }: { value: OperatingArea; onChange: (value: OperatingArea) => void }) {
  const latest = useRef({ value, onChange });
  const mounted = useRef(true); const lock = useRef(false);
  useEffect(() => { latest.current = { value, onChange }; }, [value, onChange]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [blocked, setBlocked] = useState(false);
  const patch = (changes: Partial<OperatingArea>) => latest.current.onChange({ ...latest.current.value, workLocationName: latest.current.value.workLocationName || '', workLocationAddress: latest.current.value.workLocationAddress || '', ...changes, publicMeetingPoint: false, operatingLocationLabel: undefined, clearOperatingLocation: false });
  const locate = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setBlocked(false);
    try {
      const point = await getDeviceLocation();
      if (mounted.current) patch({ ...point, operatingLocationConfirmed: true, clearWorkLocation: false });
    } catch (err) {
      if (mounted.current) { setError(err instanceof DeviceLocationError ? err.message : 'Không thể lấy GPS. Bạn vẫn có thể nhập địa chỉ thủ công.'); setBlocked(err instanceof DeviceLocationError && err.code === 'BLOCKED'); }
    } finally { lock.current = false; if (mounted.current) setBusy(false); }
  };
  return <View style={s.container}>
    <Text style={s.title}>Nơi làm việc</Text>
    <Text style={s.help}>Không bắt buộc. Thêm nơi bạn thường làm việc để khách tìm thấy bạn ở gần họ. Có thể bỏ qua nếu không có nơi cố định.</Text>
    <Text style={s.label}>Tên nơi làm việc (không bắt buộc)</Text>
    <TextInput accessibilityLabel="Tên nơi làm việc" value={value.workLocationName || ''} onChangeText={workLocationName => patch({ workLocationName, clearWorkLocation: false })} maxLength={100} placeholder="Ví dụ: Daisy Makeup Studio" style={s.input} />
    <Text style={s.label}>Địa chỉ nơi làm việc</Text>
    <TextInput accessibilityLabel="Địa chỉ nơi làm việc" value={value.workLocationAddress || ''} onChangeText={workLocationAddress => patch({ workLocationAddress, clearWorkLocation: false, ...(!workLocationAddress.trim() ? { allowCustomerVisit: false } : {}) })} multiline maxLength={500} placeholder="Số nhà, đường, phường/xã, tỉnh/thành..." style={s.input} />
    <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => { void locate(); }} style={s.action}>{busy ? <ActivityIndicator color={BrandColors.accentPink} /> : <Text style={s.link}>{value.operatingLocationConfirmed ? 'Dùng lại vị trí hiện tại' : 'Dùng vị trí hiện tại'}</Text>}</TouchableOpacity>
    {value.operatingLocationConfirmed && <><Text style={s.help}>✓ Đã lưu vị trí GPS. Hãy kiểm tra địa chỉ bên trên. Sửa địa chỉ không tự thay đổi GPS; nếu chuyển nơi làm việc, hãy lấy lại hoặc bỏ GPS.</Text><TouchableOpacity disabled={busy} onPress={() => patch({ latitude: undefined, longitude: undefined, operatingLocationConfirmed: false })}><Text style={s.link}>Bỏ vị trí GPS</Text></TouchableOpacity></>}
    {!!error && <Text accessibilityLiveRegion="polite" style={s.help}>{error}</Text>}
    {blocked && <TouchableOpacity onPress={() => { void Linking.openSettings().catch(() => setError('Không mở được cài đặt. Bạn vẫn có thể nhập địa chỉ thủ công.')); }}><Text style={s.link}>Mở cài đặt vị trí</Text></TouchableOpacity>}
    <View style={s.row}><Text style={s.consent}>Cho phép khách đến địa điểm này để sử dụng dịch vụ</Text><Switch accessibilityLabel="Cho phép khách đến nơi làm việc" value={!!value.allowCustomerVisit} disabled={!value.workLocationAddress?.trim()} onValueChange={allowCustomerVisit => patch({ allowCustomerVisit, clearWorkLocation: false })} trackColor={{ true: BrandColors.accentPink }} /></View>
    <Text style={s.help}>Khi tắt, địa chỉ và GPS chính xác không hiển thị công khai. GPS vẫn có thể dùng để tìm MUA gần bạn với khoảng cách gần đúng.</Text>
    {(!!value.workLocationAddress || !!value.workLocationName || value.latitude != null || value.longitude != null) && <TouchableOpacity disabled={busy} onPress={() => { patch({ workLocationName: '', workLocationAddress: '', latitude: undefined, longitude: undefined, operatingLocationConfirmed: false, allowCustomerVisit: false, clearWorkLocation: true }); setError(''); setBlocked(false); }}><Text style={s.link}>Xóa nơi làm việc</Text></TouchableOpacity>}
  </View>;
}
const s = StyleSheet.create({ container: { gap: Spacing.sm, marginTop: Spacing.lg }, title: { fontSize: 16, fontFamily: Typography.semiBold, color: BrandColors.textDark }, label: { fontSize: 14, fontFamily: Typography.semiBold, color: BrandColors.textDark }, help: { fontSize: 12, lineHeight: 18, color: BrandColors.textSecondary }, input: { minHeight: 50, borderWidth: 1, borderColor: BrandColors.borderSoft, borderRadius: Radius.md, padding: Spacing.md, color: BrandColors.textDark }, action: { minHeight: 44, justifyContent: 'center' }, link: { color: BrandColors.accentRoseDark, fontSize: 14, paddingVertical: Spacing.sm }, row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, consent: { flex: 1, fontSize: 14, color: BrandColors.textDark, lineHeight: 20 } });
