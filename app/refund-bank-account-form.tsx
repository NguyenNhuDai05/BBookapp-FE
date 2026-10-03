import { financialMediaService } from '../services/financialMediaService';
import { normalizeMomoPhone, isMomoPhone } from '../utils/momoPhone';
import { AppBottomSheet } from '../components/ui/AppBottomSheet';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {ArrowLeft, Check, ChevronDown, ImagePlus, Landmark, Search} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { BrandColors, Radius, Shadows, Spacing, Typography } from '../constants/theme';
import { BankOption, normalizeAccountHolder, normalizeBankSearch, VIETNAM_BANKS } from '../constants/banks';
import { refundService } from '../services/refundService';
import { getApiError } from '../services/api';
import { uploadBankQr } from '../services/supabase';
import { FeedbackDialog } from '../components/common/FeedbackDialog';
import { BankAccountOtpDialog } from '../components/bank/BankAccountOtpDialog';
import { useBankAccountOtpFlow } from '../hooks/useBankAccountOtpFlow';
import { getBankAccountErrorMessage } from '../utils/bankAccountStatus';

export default function RefundBankAccountFormScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets(); const queryClient = useQueryClient(); const submitLock = useRef(false);
  const { refundId, bookingId, id, bankBin, bankName, holder:initialHolder, method, financialQrMediaId:initialMediaId } = useLocalSearchParams<{ refundId?: string; bookingId?: string; id?:string; bankBin?:string; bankName?:string; holder?:string; method?:'BANK'|'MOMO';financialQrMediaId?:string }>();
  const editing=Boolean(id);
  const initialBank=VIETNAM_BANKS.find(bank=>bank.bin===bankBin||bank.code===bankBin)??(bankBin?{name:bankName||bankBin,fullName:bankName||'',code:method==='MOMO'?'MOMO':bankBin,bin:bankBin,color:BrandColors.accentRose}:undefined);
  const [selectedBank, setSelectedBank] = useState<BankOption|undefined>(initialBank); const [accountNumber, setAccountNumber] = useState(''); const [holder, setHolder] = useState(normalizeAccountHolder(initialHolder||'')); const [pickerVisible, setPickerVisible] = useState(false); const [search, setSearch] = useState('');
