import { ArrowLeft, Camera, Plus, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppBottomSheet } from '../../ui/AppBottomSheet';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, useWindowDimensions } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { AppAlert as appDialog } from '../../ui/dialogStore';
import * as ImagePicker from 'expo-image-picker';
import { BrandColors, Radius, Spacing, Typography } from '../../../constants/theme';
import { uploadImage } from '../../../services/supabase';
import { useMuaServices } from '../../../hooks/useMuaServices';
import { useMuaStyles } from '../../../hooks/useMuaStyles';
import { reloadOwnerPortfolio } from '../../../hooks/useMuaPortfolio';
import { getApiError } from '../../../services/api';
import type { PortfolioItemDto, PortfolioWriteRequest } from '../../../types/portfolio';
import { normalizePortfolio } from '../../../utils/portfolio';
import { portfolioTagDraft, portfolioTagPatch, supportsPortfolioTagging, validatePortfolioTags } from '../../../utils/portfolioTagging';
import { PortfolioSavedRefreshError, portfolioErrorMessage, uncertainPortfolioWrite, uploadPortfolioAlbum } from '../../../utils/portfolioWrite';
import { PortfolioTaggingFields } from './PortfolioTaggingFields';

const MAX_DESCRIPTION_LENGTH = 2000;
interface PortfolioFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: PortfolioWriteRequest) => void | Promise<unknown>;
  initialData?: Partial<PortfolioItemDto> | null;
}
export function PortfolioFormModal(props: PortfolioFormModalProps) {
  return props.visible ? <PortfolioFormContent key={props.initialData?.id || props.initialData?.portfolioId || 'create'} {...props} /> : null;
}
function PortfolioFormContent({ visible, onClose, onSubmit, initialData }: PortfolioFormModalProps) {
  const client = useQueryClient();
  const { width } = useWindowDimensions();
  const photoUnit = (Math.min(width, 640) - 60) / 4;
  const editId = initialData?.id || initialData?.portfolioId;
  const [base, setBase] = useState(() => normalizePortfolio(initialData));
  const [description, setDescription] = useState(base.description || '');
  const [imageUrls, setImageUrls] = useState(base.imageUrls || []);
  const [serviceId, setServiceId] = useState<string | null>(base.serviceId || null);
  const [tagDraft, setTagDraft] = useState(() => portfolioTagDraft(base.tagging));
  const [ready, setReady] = useState(!editId);
  const [ownerError, setOwnerError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [inputEpoch, setInputEpoch] = useState(0);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [message, setMessage] = useState('');
  const [conflict, setConflict] = useState(false);
  const [preview, setPreview] = useState<PortfolioItemDto>();
  const [completed, setCompleted] = useState<PortfolioSavedRefreshError>();
  const [uncertain, setUncertain] = useState(false);
  const [reviewed, setReviewed] = useState<PortfolioItemDto[] | null>(null);
  const picking = useRef(false);
  const saving = useRef(false);
  const uploads = useRef(new Map<string, string>());
  const { data: services = [] } = useMuaServices('me');
  const catalog = useMuaStyles();
  const busy = isUploading || isPicking;
  const frozen = busy || Boolean(completed) || uncertain;
  const canTag = supportsPortfolioTagging(catalog.catalog) && !catalog.isError && (!editId || (base.version !== undefined && base.tagging !== undefined));
  const initialize = useCallback((item: PortfolioItemDto) => {
    setBase(item); setDescription(item.description || ''); setImageUrls(item.imageUrls || []); setServiceId(item.serviceId || null);
    setTagDraft(portfolioTagDraft(item.tagging)); setInputEpoch(e => e + 1); setReady(true); setOwnerError('');
    setConflict(false); setPreview(undefined); setUncertain(false); setReviewed(null); setMessage('');
  }, []);
  useEffect(() => {
    if (!editId) return;
    let active = true;
    void reloadOwnerPortfolio(client).then(items => {
      if (!active) return;
      const item = items.find(p => p.id === editId || p.portfolioId === editId);
      if (!item) throw new Error('Không tìm thấy tác phẩm trong danh sách của bạn.');
      initialize(item);
    }).catch(error => { if (active) setOwnerError(portfolioErrorMessage(error)); });
    return () => { active = false; };
  }, [client, editId, initialize, loadAttempt]);

  const pickImage = async () => {
    if (picking.current || saving.current || frozen || !ready || imageUrls.length >= 5) return;
    picking.current = true; setIsPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { appDialog.alert('Cấp quyền', 'Cho phép truy cập thư viện để chọn ảnh tác phẩm.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 5 - imageUrls.length, quality: 0.8 });
      if (!result.canceled && result.assets?.length) setImageUrls(prev => [...new Set([...prev, ...result.assets.map(a => a.uri)])].slice(0, 5));
    } catch { appDialog.alert('Không thể chọn ảnh', 'Vui lòng thử mở thư viện ảnh lại.'); }
    finally { picking.current = false; setIsPicking(false); }
  };
  const handleSubmit = async () => {
    if (saving.current || picking.current || frozen || !ready || !imageUrls.length) return;
    const snapshot = { description, imageUrls: [...imageUrls], serviceId, tags: JSON.parse(JSON.stringify(tagDraft)) as typeof tagDraft };
    const patch = portfolioTagPatch(snapshot.tags, portfolioTagDraft(base.tagging));
    if (patch && !canTag) { setMessage('Chưa thể xác minh danh mục hoặc phiên bản tác phẩm. Hãy tải lại hoặc bỏ thay đổi tag.'); return; }
    if (patch) {
      const invalid = validatePortfolioTags(snapshot.tags, portfolioTagDraft(base.tagging), catalog.catalog);
      if (invalid) { setMessage(invalid); return; }
    }
    saving.current = true; setIsUploading(true); setMessage('');
    let writeStarted = false;
    try {
      const finalUrls = await uploadPortfolioAlbum(snapshot.imageUrls, uploads.current, uploadImage);
      const payload: PortfolioWriteRequest = {};
      if (!editId || snapshot.description !== (base.description || '')) payload.description = snapshot.description;
      if (!editId || JSON.stringify(finalUrls) !== JSON.stringify(base.imageUrls || [])) payload.imageUrls = finalUrls;
      if (!editId || snapshot.serviceId !== (base.serviceId || null)) payload.serviceId = snapshot.serviceId;
      if (editId && base.version != null) payload.expectedVersion = base.version;
      if (patch) payload.tagging = patch;
      writeStarted = true;
      await onSubmit(payload);
      onClose();
    } catch (error) {
      if (error instanceof PortfolioSavedRefreshError) { setCompleted(error); setMessage(error.message); }
      else if (writeStarted && uncertainPortfolioWrite(error)) {
        setUncertain(true); setReviewed(null); setMessage('Chưa xác định được máy chủ đã lưu hay chưa. Hãy kiểm tra danh sách trước khi gửi lại.');
      } else { setConflict(['PORTFOLIO_VERSION_CONFLICT', 'PORTFOLIO_VERSION_REQUIRED'].includes(getApiError(error).code || '')); setMessage(portfolioErrorMessage(error)); }
    } finally { saving.current = false; setIsUploading(false); }
  };
  const reviewLatest = async () => {
    if (saving.current) return;
    saving.current = true; setIsUploading(true);
    try {
      const items = await reloadOwnerPortfolio(client);
      setReviewed(items);
      if (editId) {
        const latest = items.find(p => p.id === editId || p.portfolioId === editId);
        if (!latest) throw new Error('Tác phẩm không còn trong danh sách của bạn.');
        setPreview(latest);
      }
    } catch (error) { setMessage(portfolioErrorMessage(error)); }
    finally { saving.current = false; setIsUploading(false); }
  };
  const retryRead = async () => {
    if (!completed || saving.current) return;
    saving.current = true; setIsUploading(true);
    try { await completed.retryRefresh(); onClose(); }
    catch { setMessage('Đã lưu portfolio, nhưng chưa tải lại được dữ liệu mới. Vui lòng thử tải lại.'); }
    finally { saving.current = false; setIsUploading(false); }
  };
  return <AppBottomSheet visible={visible} onClose={onClose} loading={busy} contentStyle={styles.composer}>
    <View style={styles.composerHeader}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Quay lại" onPress={onClose} disabled={busy} style={styles.backButton}><ArrowLeft size={24} color="#191528" /></TouchableOpacity><Text accessibilityRole="header" style={styles.composerTitle}>{editId ? 'Chỉnh sửa bài viết' : 'Đăng bài'}</Text><Text style={styles.composerSubtitle}>Chia sẻ tác phẩm của bạn</Text></View>
    <ScrollView style={styles.formContent} contentContainerStyle={{ paddingBottom: Spacing.lg }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {!ready ? <View><ActivityIndicator color={BrandColors.accentRose} /><Text style={styles.label}>{ownerError || 'Đang tải tác phẩm mới nhất…'}</Text>{ownerError ? <TouchableOpacity accessibilityRole="button" onPress={() => setLoadAttempt(a => a + 1)} style={styles.cancelBtn}><Text>Tải lại tác phẩm</Text></TouchableOpacity> : null}</View> : <>
        <View style={styles.inputGroup}>
          <View style={styles.imageHeader}><Text style={styles.label}>Chọn ảnh</Text><Text style={styles.imageCount}>{imageUrls.length}/5</Text>{imageUrls.length > 0 && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Xóa tất cả ảnh" disabled={frozen} onPress={() => setImageUrls([])} style={styles.clearImages}><Text style={styles.clearImagesText}>Xóa tất cả</Text></TouchableOpacity>}</View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            {imageUrls.map((uri, idx) => <View key={uri} style={[styles.imagePickerBtn, idx === 0 ? [styles.heroPhoto, { width: photoUnit * 2 }] : [styles.smallPhoto, { width: photoUnit }]]}><Image source={{ uri }} style={styles.previewImage} /><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Xóa ảnh ${idx + 1}`} disabled={frozen} style={styles.removeImage} onPress={() => setImageUrls(current => current.filter((_, i) => i !== idx))}><Text style={styles.removeImageText}>×</Text></TouchableOpacity></View>)}
            {Array.from({ length: Math.max(0, 3 - imageUrls.length) || (imageUrls.length < 5 ? 1 : 0) }, (_, index) => <TouchableOpacity key={index} accessibilityRole="button" accessibilityLabel={index === 0 ? 'Thêm ảnh tác phẩm' : 'Thêm ảnh vào album'} disabled={frozen} style={[styles.imagePickerBtn, !imageUrls.length && index === 0 ? [styles.heroPhoto, { width: photoUnit * 2 }] : [styles.smallPhoto, { width: photoUnit }]]} onPress={pickImage}><LinearGradient colors={['#FFF9FB', '#FFF0F5']} style={StyleSheet.absoluteFill} /><View style={styles.photoIcon}>{!imageUrls.length && index === 0 ? <Camera size={28} color="#F23879" /> : <Plus size={28} color="#F23879" />}</View>{!imageUrls.length && index === 0 && <Text style={styles.imagePickerText}>Thêm ảnh</Text>}</TouchableOpacity>)}
          </ScrollView>
        </View>
        <View style={styles.inputGroup}><Text style={styles.label}>Nội dung bài viết</Text><View style={styles.descriptionBox}><TextInput key={inputEpoch} style={[styles.input, styles.textArea]} accessibilityLabel="Mô tả tác phẩm" editable={!frozen} defaultValue={base.description || ''} onChangeText={setDescription} placeholder="Mô tả layout makeup, phong cách, điểm nổi bật..." multiline numberOfLines={4} maxLength={MAX_DESCRIPTION_LENGTH} placeholderTextColor={BrandColors.textMuted} /><Text style={styles.characterCount}>{description.length}/{MAX_DESCRIPTION_LENGTH}</Text></View></View>
        <View style={styles.inputGroup}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Gắn dịch vụ vào bài viết" accessibilityState={{ expanded: servicesOpen }} disabled={frozen} onPress={() => setServicesOpen(!servicesOpen)} style={styles.serviceSelector}><View style={styles.serviceIcon}><ShoppingBag size={24} color="#F23879" /></View><View style={{ flex: 1 }}><Text style={styles.serviceTitle}>Gắn dịch vụ</Text><Text style={styles.serviceHint} numberOfLines={1}>{services.find(s => s.id === serviceId)?.name || services.find(s => s.id === serviceId)?.serviceName || 'Chọn dịch vụ'}</Text></View>{servicesOpen ? <ChevronUp size={21} color="#9891A4" /> : <ChevronDown size={21} color="#9891A4" />}</TouchableOpacity>
          {servicesOpen && <View style={styles.serviceOptions}><TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: !serviceId }} disabled={frozen} style={[styles.serviceChip, !serviceId && styles.serviceChipActive]} onPress={() => { setServiceId(null); setServicesOpen(false); }}><Text>Không gắn</Text></TouchableOpacity>{services.map(s => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: serviceId === s.id }} disabled={frozen} key={s.id} style={[styles.serviceChip, serviceId === s.id && styles.serviceChipActive]} onPress={() => { setServiceId(s.id); setServicesOpen(false); }}><Text>{s.name || s.serviceName}</Text></TouchableOpacity>)}{!services.length && <Text style={styles.serviceHint}>Bạn chưa có dịch vụ để gắn.</Text>}</View>}
        </View>
        <PortfolioTaggingFields value={tagDraft} onChange={v => { setTagDraft(v); setMessage(''); }} history={base.tagging} catalog={catalog.catalog} supported={canTag} disabled={frozen} loading={catalog.isLoading} error={catalog.isError} onReload={() => { void catalog.refetch(); }} onDiscardChanges={portfolioTagPatch(tagDraft, portfolioTagDraft(base.tagging)) && !canTag ? () => { setTagDraft(portfolioTagDraft(base.tagging)); setMessage(''); } : undefined} />
      </>}
      {message ? <Text accessibilityRole="alert" style={[styles.label, { marginVertical: 12 }]}>{message}</Text> : null}
      {(conflict || uncertain) && !completed && <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={reviewLatest} style={styles.cancelBtn}><Text>{uncertain ? 'Kiểm tra danh sách đã lưu' : 'Tải bản mới để đối chiếu'}</Text></TouchableOpacity>}
      {uncertain && reviewed && !editId && <View><Text style={styles.label}>Danh sách mới nhất · {reviewed.length} tác phẩm</Text>{reviewed.slice(0, 5).map(p => <Text key={p.id} style={styles.label}>{p.description || 'Tác phẩm không có mô tả'} · {p.imageUrls?.length || 0} ảnh</Text>)}<TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.cancelBtn} onPress={() => appDialog.alert('Đã kiểm tra danh sách?', 'Chỉ tiếp tục nếu lần tạo trước chưa xuất hiện trong danh sách. Thao tác tiếp theo có thể tạo bài trùng nếu máy chủ đã lưu.', [{ text: 'Hủy', style: 'cancel' }, { text: 'Tiếp tục', onPress: () => { setUncertain(false); setReviewed(null); setMessage(''); } }])}><Text>Đã kiểm tra, cho phép tạo lại</Text></TouchableOpacity></View>}
      {preview && <View><Text style={styles.label}>Bản mới · phiên bản {preview.version ?? 'chưa hỗ trợ'} · {preview.imageUrls?.length || 0} ảnh</Text><Text style={styles.label}>{preview.description || 'Không có mô tả'}</Text><TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => initialize(preview)} style={styles.cancelBtn}><Text>Dùng bản mới (bỏ bản nháp)</Text></TouchableOpacity></View>}
    </ScrollView>
    <View style={styles.modalFooter}>
      <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={busy}><Text style={styles.cancelBtnText}>{completed ? 'Đóng' : 'Hủy'}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={[styles.submitBtn, (!ready || !imageUrls.length || busy || uncertain) && styles.submitBtnDisabled]} onPress={completed ? retryRead : handleSubmit} disabled={!ready || busy || (!completed && (!imageUrls.length || uncertain))}><Text style={styles.submitBtnText}>{busy ? 'Đang xử lý…' : completed ? 'Tải lại dữ liệu' : editId ? 'Lưu thay đổi' : 'Đăng bài'}</Text></TouchableOpacity>
    </View>
  </AppBottomSheet>;
}
const styles = StyleSheet.create({
composer: { height: '100%', maxHeight: '100%', paddingHorizontal: 0, paddingTop: 0, backgroundColor: '#FFF6F9', borderTopLeftRadius: 0, borderTopRightRadius: 0 },
composerHeader: { paddingBottom: 20, paddingHorizontal: 48, alignItems: 'center' },
backButton: { position: 'absolute', left: 14, top: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
composerTitle: { fontFamily: Typography.semiBold, fontSize: 23, color: '#191528' },
composerSubtitle: { fontSize: 14, color: '#9891A4', marginTop: 5 },
imageCount: { marginLeft: 'auto', color: '#9891A4', fontSize: 14 },
photoRow: { gap: 10 }, heroPhoto: { width: 180, height: 140 }, smallPhoto: { width: 90, height: 140 },
photoIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFE2EC', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
descriptionBox: { borderWidth: 1, borderColor: '#FFD0E0', borderRadius: 14, backgroundColor: '#FFF', overflow: 'hidden' },
serviceSelector: { borderWidth: 1, borderColor: '#FFD0E0', borderRadius: 16, padding: 12, flexDirection: 'row', gap: 14, alignItems: 'center', minHeight: 76 },
serviceIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFF0F5', alignItems: 'center', justifyContent: 'center' },
serviceTitle: { fontFamily: Typography.medium, fontSize: 16, color: '#191528' }, serviceHint: { fontSize: 14, color: '#9891A4', marginTop: 4 },
serviceOptions: { gap: 8, paddingTop: 10, flexDirection: 'row', flexWrap: 'wrap' },
imageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
clearImages: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' },
clearImagesText: { color: BrandColors.accentRose, fontSize: 13, fontFamily: Typography.semiBold },
removeImage: { position: 'absolute', top: 4, right: 4, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(33,26,41,0.75)' },
removeImageText: { color: '#FFF', fontSize: 28 },
formContent: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
imagePickerBtn: {
    borderWidth: 1,
    borderColor: '#FFBED4',
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
    color: '#8A1846',
    fontFamily: Typography.medium,
    fontSize: 14,
  },
inputGroup: {
    marginBottom: Spacing.lg,
  },
label: {
    fontFamily: Typography.medium,
    fontSize: 18,
    color: BrandColors.textDark,
    marginBottom: Spacing.xs,
  },
input: {
    borderWidth: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Typography.regular,
    color: BrandColors.textDark,
    backgroundColor: BrandColors.bgPrimary,
  },
textArea: {
    height: 112,
    textAlignVertical: 'top',
  },
characterCount: {
    paddingRight: 12,
    paddingBottom: 10,
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
    borderTopColor: '#FFF0F5', backgroundColor: '#FFF',
    gap: Spacing.md,
  },
cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F23879',
    alignItems: 'center',
  },
cancelBtnText: {
    fontFamily: Typography.semiBold,
    fontSize: 15,
    color: '#F23879',
  },
submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: '#F23879',
    alignItems: 'center',
  },
submitBtnDisabled: {
    opacity: 0.45,
  },
submitBtnText: {
    fontFamily: Typography.semiBold,
    fontSize: 15,
    color: '#FFF',
  }
});
