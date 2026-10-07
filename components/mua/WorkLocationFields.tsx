import React, { useState } from 'react';
import { ActivityIndicator, Keyboard, Linking, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronRight, MapPin, Navigation, Pencil } from 'lucide-react-native';
import { AppBottomSheet } from '../ui/AppBottomSheet';
import { useLocationSelection } from '../../hooks/useLocationSelection';
import type { Coordinate, OperatingArea } from '../../types/location';
import { isValidCoordinate } from '../../utils/locationCoordinates';
import { composeLocationAddress, LOCATION_LIMITS } from '../../utils/locationAddress';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';

const GPS_LABEL = 'Vị trí hoạt động đã xác nhận bằng GPS';

export function WorkLocationFields({ value, onChange }: { value: OperatingArea; onChange: (value: OperatingArea) => void }) {
  const [visible, setVisible] = useState(false);
  const point = value.latitude != null && value.longitude != null && isValidCoordinate({ latitude: value.latitude, longitude: value.longitude });
  const label = value.workLocationAddress || value.operatingLocationLabel || (point ? GPS_LABEL : '');
  const handleDismiss = () => { Keyboard.dismiss(); setVisible(false); };
  return <View style={s.container}>
    <Text style={s.title}>Vị trí hoạt động</Text>
    <Text style={s.help}>Nơi làm việc chính của bạn, giúp khách tìm MUA gần mình.</Text>
    <Action title={label ? 'Thay đổi vị trí' : 'Chọn vị trí hoạt động'} subtitle={label || 'Dùng GPS hoặc nhập địa chỉ'} icon="pin" onPress={() => setVisible(true)} />
    {!!label && <Text style={s.help}>{value.allowCustomerVisit ? 'Khách có thể tìm đến vị trí này.' : 'Địa chỉ và GPS chính xác được giữ riêng tư.'}</Text>}
    {point && !label.startsWith(GPS_LABEL) && <TouchableOpacity accessibilityRole="button" onPress={() => onChange({ ...value, latitude: undefined, longitude: undefined, operatingLocationConfirmed: false, clearOperatingLocation: true })}><Text style={s.link}>Bỏ vị trí GPS</Text></TouchableOpacity>}
    {(!!label || !!value.workLocationName) && <TouchableOpacity accessibilityRole="button" onPress={() => onChange({ ...value, workLocationName: undefined, workLocationAddress: undefined, latitude: undefined, longitude: undefined, operatingLocationConfirmed: false, allowCustomerVisit: false, publicMeetingPoint: false, operatingLocationLabel: undefined, clearWorkLocation: true, clearOperatingLocation: true })}><Text style={s.link}>Xóa vị trí hoạt động</Text></TouchableOpacity>}
    <AppBottomSheet visible={visible} draggable title="Vị trí hoạt động" description="Vị trí hoạt động chính cũng là nơi làm việc của bạn." closeAccessibilityLabel="Đóng chọn vị trí" onClose={handleDismiss}>
      {visible && <LocationEditor initial={value} onCancel={handleDismiss} onConfirm={next => { onChange(next); handleDismiss(); }} />}
    </AppBottomSheet>
  </View>;
}

function Action({ title, subtitle, icon, onPress, disabled = false }: { title: string; subtitle: string; icon: 'gps' | 'manual' | 'pin'; onPress: () => void; disabled?: boolean }) {
  const Icon = icon === 'gps' ? Navigation : icon === 'manual' ? Pencil : MapPin;
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={title} disabled={disabled} style={[s.action, disabled && s.disabled]} onPress={onPress}>
    <View style={s.icon}><Icon size={20} color={BrandColors.accentRoseDark} /></View>
    <View style={s.copy}><Text style={s.label}>{title}</Text><Text style={s.help}>{subtitle}</Text></View>
    <ChevronRight size={18} color={BrandColors.textMuted} />
  </TouchableOpacity>;
}

