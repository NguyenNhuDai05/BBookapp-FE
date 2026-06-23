import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BrandColors, Radius, Spacing, Typography } from '../../../constants/theme';
import { X } from 'lucide-react-native';
import { saveImageToLocalDirectory } from '../../../utils/fileHelpers';


interface PortfolioFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function PortfolioFormModal({ visible, onClose, onSubmit, initialData }: PortfolioFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImages = result.assets.map(asset => asset.uri);
      setImageUrls(prev => [...prev, ...newImages]);
    }
  };

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setImageUrls(initialData.imageUrls || []);
        setCategory(initialData.category || '');
      } else {
        setTitle('');
        setDescription('');
        setImageUrls([]);
        setCategory('');
      }
    }
  }, [visible, initialData]);

  const handleSubmit = async () => {
    setIsUploading(true);
    try {
      const finalUrls = await Promise.all(
        imageUrls.map(async (img) => {
          if (img.startsWith('file://')) {
            return await saveImageToLocalDirectory(img);
          }
          return img;
        })
      );
      
      onSubmit({
        title,
        description,
        imageUrls: finalUrls,
        category,
        tags: category.split(',').map(t => t.trim()).filter(t => t.length > 0)
      });
      onClose();
    } catch (error) {
      console.error('Error uploading portfolio images', error);
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
            <Text style={styles.modalTitle}>{initialData ? 'Sửa Portfolio' : 'Thêm tác phẩm'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={BrandColors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hình ảnh *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {(imageUrls && imageUrls.length > 0) ? imageUrls.map((uri, idx) => (
                  <View key={idx} style={[styles.imagePickerBtn, { width: 120, height: 160, marginRight: 10 }]}>
                    <Image source={{ uri }} style={styles.previewImage} />
                  </View>
                )) : null}
                <TouchableOpacity style={[styles.imagePickerBtn, { width: 120, height: 160 }]} onPress={pickImage}>
                  <Text style={styles.imagePickerText}>+ Chọn ảnh</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên tác phẩm</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="VD: Tone cô dâu tự nhiên"
                placeholderTextColor={BrandColors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mô tả</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Cảm hứng hoặc thông tin chi tiết..."
                multiline
                numberOfLines={3}
                placeholderTextColor={BrandColors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Danh mục (Tags)</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder="VD: Cô dâu, Chụp kỷ yếu"
                placeholderTextColor={BrandColors.textMuted}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitBtn, (!imageUrls || imageUrls.length === 0 || isUploading) ? styles.submitBtnDisabled : null]} 
              onPress={handleSubmit}
              disabled={(!imageUrls || imageUrls.length === 0 || isUploading)}
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
    height: '70%',
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
