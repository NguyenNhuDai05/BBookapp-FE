import { AppBottomSheet } from '../../components/ui/AppBottomSheet';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check, ChevronDown, ImagePlus, Landmark, Search, X } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BrandColors, Radius, Shadows, Spacing, Typography } from '../../constants/theme';
import { useAddBankAccount, useUpdateBankAccount } from '../../hooks/useBankAccounts';
import { getApiError } from '../../services/api';
import { BankOption, normalizeAccountHolder, normalizeBankSearch, VIETNAM_BANKS } from '../../constants/banks';
import { uploadBankQr } from '../../services/supabase';
import { getBankAccountErrorMessage } from '../../utils/bankAccountStatus';
import { FeedbackDialog } from '../../components/common/FeedbackDialog';

export default function BankAccountFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const submitLock = useRef(false);
  const params = useLocalSearchParams<{ id?: string; bankCode?: string; bankName?: string; holder?: string }>();
  const add = useAddBankAccount();
  const update = useUpdateBankAccount();
  const editing = Boolean(params.id);
  const pending = add.isPending || update.isPending;
  const initialBank = VIETNAM_BANKS.find(bank => bank.code === params.bankCode)
    ?? (params.bankCode ? { name: params.bankName || params.bankCode, fullName: params.bankName || '', code: params.bankCode, bin: '', color: BrandColors.accentRose } : undefined);
  const [selectedBank, setSelectedBank] = useState<BankOption | undefined>(initialBank);
  const [accountNumber, setAccountNumber] = useState('');
  const [holder, setHolder] = useState(normalizeAccountHolder(params.holder || ''));
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPassword,setCurrentPassword]=useState('');
  const [qrCodeUrl,setQrCodeUrl]=useState('');
  const [qrLocalUri,setQrLocalUri]=useState('');
  const [scanningQr,setScanningQr]=useState(false);
  const [entryMode,setEntryMode]=useState<'MANUAL'|'SCAN'>('MANUAL');
  const [feedback,setFeedback]=useState<{title:string;message:string;error?:boolean;navigate?:boolean}|null>(null);
  const isMomo=selectedBank?.code==='MOMO';
  const generatedQrUrl=!isMomo&&selectedBank&&/^\d{5,30}$/.test(accountNumber)?`https://img.vietqr.io/image/${encodeURIComponent(selectedBank.bin)}-${encodeURIComponent(accountNumber)}-compact2.png?accountName=${encodeURIComponent(holder.trim())}`:'';
  const effectiveQrUrl=entryMode==='SCAN'?qrCodeUrl:generatedQrUrl;
  const valid = Boolean(selectedBank) && (isMomo?/^(0|84)\d{8,10}$/.test(accountNumber):/^\d{5,30}$/.test(accountNumber)) && /^[A-Z]+(?: [A-Z]+)*$/.test(holder.trim()) && holder.trim().length >= 2 && currentPassword.length>=6 && /^https:\/\//.test(effectiveQrUrl) && !(entryMode==='MANUAL'&&isMomo);
  const filteredBanks = useMemo(() => {
    const keyword = normalizeBankSearch(search.trim());
    return keyword ? VIETNAM_BANKS.filter(bank => normalizeBankSearch(`${bank.name} ${bank.fullName} ${bank.code} ${bank.bin}`).includes(keyword)) : VIETNAM_BANKS;
  }, [search]);

  const chooseBank = (bank: BankOption) => {
    setSelectedBank(bank);
    setSearch('');
    setBankPickerVisible(false);
  };

  const pickQr = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {setFeedback({title:'Cần quyền truy cập ảnh',message:'Hãy cho phép ứng dụng chọn ảnh QR từ thư viện.',error:true});return;}
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setScanningQr(true);
    try {
      const decoded = await uploadBankQr(uri);
      const bank = decoded.method === 'MOMO' ? VIETNAM_BANKS.find(x => x.code === 'MOMO') : VIETNAM_BANKS.find(x => x.bin === decoded.bankBin);
      if (!bank) throw new Error(`Ngân hàng BIN ${decoded.bankBin || ''} chưa được hỗ trợ.`);
      setSelectedBank(bank);
      if (decoded.accountNumber) setAccountNumber(decoded.accountNumber.replace(/\D/g, ''));
      if (decoded.accountName) setHolder(normalizeAccountHolder(decoded.accountName));
      setQrCodeUrl(decoded.url); setQrLocalUri(uri);
      if (!decoded.accountName) setFeedback({title:'Đã đọc QR',message:'QR không chứa tên chủ tài khoản. Vui lòng nhập và admin sẽ đối chiếu trước khi chuyển.'});
    } catch (error) { setFeedback({title:'Không đọc được QR',message:getApiError(error).message,error:true}); }
    finally { setScanningQr(false); }
  };

  const submit = async () => {
    if (!valid || !selectedBank || pending || submitLock.current) return;
    submitLock.current = true;
    const request = { bankCode: selectedBank.code,bankBin:selectedBank.bin, bankName: selectedBank.name, accountNumber, accountHolderName: holder.trim().toUpperCase(), isDefault:false,currentPassword,method:(isMomo?'MOMO':'BANK') as 'MOMO'|'BANK',qrCodeUrl:effectiveQrUrl };
    try {
      await (params.id?update.mutateAsync({ id: params.id, request }):add.mutateAsync(request));
      setFeedback({title:'Đã lưu tài khoản',message:'Tài khoản đang chờ Admin duyệt trước khi có thể nhận tiền.',navigate:true});
    } catch (error) {
      const value=getApiError(error);setFeedback({title:'Không thể lưu tài khoản',message:getBankAccountErrorMessage(value.code,value.message),error:true});
    } finally {
      submitLock.current = false;
    }
  };

  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <View style={styles.header}><TouchableOpacity style={styles.back} onPress={() => router.back()} disabled={pending} accessibilityLabel="Quay lại"><ArrowLeft size={23} color={BrandColors.textDark}/></TouchableOpacity><Text style={styles.title}>{editing ? 'Cập nhật tài khoản' : 'Thêm tài khoản'}</Text><View style={styles.back}/></View>
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={8}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.xl }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.modeTabs}><TouchableOpacity style={[styles.modeTab,entryMode==='MANUAL'&&styles.modeTabActive]} onPress={()=>{setEntryMode('MANUAL');setQrCodeUrl('');setQrLocalUri('');}}><Text style={[styles.modeText,entryMode==='MANUAL'&&styles.modeTextActive]}>Nhập tài khoản</Text></TouchableOpacity><TouchableOpacity style={[styles.modeTab,entryMode==='SCAN'&&styles.modeTabActive]} onPress={()=>setEntryMode('SCAN')}><Text style={[styles.modeText,entryMode==='SCAN'&&styles.modeTextActive]}>Đọc ảnh QR</Text></TouchableOpacity></View>
        <View style={styles.field}><Text style={styles.label}>Ngân hàng *</Text><TouchableOpacity style={[styles.bankSelect, selectedBank && styles.bankSelectActive]} onPress={() => setBankPickerVisible(true)} activeOpacity={0.8}><BankMark bank={selectedBank}/><View style={styles.bankSelectCopy}>{selectedBank ? <><Text style={styles.bankSelectedName}>{selectedBank.name}</Text><Text style={styles.bankSelectedFull} numberOfLines={1}>{selectedBank.fullName}</Text></> : <Text style={styles.placeholder}>Chọn ngân hàng</Text>}</View><ChevronDown size={20} color={BrandColors.textMuted}/></TouchableOpacity></View>
        <View style={styles.field}><Text style={styles.label}>{editing ? 'Nhập lại số tài khoản *' : 'Số tài khoản *'}</Text><TextInput style={styles.input} value={accountNumber} onChangeText={value => setAccountNumber(value.replace(/\D/g, ''))} placeholder="Nhập số tài khoản" placeholderTextColor={BrandColors.textLight} keyboardType="number-pad" inputMode="numeric" maxLength={30} returnKeyType="next"/>{accountNumber.length > 0 && accountNumber.length < 5 ? <Text style={styles.validation}>Số tài khoản cần ít nhất 5 chữ số.</Text> : null}</View>
        <View style={styles.field}><Text style={styles.label}>Tên chủ tài khoản *</Text><TextInput style={styles.input} value={holder} onChangeText={value => setHolder(normalizeAccountHolder(value))} autoCapitalize="characters" autoCorrect={false} maxLength={150}/><Text style={styles.helper}>Nhập tên không dấu, viết IN HOA và trùng khớp với thông tin tại ngân hàng.</Text></View>
        {entryMode==='SCAN'?<View style={styles.field}><Text style={styles.label}>Ảnh QR cần kiểm tra *</Text><TouchableOpacity style={styles.qrPicker} onPress={pickQr} disabled={scanningQr}>{scanningQr?<ActivityIndicator color={BrandColors.accentRose}/>:qrLocalUri?<Image source={{uri:qrLocalUri}} style={styles.qrImage}/>:<><ImagePlus size={28} color={BrandColors.accentRose}/><Text style={styles.qrText}>Chọn ảnh QR ngân hàng hoặc MoMo</Text></>}</TouchableOpacity><Text style={styles.helper}>Hệ thống đọc QR rồi điền ngân hàng và số tài khoản để bạn kiểm tra.</Text></View>:generatedQrUrl?<View style={styles.field}><Text style={styles.label}>QR được tạo từ tài khoản</Text><Image source={{uri:generatedQrUrl}} style={styles.generatedQr}/><Text style={styles.helper}>QR được tạo tự động từ thông tin phía trên.</Text></View>:isMomo?<Text style={styles.validation}>MoMo không hỗ trợ tự tạo QR. Hãy chọn “Đọc ảnh QR”.</Text>:null}
        <View style={styles.field}><Text style={styles.label}>Mật khẩu xác nhận *</Text><TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" placeholder="Nhập mật khẩu đăng nhập"/><Text style={styles.helper}>Bắt buộc xác thực lại để bảo vệ tài khoản nhận tiền.</Text></View>
        {editing?<Text style={styles.warning}>Thay đổi thông tin nhận tiền sẽ khiến tài khoản phải được duyệt lại và không còn là mặc định.</Text>:<Text style={styles.helper}>Bạn có thể đặt tài khoản làm mặc định sau khi tài khoản được duyệt và hết thời gian bảo vệ.</Text>}
        <View style={styles.infoBox}><Landmark size={19} color={BrandColors.textSecondary}/><Text style={styles.infoText}>Hãy kiểm tra chính xác thông tin. Tiền thanh toán sẽ được chuyển tới tài khoản này sau khi hệ thống xác nhận.</Text></View>
        <TouchableOpacity style={[styles.submit, (!valid || pending) && styles.submitDisabled]} disabled={!valid || pending} onPress={submit} activeOpacity={0.85}>{pending ? <ActivityIndicator color="#FFF"/> : <Text style={styles.submitText}>Lưu tài khoản</Text>}</TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
    <AppBottomSheet visible={bankPickerVisible} title="Chọn ngân hàng" onClose={()=>setBankPickerVisible(false)}   contentStyle={{height:'75%'}}>
