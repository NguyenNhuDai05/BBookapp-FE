import { AppBottomSheet } from '../../ui/AppBottomSheet';
import React, { useRef, useState } from 'react';
import {View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image} from 'react-native';

import { AppAlert as appDialog } from '../../ui/dialogStore';
import * as ImagePicker from 'expo-image-picker';
import { BrandColors, Radius, Spacing, Typography } from '../../../constants/theme';

import { uploadImage } from '../../../services/supabase';
import { useMuaServices } from '../../../hooks/useMuaServices';
import { getApiError } from '../../../services/api';

const MAX_DESCRIPTION_LENGTH = 2000;

interface PortfolioFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void | Promise<void>;
  initialData?: any;
}

export function PortfolioFormModal({ visible, onClose, onSubmit, initialData }: PortfolioFormModalProps) {
  return visible ? <PortfolioFormContent visible={visible} onClose={onClose} onSubmit={onSubmit} initialData={initialData} /> : null;
}

function PortfolioFormContent({ visible, onClose, onSubmit, initialData }: PortfolioFormModalProps) {
  // Native inputs own their text/selection while typing; state records the draft for saving.
  const [title, setTitle] = useState<string>(initialData?.title || '');
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [imageUrls, setImageUrls] = useState<string[]>(initialData?.imageUrls?.length ? initialData.imageUrls : initialData?.imageUrl ? [initialData.imageUrl] : []);
  const [category, setCategory] = useState<string>(initialData?.category || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const picking = useRef(false);
  const saving = useRef(false);
  const [serviceId, setServiceId] = useState<string | undefined>(initialData?.serviceId || initialData?.service?.serviceId || initialData?.service?.id);
  const { data: services = [] } = useMuaServices('me');

  const pickImage = async () => {
    if (picking.current || saving.current || imageUrls.length >= 5) return;
    picking.current = true;
    setIsPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { appDialog.alert('Cấp quyền', 'Cho phép truy cập thư viện để chọn ảnh tác phẩm.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5 - imageUrls.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        setImageUrls(prev => [...new Set([...prev, ...newImages])].slice(0, 5));
      }
    } catch { appDialog.alert('Không thể chọn ảnh', 'Vui lòng thử mở thư viện ảnh lại.'); }
    finally { picking.current = false; setIsPicking(false); }
  };

  const handleSubmit = async () => {
    if (saving.current || picking.current || !imageUrls.length) return;
    saving.current = true;
    setIsUploading(true);
    try {
      const finalUrls = await Promise.all(
        imageUrls.map(async (img) => {
          return uploadImage(img, 'portfolio');
        })
      );

      await onSubmit({
        title,
        description,
        imageUrls: finalUrls,
        category,
        tags: category.split(',').map(t => t.trim()).filter(t => t.length > 0),
        serviceId,
      });
      onClose();
    } catch (error) {
      console.error('Error saving portfolio', error);
      appDialog.alert('Không thể lưu portfolio', getApiError(error).message);
    } finally {
      saving.current = false;
      setIsUploading(false);
    }
  };

  return (
    <AppBottomSheet visible={visible} title={initialData ? 'Sửa Portfolio' : 'Thêm tác phẩm'} onClose={onClose} loading={isUploading || isPicking} contentStyle={{height:'85%'}}>

<ScrollView style={styles.formContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.inputGroup}>
              <View style={styles.imageHeader}><Text style={styles.label}>Hình ảnh * · {imageUrls.length}/5</Text>
                {imageUrls.length > 0 && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Xóa tất cả ảnh" disabled={isUploading || isPicking} onPress={() => setImageUrls([])} style={styles.clearImages}><Text style={styles.clearImagesText}>Xóa tất cả</Text></TouchableOpacity>}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {(imageUrls && imageUrls.length > 0) ? imageUrls.map((uri, idx) => (
                  <View key={idx} style={[styles.imagePickerBtn, { width: 120, height: 160, marginRight: 10 }]}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Xóa ảnh ${idx + 1}`} disabled={isUploading || isPicking} style={styles.removeImage} onPress={() => setImageUrls(current => current.filter((_, index) => index !== idx))}><Text style={styles.removeImageText}>×</Text></TouchableOpacity>
                  </View>
                )) : null}
                {imageUrls.length < 5 && <TouchableOpacity accessibilityLabel="Thêm ảnh tác phẩm" disabled={isUploading || isPicking} style={[styles.imagePickerBtn, { width: 120, height: 160 }]} onPress={pickImage}>
                  <Text style={styles.imagePickerText}>+ Chọn ảnh</Text>
                </TouchableOpacity>}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gắn dịch vụ vào bài viết</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity style={[styles.serviceChip, !serviceId && styles.serviceChipActive]} onPress={() => setServiceId(undefined)}><Text>Không gắn</Text></TouchableOpacity>
                {services.map(service => <TouchableOpacity key={service.id} style={[styles.serviceChip, serviceId === service.id && styles.serviceChipActive]} onPress={() => setServiceId(service.id)}><Text numberOfLines={1}>{service.name || service.serviceName}</Text></TouchableOpacity>)}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên tác phẩm</Text>
              <TextInput
                style={styles.input}
                accessibilityLabel="Tên tác phẩm"
                editable={!isUploading}
                defaultValue={initialData?.title || ''}
                onChangeText={setTitle}
                placeholder="VD: Tone cô dâu tự nhiên"
                placeholderTextColor={BrandColors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mô tả</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                accessibilityLabel="Mô tả tác phẩm"
                editable={!isUploading}
                defaultValue={initialData?.description || ''}
                onChangeText={setDescription}
                placeholder="Cảm hứng hoặc thông tin chi tiết..."
                multiline
                numberOfLines={3}
                maxLength={MAX_DESCRIPTION_LENGTH}
                placeholderTextColor={BrandColors.textMuted}
              />
              <Text style={styles.characterCount}>{description.length}/{MAX_DESCRIPTION_LENGTH}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Danh mục (Tags)</Text>
              <TextInput
                style={styles.input}
                accessibilityLabel="Danh mục tác phẩm"
                editable={!isUploading}
                defaultValue={initialData?.category || ''}
                onChangeText={setCategory}
                placeholder="VD: Cô dâu, Chụp kỷ yếu"
                placeholderTextColor={BrandColors.textMuted}
              />
            </View>
          </ScrollView>

<View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isUploading || isPicking}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, (!imageUrls || imageUrls.length === 0 || isUploading) ? styles.submitBtnDisabled : null]}
              onPress={handleSubmit}
              disabled={(!imageUrls || imageUrls.length === 0 || isUploading || isPicking)}
            >
              <Text style={styles.submitBtnText}>{isUploading ? 'Đang tải lên...' : 'Lưu'}</Text>
            </TouchableOpacity>
          </View>
</AppBottomSheet>
  );
}

const styles = StyleSheet.create({
imageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
clearImages: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' },
clearImagesText: { color: BrandColors.accentRose, fontSize: 13, fontFamily: Typography.semiBold },
removeImage: { position: 'absolute', top: 4, right: 4, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(33,26,41,0.75)' },
removeImageText: { color: '#FFF', fontSize: 28 },
formContent: {
    padding: Spacing.md,
  },
imagePickerBtn: {
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BrandColors.bgPrimary,
    overflow: 'hidden',
  },
previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
imagePickerText: {
    color: BrandColors.textMuted,
    fontFamily: Typography.medium,
    fontSize: 14,
  },
inputGroup: {
    marginBottom: Spacing.lg,
  },
label: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: BrandColors.textDark,
    marginBottom: Spacing.xs,
  },
input: {
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Typography.regular,
    color: BrandColors.textDark,
    backgroundColor: BrandColors.bgPrimary,
  },
textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
characterCount: {
    marginTop: Spacing.xs,
    textAlign: 'right',
    color: BrandColors.textMuted,
    fontFamily: Typography.regular,
    fontSize: 12,
  },
serviceChip: { maxWidth: 170, paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: '#F4F4F5', marginRight: 8, borderWidth: 1, borderColor: '#EEE' },
serviceChipActive: { backgroundColor: '#FFF0F5', borderColor: BrandColors.accentPink },
modalFooter: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: BrandColors.borderLight,
    gap: Spacing.md,
  },
cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    alignItems: 'center',
  },
cancelBtnText: {
    fontFamily: Typography.semiBold,
    fontSize: 15,
    color: BrandColors.textDark,
  },
submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: BrandColors.accentRose,
    alignItems: 'center',
  },
submitBtnDisabled: {
    backgroundColor: BrandColors.textMuted,
  },
submitBtnText: {
    fontFamily: Typography.semiBold,
    fontSize: 15,
    color: '#FFF',
  }
});
