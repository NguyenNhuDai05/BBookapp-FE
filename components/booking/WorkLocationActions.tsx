import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Copy, Navigation } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';
import { externalMapUri, openExternalMap, type ExternalDestination } from '../../services/externalNavigation';

// Checkout receives only the current, publicly available MUA workplace.
// Booking details continue to use their immutable booking snapshot.
export function WorkLocationActions({ destination }: { destination: ExternalDestination }) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const address = destination.address?.trim() || '';
  const perform = async (action: 'copy' | 'map') => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setFeedback('');
    try {
      if (action === 'copy') {
        const copied = await Clipboard.setStringAsync(address);
        setFeedback(copied ? 'Đã sao chép địa chỉ' : 'Không thể sao chép địa chỉ. Vui lòng thử lại.');
      } else if (!await openExternalMap(destination)) {
        setFeedback('Không mở được ứng dụng bản đồ. Bạn có thể sao chép địa chỉ.');
      }
    } catch {
      setFeedback('Không thể sao chép địa chỉ. Vui lòng thử lại.');
    } finally { lock.current = false; setBusy(false); }
  };
  return <View>
    <View style={styles.actions}>
      {!!address && <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.button} onPress={() => { void perform('copy'); }}><Copy size={16} color={BrandColors.accentRoseDark} /><Text style={styles.text}>Sao chép địa chỉ</Text></TouchableOpacity>}
      {externalMapUri(destination) && <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.button} onPress={() => { void perform('map'); }}><Navigation size={16} color={BrandColors.accentRoseDark} /><Text style={styles.text}>Mở bản đồ</Text></TouchableOpacity>}
    </View>
    {!!feedback && <Text accessibilityLiveRegion="polite" style={styles.feedback}>{feedback}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, minHeight: 44, borderRadius: Radius.md, backgroundColor: BrandColors.bgPink },
  text: { fontFamily: Typography.semiBold, fontSize: 13, color: BrandColors.accentRoseDark },
  feedback: { fontFamily: Typography.regular, fontSize: 12, lineHeight: 18, color: BrandColors.textSecondary, marginTop: Spacing.sm },
});
