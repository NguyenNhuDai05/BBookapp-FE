import { AppBottomSheet } from '../../ui/AppBottomSheet';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
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
  return <AppBottomSheet visible={visible} title={editId ? 'Sửa Portfolio' : 'Thêm tác phẩm'} onClose={onClose} loading={busy} contentStyle={{ height: '85%' }}>
    <ScrollView style={styles.formContent} contentContainerStyle={{ paddingBottom: Spacing.lg }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {!ready ? <View><ActivityIndicator color={BrandColors.accentRose} /><Text style={styles.label}>{ownerError || 'Đang tải tác phẩm mới nhất…'}</Text>{ownerError ? <TouchableOpacity accessibilityRole="button" onPress={() => setLoadAttempt(a => a + 1)} style={styles.cancelBtn}><Text>Tải lại tác phẩm</Text></TouchableOpacity> : null}</View> : <>
        <View style={styles.inputGroup}>
          <View style={styles.imageHeader}><Text style={styles.label}>Hình ảnh * · {imageUrls.length}/5</Text>{imageUrls.length > 0 && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Xóa tất cả ảnh" disabled={frozen} onPress={() => setImageUrls([])} style={styles.clearImages}><Text style={styles.clearImagesText}>Xóa tất cả</Text></TouchableOpacity>}</View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {imageUrls.map((uri, idx) => <View key={`${uri}-${idx}`} style={[styles.imagePickerBtn, { width: 120, height: 160, marginRight: 10 }]}><Image source={{ uri }} style={styles.previewImage} /><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Xóa ảnh ${idx + 1}`} disabled={frozen} style={styles.removeImage} onPress={() => setImageUrls(current => current.filter((_, i) => i !== idx))}><Text style={styles.removeImageText}>×</Text></TouchableOpacity></View>)}
            {imageUrls.length < 5 && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Thêm ảnh tác phẩm" disabled={frozen} style={[styles.imagePickerBtn, { width: 120, height: 160 }]} onPress={pickImage}><Text style={styles.imagePickerText}>+ Chọn ảnh</Text></TouchableOpacity>}
          </ScrollView>
        </View>
        <View style={styles.inputGroup}><Text style={styles.label}>Gắn dịch vụ vào bài viết</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity disabled={frozen} style={[styles.serviceChip, !serviceId && styles.serviceChipActive]} onPress={() => setServiceId(null)}><Text>Không gắn</Text></TouchableOpacity>
          {services.map(s => <TouchableOpacity disabled={frozen} key={s.id} style={[styles.serviceChip, serviceId === s.id && styles.serviceChipActive]} onPress={() => setServiceId(s.id)}><Text numberOfLines={1}>{s.name || s.serviceName}</Text></TouchableOpacity>)}
        </ScrollView></View>
        <View style={styles.inputGroup}><Text style={styles.label}>Mô tả</Text><TextInput key={inputEpoch} style={[styles.input, styles.textArea]} accessibilityLabel="Mô tả tác phẩm" editable={!frozen} defaultValue={base.description || ''} onChangeText={setDescription} placeholder="Cảm hứng hoặc thông tin chi tiết..." multiline numberOfLines={3} maxLength={MAX_DESCRIPTION_LENGTH} placeholderTextColor={BrandColors.textMuted} /><Text style={styles.characterCount}>{description.length}/{MAX_DESCRIPTION_LENGTH}</Text></View>
        <PortfolioTaggingFields value={tagDraft} onChange={v => { setTagDraft(v); setMessage(''); }} history={base.tagging} catalog={catalog.catalog} supported={canTag} disabled={frozen} loading={catalog.isLoading} error={catalog.isError} onReload={() => { void catalog.refetch(); }} onDiscardChanges={portfolioTagPatch(tagDraft, portfolioTagDraft(base.tagging)) && !canTag ? () => { setTagDraft(portfolioTagDraft(base.tagging)); setMessage(''); } : undefined} />
      </>}
      {message ? <Text accessibilityRole="alert" style={[styles.label, { marginVertical: 12 }]}>{message}</Text> : null}
      {(conflict || uncertain) && !completed && <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={reviewLatest} style={styles.cancelBtn}><Text>{uncertain ? 'Kiểm tra danh sách đã lưu' : 'Tải bản mới để đối chiếu'}</Text></TouchableOpacity>}
      {uncertain && reviewed && !editId && <View><Text style={styles.label}>Danh sách mới nhất · {reviewed.length} tác phẩm</Text>{reviewed.slice(0, 5).map(p => <Text key={p.id} style={styles.label}>{p.description || 'Tác phẩm không có mô tả'} · {p.imageUrls?.length || 0} ảnh</Text>)}<TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.cancelBtn} onPress={() => appDialog.alert('Đã kiểm tra danh sách?', 'Chỉ tiếp tục nếu lần tạo trước chưa xuất hiện trong danh sách. Thao tác tiếp theo có thể tạo bài trùng nếu máy chủ đã lưu.', [{ text: 'Hủy', style: 'cancel' }, { text: 'Tiếp tục', onPress: () => { setUncertain(false); setReviewed(null); setMessage(''); } }])}><Text>Đã kiểm tra, cho phép tạo lại</Text></TouchableOpacity></View>}
      {preview && <View><Text style={styles.label}>Bản mới · phiên bản {preview.version ?? 'chưa hỗ trợ'} · {preview.imageUrls?.length || 0} ảnh</Text><Text style={styles.label}>{preview.description || 'Không có mô tả'}</Text><TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => initialize(preview)} style={styles.cancelBtn}><Text>Dùng bản mới (bỏ bản nháp)</Text></TouchableOpacity></View>}
    </ScrollView>
    <View style={styles.modalFooter}>
      <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={busy}><Text style={styles.cancelBtnText}>{completed ? 'Đóng' : 'Hủy'}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={[styles.submitBtn, (!ready || !imageUrls.length || busy || uncertain) && styles.submitBtnDisabled]} onPress={completed ? retryRead : handleSubmit} disabled={!ready || busy || (!completed && (!imageUrls.length || uncertain))}><Text style={styles.submitBtnText}>{busy ? 'Đang xử lý…' : completed ? 'Tải lại dữ liệu' : 'Lưu'}</Text></TouchableOpacity>
    </View>
  </AppBottomSheet>;
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
