import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { Crosshair, MapPin, Search, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';

interface AddressPickerSheetProps {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSelectAddress: (address: string) => void;
}

function formatGeocodedAddress(place: Location.LocationGeocodedAddress) {
  return [place.name, place.street, place.district, place.subregion, place.city, place.region, place.country]
    .filter((part, index, values): part is string => Boolean(part) && values.indexOf(part) === index)
    .join(', ');
}

export function AddressPickerSheet({ visible, value, onClose, onSelectAddress }: AddressPickerSheetProps) {
  const [address, setAddress] = useState(value);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const useCurrentLocation = async () => {
    if (isLocating) return;
    setIsLocating(true);
    setLocationError('');

    try {
      const currentPermission = await Location.getForegroundPermissionsAsync();
      const permission = currentPermission.status === Location.PermissionStatus.GRANTED
        ? currentPermission
        : await Location.requestForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setLocationError('Không thể truy cập vị trí. Bạn vẫn có thể nhập địa chỉ thủ công.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const places = await Location.reverseGeocodeAsync(current.coords);
      const formatted = places[0] ? formatGeocodedAddress(places[0]) : '';

      if (!formatted) throw new Error('Không thể xác định địa chỉ từ vị trí hiện tại.');
      setAddress(formatted);
    } catch (error: any) {
      setLocationError(error?.message || 'Không thể lấy vị trí hiện tại. Vui lòng nhập địa chỉ thủ công.');
    } finally {
      setIsLocating(false);
    }
  };

  const confirmAddress = () => {
    const normalized = address.trim();
    if (!normalized) {
      Alert.alert('Thiếu địa chỉ', 'Vui lòng nhập hoặc chọn địa chỉ thực hiện.');
      return;
    }
    onSelectAddress(normalized);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Chọn địa điểm thực hiện</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}><X size={20} color={BrandColors.textDark} /></TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.locationOption} onPress={useCurrentLocation} disabled={isLocating} activeOpacity={0.75}>
            <View style={styles.optionIcon}>{isLocating ? <ActivityIndicator color={BrandColors.accentPink} /> : <Crosshair size={21} color={BrandColors.accentPink} />}</View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>{isLocating ? 'Đang xác định vị trí...' : 'Sử dụng vị trí hiện tại'}</Text>
              <Text style={styles.optionSubtitle}>Lấy vị trí từ thiết bị</Text>
            </View>
          </TouchableOpacity>

          {locationError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{locationError}</Text>
              {Platform.OS !== 'web' ? <TouchableOpacity onPress={() => Linking.openSettings()}><Text style={styles.settingsLink}>Mở cài đặt</Text></TouchableOpacity> : null}
            </View>
          ) : null}

          <Text style={styles.inputLabel}>Hoặc nhập địa chỉ</Text>
          <View style={styles.inputContainer}>
            <Search size={19} color={BrandColors.textMuted} />
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Số nhà, đường, phường/xã, tỉnh/thành..."
              placeholderTextColor={BrandColors.textMuted}
              style={styles.input}
              multiline
              textAlignVertical="top"
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          </View>

          <TouchableOpacity style={[styles.confirmButton, !address.trim() && styles.confirmButtonDisabled]} onPress={confirmAddress} disabled={!address.trim()} activeOpacity={0.82}>
            <MapPin size={18} color={BrandColors.textWhite} />
            <Text style={styles.confirmText}>Xác nhận địa chỉ</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: BrandColors.bgOverlay },
  backdrop: { ...StyleSheet.absoluteFill },
  sheet: { backgroundColor: BrandColors.bgCard, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { flex: 1, fontFamily: Typography.bold, fontSize: 19, color: BrandColors.textDark },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.bgPinkLight },
  locationOption: { minHeight: 72, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BrandColors.borderLight, borderRadius: Radius.base, padding: Spacing.md },
  optionIcon: { width: 42, height: 42, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.bgPinkLight, marginRight: Spacing.md },
  optionCopy: { flex: 1 },
  optionTitle: { fontFamily: Typography.semiBold, fontSize: 15, color: BrandColors.textDark },
  optionSubtitle: { fontFamily: Typography.regular, fontSize: 12, color: BrandColors.textMuted, marginTop: 3 },
  errorBox: { marginTop: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: '#FFF5F5' },
  errorText: { fontFamily: Typography.regular, fontSize: 12, lineHeight: 17, color: BrandColors.statusCancelled },
  settingsLink: { marginTop: Spacing.xs, fontFamily: Typography.semiBold, fontSize: 12, color: BrandColors.accentPink },
  inputLabel: { marginTop: Spacing.lg, marginBottom: Spacing.sm, fontFamily: Typography.semiBold, fontSize: 14, color: BrandColors.textDark },
  inputContainer: { minHeight: 86, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, borderWidth: 1, borderColor: BrandColors.borderLight, borderRadius: Radius.base, padding: Spacing.md, backgroundColor: BrandColors.bgPinkLight },
  input: { flex: 1, minHeight: 54, padding: 0, fontFamily: Typography.regular, fontSize: 14, lineHeight: 20, color: BrandColors.textDark },
  confirmButton: { minHeight: 50, marginTop: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radius.base, backgroundColor: BrandColors.accentPink },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmText: { fontFamily: Typography.bold, fontSize: 15, color: BrandColors.textWhite },
});
