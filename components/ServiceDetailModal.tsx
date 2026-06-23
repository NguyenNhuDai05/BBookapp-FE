import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView, Dimensions, Platform } from 'react-native';
import { useBookingStore } from '../store/useBookingStore';
import { BrandColors } from '../constants/theme';
import { ArrowLeft, Share2, Minus, Plus, ImageIcon } from 'lucide-react-native';
import { ServiceDto } from '../types/ServiceDto';
import { ArtistDto } from '../types/ArtistDto';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ServiceDetailModalProps {
  visible: boolean;
  onClose: () => void;
  service: ServiceDto | null;
  mua: ArtistDto | null;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ServiceDetailModal({ visible, onClose, service, mua }: ServiceDetailModalProps) {
  const insets = useSafeAreaInsets();
  const draft = useBookingStore(state => state.draft);
  const updateServiceParticipantsCount = useBookingStore(state => state.updateServiceParticipantsCount);
  const removeService = useBookingStore(state => state.removeService);
  const addService = useBookingStore(state => state.addService);

  // Find current quantity in cart
  const cartItem = useMemo(() => {
    if (!service) return null;
    return draft?.services.find(s => s.id === service.id) || null;
  }, [draft, service]);

  const [localQuantity, setLocalQuantity] = useState(1);

  // Reset local quantity when modal opens
  useEffect(() => {
    if (visible) {
      setLocalQuantity(1);
    }
  }, [visible]);

  if (!service) return null;

  const handleDecrease = () => {
    if (localQuantity > 1) {
      setLocalQuantity(localQuantity - 1);
    }
  };

  const handleIncrease = () => {
    setLocalQuantity(localQuantity + 1);
  };

  const handleAddToCart = () => {
    if (!service || !mua) return;

    if (cartItem) {
      // Add localQuantity to existing count
      updateServiceParticipantsCount(cartItem.id, cartItem.participantsCount + localQuantity);
    } else {
      // Add new service to cart
      if (!draft?.mua || draft.mua.id !== mua.id) {
        useBookingStore.getState().setMua({
          id: mua.id,
          name: mua.name,
          avatarUrl: mua.avatar || '',
        } as any);
      }
      addService({
        id: service.id,
        name: service.name || service.serviceName!,
        durationMinutes: service.durationMinutes,
        price: service.price,
        participantsCount: localQuantity
      });
    }

    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} bounces={false} showsVerticalScrollIndicator={false}>
          {/* Cover Image Section */}
          <View style={styles.imageContainer}>
            {service.imageUrl ? (
              <Image source={{ uri: service.imageUrl }} style={styles.coverImage} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <ImageIcon size={48} color="#CCC" />
              </View>
            )}

            {/* Header Actions */}
            <View style={[styles.headerActions, { top: insets.top + 16 }]}>
              <TouchableOpacity style={styles.iconButton} onPress={onClose}>
                <ArrowLeft color={BrandColors.textWhite} size={24} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Share2 color={BrandColors.textWhite} size={22} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Service Details Section */}
          <View style={styles.contentContainer}>
            <Text style={styles.serviceName}>{service.name || service.serviceName}</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>{(service.price || 0).toLocaleString('vi-VN')}đ</Text>
              
              <View style={styles.stepper}>
                <TouchableOpacity 
                  style={styles.stepperBtn}
                  onPress={handleDecrease}
                  disabled={localQuantity <= 1}
                >
                  <Minus color={localQuantity <= 1 ? BrandColors.borderLight : BrandColors.accentPink} size={20} />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{localQuantity}</Text>
                <TouchableOpacity 
                  style={styles.stepperBtn}
                  onPress={handleIncrease}
                >
                  <Plus color={BrandColors.accentPink} size={20} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />
            
            <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
            {service.description ? (
              <Text style={styles.descriptionText}>{service.description}</Text>
            ) : (
              <Text style={[styles.descriptionText, { fontStyle: 'italic', color: BrandColors.textMuted }]}>Chưa có mô tả cho dịch vụ này.</Text>
            )}

            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>Thời gian thực hiện:</Text>
              <Text style={styles.metaValue}>{service.durationMinutes} phút</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity 
            style={styles.addToCartBtn} 
            onPress={handleAddToCart}
          >
            <Text style={styles.addToCartBtnText}>Thêm vào Booking</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.textWhite,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.4,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BrandColors.textDark,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: BrandColors.accentPink,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.textWhite,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    padding: 4,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    backgroundColor: BrandColors.textWhite,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    width: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: BrandColors.borderLight,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BrandColors.textDark,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: BrandColors.textBody,
    marginBottom: 20,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    marginRight: 8,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.textDark,
  },
  footer: {
    padding: 16,
    backgroundColor: BrandColors.textWhite,
    borderTopWidth: 1,
    borderTopColor: BrandColors.borderLight,
  },
  addToCartBtn: {
    backgroundColor: BrandColors.accentPink,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartBtnText: {
    color: BrandColors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
