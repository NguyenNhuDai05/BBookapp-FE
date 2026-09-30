import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppOverlay } from '../../ui/OverlayProvider';
import { uploadImage } from '../../../services/supabase';
import { getApiError } from '../../../services/api';
import type { CreateServiceRequest, ServiceDto } from '../../../types/ServiceDto';

interface ServiceFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateServiceRequest) => void | Promise<void>;
  initialData?: Partial<ServiceDto> | null;
  availableTags?: string[];
}
const unique = (items: string[]) => [...new Set(items.map(item => item.trim()).filter(Boolean))];
const digits = (value: string) => value.replace(/\D/g, '');

export function ServiceFormModal(props: ServiceFormModalProps) {
  return props.visible ? <ServiceFormContent {...props} /> : null;
}
function ServiceFormContent({ onClose, onSubmit, initialData, availableTags = [] }: ServiceFormModalProps) {
  const [name, setName] = useState(initialData?.name || initialData?.serviceName || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price ? String(initialData.price) : '');
  const [duration, setDuration] = useState(initialData?.durationMinutes ? String(initialData.durationMinutes) : '');
  const [images, setImages] = useState<string[]>(initialData?.imageUrls?.length ? initialData.imageUrls : initialData?.imageUrl ? [initialData.imageUrl] : []);
  const [tags, setTags] = useState<string[]>(unique(initialData?.tags || []));
  const [tagQuery, setTagQuery] = useState('');
  const [tagsOpen, setTagsOpen] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.visibility !== false && initialData?.status !== 'INACTIVE' && initialData?.status !== 'DRAFT' && initialData?.status !== 'ARCHIVED');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [picking, setPicking] = useState(false);
  const lock = useRef(false);
  const pickLock = useRef(false);
  const suggestions = unique([...availableTags, ...tags]);
  const valid = name.trim().length > 0 && name.length <= 100 && description.trim().length > 0 && description.length <= 500 && Number(price) > 0 && Number(price) <= 100000000 && Number.isInteger(Number(duration)) && Number(duration) > 0 && Number(duration) <= 1440 && images.length > 0 && images.length <= 5;
  const clear = (key: string) => setErrors(current => ({ ...current, [key]: '', submit: '' }));
  const close = () => { if (!lock.current && !pickLock.current) onClose(); };
  const toggleTag = (tag: string) => setTags(current => current.includes(tag) ? current.filter(item => item !== tag) : current.length < 10 ? [...current, tag] : current);
  const pickImages = async () => {
    if (pickLock.current || lock.current || images.length >= 5) return;
    pickLock.current = true; setPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { setErrors(current => ({ ...current, images: 'Cho phép truy cập thư viện để chọn ảnh minh họa.' })); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 5 - images.length, quality: .82 });
      if (!result.canceled) {
        setImages(current => unique([...current, ...result.assets.map(asset => asset.uri)]).slice(0, 5));
        clear('images');
      }
    } catch { setErrors(current => ({ ...current, images: 'Không thể mở thư viện ảnh. Vui lòng thử lại.' })); }
    finally { pickLock.current = false; setPicking(false); }
  };
  const save = async () => {
    if (lock.current || pickLock.current) return;
    if (!valid) {
      setErrors({ name: !name.trim() ? 'Vui lòng nhập tên dịch vụ.' : '', description: !description.trim() ? 'Vui lòng nhập mô tả dịch vụ.' : '',
        price: Number(price) <= 0 || Number(price) > 100000000 ? 'Giá phải lớn hơn 0 và không quá 100.000.000đ.' : '',
        duration: Number(duration) <= 0 || Number(duration) > 1440 ? 'Thời gian từ 1 đến 1440 phút.' : '', images: !images.length ? 'Vui lòng thêm ít nhất một ảnh.' : '' });
      return;
    }
    lock.current = true; setSubmitting(true); clear('submit');
    try {
      const imageUrls = await Promise.all(images.map(uri => uploadImage(uri)));
      // Retain successful uploads if saving fails so retrying does not upload them again.
      setImages(imageUrls);
      await onSubmit({ serviceName: name.trim(), description: description.trim(), price: Number(price), durationMinutes: Number(duration), imageUrls, imageUrl: imageUrls[0], tags, isActive });
      onClose();
    } catch (error) { setErrors(current => ({ ...current, submit: getApiError(error).message || 'Không thể lưu dịch vụ. Vui lòng thử lại.' })); }
    finally { lock.current = false; setSubmitting(false); }
  };
  const error = (key: string) => <Text style={s.error}>{errors[key] || ' '}</Text>;
  const tagChip = (tag: string, selected: boolean) => <TouchableOpacity key={tag} disabled={submitting} onPress={() => toggleTag(tag)} accessibilityRole="button" accessibilityLabel={selected ? `Bỏ tag ${tag}` : `Chọn tag ${tag}`} style={[s.chip, selected && s.chipSelected]}><Text style={s.chipText}>{tag}{selected ? ' ×' : ''}</Text></TouchableOpacity>;
  return <AppOverlay visible animationType="slide" onRequestClose={close}>
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}><TouchableOpacity onPress={close} disabled={submitting || picking} style={s.back} accessibilityLabel="Quay lại"><Text style={s.backText}>‹</Text></TouchableOpacity><View style={s.headerCopy}><Text style={s.title}>{initialData ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</Text><Text style={s.subtitle}>Tạo dịch vụ để khách hàng có thể đặt lịch với bạn</Text></View><View style={s.back} /></View>
        <ScrollView style={s.flex} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
          <View style={s.card}><Text style={s.section}>1. Thông tin cơ bản</Text>
            <Label text="Tên dịch vụ" required /><TextInput accessibilityLabel="Tên dịch vụ" editable={!submitting} value={name} maxLength={100} onChangeText={value => { setName(value); clear('name'); }} placeholder="Nhập tên dịch vụ" style={s.input} /><Text style={s.counter}>{name.length}/100</Text>{error('name')}
            <Label text="Mô tả dịch vụ" required /><TextInput accessibilityLabel="Mô tả dịch vụ" editable={!submitting} value={description} maxLength={500} onChangeText={value => { setDescription(value); clear('description'); }} placeholder="Mô tả chi tiết dịch vụ, phù hợp trong trường hợp nào, bao gồm những gì..." multiline textAlignVertical="top" style={[s.input, s.textarea]} /><Text style={s.counter}>{description.length}/500</Text>{error('description')}
          </View>
          <View style={s.card}><Text style={s.section}>2. Giá và thời gian</Text><View style={s.columns}>
            <View style={s.column}><Label text="Giá (VND)" required /><TextInput accessibilityLabel="Giá dịch vụ" editable={!submitting} value={price ? Number(price).toLocaleString('vi-VN') : ''} maxLength={11} onChangeText={value => { setPrice(digits(value)); clear('price'); }} keyboardType="number-pad" placeholder="Nhập giá" style={s.input} />{error('price')}</View>
            <View style={s.column}><Label text="Thời gian thực hiện" required /><View style={s.duration}><TextInput accessibilityLabel="Thời gian dịch vụ" editable={!submitting} value={duration} maxLength={4} onChangeText={value => { setDuration(digits(value)); clear('duration'); }} keyboardType="number-pad" placeholder="Số phút" style={s.durationInput} /><Text style={s.unit}>phút</Text></View>{error('duration')}</View>
          </View></View>
          <View style={s.card}><View style={s.sectionRow}><Text style={s.section}>3. Ảnh minh họa</Text><Text style={s.badge}>{images.length ? `${images.length}/5 ảnh` : 'Tối thiểu 1 ảnh'}</Text></View>
            {!images.length && <TouchableOpacity style={s.upload} onPress={pickImages} disabled={picking || submitting}><Text style={s.uploadTitle}>Thêm ảnh dịch vụ</Text><Text style={s.subtitle}>Tải lên ảnh minh họa rõ nét về dịch vụ này (tối đa 5 ảnh)</Text><Text style={s.choose}>{picking ? 'Đang mở thư viện...' : 'Chọn ảnh'}</Text></TouchableOpacity>}
            <View style={s.images}>{images.map((uri, index) => <View key={`${index}-${uri}`} style={s.imageWrap}><Image source={{ uri }} style={s.image} contentFit="cover" /><TouchableOpacity accessibilityLabel={`Xóa ảnh ${index + 1}`} disabled={submitting || picking} style={s.remove} onPress={() => setImages(current => current.filter((_, position) => position !== index))}><Text style={s.removeText}>×</Text></TouchableOpacity></View>)}
              {images.length > 0 && images.length < 5 && <TouchableOpacity accessibilityLabel="Thêm ảnh minh họa" style={[s.imageWrap, s.add]} disabled={submitting || picking} onPress={pickImages}><Text style={s.addText}>{picking ? '...' : '+'}</Text></TouchableOpacity>}
            </View>{error('images')}
          </View>
          <View style={s.card}><Text style={s.section}>4. Tag / Từ khóa</Text><Text style={s.subtitle}>Chọn các tag phù hợp để khách hàng dễ tìm thấy dịch vụ</Text>
            <TouchableOpacity accessibilityLabel="Chọn tag" disabled={submitting} onPress={() => setTagsOpen(current => !current)} style={s.tagSelector}><Text style={s.subtitle}>{tags.length ? `${tags.length} tag đã chọn · Bấm để chỉnh sửa` : 'Chọn tag'}</Text></TouchableOpacity>
            <View style={s.chips}>{tags.map(tag => tagChip(tag, true))}</View>
            {tagsOpen && <View style={s.tagPanel}><TextInput accessibilityLabel="Tìm hoặc thêm tag" value={tagQuery} maxLength={50} onChangeText={setTagQuery} placeholder="Tìm hoặc thêm tag..." style={s.input} /><View style={s.chips}>{suggestions.filter(tag => !tags.includes(tag) && tag.toLowerCase().includes(tagQuery.trim().toLowerCase())).map(tag => tagChip(tag, false))}</View>
              {tagQuery.trim() && !suggestions.some(tag => tag.toLowerCase() === tagQuery.trim().toLowerCase()) && <TouchableOpacity disabled={tags.length >= 10} onPress={() => { toggleTag(tagQuery.trim()); setTagQuery(''); }}><Text style={s.choose}>Thêm “{tagQuery.trim()}”</Text></TouchableOpacity>}
              <TouchableOpacity onPress={() => setTagsOpen(false)}><Text style={s.choose}>Xong</Text></TouchableOpacity></View>}
            <Text style={s.smallLabel}>Tag thường dùng:</Text><View style={s.chips}>{suggestions.filter(tag => !tags.includes(tag)).slice(0, 5).map(tag => tagChip(tag, false))}</View>
          </View>
          <View style={s.card}><Text style={s.section}>5. Trạng thái hiển thị</Text><Text style={s.subtitle}>Bạn có thể lưu ở chế độ ẩn nếu chưa muốn hiển thị dịch vụ này</Text><View style={s.visibility}><Text style={s.visibilityLabel}>Hiển thị dịch vụ trên hồ sơ</Text><Switch accessibilityLabel="Hiển thị dịch vụ trên hồ sơ" value={isActive} disabled={submitting} onValueChange={setIsActive} trackColor={{ false: '#DED7DD', true: '#FF5C9A' }} thumbColor="#FFF" /></View></View>
          {!!errors.submit && <Text accessibilityRole="alert" style={s.submitError}>{errors.submit}</Text>}
        </ScrollView>
        <View style={s.footer}><TouchableOpacity disabled={submitting || picking} onPress={close} style={s.cancel}><Text style={s.cancelText}>Hủy</Text></TouchableOpacity><TouchableOpacity accessibilityLabel={initialData ? 'Lưu thay đổi' : 'Lưu dịch vụ'} disabled={!valid || submitting || picking} onPress={save} style={[s.save, (!valid || submitting || picking) && s.disabled]}>{submitting ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveText}>{initialData ? 'Lưu thay đổi' : 'Lưu dịch vụ'}</Text>}</TouchableOpacity></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </AppOverlay>;
}
function Label({ text, required }: { text: string; required?: boolean }) { return <Text style={s.label}>{text}{required && <Text style={s.required}> *</Text>}</Text>; }
const s = StyleSheet.create({
  flex: { flex: 1 }, screen: { flex: 1, backgroundColor: '#FFF5F8' }, header: { flexDirection: 'row', alignItems: 'center', minHeight: 84, paddingHorizontal: 8 }, back: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' }, backText: { fontSize: 36, color: '#211A29' }, headerCopy: { flex: 1, alignItems: 'center' }, title: { fontSize: 21, fontWeight: '800', color: '#211A29' }, subtitle: { fontSize: 13, color: '#837985', lineHeight: 19, marginTop: 7 },
  content: { paddingHorizontal: 14, paddingBottom: 16, gap: 14, width: '100%', maxWidth: 700, alignSelf: 'center' }, card: { backgroundColor: '#FFF', padding: 18, borderRadius: 22 }, section: { fontSize: 17, fontWeight: '700', color: '#211A29', flexShrink: 1 }, sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, label: { marginTop: 18, marginBottom: 8, fontSize: 14, color: '#211A29' }, required: { color: '#FF3D7C' }, input: { minHeight: 50, borderWidth: 1, borderColor: '#E6DCE2', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#211A29', backgroundColor: '#FFF' }, textarea: { minHeight: 120, lineHeight: 21 }, counter: { textAlign: 'right', color: '#948B98', fontSize: 12, marginTop: 5 }, error: { minHeight: 18, fontSize: 11, color: '#B64753', marginTop: 3 }, columns: { flexDirection: 'row', gap: 12 }, column: { flex: 1, minWidth: 0 }, duration: { minHeight: 50, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E6DCE2', borderRadius: 12, paddingHorizontal: 12 }, durationInput: { flex: 1, minWidth: 0, fontSize: 14, color: '#211A29', paddingVertical: 10 }, unit: { fontSize: 12, color: '#837985' }, badge: { color: '#FF3D7C', backgroundColor: '#FFF0F5', borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11 }, upload: { minHeight: 150, marginTop: 16, padding: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: '#FFBDD3', borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8FA' }, uploadTitle: { fontSize: 15, fontWeight: '700', color: '#211A29' }, choose: { color: '#FF3D7C', fontWeight: '600', paddingVertical: 12 }, images: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }, imageWrap: { width: '17.5%', aspectRatio: .72, borderRadius: 12 }, image: { width: '100%', height: '100%', borderRadius: 12 }, remove: { position: 'absolute', right: -5, top: -5, height: 28, width: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#857D87' }, removeText: { color: '#FFF', fontSize: 21 }, add: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#DCD0D9', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF9FB' }, addText: { color: '#857D87', fontSize: 28 }, tagSelector: { borderWidth: 1, borderColor: '#E6DCE2', borderRadius: 12, paddingHorizontal: 12, paddingBottom: 7, minHeight: 50, justifyContent: 'center', marginTop: 12 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }, chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#FFF2F6' }, chipSelected: { backgroundColor: '#FFE5EE' }, chipText: { color: '#E93975', fontSize: 12 }, tagPanel: { marginTop: 12 }, smallLabel: { fontSize: 12, color: '#837985', marginTop: 16 }, visibility: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, gap: 8 }, visibilityLabel: { flex: 1, color: '#211A29', fontSize: 14 }, footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: '#FFF5F8', borderTopWidth: 1, borderTopColor: '#F3E5EC' }, cancel: { flex: 1, height: 52, borderRadius: 26, borderWidth: 1, borderColor: '#E5D9E1', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }, cancelText: { color: '#211A29', fontSize: 15 }, save: { flex: 1.25, height: 52, borderRadius: 26, backgroundColor: '#FF4E91', alignItems: 'center', justifyContent: 'center' }, saveText: { color: '#FFF', fontSize: 15, fontWeight: '700' }, disabled: { opacity: .45 }, submitError: { fontSize: 13, color: '#B64753', marginVertical: 12, textAlign: 'center' },
});
