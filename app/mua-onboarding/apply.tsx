import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';
import { useSubmitApplication } from '../../hooks/useMuaOnboarding';
import { uploadImage } from '../../services/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import type { MuaApplicationRequestDto } from '../../types/onboarding';

const specialtyOptions = ['Cô dâu', 'Sự kiện', 'Korean', 'Natural', 'Douyin', 'Kỷ yếu'];
type Form = MuaApplicationRequestDto & { avatarUrl?: string };

export default function MuaApplyScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const submit = useSubmitApplication();
  const draftKey = `mua_onboarding_draft:${user?.id || 'anonymous'}`;
  const [form, setForm] = useState<Form>({ displayName:user?.name||'', phoneNumber:'', city:'', bio:'', specialization:'', socialLinks:'', avatarUrl:'' });
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [draftReady, setDraftReady] = useState(false);
  const selected = useMemo(() => (form.specialization || '').split(',').map(x=>x.trim()).filter(Boolean), [form.specialization]);

  useEffect(() => { AsyncStorage.getItem(draftKey).then(raw => { if (raw) setForm(current => ({...current,...JSON.parse(raw)})); }).finally(() => setDraftReady(true)); }, [draftKey]);
  useEffect(() => { if (!draftReady) return; const id=setTimeout(() => void AsyncStorage.setItem(draftKey,JSON.stringify(form)),250); return () => clearTimeout(id); }, [draftKey,draftReady,form]);

  const setField = (key:keyof Form,value:any) => { setForm(current=>({...current,[key]:value})); setErrors(current=>({...current,[key]:'',submit:''})); };
  const toggleSpecialty = (value:string) => setField('specialization', selected.includes(value) ? selected.filter(x=>x!==value).join(', ') : [...selected,value].join(', '));
  const validate = () => { const next:Record<string,string>={}; if(!form.displayName.trim())next.displayName='Vui lòng nhập tên hiển thị.'; if(!form.phoneNumber?.trim())next.phoneNumber='Vui lòng nhập số điện thoại.'; if(!form.city.trim())next.city='Vui lòng nhập thành phố hoặc khu vực.'; if(!form.bio.trim())next.bio='Vui lòng giới thiệu ngắn về bạn.'; if(!form.specialization?.trim())next.specialization='Hãy chọn ít nhất một chuyên môn.'; setErrors(next); return !Object.keys(next).length; };
  const pickAvatar = async () => { const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:.8}); if(!result.canceled)setField('avatarUrl',result.assets[0].uri); };
  const handleSubmit = async () => { if(!validate()||submit.isPending)return; try { const avatarUrl=form.avatarUrl ? await uploadImage(form.avatarUrl) : undefined; await submit.mutateAsync({...form,experienceYears:Number(form.experienceYears)||0,avatarUrl} as MuaApplicationRequestDto); await AsyncStorage.removeItem(draftKey); router.replace('/(mua)/dashboard'); } catch(error:any) { const body=error?.response?.data; setErrors(current=>({...current,submit:body?.message||body?.Message||'Không thể tạo hồ sơ. Vui lòng kiểm tra mạng và thử lại.'})); } };
  const input=(label:string,key:keyof Form,placeholder:string,props:any={})=><View style={styles.group}><Text style={styles.label}>{label}</Text><TextInput style={[styles.input,props.multiline&&styles.textarea,errors[key]&&styles.inputError]} value={String(form[key]??'')} onChangeText={value=>setField(key,key==='experienceYears'?value.replace(/\D/g,''):value)} placeholder={placeholder} placeholderTextColor={BrandColors.textMuted} {...props}/>{errors[key]?<Text style={styles.error}>{errors[key]}</Text>:null}</View>;

  return <SafeAreaView style={styles.safe} edges={['top','bottom']}>
    <View style={styles.header}><TouchableOpacity style={styles.iconButton} onPress={()=>router.back()} accessibilityLabel="Quay lại"><ArrowLeft size={23} color={BrandColors.textDark}/></TouchableOpacity><View><Text style={styles.headerTitle}>Tạo hồ sơ MUA</Text><Text style={styles.step}>Bước 1/3 · Thông tin ban đầu</Text></View><View style={styles.iconButton}/></View>
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <Text style={styles.title}>Thông tin của bạn</Text><Text style={styles.helper}>Bạn có thể tiếp tục hoàn thiện dịch vụ, portfolio và lịch làm việc sau.</Text>
      <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} accessibilityLabel="Chọn ảnh đại diện">{form.avatarUrl?<Image source={{uri:form.avatarUrl}} style={styles.avatar}/>:<View style={styles.avatarFallback}><Camera size={27} color={BrandColors.accentRose}/></View>}<View style={{flex:1}}><Text style={styles.avatarTitle}>Ảnh đại diện</Text><Text style={styles.avatarHint}>Ảnh vuông, rõ khuôn mặt hoặc thương hiệu</Text></View></TouchableOpacity>
      {input('Tên hiển thị','displayName','Ví dụ: Uyên Makeup')}{input('Số điện thoại','phoneNumber','Ví dụ: 0901234567',{keyboardType:'phone-pad'})}{input('Thành phố / khu vực','city','Ví dụ: Hà Nội')}{input('Giới thiệu','bio','Phong cách, kinh nghiệm và điểm nổi bật của bạn...',{multiline:true,numberOfLines:4,textAlignVertical:'top'})}
      <Text style={styles.sectionTitle}>Kinh nghiệm & phong cách</Text>{input('Số năm kinh nghiệm','experienceYears','Ví dụ: 3',{keyboardType:'number-pad'})}
      <View style={styles.group}><Text style={styles.label}>Chuyên môn</Text><View style={styles.chips}>{specialtyOptions.map(value=>{const active=selected.includes(value);return <TouchableOpacity key={value} onPress={()=>toggleSpecialty(value)} style={[styles.chip,active&&styles.chipActive]}>{active?<Check size={14} color="#FFF"/>:null}<Text style={[styles.chipText,active&&styles.chipTextActive]}>{value}</Text></TouchableOpacity>})}</View>{errors.specialization?<Text style={styles.error}>{errors.specialization}</Text>:null}</View>
      {input('Instagram/Facebook (không bắt buộc)','socialLinks','https://instagram.com/...',{autoCapitalize:'none',keyboardType:'url'})}
      {errors.submit?<View style={styles.submitError}><Text style={styles.submitErrorText}>{errors.submit}</Text></View>:null}
      <TouchableOpacity disabled={submit.isPending} onPress={handleSubmit} style={[styles.primary,submit.isPending&&styles.disabled]}>{submit.isPending?<><ActivityIndicator color="#FFF"/><Text style={styles.primaryText}>Đang tạo hồ sơ...</Text></>:<Text style={styles.primaryText}>Tiếp tục</Text>}</TouchableOpacity>
    </ScrollView></KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:BrandColors.bgPrimary},header:{minHeight:62,paddingHorizontal:Spacing.md,backgroundColor:'#FFF',flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:BrandColors.borderLight},iconButton:{width:44,height:44,alignItems:'center',justifyContent:'center'},headerTitle:{fontFamily:Typography.bold,fontSize:17,color:BrandColors.textDark,textAlign:'center'},step:{fontFamily:Typography.regular,fontSize:11,color:BrandColors.textMuted,textAlign:'center',marginTop:2},content:{padding:Spacing.base,paddingBottom:Spacing.xxl},title:{fontFamily:Typography.extraBold,fontSize:24,color:BrandColors.textDark},helper:{fontFamily:Typography.regular,fontSize:14,lineHeight:20,color:BrandColors.textBody,marginTop:5,marginBottom:Spacing.lg},avatarWrap:{minHeight:82,backgroundColor:'#FFF',borderRadius:Radius.base,padding:12,flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:BrandColors.borderLight,marginBottom:Spacing.lg},avatar:{width:58,height:58,borderRadius:29,marginRight:12},avatarFallback:{width:58,height:58,borderRadius:29,backgroundColor:BrandColors.bgPink,alignItems:'center',justifyContent:'center',marginRight:12},avatarTitle:{fontFamily:Typography.bold,fontSize:14,color:BrandColors.textDark},avatarHint:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textMuted,marginTop:3},sectionTitle:{fontFamily:Typography.bold,fontSize:18,color:BrandColors.textDark,marginTop:8,marginBottom:Spacing.base},group:{marginBottom:Spacing.base},label:{fontFamily:Typography.semiBold,fontSize:14,color:BrandColors.textDark,marginBottom:7},input:{minHeight:50,borderRadius:Radius.md,borderWidth:1,borderColor:BrandColors.borderLight,backgroundColor:'#FFF',paddingHorizontal:14,fontFamily:Typography.regular,fontSize:15,color:BrandColors.textDark},textarea:{minHeight:106,paddingTop:13},inputError:{borderColor:BrandColors.statusCancelled},error:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.statusCancelled,marginTop:5},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{minHeight:40,paddingHorizontal:13,borderRadius:Radius.full,backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.borderLight,flexDirection:'row',alignItems:'center',gap:5},chipActive:{backgroundColor:BrandColors.accentRose,borderColor:BrandColors.accentRose},chipText:{fontFamily:Typography.medium,fontSize:13,color:BrandColors.textBody},chipTextActive:{color:'#FFF'},submitError:{padding:12,borderRadius:Radius.md,backgroundColor:BrandColors.statusCancelledBg,marginBottom:12},submitErrorText:{fontFamily:Typography.regular,fontSize:13,color:BrandColors.statusCancelled},primary:{minHeight:52,borderRadius:Radius.base,backgroundColor:BrandColors.accentRose,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},disabled:{opacity:.6},primaryText:{fontFamily:Typography.bold,fontSize:16,color:'#FFF'}});
