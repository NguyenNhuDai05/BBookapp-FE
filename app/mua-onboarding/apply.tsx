import * as ImagePicker from 'expo-image-picker';
import { OperatingAreaFields } from '../../components/mua/OperatingAreaFields';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Plus, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { AppBottomSheet } from '../../components/ui/AppBottomSheet';
import { AppAlert as appDialog } from '../../components/ui/dialogStore';
import { BrandColors } from '../../constants/theme';
import { useSubmitApplication } from '../../hooks/useMuaOnboarding';
import { MUA_STYLES_QUERY_KEY, useMuaStyles } from '../../hooks/useMuaStyles';
import { muaStyleService, type MuaStyle } from '../../services/muaStyleService';
import { uploadImage } from '../../services/supabase';
import { getApiError } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import type { MuaApplicationRequestDto } from '../../types/onboarding';
import { validateMuaOnboarding } from '../../utils/muaOnboarding';
import { EXPERIENCE_LEVELS, normalizeAreaName } from '../../utils/muaAreas';

export default function MuaApplyScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const submit = useSubmitApplication();
  const stylesQuery = useMuaStyles();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MuaApplicationRequestDto>({ displayName: user?.name || '', city: '', bio: '', avatarUrl: user?.avatarUrl || user?.avatar || '', styleIds: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sheet, setSheet] = useState<'styles' | null>(null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const tagLock = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const allStyles = stylesQuery.data || [];
  const selected = allStyles.filter(item => form.styleIds.includes(item.styleId));
  const setField = <K extends keyof MuaApplicationRequestDto>(key: K, value: MuaApplicationRequestDto[K]) => {
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: '', submit: '' }));
  };
  const open = (value: typeof sheet) => { setSearch(''); setSheet(value); };
  const toggleStyle = (item: MuaStyle) => {
    setErrors(current => ({ ...current, styleIds: '' }));
    setForm(current => ({ ...current, styleIds: current.styleIds.includes(item.styleId)
      ? current.styleIds.filter(id => id !== item.styleId)
      : current.styleIds.length < 5 ? [...current.styleIds, item.styleId] : current.styleIds }));
  };
  const pickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return appDialog.alert('Cần quyền truy cập ảnh', 'Hãy cho phép chọn ảnh đại diện từ thư viện.');
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: .82, allowsEditing: true, aspect: [1, 1] });
      if (!result.canceled && result.assets[0]) setField('avatarUrl', result.assets[0].uri);
    } catch (error) { appDialog.alert('Không thể chọn ảnh', getApiError(error).message); }
  };
  const createStyle = async () => {
    const name = search.trim().replace(/\s+/g, ' ');
    if (!name || name.length > 100 || tagLock.current || form.styleIds.length >= 5) return;
    tagLock.current = true; setCreating(true);
    try {
      const item = await muaStyleService.selectOrCreate(name);
      queryClient.setQueryData<MuaStyle[]>(MUA_STYLES_QUERY_KEY, current => current?.some(value => value.styleId === item.styleId) ? current : [...(current || []), item]);
      setForm(current => ({ ...current, styleIds: current.styleIds.includes(item.styleId) || current.styleIds.length >= 5 ? current.styleIds : [...current.styleIds, item.styleId] }));
      setSearch('');
    } catch (error) { appDialog.alert('Không thể thêm phong cách', getApiError(error).message); }
    finally { tagLock.current = false; setCreating(false); }
  };
  const save = async () => {
    if (saveLock.current) return;
    const next = validateMuaOnboarding(form);
    if (!form.operatingProvinceCode || !form.operatingAreaIds?.length) next.district = 'Vui lòng chọn ít nhất một khu vực nhận khách.';
    if (!user?.email) next.submit = 'Không tìm thấy email tài khoản. Vui lòng đăng nhập lại.';
    setErrors(next);
    if (Object.keys(next).length) { scroll.current?.scrollTo({ y: 0, animated: true }); return appDialog.alert('Thông tin chưa hoàn tất', Object.values(next)[0]); }
    saveLock.current = true; setSaving(true);
    try { await submit.mutateAsync({ ...form, displayName: form.displayName.trim(), bio: form.bio.trim(), avatarUrl: await uploadImage(form.avatarUrl) }); router.replace('/(mua)/dashboard'); }
    catch (error) { setErrors(current => ({ ...current, submit: getApiError(error).message })); }
    finally { saveLock.current = false; setSaving(false); }
  };
  const chips = (items: MuaStyle[], removable = false) => <View style={s.chips}>{items.map(item => {
    const active = form.styleIds.includes(item.styleId);
    return <TouchableOpacity key={item.styleId} disabled={creating || (!active && form.styleIds.length >= 5)} onPress={() => toggleStyle(item)}
      accessibilityRole="button" accessibilityLabel={removable ? `Bỏ ${item.name}` : item.name} accessibilityState={{ selected: active }}
      style={[s.chip, active && s.chipActive, !active && form.styleIds.length >= 5 && s.disabled]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{item.name}</Text>{removable && <X size={14} color="#FFF" />}
    </TouchableOpacity>;
  })}</View>;
  const fieldError = (key: string) => errors[key] ? <Text style={s.error}>{errors[key]}</Text> : null;
  const filteredStyles = allStyles.filter(item => normalizeAreaName(item.name).includes(normalizeAreaName(search)));
  const exactTag = allStyles.some(item => item.name.trim().toLocaleLowerCase() === search.trim().toLocaleLowerCase());

  return <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
    <View style={s.header}><TouchableOpacity style={s.iconButton} accessibilityLabel="Quay lại" onPress={() => router.back()}><ArrowLeft size={23} color={BrandColors.textDark} /></TouchableOpacity><Text style={s.headerTitle}>Trở thành Makeup Artist</Text><View style={s.iconButton} /></View>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        <Text style={s.intro}>Bắt đầu hồ sơ MUA của bạn ✨</Text><Text style={s.helper}>Chỉ cần một vài thông tin cơ bản.{ '\n' }Bạn có thể hoàn thiện hồ sơ sau.</Text>
        <View style={s.card}>
          <Text style={s.section}>1. Ảnh đại diện</Text>
          <TouchableOpacity style={s.avatarWrap} onPress={pickAvatar} accessibilityLabel="Thay ảnh đại diện">
            {form.avatarUrl ? <Image source={{ uri: form.avatarUrl }} style={s.avatar} /> : <View style={[s.avatar, s.emptyAvatar]}><Camera size={30} color={BrandColors.accentRose} /></View>}
            <View style={s.camera}><Camera size={16} color="#FFF" /></View>
          </TouchableOpacity><TouchableOpacity onPress={pickAvatar}><Text style={s.avatarLink}>{form.avatarUrl ? 'Thay ảnh' : 'Chọn ảnh'}</Text></TouchableOpacity>{fieldError('avatarUrl')}
          <Text style={s.section}>2. Tên hiển thị *</Text><Text style={s.label}>Tên hiển thị</Text>
          <TextInput value={form.displayName} onChangeText={value => setField('displayName', value)} maxLength={100} placeholder="Tên Customer sẽ nhìn thấy" style={s.input} />{fieldError('displayName')}
          <Text style={s.label}>Email</Text><TextInput value={user?.email || ''} editable={false} style={[s.input, s.readonly]} />
          <Text style={s.section}>3. Khu vực hoạt động *</Text>
          <OperatingAreaFields value={form} onChange={area => { setForm(current => ({ ...current, ...area,
            provinceCode: area.provinceCode, district: area.district, districtCode: area.districtCode,
            latitude: area.latitude, longitude: area.longitude, operatingLocationConfirmed: area.operatingLocationConfirmed,
            publicMeetingPoint: area.publicMeetingPoint, operatingLocationLabel: area.operatingLocationLabel })); setErrors(current => ({ ...current, city: '', district: '', workLocation: '' })); }} />{fieldError('city')}{fieldError('district')}{fieldError('workLocation')}
          <Text style={s.section}>4. Giới thiệu về bạn</Text><TextInput value={form.bio} onChangeText={value => setField('bio', value)} multiline maxLength={500} placeholder="Chia sẻ ngắn về kinh nghiệm, phong cách và thế mạnh makeup của bạn..." style={[s.input, s.textarea]} /><Text style={s.counter}>{form.bio.length}/500</Text>{fieldError('bio')}
          <Text style={s.section}>5. Kinh nghiệm</Text><Text style={s.helper}>Chọn mức phù hợp với bạn</Text>
          <View style={s.chips}>{EXPERIENCE_LEVELS.map(item => <TouchableOpacity key={item.value} onPress={() => setField('experienceLevel', item.value)} accessibilityRole="radio" accessibilityState={{ checked: form.experienceLevel === item.value }} style={[s.chip, form.experienceLevel === item.value && s.chipActive]}><Text style={[s.chipText, form.experienceLevel === item.value && s.chipTextActive]}>{item.label}</Text></TouchableOpacity>)}</View>
          <Text style={s.section}>6. Phong cách makeup *</Text><Text style={s.helper}>Chọn tối đa 5 phong cách nổi bật</Text>
          {!!selected.length && <><Text style={s.label}>Đã chọn {selected.length}/5</Text>{chips(selected, true)}</>}
          <Text style={s.label}>Gợi ý</Text>{stylesQuery.isLoading ? <ActivityIndicator color={BrandColors.accentRose} /> : chips(allStyles.filter(item => !form.styleIds.includes(item.styleId)).slice(0, 4))}
          {stylesQuery.isError && <TouchableOpacity onPress={() => stylesQuery.refetch()}><Text style={s.error}>Không tải được phong cách. Bấm để thử lại.</Text></TouchableOpacity>}
          <TouchableOpacity onPress={() => open('styles')} style={s.location}><Plus size={18} color={BrandColors.accentRose} /><Text style={s.link}>Thêm phong cách</Text></TouchableOpacity>{fieldError('styleIds')}
        </View>
        {fieldError('submit')}
        <TouchableOpacity disabled={saving || stylesQuery.isLoading} onPress={save} style={[s.primary, (saving || stylesQuery.isLoading) && s.disabled]}>{saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.primaryText}>Tạo hồ sơ MUA</Text>}</TouchableOpacity>
        <Text style={[s.helper, s.center]}>Bạn có thể tiếp tục hoàn thiện hồ sơ sau.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
    <AppBottomSheet visible={sheet !== null} title='Thêm phong cách' onClose={() => setSheet(null)} loading={creating}>
      <TextInput value={search} onChangeText={setSearch} placeholder='Tìm phong cách...' maxLength={100} style={s.input} />
      <ScrollView keyboardShouldPersistTaps="handled" style={s.sheetScroll}>
        <>
          <Text style={s.label}>Đã chọn {form.styleIds.length}/5</Text>{chips(selected, true)}<Text style={s.label}>{search.trim() ? 'Kết quả tìm kiếm' : 'Gợi ý'}</Text>{chips(filteredStyles)}
          {search.trim() && !exactTag && <><Text style={s.helper}>{filteredStyles.length ? 'Bạn có thể thêm phong cách mới.' : 'Không tìm thấy phong cách này'}</Text><TouchableOpacity disabled={creating || form.styleIds.length >= 5} style={[s.location, form.styleIds.length >= 5 && s.disabled]} onPress={createStyle}>{creating ? <ActivityIndicator color={BrandColors.accentRose} /> : <Plus size={18} color={BrandColors.accentRose} />}<Text style={s.link}>Thêm “{search.trim()}”</Text></TouchableOpacity></>}
          {form.styleIds.length >= 5 && <Text style={s.helper}>Đã chọn đủ 5 phong cách. Bỏ một phong cách để thêm mới.</Text>}
        </>
      </ScrollView>
      {sheet === 'styles' && <TouchableOpacity disabled={creating} onPress={() => setSheet(null)} style={s.primary}><Text style={s.primaryText}>Xong</Text></TouchableOpacity>}
    </AppBottomSheet>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: BrandColors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, minHeight: 64 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: BrandColors.textDark },
  content: { padding: 20, paddingBottom: 32, maxWidth: 700, width: '100%', alignSelf: 'center' }, intro: { fontSize: 23, fontWeight: '800', color: BrandColors.textDark, marginBottom: 8 },
  helper: { fontSize: 13, lineHeight: 20, color: BrandColors.textMuted }, card: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginVertical: 20 },
  section: { fontSize: 17, fontWeight: '800', color: BrandColors.textDark, marginTop: 26, marginBottom: 14 }, label: { fontSize: 14, fontWeight: '600', color: BrandColors.textDark, marginTop: 16, marginBottom: 8 },
  input: { minHeight: 50, borderWidth: 1, borderColor: BrandColors.borderLight, borderRadius: 12, paddingHorizontal: 14, color: BrandColors.textDark, fontSize: 15 }, readonly: { backgroundColor: BrandColors.bgPrimary, color: BrandColors.textMuted },
  textarea: { minHeight: 120, paddingTop: 12, textAlignVertical: 'top' }, counter: { textAlign: 'right', color: BrandColors.textMuted, fontSize: 12, marginTop: 6 },
  avatarWrap: { width: 90, height: 90, alignSelf: 'center' }, avatar: { width: 90, height: 90, borderRadius: 45 }, emptyAvatar: { backgroundColor: BrandColors.bgPinkLight, alignItems: 'center', justifyContent: 'center' }, camera: { position: 'absolute', right: 0, bottom: 0, padding: 7, borderRadius: 20, backgroundColor: BrandColors.accentRose },
  avatarLink: { color: BrandColors.accentRose, fontWeight: '700', textAlign: 'center', marginTop: 12 },
  select: { minHeight: 50, borderWidth: 1, borderColor: BrandColors.borderLight, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, selectText: { fontSize: 15, color: BrandColors.textDark, flexShrink: 1 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 }, link: { color: BrandColors.accentRose, fontWeight: '700', flexShrink: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }, chip: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 22, borderWidth: 1, borderColor: BrandColors.borderLight }, chipActive: { backgroundColor: BrandColors.accentRose, borderColor: BrandColors.accentRose }, chipText: { color: BrandColors.textBody, fontSize: 13 }, chipTextActive: { color: '#FFF' },
  primary: { minHeight: 52, borderRadius: 14, backgroundColor: BrandColors.accentRose, alignItems: 'center', justifyContent: 'center', marginVertical: 12 }, primaryText: { color: '#FFF', fontSize: 16, fontWeight: '800' }, disabled: { opacity: .5 }, error: { color: BrandColors.statusCancelled, fontSize: 13, marginTop: 8 }, center: { textAlign: 'center' },
  sheetScroll: { maxHeight: 360, marginTop: 12 }, areaRow: { minHeight: 48, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: BrandColors.borderLight },
});

