import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Camera, X } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { BrandColors, Shadows } from '../../constants/theme';
import { useSubmitReview } from '../../hooks/useBooking';

export default function ReviewScreen() {
  const router = useRouter();
  const { id: bookingId, muaName } = useLocalSearchParams<{ id: string, muaName: string }>();
  
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  const { mutate: submitReview, isPending } = useSubmitReview();

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để tải ảnh lên.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn số sao đánh giá (từ 1 đến 5).');
      return;
    }

    submitReview(
      {
        bookingId: bookingId!,
        rating,
        comment: comment.trim(),
        imageUrl: imageUri || undefined, 
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Thành công', 
            'Cảm ơn bạn đã gửi đánh giá! Phản hồi của bạn sẽ giúp cộng đồng BBeauty tốt hơn.',
            [{ text: 'Đóng', onPress: () => router.back() }]
          );
        },
        onError: (error: any) => {
          Alert.alert('Lỗi', error?.message || 'Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.');
        }
      }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá dịch vụ</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* SUMMARY CARD */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Đánh giá chuyên viên:</Text>
            <Text style={styles.summaryName}>{muaName || 'Chuyên viên Makeup'}</Text>
            <Text style={styles.summaryDesc}>Hãy chia sẻ cảm nhận thực tế của bạn về chất lượng dịch vụ nhé!</Text>
          </View>

          {/* RATING STARS */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingTitle}>Bạn cảm thấy thế nào?</Text>
            <View style={styles.starsWrapper}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => setRating(star)}
                  style={styles.starBtn}
                >
                  <Star 
                    size={48} 
                    color={star <= rating ? '#FFD700' : '#E0E0E0'} 
                    fill={star <= rating ? '#FFD700' : 'transparent'} 
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingHint}>
              {rating === 1 && 'Rất tệ'}
              {rating === 2 && 'Tệ'}
              {rating === 3 && 'Bình thường'}
              {rating === 4 && 'Tốt'}
              {rating === 5 && 'Tuyệt vời!'}
              {rating === 0 && 'Chưa chọn'}
            </Text>
          </View>

          {/* TEXT AREA */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Chia sẻ trải nghiệm (Tùy chọn)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Bạn có hài lòng với lớp makeup không? Thái độ phục vụ của chuyên viên như thế nào?"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />
          </View>

          {/* PHOTO UPLOAD */}
          <View style={styles.photoContainer}>
            <Text style={styles.inputLabel}>Đính kèm hình ảnh thực tế (Tùy chọn)</Text>
            
            {imageUri ? (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                  <X size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage}>
                <Camera size={24} color="#F5446A" />
                <Text style={styles.uploadText}>Thêm hình ảnh</Text>
              </TouchableOpacity>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* STICKY BOTTOM BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]} 
          disabled={rating === 0 || isPending}
          onPress={handleSubmit}
        >
          {isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Gửi đánh giá</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    ...Shadows.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#22152B',
    marginBottom: 8,
  },
  summaryDesc: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  starsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starBtn: {
    padding: 4,
  },
  ratingHint: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5446A',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
    fontSize: 15,
    minHeight: 120,
    color: '#333',
  },
  photoContainer: {
    marginBottom: 20,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F3',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#F5446A',
    borderRadius: 12,
    padding: 20,
    gap: 8,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F5446A',
  },
  imageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    ...Shadows.md,
  },
  submitBtn: {
    backgroundColor: '#F5446A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#FFB3C1',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