const [financialQrMediaId,setFinancialQrMediaId]=useState(initialMediaId||''); const [qrRemoved,setQrRemoved]=useState(false);
const [qrLocalUri,setQrLocalUri]=useState(''); const [scanningQr,setScanningQr]=useState(false); const [entryMode,setEntryMode]=useState<'MANUAL'|'SCAN'>('MANUAL'); const isMomo=selectedBank?.code==='MOMO';
  const [feedback,setFeedback]=useState<{title:string;message:string;error?:boolean;navigate?:'back'|'booking'}|null>(null);
  const valid = Boolean(selectedBank) && (isMomo?isMomoPhone(accountNumber):/^\d{5,30}$/.test(accountNumber)) && /^[A-Z]+(?: [A-Z]+)*$/.test(holder.trim()) && holder.trim().length >= 2;
  const filtered = useMemo(() => { const keyword = normalizeBankSearch(search.trim()); return keyword ? VIETNAM_BANKS.filter(bank => normalizeBankSearch(`${bank.name} ${bank.fullName} ${bank.code}`).includes(keyword)) : VIETNAM_BANKS; }, [search]);
  const draft=useMemo(()=>valid&&selectedBank?{bankCode:selectedBank.code,bankBin:selectedBank.bin,bankName:selectedBank.name,accountNumber:isMomo?normalizeMomoPhone(accountNumber):accountNumber,accountHolderName:holder.trim(),method:(isMomo?'MOMO':'BANK') as 'MOMO'|'BANK',financialQrAction:(qrRemoved?'REMOVE':financialQrMediaId&&financialQrMediaId!==initialMediaId?'REPLACE':'UNCHANGED') as 'UNCHANGED'|'REPLACE'|'REMOVE',...(isMomo&&financialQrMediaId?{financialQrMediaId}:{})}:undefined,[valid,selectedBank,accountNumber,holder,isMomo,financialQrMediaId,qrRemoved,initialMediaId]);
  const otpFlow=useBankAccountOtpFlow(id,draft);const savePending=otpFlow.isSending||otpFlow.isConfirming;
  const submit = async() => { if (!valid || savePending || submitLock.current) return;submitLock.current=true;try{await otpFlow.send();}catch(error){const value=getApiError(error);setFeedback({title:'Không thể gửi OTP',message:getBankAccountErrorMessage(value.code,value.message),error:true});}finally{submitLock.current=false;} };
  const confirmOtp=async(otp:string)=>{try{const bank=await otpFlow.confirm(otp);otpFlow.reset();if(refundId&&!editing&&bank.isUsable){await refundService.setDestination(refundId,bank.id);void queryClient.invalidateQueries({queryKey:['bookingDetail',bookingId]});void queryClient.invalidateQueries({queryKey:['userBookings']});setFeedback({title:'Đã chọn tài khoản',message:'Khoản hoàn đã được đưa vào hàng đợi xử lý.',navigate:'booking'});}else setFeedback({title:'Email đã được xác minh',message:'Tài khoản đang chờ Admin duyệt.',navigate:'back'});}catch(error){const value=getApiError(error);setFeedback({title:'Không thể xác nhận',message:getBankAccountErrorMessage(value.code,value.message),error:true});throw error;}};
  const choose = (bank: BankOption) => { setSelectedBank(bank); setSearch(''); setPickerVisible(false); };
  const pickQr=async()=>{const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();if(!permission.granted){setFeedback({title:'Cần quyền truy cập ảnh',message:'Hãy cho phép ứng dụng chọn ảnh QR từ thư viện.',error:true});return;}const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:1});if(result.canceled)return;const uri=result.assets[0].uri;setScanningQr(true);try{const decoded=await uploadBankQr(uri);const bank=decoded.method==='MOMO'?VIETNAM_BANKS.find(x=>x.code==='MOMO'):VIETNAM_BANKS.find(x=>x.bin===decoded.bankBin);if (!bank) { setFeedback({title:'QR đã đọc được',message:'Mã định tuyến của QR chưa được BBook hỗ trợ. Hãy chọn đúng ngân hàng và nhập thông tin thủ công; không tự đổi số tài khoản.',error:true}); return; }if(decoded.accountNumber&&!/^\d+$/.test(decoded.accountNumber))throw new Error('Định dạng tài khoản trong QR chưa được form hỗ trợ.');const uploaded=decoded.method==='MOMO'?await financialMediaService.uploadMomo(uri):null;setFinancialQrMediaId(uploaded?.financialQrMediaId||'');setQrRemoved(false);setSelectedBank(bank);if(decoded.accountNumber)setAccountNumber(decoded.accountNumber);if(decoded.accountName)setHolder(normalizeAccountHolder(decoded.accountName));setQrLocalUri(uri);if(!decoded.accountName||!decoded.accountNumber)setFeedback({title:'Đã đọc QR',message:decoded.method==='MOMO'&&!decoded.accountNumber?'Đã đọc QR MoMo đa năng. Mã nhận tiền trong QR không phải số điện thoại; hãy nhập số MoMo và tên người nhận để Admin đối chiếu.':'QR không chứa tên chủ tài khoản. Vui lòng nhập và admin sẽ đối chiếu trước khi chuyển.'});}catch(error){const qrError=getApiError(error); setFeedback(qrError.code==='FINANCIAL_QR_UNAVAILABLE'?{title:'Chưa thể lưu QR riêng tư',message:'Ảnh QR đã được đọc nhưng máy chủ chưa thể lưu riêng tư. Vui lòng thử lại; thông tin đang nhập được giữ lại.',error:true}:{title:'Không đọc được QR',message:'Không đọc được thông tin từ mã QR. Bạn có thể thử ảnh khác hoặc nhập thủ công.',error:true});}finally{setScanningQr(false);}};

  return <SafeAreaView style={styles.safe} edges={['top','left','right']}><View style={styles.header}><TouchableOpacity style={styles.back} onPress={() => router.back()} disabled={savePending}><ArrowLeft size={23} color={BrandColors.textDark}/></TouchableOpacity><Text style={styles.title}>{editing?'Cập nhật tài khoản':'Thêm tài khoản nhận tiền'}</Text><View style={styles.back}/></View><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}><ScrollView contentContainerStyle={[styles.content,{paddingBottom:Math.max(insets.bottom,Spacing.lg)+Spacing.xl}]} keyboardShouldPersistTaps="handled">
    <View style={modeStyles.modeTabs}><TouchableOpacity style={[modeStyles.modeTab,entryMode==='MANUAL'&&modeStyles.modeTabActive]} onPress={()=>{setEntryMode('MANUAL');setQrLocalUri('');}}><Text style={[modeStyles.modeText,entryMode==='MANUAL'&&modeStyles.modeTextActive]}>Nhập tài khoản</Text></TouchableOpacity><TouchableOpacity style={[modeStyles.modeTab,entryMode==='SCAN'&&modeStyles.modeTabActive]} onPress={()=>setEntryMode('SCAN')}><Text style={[modeStyles.modeText,entryMode==='SCAN'&&modeStyles.modeTextActive]}>Đọc ảnh QR</Text></TouchableOpacity></View>
    {entryMode==='SCAN'?<View style={styles.field}><Text style={styles.label}>Đọc ảnh QR tài khoản nhận tiền</Text><TouchableOpacity style={styles.qrPicker} onPress={pickQr} disabled={scanningQr}>{scanningQr?<><ActivityIndicator color={BrandColors.accentRose}/><Text style={styles.qrText}>Đang đọc mã QR...</Text></>:qrLocalUri?<Image source={{uri:qrLocalUri}} style={styles.qrImage}/>:<><ImagePlus size={28} color={BrandColors.accentRose}/><Text style={styles.qrText}>Chọn ảnh QR ngân hàng hoặc MoMo</Text></>}</TouchableOpacity><Text style={styles.helper}>Ảnh ngân hàng chỉ được đọc, không lưu. QR MoMo được lưu riêng tư để Admin đối chiếu; hãy kiểm tra thông tin người nhận.</Text></View>:null}
    <View style={styles.field}><Text style={styles.label}>Ngân hàng *</Text><TouchableOpacity style={[styles.bankSelect,selectedBank&&styles.bankSelectActive]} onPress={() => setPickerVisible(true)}><BankMark bank={selectedBank}/><View style={{flex:1}}>{selectedBank?<><Text style={styles.bankName}>{selectedBank.name}</Text><Text style={styles.bankFull}>{selectedBank.fullName}</Text></>:<Text style={styles.placeholder}>Chọn ngân hàng</Text>}</View><ChevronDown size={20} color={BrandColors.textMuted}/></TouchableOpacity></View>
    <View style={styles.field}><Text style={styles.label}>{editing?'Nhập lại số tài khoản *':'Số tài khoản *'}</Text><TextInput style={styles.input} accessibilityLabel="Số tài khoản nhận tiền" value={accountNumber} onChangeText={value => setAccountNumber(value.replace(/\D/g,''))} placeholder="Nhập số tài khoản" keyboardType="number-pad" inputMode="numeric" maxLength={30}/>{accountNumber.length>0&&accountNumber.length<5?<Text style={styles.validation}>Số tài khoản cần ít nhất 5 chữ số.</Text>:null}</View>
    <View style={styles.field}><Text style={styles.label}>Tên chủ tài khoản *</Text><TextInput style={styles.input} accessibilityLabel="Tên chủ tài khoản nhận tiền" value={holder} onChangeText={value => setHolder(normalizeAccountHolder(value))} autoCapitalize="characters" autoCorrect={false} maxLength={150}/><Text style={styles.helper}>Tên không dấu, viết IN HOA và trùng khớp thông tin tại ngân hàng.</Text></View>
    {isMomo&&financialQrMediaId?<TouchableOpacity onPress={()=>{setFinancialQrMediaId('');setQrRemoved(true);setQrLocalUri('');}}><Text style={styles.helper}>Bỏ QR, nhận tiền thủ công</Text></TouchableOpacity>:null}
    <Text style={editing?styles.warning:styles.helper}>{editing?'Thay đổi thông tin nhận tiền sẽ khiến tài khoản phải được duyệt lại và không còn là mặc định.':'Sau khi xác minh email, tài khoản vẫn cần Admin đối chiếu và duyệt.'}</Text>
    <View style={styles.info}><Landmark size={19} color={BrandColors.textSecondary}/><Text style={styles.infoText}>Mã BIN được hệ thống tự xác định từ ngân hàng bạn chọn. Bạn chỉ cần kiểm tra tên ngân hàng, số tài khoản và tên chủ tài khoản.</Text></View>
    <TouchableOpacity style={[styles.submit,(!valid||savePending)&&styles.disabled]} disabled={!valid||savePending} onPress={submit}>{savePending?<ActivityIndicator color="#FFF"/>:<Text style={styles.submitText}>Tiếp tục</Text>}</TouchableOpacity>
  </ScrollView></KeyboardAvoidingView>
  <AppBottomSheet visible={pickerVisible} title="Chọn ngân hàng" onClose={()=>setPickerVisible(false)}   contentStyle={{height:'75%'}}><View style={styles.handle}/>
