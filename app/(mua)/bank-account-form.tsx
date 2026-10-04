import { useAuthStore as useReviewAuth } from '../../store/useAuthStore';
import { ReviewReadOnlyScreen } from '../../components/ReviewReadOnlyScreen';
import { normalizeMomoPhone, isMomoPhone } from '../../utils/momoPhone';
import { AppBottomSheet } from '../../components/ui/AppBottomSheet';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check, ChevronDown, ImagePlus, Landmark, Search, X } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BrandColors, Radius, Shadows, Spacing, Typography } from '../../constants/theme';
import { getApiError } from '../../services/api';
import { BankOption, normalizeAccountHolder, normalizeBankSearch, VIETNAM_BANKS } from '../../constants/banks';
import { uploadBankQr } from '../../services/supabase';
import { financialMediaService } from '../../services/financialMediaService';
import { getBankAccountErrorMessage } from '../../utils/bankAccountStatus';
import { FeedbackDialog } from '../../components/common/FeedbackDialog';
import { BankAccountOtpDialog } from '../../components/bank/BankAccountOtpDialog';
import { useBankAccountOtpFlow } from '../../hooks/useBankAccountOtpFlow';

function BankAccountFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const submitLock = useRef(false);
  const params = useLocalSearchParams<{ id?: string; bankCode?: string; bankName?: string; holder?: string; financialQrMediaId?: string }>();
  const editing = Boolean(params.id);
  const initialBank = VIETNAM_BANKS.find(bank => bank.code === params.bankCode)
    ?? (params.bankCode ? { name: params.bankName || params.bankCode, fullName: params.bankName || '', code: params.bankCode, bin: '', color: BrandColors.accentRose } : undefined);
  const [selectedBank, setSelectedBank] = useState<BankOption | undefined>(initialBank);
  const [accountNumber, setAccountNumber] = useState('');
  const [holder, setHolder] = useState(normalizeAccountHolder(params.holder || ''));
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const [search, setSearch] = useState('');

  const [qrLocalUri,setQrLocalUri]=useState('');
  const [qrRemoved,setQrRemoved]=useState(false);
  const [financialQrMediaId,setFinancialQrMediaId]=useState(params.financialQrMediaId||'');
  const [privateQrPreview,setPrivateQrPreview]=useState<{id:string;image:string}>();
  const privateQrImage=privateQrPreview?.id===financialQrMediaId?privateQrPreview.image:'';
  useEffect(()=>{let cancelled=false;if(financialQrMediaId)financialMediaService.preview(financialQrMediaId).then(image=>{if(!cancelled)setPrivateQrPreview({id:financialQrMediaId,image});}).catch(()=>{});return()=>{cancelled=true;};},[financialQrMediaId]);
  const [scanningQr,setScanningQr]=useState(false);
  const [entryMode,setEntryMode]=useState<'MANUAL'|'SCAN'>('MANUAL');
  const [feedback,setFeedback]=useState<{title:string;message:string;error?:boolean;navigate?:boolean}|null>(null);
  const isMomo=selectedBank?.code==='MOMO';
  const valid = Boolean(selectedBank) && (isMomo?isMomoPhone(accountNumber):/^\d{5,30}$/.test(accountNumber)) && /^[A-Z]+(?: [A-Z]+)*$/.test(holder.trim()) && holder.trim().length >= 2;
  const draft=useMemo(()=>valid&&selectedBank?{bankCode:selectedBank.code,bankBin:selectedBank.bin,bankName:selectedBank.name,accountNumber:isMomo?normalizeMomoPhone(accountNumber):accountNumber,accountHolderName:holder.trim().toUpperCase(),method:(isMomo?'MOMO':'BANK') as 'MOMO'|'BANK',financialQrAction:(qrRemoved?'REMOVE':financialQrMediaId&&financialQrMediaId!==params.financialQrMediaId?'REPLACE':'UNCHANGED') as 'UNCHANGED'|'REPLACE'|'REMOVE',...(isMomo&&financialQrMediaId?{financialQrMediaId}:{})}:undefined,[valid,selectedBank,accountNumber,holder,isMomo,financialQrMediaId,qrRemoved,params.financialQrMediaId]);
  const otpFlow=useBankAccountOtpFlow(params.id,draft);const pending=otpFlow.isSending||otpFlow.isConfirming;
  const filteredBanks = useMemo(() => {
    const keyword = normalizeBankSearch(search.trim());
    return keyword ? VIETNAM_BANKS.filter(bank => normalizeBankSearch(`${bank.name} ${bank.fullName} ${bank.code} ${bank.bin}`).includes(keyword)) : VIETNAM_BANKS;
  }, [search]);

  const chooseBank = (bank: BankOption) => {
    if(bank.code!==selectedBank?.code){setFinancialQrMediaId('');setQrLocalUri('');}
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
      if (!bank) { setFeedback({title:'QR đã đọc được',message:'Mã định tuyến của QR chưa được BBook hỗ trợ. Hãy chọn đúng ngân hàng và nhập thông tin thủ công; không tự đổi số tài khoản.',error:true}); return; }
      if (decoded.accountNumber && !/^\d+$/.test(decoded.accountNumber)) throw new Error('Định dạng tài khoản trong QR chưa được form hỗ trợ.');
      const financial = decoded.method==='MOMO' ? await financialMediaService.uploadMomo(uri) : null;
      if(financial && financial.accountNumber && decoded.accountNumber && normalizeMomoPhone(financial.accountNumber)!==normalizeMomoPhone(decoded.accountNumber))throw new Error('QR đã thay đổi.');
      setFinancialQrMediaId(financial?.financialQrMediaId||'');setQrRemoved(false);
      setSelectedBank(bank);
      if (decoded.accountNumber) setAccountNumber(decoded.accountNumber);
      if (decoded.accountName) setHolder(normalizeAccountHolder(decoded.accountName));
      setQrLocalUri(uri);
      if (!decoded.accountName || !decoded.accountNumber) setFeedback({title:'Đã đọc QR',message:decoded.method==='MOMO'&&!decoded.accountNumber?'Đã đọc QR MoMo đa năng. Mã nhận tiền trong QR không phải số điện thoại; hãy nhập số MoMo và tên người nhận để Admin đối chiếu.':'QR không chứa tên chủ tài khoản. Vui lòng nhập và admin sẽ đối chiếu trước khi chuyển.'});
    } catch (error) { const qrError=getApiError(error); setFeedback(qrError.code==='FINANCIAL_QR_UNAVAILABLE'?{title:'Chưa thể lưu QR riêng tư',message:'Ảnh QR đã được đọc nhưng máy chủ chưa thể lưu riêng tư. Vui lòng thử lại; thông tin đang nhập được giữ lại.',error:true}:{title:'Không đọc được QR',message:'Không đọc được thông tin từ mã QR. Bạn có thể thử ảnh khác hoặc nhập thủ công.',error:true}); }
    finally { setScanningQr(false); }
  };

  const submit = async () => {
    if (!valid || !selectedBank || pending || scanningQr || submitLock.current) return;
    submitLock.current = true;
    try {
      await otpFlow.send();
    } catch (error) {
      const value=getApiError(error);setFeedback({title:'Không thể gửi OTP',message:getBankAccountErrorMessage(value.code,value.message),error:true});
    } finally {
      submitLock.current = false;
    }
  };
  const confirmOtp=async(otp:string)=>{try{await otpFlow.confirm(otp);otpFlow.reset();setFeedback({title:'Email đã được xác minh',message:'Tài khoản đang chờ Admin duyệt.',navigate:true});}catch(error){const value=getApiError(error);setFeedback({title:'Không thể xác nhận',message:getBankAccountErrorMessage(value.code,value.message),error:true});throw error;}};

  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <View style={styles.header}><TouchableOpacity style={styles.back} onPress={() => router.back()} disabled={pending} accessibilityLabel="Quay lại"><ArrowLeft size={23} color={BrandColors.textDark}/></TouchableOpacity><Text style={styles.title}>{editing ? 'Cập nhật tài khoản' : 'Thêm tài khoản'}</Text><View style={styles.back}/></View>
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={8}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.xl }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.modeTabs}><TouchableOpacity style={[styles.modeTab,entryMode==='MANUAL'&&styles.modeTabActive]} onPress={()=>{setEntryMode('MANUAL');setQrLocalUri('');}}><Text style={[styles.modeText,entryMode==='MANUAL'&&styles.modeTextActive]}>Nhập tài khoản</Text></TouchableOpacity><TouchableOpacity style={[styles.modeTab,entryMode==='SCAN'&&styles.modeTabActive]} onPress={()=>setEntryMode('SCAN')}><Text style={[styles.modeText,entryMode==='SCAN'&&styles.modeTextActive]}>Đọc ảnh QR</Text></TouchableOpacity></View>
        {entryMode==='SCAN'||isMomo?<View style={styles.field}><Text style={styles.label}>{isMomo?'QR nhận tiền MoMo (lưu riêng tư)':'Đọc ảnh QR ngân hàng (không lưu trên máy chủ)'}</Text><TouchableOpacity accessibilityLabel={isMomo?"QR MoMo riêng tư":"Đọc QR ngân hàng"} style={styles.qrPicker} onPress={pickQr} disabled={scanningQr||pending}>{scanningQr?<><ActivityIndicator color={BrandColors.accentRose}/><Text style={styles.qrText}>Đang đọc mã QR...</Text></>:(isMomo?privateQrImage:qrLocalUri)?<Image source={{uri:isMomo?privateQrImage:qrLocalUri}} style={styles.qrImage}/>:<><ImagePlus size={28} color={BrandColors.accentRose}/><Text style={styles.qrText}>Chọn ảnh QR ngân hàng hoặc MoMo</Text></>}</TouchableOpacity><Text style={styles.helper}>{isMomo?'QR MoMo được lưu riêng tư để Admin chuyển tiền. Bạn có thể nhập thủ công nếu không tải QR. Kiểm tra đúng người nhận trước khi xác nhận.':'Ảnh ngân hàng chỉ dùng để điền thông tin, không lưu trong Storage. Hãy kiểm tra ngân hàng, số tài khoản và tên người nhận.'}</Text></View>:null}
        <View style={styles.field}><Text style={styles.label}>Ngân hàng *</Text><TouchableOpacity style={[styles.bankSelect, selectedBank && styles.bankSelectActive]} onPress={() => setBankPickerVisible(true)} activeOpacity={0.8}><BankMark bank={selectedBank}/><View style={styles.bankSelectCopy}>{selectedBank ? <><Text style={styles.bankSelectedName}>{selectedBank.name}</Text><Text style={styles.bankSelectedFull} numberOfLines={1}>{selectedBank.fullName}</Text></> : <Text style={styles.placeholder}>Chọn ngân hàng</Text>}</View><ChevronDown size={20} color={BrandColors.textMuted}/></TouchableOpacity></View>
        <View style={styles.field}><Text style={styles.label}>{editing ? 'Nhập lại số tài khoản *' : 'Số tài khoản *'}</Text><TextInput style={styles.input} accessibilityLabel="Số tài khoản nhận tiền" value={accountNumber} onChangeText={value => setAccountNumber(value.replace(/\D/g, ''))} placeholder="Nhập số tài khoản" placeholderTextColor={BrandColors.textLight} keyboardType="number-pad" inputMode="numeric" maxLength={30} returnKeyType="next"/>{accountNumber.length > 0 && accountNumber.length < 5 ? <Text style={styles.validation}>Số tài khoản cần ít nhất 5 chữ số.</Text> : null}</View>
        <View style={styles.field}><Text style={styles.label}>Tên chủ tài khoản *</Text><TextInput style={styles.input} accessibilityLabel="Tên chủ tài khoản nhận tiền" value={holder} onChangeText={value => setHolder(normalizeAccountHolder(value))} autoCapitalize="characters" autoCorrect={false} maxLength={150}/><Text style={styles.helper}>Nhập tên không dấu, viết IN HOA và trùng khớp với thông tin tại ngân hàng.</Text></View>
        {isMomo&&financialQrMediaId?<TouchableOpacity onPress={()=>{setFinancialQrMediaId('');setQrLocalUri('');setQrRemoved(true);}} disabled={pending||scanningQr}><Text style={styles.helper}>Bỏ QR, nhận tiền thủ công</Text></TouchableOpacity>:null}
        {editing?<Text style={styles.warning}>Thay đổi thông tin nhận tiền sẽ khiến tài khoản phải được duyệt lại và không còn là mặc định.</Text>:<Text style={styles.helper}>Sau khi xác minh email, tài khoản vẫn cần Admin đối chiếu và duyệt.</Text>}
        <View style={styles.infoBox}><Landmark size={19} color={BrandColors.textSecondary}/><Text style={styles.infoText}>Hãy kiểm tra chính xác thông tin. Tiền thanh toán sẽ được chuyển tới tài khoản này sau khi hệ thống xác nhận.</Text></View>
        <TouchableOpacity style={[styles.submit, (!valid || pending || scanningQr) && styles.submitDisabled]} disabled={!valid || pending || scanningQr} onPress={submit} activeOpacity={0.85}>{pending ? <ActivityIndicator color="#FFF"/> : <Text style={styles.submitText}>Tiếp tục</Text>}</TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
    <AppBottomSheet visible={bankPickerVisible} title="Chọn ngân hàng" onClose={()=>setBankPickerVisible(false)}   contentStyle={{height:'75%'}}>
