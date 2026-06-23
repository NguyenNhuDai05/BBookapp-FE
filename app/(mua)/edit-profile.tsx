import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Camera, User, FileText, BadgeCheck } from 'lucide-react-native';
import { Image } from 'expo-image';
import { BrandColors, Radius, Spacing, Typography, Shadows } from '../../constants/theme';
import { saveImageToLocalDirectory } from '../../utils/fileHelpers';
import { useAuthStore } from '../../store/useAuthStore';
import { useMuaProfile, useUpdateMuaProfile } from '../../hooks/useMuaProfile';


const MOCK_AVATAR = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const muaId = 'me';
  
  const { data: profile, isLoading } = useMuaProfile(muaId);

  const [avatar, setAvatar] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setAvatar(profile.avatarUrl || '');
      setName(profile.name || profile.brandName || user?.name || '');
      setBio(profile.bio || '');
    } else if (user) {
      setAvatar('');
      setName(user.name || '');
    }
  }, [profile, user]);

  const { mutate: updateProfile, isPending } = useUpdateMuaProfile();
  const isSaving = isPending || isUploading;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên hiển thị');
      return;
    }
    
    let finalAvatarUrl = avatar;
    if (avatar && avatar.startsWith('file://')) {
      finalAvatarUrl = await saveImageToLocalDirectory(avatar);
    }

    
    updateProfile(
      { displayName: name, bio, avatarUrl: finalAvatarUrl },
      {
        onSuccess: () => {
          updateUser({ name, avatarUrl: finalAvatarUrl });
          Alert.alert('Thành công', 'Đã lưu thông tin hồ sơ', [
            { text: 'OK', onPress: () => router.push({ pathname: '/(mua)/profile', params: { tab: 'Portfolio' } } as any) }
          ]);
        },
        onError: () => {
          Alert.alert('Lỗi', 'Không thể lưu hồ sơ, vui lòng thử lại.');
        }
      }
    );
  };

  const handleChangeAvatar = async () => {
    // Request permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Cấp quyền', 'Bạn cần cấp quyền truy cập thư viện ảnh để thay đổi ảnh đại diện.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={BrandColors.accentPink} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push({ pathname: '/(mua)/profile', params: { tab: 'Portfolio' } } as any)}>
          <ArrowLeft size={24} color={BrandColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa trang</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={BrandColors.accentPink} />
          ) : (
            <Check size={24} color={BrandColors.accentPink} />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' }]}>
                  <User size={60} color="#A855F7" />
                </View>
              )}
              <TouchableOpacity style={styles.cameraBtn} onPress={handleChangeAvatar}>
                <Camera size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarHelperText}>Chạm để thay đổi ảnh đại diện</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <User size={16} color={BrandColors.textMuted} />
                <Text style={styles.label}>Tên hiển thị (Thương hiệu)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nhập tên thương hiệu của bạn"
                placeholderTextColor={BrandColors.textMuted}
              />
              <Text style={styles.helpText}>Tên này sẽ hiển thị với khách hàng khi họ tìm kiếm và xem hồ sơ của bạn.</Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <FileText size={16} color={BrandColors.textMuted} />
                <Text style={styles.label}>Tiểu sử (Bio)</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Giới thiệu ngắn về phong cách, kinh nghiệm của bạn..."
                placeholderTextColor={BrandColors.textMuted}
                multiline
                textAlignVertical="top"
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.verificationBox}>
              <BadgeCheck size={24} color="#1DA1F2" />
              <View style={styles.verificationTexts}>
                <Text style={styles.verificationTitle}>Xác minh tài khoản</Text>
                <Text style={styles.verificationDesc}>Tài khoản của bạn đã được xác minh. Khách hàng có thể tin tưởng vào dịch vụ của bạn.</Text>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
    backgroundColor: '#FFF',
    zIndex: 10,
    ...Shadows.sm,
  },
  headerBtn: {
    padding: Spacing.xs,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.semiBold,
    fontSize: 18,
    color: BrandColors.textDark,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: '#FFF9FA',
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFF',
    ...Shadows.md,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: BrandColors.accentPink,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  avatarHelperText: {
    fontFamily: Typography.regular,
    fontSize: 13,
    color: BrandColors.textMuted,
  },
  formSection: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontFamily: Typography.medium,
    fontSize: 15,
    color: BrandColors.textDark,
    marginLeft: Spacing.xs,
  },
  input: {
    backgroundColor: BrandColors.background,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: Typography.regular,
    fontSize: 15,
    color: BrandColors.textDark,
  },
  textArea: {
    height: 120,
  },
  helpText: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: BrandColors.textMuted,
    marginTop: Spacing.xs,
  },
  verificationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: Spacing.md,
  },
  verificationTexts: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  verificationTitle: {
    fontFamily: Typography.medium,
    fontSize: 15,
    color: '#0369A1',
    marginBottom: 2,
  },
  verificationDesc: {
    fontFamily: Typography.regular,
    fontSize: 13,
    color: '#0284C7',
    lineHeight: 18,
  },
});