<View style={styles.search}><Search size={19} color={BrandColors.textMuted}/><TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Tìm kiếm ngân hàng..." autoFocus/></View>
<FlatList data={filtered} keyExtractor={bank => bank.bin} keyboardShouldPersistTaps="handled" renderItem={({item}) => <TouchableOpacity style={styles.bankRow} onPress={() => choose(item)}><BankMark bank={item}/><View style={{flex:1}}><Text style={styles.bankName}>{item.name}</Text><Text style={styles.bankFull}>{item.fullName}</Text></View>{item.bin===selectedBank?.bin?<Check size={21} color={BrandColors.accentPink}/>:null}</TouchableOpacity>}/></AppBottomSheet>
  <FeedbackDialog visible={Boolean(feedback)} title={feedback?.title||''} message={feedback?.message||''} error={feedback?.error} buttonLabel={feedback?.navigate?'Hoàn tất':'Đóng'} onClose={()=>{const navigate=feedback?.navigate;setFeedback(null);if(navigate==='booking')router.replace(`/booking/${bookingId}/cancel-success` as never);else if(navigate==='back')router.back();}}/>
  {otpFlow.session?<BankAccountOtpDialog info={otpFlow.session.info} loading={otpFlow.isConfirming||otpFlow.isSending} onClose={otpFlow.reset} onConfirm={confirmOtp} onResend={otpFlow.send} onError={error=>{const value=getApiError(error);setFeedback({title:'Không thể xác nhận',message:getBankAccountErrorMessage(value.code,value.message),error:true});}}/>:null}
  </SafeAreaView>;
}