<View style={styles.sheetHandle}/>

<View style={styles.searchBox}><Search size={19} color={BrandColors.textMuted}/><TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Tìm kiếm ngân hàng..." placeholderTextColor={BrandColors.textLight} autoFocus autoCapitalize="none"/>{search ? <TouchableOpacity onPress={() => setSearch('')}><X size={18} color={BrandColors.textMuted}/></TouchableOpacity> : null}</View>

<FlatList data={filteredBanks} keyExtractor={bank => bank.code} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.bankList} ListEmptyComponent={<Text style={styles.empty}>Không tìm thấy ngân hàng phù hợp.</Text>} renderItem={({ item }) => <TouchableOpacity style={styles.bankRow} onPress={() => chooseBank(item)} activeOpacity={0.75}><BankMark bank={item}/><View style={styles.bankRowCopy}><Text style={styles.bankRowName}>{item.name}</Text><Text style={styles.bankRowFull} numberOfLines={1}>{item.fullName}</Text></View>{item.code === selectedBank?.code ? <Check size={21} color={BrandColors.accentPink}/> : null}</TouchableOpacity>}/>
</AppBottomSheet>
    <FeedbackDialog visible={Boolean(feedback)} title={feedback?.title||''} message={feedback?.message||''} error={feedback?.error} buttonLabel={feedback?.navigate?'Hoàn tất':'Đóng'} onClose={()=>{const navigate=feedback?.navigate;setFeedback(null);if(navigate)router.back();}}/>
  </SafeAreaView>;
}

