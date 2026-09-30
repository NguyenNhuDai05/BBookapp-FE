import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, ChevronUp, CircleDollarSign, Clock3, FileText, Hash, ImagePlus, Tag, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shadows, Typography } from '../../../constants/theme';
import { uploadImage } from '../../../services/supabase';
import type { CreateServiceRequest, ServiceDto } from '../../../types/ServiceDto';

interface ServiceFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateServiceRequest) => void | Promise<void>;
  initialData?: Partial<ServiceDto> | null;
  availableTags?: string[];
}

type Field = 'name' | 'price' | 'duration';
type Errors = Partial<Record<Field | 'submit', string>>;

const digitsOnly = (value: string) => value.replace(/\D/g, '');
const formatPrice = (value: string) => value ? Number(value).toLocaleString('vi-VN') : '';
const normalizeTags = (values: string[]) => [...new Set(values.map(value => value.trim()).filter(Boolean))];

export function ServiceFormModal(props: ServiceFormModalProps) {
  if (!props.visible) return null;
  return <ServiceFormModalContent {...props} />;
}

function ServiceFormModalContent({ visible, onClose, onSubmit, initialData, availableTags = [] }: ServiceFormModalProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialData?.name || initialData?.serviceName || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price ? String(Math.trunc(initialData.price)) : '');
  const [duration, setDuration] = useState(initialData?.durationMinutes ? String(initialData.durationMinutes) : '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(normalizeTags(initialData?.tags || []));
  const [tagsOpen, setTagsOpen] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const suggestions = useMemo(
    () => normalizeTags([...availableTags, ...(initialData?.tags || [])]),
    [availableTags, initialData?.tags],
  );
  const valid = Boolean(name.trim() && Number(price) > 0 && Number(duration) > 0);

  const fieldError = (field: Field) => {
    if (field === 'name' && !name.trim()) return 'Vui lòng nhập tên dịch vụ';
    if (field === 'price' && Number(price) <= 0) return 'Vui lòng nhập giá lớn hơn 0';
    if (field === 'duration' && Number(duration) <= 0) return 'Vui lòng nhập thời gian lớn hơn 0';
    return undefined;
  };
  const touch = (field: Field) => {
    setTouched(current => ({ ...current, [field]: true }));
    setErrors(current => ({ ...current, [field]: fieldError(field) }));
    setFocused(null);
  };
  const clearError = (field: Field) => setErrors(current => ({ ...current, [field]: undefined, submit: undefined }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.82 });
    if (!result.canceled && result.assets[0]) { setImageUrl(result.assets[0].uri); setErrors(current => ({ ...current, submit: undefined })); }
  };
  const toggleTag = (tag: string) => setSelectedTags(current => current.includes(tag) ? current.filter(value => value !== tag) : [...current, tag]);

  const handleSubmit = async () => {
    const nextErrors: Errors = { name: fieldError('name'), price: fieldError('price'), duration: fieldError('duration') };
    setTouched({ name: true, price: true, duration: true }); setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean) || submitting) return;
    setSubmitting(true);
    try {
      const finalImageUrl = imageUrl ? await uploadImage(imageUrl) : undefined;
      await onSubmit({
        serviceName: name.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        durationMinutes: Number(duration),
        imageUrl: finalImageUrl,
        tags: selectedTags,
      });
      onClose();
    } catch {
      setErrors(current => ({ ...current, submit: 'Không thể lưu dịch vụ. Vui lòng thử lại.' }));
    } finally { setSubmitting(false); }
  };

  const inputStyle = (field: Field) => [styles.inputShell, focused === field && styles.inputFocused, touched[field] && errors[field] && styles.inputError];

  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.header}>
          <View style={styles.handle}/>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}><Text style={styles.title}>{initialData ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</Text><Text style={styles.subtitle}>Tạo dịch vụ để khách hàng dễ dàng tìm thấy và đặt lịch.</Text></View>
            <TouchableOpacity onPress={onClose} style={styles.close} accessibilityLabel="Đóng"><X size={23} color="#2B1B2A"/></TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Section number="1" title="Thông tin cơ bản"/>
          <FieldLabel text="Tên dịch vụ" required/>
          <View style={inputStyle('name')}>
            <Tag size={21} color="#FF5C9A"/><TextInput accessibilityLabel="Tên dịch vụ" value={name} onChangeText={value=>{setName(value);clearError('name');}} onFocus={()=>setFocused('name')} onBlur={()=>touch('name')} placeholder="Tên dịch vụ" placeholderTextColor="#A999A4" style={styles.input}/>
            {name ? <TouchableOpacity style={styles.clear} onPress={()=>setName('')}><X size={15} color="#8D7E87"/></TouchableOpacity> : null}
          </View>
          {touched.name && errors.name ? <ErrorText text={errors.name}/> : null}

          <View style={styles.twoColumns}>
            <View style={styles.column}><FieldLabel text="Giá (VNĐ)" required/><View style={inputStyle('price')}><CircleDollarSign size={21} color="#FF5C9A"/><TextInput accessibilityLabel="Giá dịch vụ" value={formatPrice(price)} onChangeText={value=>{setPrice(digitsOnly(value));clearError('price');}} onFocus={()=>setFocused('price')} onBlur={()=>touch('price')} placeholder="0" keyboardType="numeric" placeholderTextColor="#A999A4" style={styles.input}/></View>{touched.price&&errors.price?<ErrorText text={errors.price}/>:null}</View>
            <View style={styles.column}><FieldLabel text="Thời gian (phút)" required/><View style={inputStyle('duration')}><Clock3 size={21} color="#FF5C9A"/><TextInput accessibilityLabel="Thời gian dịch vụ" value={duration} onChangeText={value=>{setDuration(digitsOnly(value));clearError('duration');}} onFocus={()=>setFocused('duration')} onBlur={()=>touch('duration')} placeholder="0" keyboardType="numeric" placeholderTextColor="#A999A4" style={styles.input}/><Text style={styles.suffix}>phút</Text></View>{touched.duration&&errors.duration?<ErrorText text={errors.duration}/>:null}</View>
          </View>

          <Section number="2" title="Mô tả dịch vụ"/>
          <View style={[styles.textAreaShell, focused==='description'&&styles.inputFocused]}><FileText size={21} color="#FF5C9A" style={styles.textAreaIcon}/><TextInput accessibilityLabel="Mô tả dịch vụ" value={description} onChangeText={setDescription} onFocus={()=>setFocused('description')} onBlur={()=>setFocused(null)} multiline textAlignVertical="top" placeholder="Mô tả dịch vụ, phong cách và những gì khách hàng sẽ nhận được" placeholderTextColor="#A999A4" style={styles.textArea}/></View>

          <Section number="3" title="Hình ảnh minh họa" subtitle="Thêm hình ảnh chất lượng cao để khách hàng dễ hình dung."/>
          {imageUrl ? <View style={styles.imagePreviewWrap}><Image source={{uri:imageUrl}} style={styles.imagePreview} contentFit="cover"/><TouchableOpacity style={styles.removeImage} onPress={()=>setImageUrl('')} accessibilityLabel="Xóa ảnh"><X size={19} color="#2B1B2A"/></TouchableOpacity><TouchableOpacity style={styles.replaceImage} onPress={pickImage}><ImagePlus size={18} color="#FF5C9A"/><Text style={styles.replaceText}>Thay ảnh</Text></TouchableOpacity></View>
            : <TouchableOpacity style={styles.upload} onPress={pickImage} activeOpacity={.75}><View style={styles.uploadIcon}><ImagePlus size={29} color="#FF5C9A"/></View><Text style={styles.uploadTitle}>Chọn ảnh từ thiết bị</Text><Text style={styles.uploadHint}>JPG • PNG • WEBP</Text></TouchableOpacity>}

          <Section number="4" title="Tags / Phân loại" subtitle="Chọn các tag phù hợp để khách hàng dễ tìm kiếm."/>
          <TouchableOpacity style={styles.tagSelector} onPress={()=>setTagsOpen(value=>!value)}><Hash size={22} color="#FF5C9A"/><View style={styles.selectedTagArea}>{selectedTags.length ? selectedTags.map(tag=><TouchableOpacity key={tag} style={styles.selectedTag} onPress={()=>toggleTag(tag)}><Text style={styles.selectedTagText}>{tag}</Text><X size={13} color="#D13B73"/></TouchableOpacity>) : <Text style={styles.tagPlaceholder}>Chọn tags</Text>}</View>{tagsOpen?<ChevronUp size={20} color="#2B1B2A"/>:<ChevronDown size={20} color="#2B1B2A"/>}</TouchableOpacity>
          {tagsOpen ? <View style={styles.tagPanel}>{suggestions.length ? suggestions.map(tag=><TouchableOpacity key={tag} style={[styles.suggestion,selectedTags.includes(tag)&&styles.suggestionActive]} onPress={()=>toggleTag(tag)}><Text style={[styles.suggestionText,selectedTags.includes(tag)&&styles.suggestionTextActive]}>{tag}</Text></TouchableOpacity>) : <Text style={styles.noTags}>Chưa có tag từ dữ liệu dịch vụ hiện tại.</Text>}</View> : null}
          {suggestions.length ? <><Text style={styles.suggestionLabel}>Gợi ý tag từ dịch vụ của bạn</Text><View style={styles.suggestionRow}>{suggestions.slice(0,10).map(tag=><TouchableOpacity key={tag} style={[styles.suggestion,selectedTags.includes(tag)&&styles.suggestionActive]} onPress={()=>toggleTag(tag)}><Text style={[styles.suggestionText,selectedTags.includes(tag)&&styles.suggestionTextActive]}>{tag}</Text></TouchableOpacity>)}</View></> : null}
          {errors.submit ? <Text style={styles.submitError}>{errors.submit}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancel} onPress={onClose} disabled={submitting}><Text style={styles.cancelText}>Hủy</Text></TouchableOpacity>
          <TouchableOpacity style={styles.saveTouch} onPress={handleSubmit} disabled={!valid||submitting}>
            {valid ? <LinearGradient colors={['#FF5C9A','#FF9BC1']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.save}>{submitting?<><ActivityIndicator color="#FFF"/><Text style={styles.saveText}>Đang lưu...</Text></>:<Text style={styles.saveText}>{initialData?'Lưu thay đổi':'Lưu dịch vụ'}</Text>}</LinearGradient>
              : <View style={[styles.save,styles.saveDisabled]}><Text style={styles.saveText}>{initialData?'Lưu thay đổi':'Lưu dịch vụ'}</Text></View>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

function Section({number,title,subtitle}:{number:string;title:string;subtitle?:string}){return <View style={styles.section}><View style={styles.sectionTitleRow}><View style={styles.number}><Text style={styles.numberText}>{number}</Text></View><Text style={styles.sectionTitle}>{title}</Text></View>{subtitle?<Text style={styles.sectionSubtitle}>{subtitle}</Text>:null}</View>}
function FieldLabel({text,required}:{text:string;required?:boolean}){return <Text style={styles.label}>{text}{required?<Text style={styles.required}> *</Text>:null}</Text>}
function ErrorText({text}:{text:string}){return <Text style={styles.error}>⚠ {text}</Text>}

const styles=StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(43,27,42,.38)',justifyContent:'flex-end'},sheet:{height:'94%',width:'100%',maxWidth:720,alignSelf:'center',backgroundColor:'#FFFBFC',borderTopLeftRadius:28,borderTopRightRadius:28,overflow:'hidden'},header:{backgroundColor:'#FFFBFC',paddingHorizontal:24,paddingBottom:16,borderBottomWidth:1,borderBottomColor:'#F7E9EF'},handle:{width:48,height:5,borderRadius:3,backgroundColor:'#CFC3C9',alignSelf:'center',marginTop:13,marginBottom:18},headerRow:{flexDirection:'row',alignItems:'flex-start'},headerCopy:{flex:1,paddingRight:12},title:{fontFamily:Typography.black,fontSize:26,lineHeight:33,color:'#2B1B2A'},subtitle:{fontFamily:Typography.regular,fontSize:14,lineHeight:20,color:'#7D6F78',marginTop:5},close:{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:'#FFE7EF'},scroll:{flex:1},form:{paddingHorizontal:24,paddingBottom:28},section:{marginTop:24,marginBottom:12},sectionTitleRow:{flexDirection:'row',alignItems:'center',gap:11},number:{width:34,height:34,borderRadius:17,backgroundColor:'#FFD6E5',alignItems:'center',justifyContent:'center'},numberText:{fontFamily:Typography.extraBold,fontSize:17,color:'#EF376F'},sectionTitle:{fontFamily:Typography.extraBold,fontSize:18,color:'#2B1B2A'},sectionSubtitle:{fontFamily:Typography.regular,fontSize:13,lineHeight:19,color:'#7D6F78',marginTop:6},label:{fontFamily:Typography.semiBold,fontSize:14,color:'#2B1B2A',marginBottom:7},required:{color:'#E22E64'},inputShell:{minHeight:56,borderWidth:1,borderColor:'#EADDE3',borderRadius:17,backgroundColor:'#FFF',paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:11},inputFocused:{borderColor:'#FF5C9A',shadowColor:'#FF5C9A',shadowOpacity:.09,shadowRadius:7,elevation:1},inputError:{borderColor:'#D95A67'},input:{flex:1,fontFamily:Typography.regular,fontSize:15,color:'#2B1B2A',paddingVertical:12,outlineStyle:'none'} as any,clear:{width:32,height:32,borderRadius:16,backgroundColor:'#F1ECF0',alignItems:'center',justifyContent:'center'},twoColumns:{flexDirection:'row',gap:12,marginTop:18},column:{flex:1,minWidth:0},suffix:{fontFamily:Typography.medium,fontSize:12,color:'#7D6F78'},error:{fontFamily:Typography.regular,fontSize:12,color:'#B64753',marginTop:5},textAreaShell:{minHeight:142,borderWidth:1,borderColor:'#EADDE3',borderRadius:17,backgroundColor:'#FFF',flexDirection:'row',alignItems:'flex-start',padding:14},textAreaIcon:{marginTop:2,marginRight:10},textArea:{flex:1,minHeight:110,fontFamily:Typography.regular,fontSize:15,lineHeight:22,color:'#2B1B2A',padding:0,outlineStyle:'none'} as any,upload:{height:166,borderWidth:1.5,borderStyle:'dashed',borderColor:'#FF9CBC',borderRadius:18,backgroundColor:'#FFF7FA',alignItems:'center',justifyContent:'center'},uploadIcon:{width:54,height:54,borderRadius:27,backgroundColor:'#FFE5EE',alignItems:'center',justifyContent:'center'},uploadTitle:{fontFamily:Typography.bold,fontSize:15,color:'#2B1B2A',marginTop:10},uploadHint:{fontFamily:Typography.regular,fontSize:13,color:'#7D6F78',marginTop:5},imagePreviewWrap:{height:210,borderRadius:17,overflow:'hidden',backgroundColor:'#F4EBEF'},imagePreview:{width:'100%',height:'100%'},removeImage:{position:'absolute',right:10,top:10,width:44,height:44,borderRadius:22,backgroundColor:'#FFF',alignItems:'center',justifyContent:'center',...Shadows.sm},replaceImage:{position:'absolute',right:10,bottom:10,height:42,paddingHorizontal:14,borderRadius:21,backgroundColor:'#FFF',flexDirection:'row',alignItems:'center',gap:6,...Shadows.sm},replaceText:{fontFamily:Typography.bold,fontSize:13,color:'#FF5C9A'},tagSelector:{minHeight:58,borderWidth:1,borderColor:'#EADDE3',borderRadius:17,backgroundColor:'#FFF',paddingHorizontal:14,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:10},selectedTagArea:{flex:1,flexDirection:'row',flexWrap:'wrap',gap:6},tagPlaceholder:{fontFamily:Typography.regular,fontSize:15,color:'#A999A4'},selectedTag:{height:32,paddingHorizontal:11,borderRadius:16,backgroundColor:'#FFE8F0',flexDirection:'row',alignItems:'center',gap:5},selectedTagText:{fontFamily:Typography.semiBold,fontSize:12,color:'#D13B73'},tagPanel:{marginTop:8,padding:12,borderWidth:1,borderColor:'#F2E4EA',borderRadius:16,backgroundColor:'#FFF',flexDirection:'row',flexWrap:'wrap',gap:8},noTags:{fontFamily:Typography.regular,fontSize:13,color:'#7D6F78'},suggestionLabel:{fontFamily:Typography.semiBold,fontSize:13,color:'#2B1B2A',marginTop:14,marginBottom:9},suggestionRow:{flexDirection:'row',flexWrap:'wrap',gap:8},suggestion:{minHeight:36,paddingHorizontal:14,borderWidth:1,borderColor:'#FFC5D8',borderRadius:18,backgroundColor:'#FFF5F8',alignItems:'center',justifyContent:'center'},suggestionActive:{backgroundColor:'#FF5C9A',borderColor:'#FF5C9A'},suggestionText:{fontFamily:Typography.medium,fontSize:13,color:'#E14078'},suggestionTextActive:{color:'#FFF'},submitError:{fontFamily:Typography.medium,fontSize:13,color:'#B64753',textAlign:'center',marginTop:20},footer:{backgroundColor:'#FFF',borderTopWidth:1,borderTopColor:'#F3E4EA',paddingHorizontal:24,paddingTop:14,flexDirection:'row',gap:12},cancel:{flex:0.85,height:54,borderRadius:22,borderWidth:1,borderColor:'#E3D5DC',alignItems:'center',justifyContent:'center'},cancelText:{fontFamily:Typography.bold,fontSize:15,color:'#2B1B2A'},saveTouch:{flex:1.15,height:54,borderRadius:22,overflow:'hidden'},save:{flex:1,flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center'},saveDisabled:{backgroundColor:'#E7DDE3'},saveText:{fontFamily:Typography.bold,fontSize:15,color:'#FFF'}
});
