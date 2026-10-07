import React, { useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Crosshair, MapPin, Pencil } from 'lucide-react-native';
import { AppBottomSheet } from '../ui/AppBottomSheet';
import { useLocationSelection } from '../../hooks/useLocationSelection';
import type { Coordinate } from '../../types/location';
import { composeLocationAddress, LOCATION_LIMITS } from '../../utils/locationAddress';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';

interface AddressPickerSheetProps {
  visible: boolean;
  value: string;
  coordinates?: Coordinate;
  details?: string;
  onClose: () => void;
  onSelectAddress: (address: string, coordinates?: Coordinate, details?: string) => void;
}

export function AddressPickerSheet({ visible, ...props }: AddressPickerSheetProps) {
  return <AppBottomSheet visible={visible} title="Địa điểm thực hiện" onClose={props.onClose}>
    {visible && <AddressSelection {...props} />}
  </AppBottomSheet>;
}

function AddressSelection({ value, coordinates, details = '', onClose, onSelectAddress }: Omit<AddressPickerSheetProps, 'visible'>) {
  const selection = useLocationSelection();
  const [mode, setMode] = useState<'existing' | 'gps' | 'manual'>(value ? 'existing' : 'manual');
  const [showManual, setShowManual] = useState(false);
  const [manualAddress, setAddress] = useState(value);
  const [point, setPoint] = useState(coordinates);
  const [locationDetails, setLocationDetails] = useState(details);
  const candidate = mode === 'gps' ? selection.candidate : undefined;
  const address = mode === 'gps' ? candidate?.formattedAddress || '' : manualAddress;
  const selectedPoint = mode === 'gps' ? candidate && candidate.accuracyQuality !== 'unreliable' ? { latitude: candidate.latitude, longitude: candidate.longitude } : undefined : point;
  const locate = () => { setMode('gps'); setShowManual(false); setLocationDetails(''); void selection.locate(); };
  const manual = () => { setAddress(address || manualAddress); selection.cancel(); setMode('manual'); setShowManual(true); setPoint(undefined); };
  const composed = composeLocationAddress(address, locationDetails);
  const gpsReady = mode !== 'gps' || (selection.phase === 'ready' && !!selection.candidate && selection.candidate.accuracyQuality !== 'unreliable' && !!selection.candidate.formattedAddress);
  const canConfirm = !!address.trim() && composed.length <= LOCATION_LIMITS.addressLength && gpsReady && !selection.busy;
  const confirm = () => { if (canConfirm) { onSelectAddress(address.trim(), selectedPoint, locationDetails.trim()); onClose(); } };
  const reverseMissing = selection.phase === 'ready' && candidate && !candidate.formattedAddress && candidate.accuracyQuality !== 'unreliable';
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
    <TouchableOpacity accessibilityRole="button" disabled={selection.busy} style={s.option} onPress={locate}>
      <Crosshair size={21} color={BrandColors.accentPink} /><Text style={s.link}>Sử dụng vị trí hiện tại</Text>
    </TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" style={s.option} onPress={manual}><Pencil size={19} color={BrandColors.accentPink} /><Text style={s.link}>Nhập địa chỉ khác</Text></TouchableOpacity>
    <View style={s.status} accessibilityLiveRegion="polite">
      {selection.busy && <ActivityIndicator color={BrandColors.accentPink} />}
      <Text style={s.helper}>{selection.busy ? selection.phase === 'resolving' ? 'Đang tìm địa chỉ...' : 'Đang xác định vị trí...' : selection.error}</Text>
    </View>
    {selection.blocked && Platform.OS !== 'web' && <TouchableOpacity onPress={() => { void Linking.openSettings().catch(() => {}); }}><Text style={s.link}>Mở cài đặt</Text></TouchableOpacity>}
    {selection.phase === 'error' && !selection.blocked && <TouchableOpacity onPress={locate}><Text style={s.link}>Thử lại</Text></TouchableOpacity>}
    {candidate?.accuracyQuality === 'unreliable' && <Text style={s.helper}>Vị trí chưa đủ tin cậy. Hãy thử lại hoặc nhập địa chỉ khác.</Text>}
    {candidate?.accuracyQuality === 'approximate' && <Text style={s.helper}>Vị trí có thể chưa chính xác. Hãy kiểm tra trước khi xác nhận hoặc thử lại.</Text>}
    {reverseMissing && <View><Text style={s.helper}>Đã xác định được vị trí GPS nhưng chưa tìm được địa chỉ.</Text><TouchableOpacity onPress={() => { void selection.retryReverse(); }}><Text style={s.link}>Thử tìm địa chỉ lại</Text></TouchableOpacity></View>}
    {showManual ? <><Text style={s.label}>Địa chỉ thực hiện</Text><TextInput accessibilityLabel="Địa chỉ thực hiện" value={address} onChangeText={text => { setAddress(text); setPoint(undefined); }} maxLength={LOCATION_LIMITS.addressLength} placeholder="Số nhà, đường, phường/xã, tỉnh/thành..." multiline style={s.input} /></> : !!address && !selection.busy && <View style={s.preview}><MapPin size={19} color={BrandColors.accentPink} /><Text style={s.address}>{address}</Text><TouchableOpacity accessibilityRole="button" onPress={manual}><Text style={s.link}>Chỉnh sửa</Text></TouchableOpacity></View>}
    {selectedPoint && !selection.busy && <Text style={s.helper}>✓ Đã xác định vị trí GPS</Text>}
    {(!!address || showManual) && <><Text style={s.label}>Chi tiết địa điểm · Không bắt buộc</Text><TextInput accessibilityLabel="Chi tiết địa điểm" value={locationDetails} onChangeText={setLocationDetails} maxLength={LOCATION_LIMITS.addressLength} placeholder="Tòa nhà, block, tầng, căn hộ, cổng vào..." multiline style={s.input} /></>}
    {composed.length > LOCATION_LIMITS.addressLength && <Text style={s.error}>Địa chỉ và chi tiết địa điểm tối đa 500 ký tự.</Text>}
    <TouchableOpacity accessibilityRole="button" disabled={!canConfirm} style={[s.confirm, !canConfirm && s.disabled]} onPress={confirm}><Text style={s.white}>Xác nhận địa điểm</Text></TouchableOpacity>
  </ScrollView>;
}

const s = StyleSheet.create({ content: { gap: Spacing.sm, paddingBottom: Spacing.sm }, option: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }, link: { fontFamily: Typography.semiBold, color: BrandColors.accentPink, paddingVertical: Spacing.sm }, status: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, helper: { fontFamily: Typography.regular, fontSize: 12, lineHeight: 18, color: BrandColors.textSecondary }, label: { fontFamily: Typography.semiBold, fontSize: 14, color: BrandColors.textDark, marginTop: Spacing.sm }, input: { minHeight: 72, borderWidth: 1, borderColor: BrandColors.borderLight, borderRadius: Radius.base, padding: Spacing.md, color: BrandColors.textDark, textAlignVertical: 'top' }, preview: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, address: { flex: 1, fontFamily: Typography.regular, fontSize: 14, lineHeight: 21, color: BrandColors.textDark }, confirm: { minHeight: 50, borderRadius: Radius.base, backgroundColor: BrandColors.accentPink, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm }, disabled: { opacity: .5 }, white: { fontFamily: Typography.bold, fontSize: 15, color: BrandColors.textWhite }, error: { color: BrandColors.statusCancelled, fontSize: 12 } });
