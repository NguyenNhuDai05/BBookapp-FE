import React, { useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Copy, MapPin, Navigation } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';
import type { BookingDto } from '../../types/booking';
import { externalMapUri, openExternalMap } from '../../services/externalNavigation';

type Props = {
  booking: Pick<BookingDto, 'address' | 'serviceLatitude' | 'serviceLongitude' | 'serviceLocationType' | 'serviceLocationName' | 'note'>;
  authorized: boolean;
};

export function BookingLocationCard({ booking, authorized }: Props) {
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const busyLock = useRef(false);
  if (!authorized) return null;

  // Only booking snapshots are accepted. No MUA profile/draft/GPS lookup.
  const address = booking.address?.trim() || '';
  const workplace = booking.serviceLocationType === 'MUA_WORK_LOCATION';
  const destination = { address, latitude: booking.serviceLatitude, longitude: booking.serviceLongitude, label: booking.serviceLocationName };
  const canNavigate = externalMapUri(destination, Platform.OS) !== null;
  const perform = async (action: 'copy' | 'map') => {
    if (busyLock.current) return;
    busyLock.current = true; setBusy(true); setFeedback('');
    try {
      if (action === 'copy') {
        const copied = await Clipboard.setStringAsync(address);
        setFeedback(copied ? 'Đã sao chép địa chỉ' : 'Không thể sao chép địa chỉ. Vui lòng thử lại.');
      } else {
        const opened = await openExternalMap(destination);
        if (!opened) setFeedback(address ? 'Không mở được ứng dụng bản đồ. Bạn có thể sao chép địa chỉ.' : 'Không mở được ứng dụng bản đồ trên thiết bị này.');
      }
    } catch {
      setFeedback('Không thể sao chép địa chỉ. Vui lòng thử lại.');
    } finally {
      busyLock.current = false; setBusy(false);
    }
  };
  return <View style={s.container}>
    <View style={s.heading}><MapPin size={18} color={BrandColors.accentPink} /><Text style={s.title}>{workplace ? 'Nơi làm việc của MUA' : 'Địa điểm thực hiện'}</Text></View>
    {workplace && !!booking.serviceLocationName?.trim() && <Text style={s.name}>{booking.serviceLocationName}</Text>}
    <Text style={s.address}>{address || 'Chưa có địa chỉ trong lịch đặt này.'}</Text>
    {!!booking.note?.trim() && <View style={s.note}><Text style={s.helper}>Ghi chú từ khách hàng</Text><Text style={s.address}>{booking.note}</Text></View>}
    <View style={s.actions}>
      {!!address && <TouchableOpacity accessibilityRole="button" disabled={busy} style={s.button} onPress={() => { void perform('copy'); }}><Copy size={16} color={BrandColors.accentRoseDark} /><Text style={s.buttonText}>Sao chép địa chỉ</Text></TouchableOpacity>}
      {canNavigate && <TouchableOpacity accessibilityRole="button" disabled={busy} style={s.button} onPress={() => { void perform('map'); }}><Navigation size={16} color={BrandColors.accentRoseDark} /><Text style={s.buttonText}>Mở bản đồ</Text></TouchableOpacity>}
    </View>
    {!!feedback && <Text accessibilityLiveRegion="polite" style={s.helper}>{feedback}</Text>}
  </View>;
}

const s = StyleSheet.create({
  container: { paddingTop: Spacing.sm }, heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  title: { fontFamily: Typography.semiBold, color: BrandColors.textDark, fontSize: 14 },
  name: { fontFamily: Typography.semiBold, color: BrandColors.textDark, fontSize: 15, marginBottom: Spacing.xs },
  address: { fontFamily: Typography.regular, color: BrandColors.textDark, fontSize: 14, lineHeight: 21 },
  helper: { fontFamily: Typography.regular, color: BrandColors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: Spacing.xs },
  note: { marginTop: Spacing.sm }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, minHeight: 44, borderRadius: Radius.md, backgroundColor: BrandColors.bgPink },
  buttonText: { fontFamily: Typography.semiBold, color: BrandColors.accentRoseDark, fontSize: 13 },
});
