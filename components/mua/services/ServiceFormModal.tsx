import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BrandColors, Radius, Spacing, Typography } from '../../../constants/theme';
import { X } from 'lucide-react-native';
import { saveImageToLocalDirectory } from '../../../utils/fileHelpers';


interface ServiceFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function ServiceFormModal({ visible, onClose, onSubmit, initialData }: ServiceFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUrl(result.assets[0].uri);
    }
  };

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setName(initialData.name || initialData.serviceName || '');
        setDescription(initialData.description || '');
        setPrice(initialData.price ? initialData.price.toString() : '');
        setDuration(initialData.durationMinutes ? initialData.durationMinutes.toString() : '');
        setImageUrl(initialData.imageUrl || '');
        setTags(initialData.tags ? initialData.tags.join(', ') : '');
      } else {
        setName('');
        setDescription('');
        setPrice('');
        setDuration('');
        setImageUrl('');
        setTags('');
      }
    }
  }, [visible, initialData]);

  const handleSubmit = async () => {
    setIsUploading(true);
    try {
      let finalImageUrl = imageUrl;
      if (imageUrl && imageUrl.startsWith('file://')) {
        finalImageUrl = await saveImageToLocalDirectory(imageUrl);
      }
      
      onSubmit({
        name,
        serviceName: name,
        description,
        price: price ? parseFloat(price) : undefined,
        durationMinutes: duration ? parseInt(duration) : undefined,
        imageUrl: finalImageUrl,
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
      });
      onClose();
    } catch (error) {
      console.error('Error uploading service image', error);
      alert('Lỗi tải ảnh lên, vui lòng thử lại');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{initialData ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={BrandColors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên dịch vụ *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="VD: Makeup Cô dâu"
                placeholderTextColor={BrandColors.textMuted}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
                <Text style={styles.label}>Giá (VNĐ) *</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="VD: 1500000"
                  keyboardType="numeric"
                  placeholderTextColor={BrandColors.textMuted}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Thời gian (phút) *</Text>
                <TextInput
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="VD: 120"
                  keyboardType="numeric"
                  placeholderTextColor={BrandColors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mô tả</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Mô tả chi tiết về dịch vụ..."
                multiline
                numberOfLines={3}
                placeholderTextColor={BrandColors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hình ảnh</Text>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                ) : (
                  <Text style={styles.imagePickerText}>+ Chọn ảnh từ thiết bị</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags (phân cách bằng dấu phẩy)</Text>
              <TextInput
                style={styles.input}
                value={tags}
                onChangeText={setTags}
                placeholder="VD: Cô dâu, Tiệc tối"
                placeholderTextColor={BrandColors.textMuted}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitBtn, (!name || !price || isUploading) ? styles.submitBtnDisabled : null]} 
              onPress={handleSubmit}
              disabled={(!name || !price || isUploading)}
            >
              <Text style={styles.submitBtnText}>{isUploading ? 'Đang tải lên...' : 'Lưu'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  modalTitle: {
    fontFamily: Typography.bold,
    fontSize: 18,
    color: BrandColors.textDark,
  },
  closeBtn: {
    padding: 4,
  },
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
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
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
  },
});