function BankMark({ bank }: { bank?: BankOption }) {
  return <View style={[styles.bankMark, bank ? { backgroundColor: bank.color } : undefined]}>{bank ? <Text style={styles.bankMarkText}>{bank.code.slice(0, 3)}</Text> : <Landmark size={20} color={BrandColors.textMuted}/>}</View>;
}

const styles = StyleSheet.create({
safe:{flex:1,backgroundColor:BrandColors.bgPrimary},
keyboard:{flex:1},
header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:Spacing.md,paddingVertical:Spacing.sm},
back:{width:44,height:44,alignItems:'center',justifyContent:'center'},
title:{fontFamily:Typography.bold,fontSize:20,color:BrandColors.textDark},
content:{paddingHorizontal:Spacing.base,paddingTop:Spacing.md},
field:{marginBottom:Spacing.lg},
label:{fontFamily:Typography.semiBold,fontSize:14,color:BrandColors.textDark,marginBottom:Spacing.sm},
input:{minHeight:58,backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.borderLight,borderRadius:Radius.base,paddingHorizontal:Spacing.base,fontFamily:Typography.semiBold,fontSize:16,color:BrandColors.textDark},
qrPicker:{minHeight:150,borderWidth:1,borderStyle:'dashed',borderColor:BrandColors.borderPink,borderRadius:Radius.base,backgroundColor:'#FFF',alignItems:'center',justifyContent:'center',overflow:'hidden'},
qrImage:{width:'100%',height:220,resizeMode:'contain'},
qrText:{fontFamily:Typography.semiBold,color:BrandColors.accentRose,marginTop:8},
bankSelect:{minHeight:68,flexDirection:'row',alignItems:'center',gap:Spacing.md,backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.borderLight,borderRadius:Radius.base,paddingHorizontal:Spacing.md,...Shadows.sm},
bankSelectActive:{borderColor:BrandColors.borderPink},
bankSelectCopy:{flex:1},
bankSelectedName:{fontFamily:Typography.bold,fontSize:15,color:BrandColors.textDark},
bankSelectedFull:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textSecondary,marginTop:3},
placeholder:{fontFamily:Typography.regular,fontSize:15,color:BrandColors.textMuted},
bankMark:{width:44,height:44,borderRadius:13,alignItems:'center',justifyContent:'center',backgroundColor:'#F4F1F3'},
bankMarkText:{fontFamily:Typography.extraBold,fontSize:11,color:'#FFF'},
validation:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.statusCancelled,marginTop:6},
helper:{fontFamily:Typography.regular,fontSize:12,lineHeight:17,color:BrandColors.textMuted,marginTop:7},
infoBox:{flexDirection:'row',alignItems:'flex-start',gap:10,backgroundColor:'#FFF8F5',borderRadius:Radius.base,padding:Spacing.md,marginTop:Spacing.md,borderWidth:1,borderColor:'#F6E8E2'},
infoText:{flex:1,fontFamily:Typography.regular,fontSize:12,lineHeight:18,color:BrandColors.textSecondary},
submit:{minHeight:56,alignItems:'center',justifyContent:'center',backgroundColor:BrandColors.accentRose,borderRadius:Radius.full,marginTop:Spacing.lg,...Shadows.soft},
submitDisabled:{opacity:.45,shadowOpacity:0},
submitText:{fontFamily:Typography.bold,fontSize:16,color:'#FFF'},
sheetHandle:{width:42,height:4,borderRadius:2,backgroundColor:BrandColors.borderSoft,alignSelf:'center',marginTop:Spacing.sm},
searchBox:{minHeight:50,flexDirection:'row',alignItems:'center',gap:9,backgroundColor:BrandColors.bgPinkLight,borderWidth:1,borderColor:BrandColors.borderLight,borderRadius:Radius.base,paddingHorizontal:Spacing.md,marginBottom:Spacing.sm},
searchInput:{flex:1,fontFamily:Typography.regular,fontSize:15,color:BrandColors.textDark,paddingVertical:0},
bankList:{paddingBottom:Spacing.lg},
bankRow:{minHeight:66,flexDirection:'row',alignItems:'center',gap:Spacing.md,borderBottomWidth:1,borderBottomColor:BrandColors.borderDivider},
bankRowCopy:{flex:1},
bankRowName:{fontFamily:Typography.bold,fontSize:15,color:BrandColors.textDark},
bankRowFull:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textSecondary,marginTop:3},
empty:{fontFamily:Typography.regular,color:BrandColors.textMuted,textAlign:'center',padding:Spacing.xl},
modeTabs:{flexDirection:'row',backgroundColor:'#F1EDF0',borderRadius:Radius.full,padding:4,marginBottom:Spacing.lg},
modeTab:{flex:1,minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:Radius.full},
modeTabActive:{backgroundColor:'#FFF'},
modeText:{fontFamily:Typography.semiBold,color:BrandColors.textSecondary},
modeTextActive:{color:BrandColors.accentRose},
generatedQr:{width:220,height:220,alignSelf:'center',resizeMode:'contain',backgroundColor:'#FFF',borderRadius:Radius.base},
warning:{fontFamily:Typography.semiBold,fontSize:12,lineHeight:18,color:'#9A6700',backgroundColor:'#FFF4CE',padding:Spacing.md,borderRadius:Radius.base,marginTop:Spacing.sm}
});
