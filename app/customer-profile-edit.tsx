import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Save } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors, Radius, Spacing } from '../constants/theme';
import { getApiError } from '../services/api';
import { uploadImage } from '../services/supabase';
import { userService, type UserProfile } from '../services/userService';
import { useAuthStore } from '../store/useAuthStore';

export default function CustomerProfileEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const updateUser = useAuthStore(state => state.updateUser);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    userService.getUserProfile()
      .then(data => {
        if (!active) return;
        setProfile(data);
        setName(data.name);
        setPhoneNumber(data.phoneNumber);
        setAvatar(data.avatar);
      })
      .catch(error => Alert.alert('Không thể tải hồ sơ', getApiError(error).message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền truy cập ảnh', 'Hãy cho phép BeautyBook truy cập thư viện ảnh để đổi ảnh đại diện.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatar(result.assets[0].uri);
  };

  const save = async () => {
    if (!profile || saving) return;
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ và tên.');
      return;
    }
    try {
      setSaving(true);
      const uploadedAvatar = avatar ? await uploadImage(avatar) : '';
      const updated = await userService.updateUserProfile({
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        avatar: uploadedAvatar,
      });
      updateUser({ name: updated.name, avatar: updated.avatar, avatarUrl: updated.avatar });
      if (Platform.OS === 'web') window.alert('Đã cập nhật thông tin.');
      else Alert.alert('Thành công', 'Thông tin tài khoản đã được cập nhật.');
      router.back();
    } catch (error) {
      const message = getApiError(error).message;
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('Không thể cập nhật', message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={BrandColors.accentPink} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()} accessibilityLabel="Quay lại">
          <ArrowLeft size={23} color={BrandColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa thông tin</Text>
        <View style={styles.headerButton} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.xl }]}
        >
          <TouchableOpacity style={styles.avatarButton} onPress={pickAvatar} accessibilityLabel="Đổi ảnh đại diện">
            {avatar && (avatar.startsWith('http') || avatar.startsWith('file') || avatar.startsWith('content') || avatar.startsWith('blob'))
              ? <Image source={{ uri: avatar }} style={styles.avatar} />
              : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarText}>{name.trim().charAt(0).toUpperCase() || 'B'}</Text></View>}
            <View style={styles.cameraBadge}><Camera size={17} color="#FFF" /></View>
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nhập họ và tên" autoCapitalize="words" />
            <Text style={styles.label}>Email</Text>
            <TextInput style={[styles.input, styles.readonly]} value={profile?.email || ''} editable={false} />
            <Text style={styles.helper}>Email đăng nhập không thể thay đổi tại đây.</Text>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>

          <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Save size={19} color="#FFF" />}
            <Text style={styles.saveText}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#F9F6F8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9F6F8' },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1E9ED' },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: BrandColors.textDark, fontSize: 18, fontWeight: '800' },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.lg },
  avatarButton: { width: 108, height: 108, alignSelf: 'center', marginVertical: Spacing.lg },
  avatar: { width: 108, height: 108, borderRadius: 54 },
  avatarFallback: { backgroundColor: '#FFE6ED', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BrandColors.accentPink, fontSize: 38, fontWeight: '800' },
  cameraBadge: { position: 'absolute', right: 1, bottom: 4, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.accentPink, borderWidth: 3, borderColor: '#F9F6F8' },
  card: { backgroundColor: '#FFF', borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: '#F3EAEF' },
  label: { marginTop: Spacing.md, marginBottom: 7, color: BrandColors.textDark, fontSize: 14, fontWeight: '700' },
  input: { minHeight: 50, borderWidth: 1, borderColor: '#E9DFE5', borderRadius: Radius.md, paddingHorizontal: Spacing.md, backgroundColor: '#FFF', color: BrandColors.textDark, fontSize: 15 },
  readonly: { backgroundColor: '#F5F2F4', color: BrandColors.textMuted },
  helper: { color: BrandColors.textMuted, fontSize: 12, marginTop: 6 },
  saveButton: { minHeight: 52, marginTop: Spacing.lg, borderRadius: Radius.full, backgroundColor: BrandColors.accentPink, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.6 },
  saveText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