function LocationEditor({ initial, onCancel, onConfirm }: { initial: OperatingArea; onCancel: () => void; onConfirm: (value: OperatingArea) => void }) {
  const selection = useLocationSelection();
  const [mode, setMode] = useState<'choose' | 'gps' | 'manual'>('choose');
  const [address, setAddress] = useState(initial.workLocationAddress || initial.operatingLocationLabel || '');
  const [details, setDetails] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [allowVisit, setAllowVisit] = useState(!!initial.allowCustomerVisit);
  const [point, setPoint] = useState<Coordinate | undefined>(() => initial.latitude != null && initial.longitude != null && isValidCoordinate({ latitude: initial.latitude, longitude: initial.longitude }) ? { latitude: initial.latitude, longitude: initial.longitude } : undefined);
  const manual = () => { const label = selection.candidate?.formattedAddress || address; setAddress(label.startsWith(GPS_LABEL) ? '' : label); selection.cancel(); setMode('manual'); setPoint(undefined); };
  const gps = () => { setMode('gps'); setDetails(''); void selection.locate(); };
  const candidate = mode === 'gps' ? selection.candidate : undefined;
  const displayAddress = mode === 'gps' ? candidate?.formattedAddress || '' : address;
  const selectedPoint = mode === 'gps' ? candidate && candidate.accuracyQuality !== 'unreliable' && isValidCoordinate(candidate) ? { latitude: candidate.latitude, longitude: candidate.longitude } : undefined : point;
  // Existing API requires a workplace label. This GPS label is not a street address.
  const combined = composeLocationAddress(displayAddress || (selectedPoint ? GPS_LABEL : ''), details);
  const canConfirm = (!!selectedPoint || !!displayAddress.trim()) && combined.length <= LOCATION_LIMITS.addressLength && (mode !== 'gps' || !!selectedPoint);
  const confirm = () => {
    if (!canConfirm) return;
    selection.cancel();
    if (!allowVisit && selectedPoint) {
      onConfirm({ ...initial, ...selectedPoint, operatingLocationConfirmed: true, operatingLocationLabel: combined.slice(0, 300), publicMeetingPoint: false, allowCustomerVisit: false, workLocationName: undefined, workLocationAddress: undefined, clearWorkLocation: initial.clearWorkLocation || initial.workLocationAddress != null || initial.workLocationName != null || !!initial.allowCustomerVisit, clearOperatingLocation: false });
    } else {
      onConfirm({ ...initial, latitude: selectedPoint?.latitude, longitude: selectedPoint?.longitude, operatingLocationConfirmed: !!selectedPoint, operatingLocationLabel: undefined, publicMeetingPoint: false, workLocationName: mode === 'choose' ? initial.workLocationName : undefined, workLocationAddress: combined, allowCustomerVisit: allowVisit, clearWorkLocation: false, clearOperatingLocation: false });
    }
  };
  const settings = () => {
    if (Platform.OS === 'android' && selection.errorCode === 'DISABLED') void Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => Linking.openSettings().catch(() => {}));
    else if (Platform.OS !== 'web') void Linking.openSettings().catch(() => {});
  };
  const errorText = selection.errorCode === 'DENIED' ? 'BBook cần quyền vị trí để xác định nơi làm việc của bạn.' : selection.errorCode === 'DISABLED' ? 'Vui lòng bật dịch vụ vị trí.' : selection.errorCode === 'TIMEOUT' ? 'Chưa thể xác định vị trí.' : selection.blocked ? 'Hãy cho phép BBook truy cập vị trí trong cài đặt.' : 'Không thể xác định vị trí lúc này.';
  return <View style={s.editor}>
    <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={s.body}>
      {mode !== 'manual' && <>
        <Action title="Sử dụng vị trí hiện tại" subtitle="Lấy vị trí GPS của bạn" icon="gps" onPress={gps} disabled={selection.busy} />
        <Action title="Nhập vị trí thủ công" subtitle="Nhập địa chỉ nếu bạn không muốn dùng GPS" icon="manual" onPress={manual} />
      </>}
      {mode === 'gps' && !candidate && selection.busy && <View style={s.result} accessibilityLiveRegion="polite"><ActivityIndicator color={BrandColors.primaryPink} /><Text style={s.label}>Đang xác định vị trí...</Text><Text style={s.help}>Bạn có thể nhập thủ công hoặc đóng bảng trong lúc chờ.</Text></View>}
      {mode === 'gps' && selection.phase === 'error' && <View style={s.error} accessibilityLiveRegion="polite">
        <Text style={s.label}>{errorText}</Text><View style={s.row}>
          <TouchableOpacity accessibilityRole="button" onPress={selection.blocked || selection.errorCode === 'DISABLED' ? settings : gps}><Text style={s.link}>{selection.blocked ? 'Mở cài đặt' : selection.errorCode === 'DISABLED' ? 'Bật vị trí' : selection.errorCode === 'DENIED' ? 'Cho phép lại' : 'Thử lại'}</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={manual}><Text style={s.link}>Nhập thủ công</Text></TouchableOpacity>
        </View>
      </View>}
      {mode === 'manual' ? <View style={s.result}>
        <Text style={s.label}>Địa chỉ hoạt động</Text><TextInput accessibilityLabel="Địa chỉ hoạt động" value={address} onChangeText={text => { setAddress(text); setPoint(undefined); }} maxLength={LOCATION_LIMITS.addressLength} multiline placeholder="Số nhà, đường, phường/xã, tỉnh/thành..." style={s.input} />
        <TouchableOpacity accessibilityRole="button" onPress={gps}><Text style={s.link}>Quay lại dùng GPS</Text></TouchableOpacity>
      </View> : (!!candidate || (mode === 'choose' && (!!displayAddress || !!selectedPoint))) && <View style={s.result} accessibilityLiveRegion="polite">
        <View style={s.row}><MapPin size={20} color={BrandColors.accentRoseDark} /><Text style={[s.label, s.copy]}>{displayAddress || (selectedPoint ? 'Đã xác định vị trí GPS' : 'Vị trí chưa đủ tin cậy')}</Text></View>
        {!!selectedPoint && !!displayAddress && <Text style={s.success}>✓ Đã xác định vị trí GPS</Text>}
        {candidate?.accuracyQuality === 'approximate' && <Text style={s.help}>Vị trí có thể chưa chính xác. Bạn có thể lấy lại GPS.</Text>}
        {candidate?.accuracyQuality === 'unreliable' && <Text style={s.help}>Hãy thử lại GPS hoặc nhập vị trí thủ công.</Text>}
        {selection.phase === 'resolving' && <View style={s.row}><ActivityIndicator size="small" color={BrandColors.primaryPink} /><Text style={s.help}>Đang tải tên địa chỉ...</Text></View>}
        {candidate && selectedPoint && !displayAddress && selection.phase === 'ready' && <>
          <Text style={s.help}>Chưa tải được tên địa chỉ. Bạn vẫn có thể xác nhận GPS.</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => { void selection.retryReverse(); }}><Text style={s.link}>Thử lại địa chỉ</Text></TouchableOpacity>
        </>}
        {candidate?.accuracyQuality === 'unreliable' && <TouchableOpacity accessibilityRole="button" onPress={gps}><Text style={s.link}>Thử lại</Text></TouchableOpacity>}
      </View>}
      <View style={s.consentSection}>
        <View style={s.row}><Text style={[s.label, s.copy]}>Khách có thể đến địa điểm này</Text><Switch accessibilityLabel="Cho phép khách đến địa điểm này" accessibilityState={{ checked: allowVisit }} value={allowVisit} onValueChange={setAllowVisit} trackColor={{ true: BrandColors.primaryPink }} /></View>
        <Text style={s.help}>{allowVisit ? 'Khi bật, khách sẽ thấy địa chỉ và GPS chính xác nếu có để tìm đến bạn.' : 'Vị trí hỗ trợ tìm MUA gần bạn. Địa chỉ và GPS chính xác không hiển thị công khai.'}</Text>
      </View>
      {(!!selectedPoint || !!displayAddress.trim()) && <View>
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }} accessibilityLabel="Thêm chi tiết địa điểm" style={s.detailsToggle} onPress={() => setDetailsOpen(!detailsOpen)}>
          <View style={s.copy}><Text style={s.label}>Thêm chi tiết địa điểm</Text><Text style={s.help}>Tùy chọn · Tòa nhà, tầng, căn hộ, cổng vào...</Text></View><ChevronDown size={18} color={BrandColors.textMuted} style={{ transform: [{ rotate: detailsOpen ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>
        {detailsOpen && <><Text style={s.help}>Chi tiết địa điểm · Không bắt buộc</Text><TextInput accessibilityLabel="Chi tiết địa điểm MUA" value={details} onChangeText={setDetails} maxLength={LOCATION_LIMITS.addressLength} multiline placeholder="Tòa nhà, tầng, căn hộ, cổng vào..." style={s.input} /></>}
      </View>}
      {!allowVisit && !!selectedPoint && !!initial.workLocationAddress && <Text style={s.help}>Khi lưu điểm riêng, địa điểm tiếp khách cũ sẽ được xóa. Địa điểm trong booking đã tạo vẫn được giữ.</Text>}
      {combined.length > LOCATION_LIMITS.addressLength && <Text style={s.help}>Địa chỉ và chi tiết tối đa 500 ký tự.</Text>}
    </ScrollView>
    <View style={s.footer}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Xác nhận vị trí" disabled={!canConfirm} style={[s.confirm, !canConfirm && s.disabled]} onPress={confirm}><Text style={s.white}>Xác nhận vị trí</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={onCancel} style={s.cancel}><Text style={s.link}>Hủy</Text></TouchableOpacity>
    </View>
  </View>;
}

const s = StyleSheet.create({
  container: { gap: Spacing.sm, paddingBottom: Spacing.sm, marginTop: Spacing.sm }, editor: { flexShrink: 1 }, scroll: { flexShrink: 1 }, body: { gap: Spacing.md, paddingBottom: Spacing.base },
  title: { fontSize: 16, fontFamily: Typography.semiBold, color: BrandColors.textDark }, label: { fontSize: 14, lineHeight: 21, fontFamily: Typography.semiBold, color: BrandColors.textDark }, help: { fontSize: 12, lineHeight: 18, color: BrandColors.textSecondary },
  action: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderWidth: 1, borderColor: BrandColors.borderLight, borderRadius: Radius.base, backgroundColor: BrandColors.bgPinkLight },
  icon: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: BrandColors.bgPink, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 },
  result: { padding: Spacing.base, borderRadius: Radius.base, backgroundColor: BrandColors.bgPinkLight, gap: Spacing.sm, borderWidth: 1, borderColor: BrandColors.borderLight }, error: { padding: Spacing.base, borderRadius: Radius.base, backgroundColor: BrandColors.statusCancelledBg, gap: Spacing.sm },
  success: { fontSize: 12, lineHeight: 18, color: BrandColors.statusConfirmed }, input: { minHeight: 64, borderWidth: 1, borderColor: BrandColors.borderSoft, borderRadius: Radius.md, padding: Spacing.md, color: BrandColors.textDark, textAlignVertical: 'top', marginTop: Spacing.sm, backgroundColor: BrandColors.bgCard },
  link: { color: BrandColors.accentRoseDark, fontSize: 14, lineHeight: 20, paddingVertical: Spacing.md }, row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }, consentSection: { gap: Spacing.xs }, detailsToggle: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  footer: { paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: BrandColors.borderLight }, confirm: { minHeight: 50, backgroundColor: BrandColors.primaryPink, borderRadius: Radius.base, alignItems: 'center', justifyContent: 'center' }, white: { color: BrandColors.textWhite, fontFamily: Typography.semiBold, fontSize: 15 }, disabled: { opacity: .45 }, cancel: { alignItems: 'center', minHeight: 44 },
});
