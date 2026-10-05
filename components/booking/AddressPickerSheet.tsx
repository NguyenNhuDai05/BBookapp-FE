import { AppBottomSheet } from '../ui/AppBottomSheet';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppAlert as appDialog } from '../ui/dialogStore';

import { DeviceLocationError, getDeviceLocation } from '../../services/locationService';
import type { Coordinate } from '../../types/location';
import {Crosshair, MapPin, Search} from 'lucide-react-native';

import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';

interface AddressPickerSheetProps {
  visible: boolean;
  value: string;
  coordinates?: Coordinate;
  onClose: () => void;
  onSelectAddress: (address: string, coordinates?: Coordinate) => void;
}

export function AddressPickerSheet({ visible, value, coordinates, onClose, onSelectAddress }: AddressPickerSheetProps) {
  const [address, setAddress] = useState(value);
  const [point, setPoint] = useState(coordinates);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const mounted = useRef(true);
  const busyLock = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const useCurrentLocation = async () => {
    if (busyLock.current) return;
    busyLock.current = true;
    setIsLocating(true);
    setLocationError('');
    setBlocked(false);

    try {
      const current = await getDeviceLocation();
      if (mounted.current) setPoint(current);
    } catch (error: any) {
      if (mounted.current) {
        setLocationError(error instanceof DeviceLocationError ? error.message : 'Không thể lấy vị trí hiện tại. Bạn vẫn có thể nhập địa chỉ thủ công.');
        setBlocked(error instanceof DeviceLocationError && error.code === 'BLOCKED');
      }
    } finally {
      busyLock.current = false;
      if (mounted.current) setIsLocating(false);
    }
  };

  const confirmAddress = () => {
    const normalized = address.trim();
    if (!normalized) {
      appDialog.alert('Thiếu địa chỉ', 'Vui lòng nhập hoặc chọn địa chỉ thực hiện.');
      return;
    }
    onSelectAddress(normalized, point);
    onClose();
  };

  return (
    <AppBottomSheet visible={visible} title="Chọn địa điểm thực hiện" onClose={onClose} loading={isLocating}  >

<TouchableOpacity style={styles.locationOption} onPress={useCurrentLocation} disabled={isLocating} activeOpacity={0.75}>
            <View style={styles.optionIcon}>{isLocating ? <ActivityIndicator color={BrandColors.accentPink} /> : <Crosshair size={21} color={BrandColors.accentPink} />}</View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>{isLocating ? 'Đang xác định vị trí...' : point ? 'Dùng lại vị trí hiện tại' : 'Dùng vị trí hiện tại'}</Text>
              <Text style={styles.optionSubtitle}>Không bắt buộc · GPS không tạo địa chỉ</Text>
            </View>
          </TouchableOpacity>

{locationError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{locationError}</Text>
              {blocked && Platform.OS !== 'web' ? <TouchableOpacity onPress={() => Linking.openSettings()}><Text style={styles.settingsLink}>Mở cài đặt</Text></TouchableOpacity> : null}
            </View>
          ) : null}

{point && <View><Text style={styles.optionSubtitle}>✓ Đã chọn vị trí GPS. Hãy nhập và kiểm tra địa chỉ bên dưới; GPS không tự thay đổi khi bạn sửa địa chỉ.</Text><TouchableOpacity onPress={() => setPoint(undefined)}><Text style={styles.settingsLink}>Bỏ vị trí GPS</Text></TouchableOpacity></View>}
<Text style={styles.inputLabel}>Địa chỉ thực hiện *</Text>

<View style={styles.inputContainer}>
            <Search size={19} color={BrandColors.textMuted} />
            <TextInput
              value={address}
              accessibilityLabel="Địa chỉ thực hiện"
              maxLength={500}
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

<TouchableOpacity accessibilityRole="button" style={[styles.confirmButton, !address.trim() && styles.confirmButtonDisabled]} onPress={confirmAddress} disabled={!address.trim()} activeOpacity={0.82}>
            <MapPin size={18} color={BrandColors.textWhite} />
            <Text style={styles.confirmText}>Xác nhận địa chỉ</Text>
          </TouchableOpacity>
</AppBottomSheet>
  );
}

const styles = StyleSheet.create({
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
confirmText: { fontFamily: Typography.bold, fontSize: 15, color: BrandColors.textWhite }
});