<View style={styles.sheetHandle}/>

<View style={styles.searchBox}><Search size={19} color={BrandColors.textMuted}/><TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Tìm kiếm ngân hàng..." placeholderTextColor={BrandColors.textLight} autoFocus autoCapitalize="none"/>{search ? <TouchableOpacity onPress={() => setSearch('')}><X size={18} color={BrandColors.textMuted}/></TouchableOpacity> : null}</View>

<FlatList data={filteredBanks} keyExtractor={bank => bank.code} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.bankList} ListEmptyComponent={<Text style={styles.empty}>Không tìm thấy ngân hàng phù hợp.</Text>} renderItem={({ item }) => <TouchableOpacity style={styles.bankRow} onPress={() => chooseBank(item)} activeOpacity={0.75}><BankMark bank={item}/><View style={styles.bankRowCopy}><Text style={styles.bankRowName}>{item.name}</Text><Text style={styles.bankRowFull} numberOfLines={1}>{item.fullName}</Text></View>{item.code === selectedBank?.code ? <Check size={21} color={BrandColors.accentPink}/> : null}</TouchableOpacity>}/>
</AppBottomSheet>
    <FeedbackDialog visible={Boolean(feedback)} title={feedback?.title||''} message={feedback?.message||''} error={feedback?.error} buttonLabel={feedback?.navigate?'Hoàn tất':'Đóng'} onClose={()=>{const navigate=feedback?.navigate;setFeedback(null);if(navigate)router.back();}}/>
    {otpFlow.session?<BankAccountOtpDialog info={otpFlow.session.info} loading={pending} onClose={otpFlow.reset} onConfirm={confirmOtp} onResend={otpFlow.send} onError={error=>{const value=getApiError(error);setFeedback({title:'Không thể xác nhận',message:getBankAccountErrorMessage(value.code,value.message),error:true});}}/>:null}
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

warning:{fontFamily:Typography.semiBold,fontSize:12,lineHeight:18,color:'#9A6700',backgroundColor:'#FFF4CE',padding:Spacing.md,borderRadius:Radius.base,marginTop:Spacing.sm}
});

export default function ProtectedBankAccountFormScreen() {
  const review = useReviewAuth(state => state.user?.isDemoAccount === true);
  return review ? <ReviewReadOnlyScreen/> : <BankAccountFormScreen/>;
}
