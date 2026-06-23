import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useBookingStore } from '../store/useBookingStore';
import { BrandColors } from '../constants/theme';
import { Minus, Plus, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface BookingCartBottomSheetProps {
  onClose: () => void;
}

export default function BookingCartBottomSheet({ onClose }: BookingCartBottomSheetProps) {
  const router = useRouter();
  const draft = useBookingStore(state => state.draft);
  const getServiceTotal = useBookingStore(state => state.getServiceTotal);
  const updateServiceParticipantsCount = useBookingStore(state => state.updateServiceParticipantsCount);
  const removeService = useBookingStore(state => state.removeService);

  const totalAmount = getServiceTotal();

  if (!draft || draft.services.length === 0) {
    onClose();
    return null;
  }

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Giỏ hàng dịch vụ</Text>
          <Text style={styles.headerSubtitle}>MUA: {draft.mua?.name}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X color={BrandColors.textDark} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentInner}>
        {draft.services.map(service => (
          <View key={service.id} style={styles.serviceItem}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName} numberOfLines={2}>{service.name}</Text>
              <Text style={styles.servicePrice}>{service.price.toLocaleString('vi-VN')}đ</Text>
            </View>
            
            <View style={styles.quantityControls}>
              <Text style={styles.quantityLabel}>Số người:</Text>
              <View style={styles.stepper}>
                <TouchableOpacity 
                  style={styles.stepperBtn}
                  onPress={() => {
                    if (service.participantsCount <= 1) {
                      removeService(service.id);
                    } else {
                      updateServiceParticipantsCount(service.id, service.participantsCount - 1);
                    }
                  }}
                >
                  <Minus color={BrandColors.accentPink} size={16} />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{service.participantsCount}</Text>
                <TouchableOpacity 
                  style={styles.stepperBtn}
                  onPress={() => updateServiceParticipantsCount(service.id, service.participantsCount + 1)}
                >
                  <Plus color={BrandColors.accentPink} size={16} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalValue}>{totalAmount.toLocaleString('vi-VN')}đ</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutBtnText}>Xác nhận đặt lịch</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BrandColors.textWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BrandColors.textDark,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: 20,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
    paddingBottom: 16,
  },
  serviceInfo: {
    flex: 1,
    paddingRight: 16,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: BrandColors.textDark,
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: 14,
    color: BrandColors.accentPink,
    fontWeight: 'bold',
  },
  quantityControls: {
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 12,
    color: BrandColors.textSecondary,
    marginBottom: 4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    backgroundColor: BrandColors.textWhite,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  quantityValue: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: BrandColors.borderLight,
    backgroundColor: BrandColors.textWhite,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: BrandColors.textDark,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandColors.accentPink,
  },
  checkoutBtn: {
    backgroundColor: BrandColors.accentPink,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: BrandColors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