function BankMark({bank}:{bank?:BankOption}){return <View style={[styles.mark,bank?{backgroundColor:bank.color}:undefined]}>{bank?<Text style={styles.markText}>{bank.code.slice(0,3)}</Text>:<Landmark size={20} color={BrandColors.textMuted}/>}</View>}
const modeStyles=StyleSheet.create({modeTabs:{flexDirection:'row',backgroundColor:'#F1EDF0',borderRadius:Radius.full,padding:4,marginBottom:Spacing.lg},modeTab:{flex:1,minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:Radius.full},modeTabActive:{backgroundColor:'#FFF'},modeText:{fontFamily:Typography.semiBold,color:BrandColors.textSecondary},modeTextActive:{color:BrandColors.accentRose},generatedQr:{width:220,height:220,alignSelf:'center',resizeMode:'contain',backgroundColor:'#FFF',borderRadius:Radius.base}});
const styles=StyleSheet.create({
safe:{flex:1,backgroundColor:BrandColors.bgPrimary},
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
bankName:{fontFamily:Typography.bold,fontSize:15,color:BrandColors.textDark},
bankFull:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textSecondary,marginTop:3},
placeholder:{fontFamily:Typography.regular,fontSize:15,color:BrandColors.textMuted},
mark:{width:44,height:44,borderRadius:13,alignItems:'center',justifyContent:'center',backgroundColor:'#F4F1F3'},
markText:{fontFamily:Typography.extraBold,fontSize:11,color:'#FFF'},
validation:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.statusCancelled,marginTop:6},
helper:{fontFamily:Typography.regular,fontSize:12,lineHeight:17,color:BrandColors.textMuted,marginTop:7},
warning:{fontFamily:Typography.semiBold,fontSize:12,lineHeight:18,color:'#9A6700',backgroundColor:'#FFF4CE',padding:Spacing.md,borderRadius:Radius.base,marginTop:Spacing.sm},
info:{flexDirection:'row',alignItems:'flex-start',gap:10,backgroundColor:'#FFF8F5',borderRadius:Radius.base,padding:Spacing.md,marginTop:Spacing.md,borderWidth:1,borderColor:'#F6E8E2'},
infoText:{flex:1,fontFamily:Typography.regular,fontSize:12,lineHeight:18,color:BrandColors.textSecondary},
submit:{minHeight:56,alignItems:'center',justifyContent:'center',backgroundColor:BrandColors.accentRose,borderRadius:Radius.full,marginTop:Spacing.lg,...Shadows.soft},
disabled:{opacity:.45,shadowOpacity:0},
submitText:{fontFamily:Typography.bold,fontSize:16,color:'#FFF'},
handle:{width:42,height:4,borderRadius:2,backgroundColor:BrandColors.borderSoft,alignSelf:'center',marginTop:Spacing.sm},
search:{minHeight:50,flexDirection:'row',alignItems:'center',gap:9,backgroundColor:BrandColors.bgPinkLight,borderWidth:1,borderColor:BrandColors.borderLight,borderRadius:Radius.base,paddingHorizontal:Spacing.md,marginBottom:Spacing.sm},
searchInput:{flex:1,fontFamily:Typography.regular,fontSize:15,color:BrandColors.textDark},
bankRow:{minHeight:66,flexDirection:'row',alignItems:'center',gap:Spacing.md,borderBottomWidth:1,borderBottomColor:BrandColors.borderDivider}
});
