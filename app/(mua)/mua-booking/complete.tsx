import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Upload, X, CheckCircle } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { BrandColors, Spacing, Typography, Radius } from '../../../constants/theme';
import { useBookingDetail } from '../../../hooks/useBooking';
import { useUpdateBookingStatus } from '../../../hooks/useMuaBookings';

export default function MuaCompleteBookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const { data: booking, isLoading } = useBookingDetail(id);
  const { mutate: updateStatus, isPending } = useUpdateBookingStatus(booking?.mua.id || 'me');

  const [images, setImages] = useState<string[]>([]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...newUris]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    if (images.length === 0) {
      Alert.alert('Bắt buộc', 'Vui lòng tải lên ít nhất 1 hình ảnh kết quả makeup để hoàn thành đơn!');
      return;
    }
    
    // For MVP: We just update the status to COMPLETED
    // In a real app, we would upload these images to S3/Cloudinary first
    updateStatus(
      { bookingId: id, status: 'WAITING_CUSTOMER' },
      {
        onSuccess: () => {
          Alert.alert('Thành công', 'Đã tải lên bằng chứng. Vui lòng chờ khách hàng xác nhận để hoàn tất đơn và nhận thanh toán!', [
            { text: 'OK', onPress: () => router.replace('/(mua)/bookings') }
          ]);
        }
      }
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={BrandColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác nhận hoàn thành</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Mã đơn: #{id.substring(0, 8)}</Text>
          <Text style={styles.infoText}>Khách hàng: {booking?.customer?.name}</Text>
          <Text style={styles.infoText}>Tổng dịch vụ: {booking?.totalAmount?.toLocaleString()}đ</Text>
          <Text style={styles.infoHighlight}>Cần thu thêm: {booking?.remainingAmount?.toLocaleString()}đ</Text>
        </View>

        <Text style={styles.sectionTitle}>Hình ảnh kết quả Makeup</Text>
        <Text style={styles.sectionDesc}>
          Vui lòng tải lên 1-5 hình ảnh cho thấy bạn đã hoàn thành dịch vụ cho khách hàng. Hình ảnh này có thể dùng làm portfolio của bạn.
        </Text>

        <View style={styles.imageGrid}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.uploadedImg} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                <X size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          ))}
          
          {images.length < 5 && (
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
              <Upload size={32} color={BrandColors.textMuted} />
              <Text style={styles.uploadText}>Tải ảnh lên</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.submitBtn, (images.length === 0 || isPending) && styles.submitBtnDisabled]}
          onPress={handleComplete}
          disabled={images.length === 0 || isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <CheckCircle size={20} color="#FFF" />
              <Text style={styles.submitText}>Hoàn tất dịch vụ</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: BrandColors.borderLight },
  headerTitle: { fontFamily: Typography.bold, fontSize: 18, color: BrandColors.textDark },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.md },
  infoCard: { backgroundColor: '#F9FAFB', padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.xl, borderWidth: 1, borderColor: BrandColors.borderLight },
  infoTitle: { fontFamily: Typography.bold, fontSize: 16, color: BrandColors.textDark, marginBottom: Spacing.xs },
  infoText: { fontFamily: Typography.medium, fontSize: 14, color: BrandColors.textDark, marginBottom: 4 },
  infoHighlight: { fontFamily: Typography.bold, fontSize: 16, color: BrandColors.accentRose, marginTop: 8 },
  sectionTitle: { fontFamily: Typography.bold, fontSize: 18, color: BrandColors.textDark, marginBottom: Spacing.xs },
  sectionDesc: { fontFamily: Typography.regular, fontSize: 14, color: BrandColors.textMuted, marginBottom: Spacing.lg, lineHeight: 20 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  imageWrapper: { width: '30%', aspectRatio: 1, borderRadius: Radius.md, overflow: 'hidden', position: 'relative' },
  uploadedImg: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 },
  uploadBtn: { width: '30%', aspectRatio: 1, borderRadius: Radius.md, borderWidth: 1, borderColor: BrandColors.borderLight, borderStyle: 'dashed', backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  uploadText: { fontFamily: Typography.medium, fontSize: 12, color: BrandColors.textMuted, marginTop: 8 },
  bottomBar: { padding: Spacing.md, borderTopWidth: 1, borderTopColor: BrandColors.borderLight, backgroundColor: '#FFF' },
  submitBtn: { flexDirection: 'row', height: 50, backgroundColor: BrandColors.accentRose, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center', gap: 8 },
  submitBtnDisabled: { backgroundColor: BrandColors.borderLight },
  submitText: { fontFamily: Typography.bold, fontSize: 16, color: '#FFF' }
});
