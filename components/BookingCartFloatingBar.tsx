import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useBookingStore } from '../store/useBookingStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors } from '../constants/theme';
import { ShoppingBag } from 'lucide-react-native';

interface BookingCartFloatingBarProps {
  onPressCart: () => void;
  onPressCheckout: () => void;
}

export default function BookingCartFloatingBar({ onPressCart, onPressCheckout }: BookingCartFloatingBarProps) {
  const insets = useSafeAreaInsets();
  const draft = useBookingStore(state => state.draft);
  const getServiceTotal = useBookingStore(state => state.getServiceTotal);

  if (!draft || draft.services.length === 0) {
    return null;
  }

  const totalAmount = getServiceTotal();
  const totalServices = draft.services.reduce((sum, s) => sum + s.participantsCount, 0);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      <View style={styles.content}>
        <TouchableOpacity style={[styles.leftInfo, { flex: 1 }]} onPress={onPressCart} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            <ShoppingBag color={BrandColors.textWhite} size={20} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalServices}</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Tổng cộng:</Text>
            <Text style={styles.priceValue}>{totalAmount.toLocaleString('vi-VN')}đ</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onPressCheckout} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Tiếp tục</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BrandColors.textWhite,
    borderTopWidth: 1,
    borderTopColor: BrandColors.borderLight,
    paddingTop: 16,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  content: {
    backgroundColor: BrandColors.accentPink,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: BrandColors.accentRose,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BrandColors.accentPink,
  },
  badgeText: {
    color: BrandColors.textWhite,
    fontSize: 10,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'column',
  },
  priceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  priceValue: {
    color: BrandColors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: BrandColors.textWhite,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  buttonText: {
    color: BrandColors.accentPink,
    fontSize: 14,
    fontWeight: '600',
  },
});
