import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check, CheckSquare, ChevronDown, Landmark, Search, Square, X } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BrandColors, Radius, Shadows, Spacing, Typography } from '../../constants/theme';
import { useAddMuaBankAccount, useUpdateMuaBankAccount } from '../../hooks/useMuaPayouts';
import { getApiError } from '../../services/api';

type BankOption = { name: string; fullName: string; code: string; bin: string; color: string };

const BANKS: BankOption[] = [
  { name: 'MB Bank', fullName: 'Ngân hàng TMCP Quân Đội', code: 'MB', bin: '970422', color: '#1677D2' },
  { name: 'Vietcombank', fullName: 'Ngân hàng TMCP Ngoại thương Việt Nam', code: 'VCB', bin: '970436', color: '#0A8A62' },
  { name: 'Techcombank', fullName: 'Ngân hàng TMCP Kỹ thương Việt Nam', code: 'TCB', bin: '970407', color: '#D9272E' },
  { name: 'ACB', fullName: 'Ngân hàng TMCP Á Châu', code: 'ACB', bin: '970416', color: '#1769AA' },
  { name: 'VPBank', fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', code: 'VPB', bin: '970432', color: '#15864B' },
  { name: 'BIDV', fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', code: 'BIDV', bin: '970418', color: '#006B85' },
  { name: 'VietinBank', fullName: 'Ngân hàng TMCP Công thương Việt Nam', code: 'ICB', bin: '970415', color: '#0B78A7' },
  { name: 'Agribank', fullName: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn', code: 'VBA', bin: '970405', color: '#A3233A' },
  { name: 'Sacombank', fullName: 'Ngân hàng TMCP Sài Gòn Thương Tín', code: 'STB', bin: '970403', color: '#1661A4' },
  { name: 'TPBank', fullName: 'Ngân hàng TMCP Tiên Phong', code: 'TPB', bin: '970423', color: '#6F2C91' },
  { name: 'VIB', fullName: 'Ngân hàng TMCP Quốc tế Việt Nam', code: 'VIB', bin: '970441', color: '#F28B22' },
  { name: 'SHB', fullName: 'Ngân hàng TMCP Sài Gòn - Hà Nội', code: 'SHB', bin: '970443', color: '#F58220' },
  { name: 'HDBank', fullName: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh', code: 'HDB', bin: '970437', color: '#D71920' },
  { name: 'OCB', fullName: 'Ngân hàng TMCP Phương Đông', code: 'OCB', bin: '970448', color: '#178548' },
];

const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const normalizeAccountHolder = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/gi, 'D')
  .toUpperCase()
  .replace(/[^A-Z ]/g, '')
  .replace(/\s+/g, ' ')
  .replace(/^\s/, '');

export default function BankAccountFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const submitLock = useRef(false);
  const params = useLocalSearchParams<{ id?: string; bankCode?: string; bankName?: string; holder?: string; isDefault?: string }>();
  const add = useAddMuaBankAccount();
  const update = useUpdateMuaBankAccount();
  const editing = Boolean(params.id);
  const pending = add.isPending || update.isPending;
  const initialBank = BANKS.find(bank => bank.code === params.bankCode)
    ?? (params.bankCode ? { name: params.bankName || params.bankCode, fullName: params.bankName || '', code: params.bankCode, bin: '', color: BrandColors.accentRose } : undefined);
  const [selectedBank, setSelectedBank] = useState<BankOption | undefined>(initialBank);
  const [accountNumber, setAccountNumber] = useState('');
  const [holder, setHolder] = useState(normalizeAccountHolder(params.holder || ''));
  const [isDefault, setDefault] = useState(params.isDefault ? params.isDefault === 'true' : true);
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const valid = Boolean(selectedBank) && /^\d{5,30}$/.test(accountNumber) && /^[A-Z]+(?: [A-Z]+)*$/.test(holder.trim()) && holder.trim().length >= 2;
  const filteredBanks = useMemo(() => {
    const keyword = normalizeSearch(search.trim());
    return keyword ? BANKS.filter(bank => normalizeSearch(`${bank.name} ${bank.fullName} ${bank.code} ${bank.bin}`).includes(keyword)) : BANKS;
  }, [search]);

  const chooseBank = (bank: BankOption) => {
    setSelectedBank(bank);
    setSearch('');
    setBankPickerVisible(false);
  };

  const submit = async () => {
    if (!valid || !selectedBank || pending || submitLock.current) return;
    submitLock.current = true;
    const request = { bankCode: selectedBank.code, bankName: selectedBank.name, accountNumber, accountHolderName: holder.trim().toUpperCase(), isDefault };
    try {
      if (params.id) await update.mutateAsync({ id: params.id, request });
      else await add.mutateAsync(request);
      router.back();
    } catch (error) {
      Alert.alert('Không thể lưu tài khoản', getApiError(error).message);
    } finally {
      submitLock.current = false;
    }
  };

  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <View style={styles.header}><TouchableOpacity style={styles.back} onPress={() => router.back()} disabled={pending} accessibilityLabel="Quay lại"><ArrowLeft size={23} color={BrandColors.textDark}/></TouchableOpacity><Text style={styles.title}>{editing ? 'Cập nhật tài khoản' : 'Thêm tài khoản'}</Text><View style={styles.back}/></View>
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={8}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.xl }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.field}><Text style={styles.label}>Ngân hàng *</Text><TouchableOpacity style={[styles.bankSelect, selectedBank && styles.bankSelectActive]} onPress={() => setBankPickerVisible(true)} activeOpacity={0.8}><BankMark bank={selectedBank}/><View style={styles.bankSelectCopy}>{selectedBank ? <><Text style={styles.bankSelectedName}>{selectedBank.name}</Text><Text style={styles.bankSelectedFull} numberOfLines={1}>{selectedBank.fullName}</Text></> : <Text style={styles.placeholder}>Chọn ngân hàng</Text>}</View><ChevronDown size={20} color={BrandColors.textMuted}/></TouchableOpacity></View>
        <View style={styles.field}><Text style={styles.label}>{editing ? 'Nhập lại số tài khoản *' : 'Số tài khoản *'}</Text><TextInput style={styles.input} value={accountNumber} onChangeText={value => setAccountNumber(value.replace(/\D/g, ''))} placeholder="Nhập số tài khoản" placeholderTextColor={BrandColors.textLight} keyboardType="number-pad" inputMode="numeric" maxLength={30} returnKeyType="next"/>{accountNumber.length > 0 && accountNumber.length < 5 ? <Text style={styles.validation}>Số tài khoản cần ít nhất 5 chữ số.</Text> : null}</View>
        <View style={styles.field}><Text style={styles.label}>Tên chủ tài khoản *</Text><TextInput style={styles.input} value={holder} onChangeText={value => setHolder(normalizeAccountHolder(value))} autoCapitalize="characters" autoCorrect={false} maxLength={150}/><Text style={styles.helper}>Nhập tên không dấu, viết IN HOA và trùng khớp với thông tin tại ngân hàng.</Text></View>
        <TouchableOpacity style={styles.checkRow} onPress={() => setDefault(value => !value)} activeOpacity={0.75}>{isDefault ? <CheckSquare size={23} color={BrandColors.accentPink}/> : <Square size={23} color={BrandColors.textMuted}/>}<Text style={styles.checkText}>Đặt làm tài khoản mặc định</Text></TouchableOpacity>
        <View style={styles.infoBox}><Landmark size={19} color={BrandColors.textSecondary}/><Text style={styles.infoText}>Hãy kiểm tra chính xác thông tin. Tiền thanh toán sẽ được chuyển tới tài khoản này sau khi hệ thống xác nhận.</Text></View>
        <TouchableOpacity style={[styles.submit, (!valid || pending) && styles.submitDisabled]} disabled={!valid || pending} onPress={submit} activeOpacity={0.85}>{pending ? <ActivityIndicator color="#FFF"/> : <Text style={styles.submitText}>Lưu tài khoản</Text>}</TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
    <Modal visible={bankPickerVisible} transparent animationType="slide" onRequestClose={() => setBankPickerVisible(false)}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setBankPickerVisible(false)}/>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <View style={styles.sheetHandle}/><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>Chọn ngân hàng</Text><TouchableOpacity style={styles.close} onPress={() => setBankPickerVisible(false)} accessibilityLabel="Đóng danh sách ngân hàng"><X size={21} color={BrandColors.textDark}/></TouchableOpacity></View>
          <View style={styles.searchBox}><Search size={19} color={BrandColors.textMuted}/><TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Tìm kiếm ngân hàng..." placeholderTextColor={BrandColors.textLight} autoFocus autoCapitalize="none"/>{search ? <TouchableOpacity onPress={() => setSearch('')}><X size={18} color={BrandColors.textMuted}/></TouchableOpacity> : null}</View>
          <FlatList data={filteredBanks} keyExtractor={bank => bank.code} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.bankList} ListEmptyComponent={<Text style={styles.empty}>Không tìm thấy ngân hàng phù hợp.</Text>} renderItem={({ item }) => <TouchableOpacity style={styles.bankRow} onPress={() => chooseBank(item)} activeOpacity={0.75}><BankMark bank={item}/><View style={styles.bankRowCopy}><Text style={styles.bankRowName}>{item.name}</Text><Text style={styles.bankRowFull} numberOfLines={1}>{item.fullName}</Text></View>{item.code === selectedBank?.code ? <Check size={21} color={BrandColors.accentPink}/> : null}</TouchableOpacity>}/>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </SafeAreaView>;
}

function BankMark({ bank }: { bank?: BankOption }) {
  return <View style={[styles.bankMark, bank ? { backgroundColor: bank.color } : undefined]}>{bank ? <Text style={styles.bankMarkText}>{bank.code.slice(0, 3)}</Text> : <Landmark size={20} color={BrandColors.textMuted}/>}</View>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:BrandColors.bgPrimary},keyboard:{flex:1},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:Spacing.md,paddingVertical:Spacing.sm},back:{width:44,height:44,alignItems:'center',justifyContent:'center'},title:{fontFamily:Typography.bold,fontSize:20,color:BrandColors.textDark},content:{paddingHorizontal:Spacing.base,paddingTop:Spacing.md},field:{marginBottom:Spacing.lg},label:{fontFamily:Typography.semiBold,fontSize:14,color:BrandColors.textDark,marginBottom:Spacing.sm},input:{minHeight:58,backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.borderLight,borderRadius:Radius.base,paddingHorizontal:Spacing.base,fontFamily:Typography.semiBold,fontSize:16,color:BrandColors.textDark},bankSelect:{minHeight:68,flexDirection:'row',alignItems:'center',gap:Spacing.md,backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.borderLight,borderRadius:Radius.base,paddingHorizontal:Spacing.md,...Shadows.sm},bankSelectActive:{borderColor:BrandColors.borderPink},bankSelectCopy:{flex:1},bankSelectedName:{fontFamily:Typography.bold,fontSize:15,color:BrandColors.textDark},bankSelectedFull:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textSecondary,marginTop:3},placeholder:{fontFamily:Typography.regular,fontSize:15,color:BrandColors.textMuted},bankMark:{width:44,height:44,borderRadius:13,alignItems:'center',justifyContent:'center',backgroundColor:'#F4F1F3'},bankMarkText:{fontFamily:Typography.extraBold,fontSize:11,color:'#FFF'},validation:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.statusCancelled,marginTop:6},helper:{fontFamily:Typography.regular,fontSize:12,lineHeight:17,color:BrandColors.textMuted,marginTop:7},checkRow:{minHeight:50,flexDirection:'row',alignItems:'center',gap:11,marginTop:-4},checkText:{fontFamily:Typography.semiBold,fontSize:14,color:BrandColors.textDark},infoBox:{flexDirection:'row',alignItems:'flex-start',gap:10,backgroundColor:'#FFF8F5',borderRadius:Radius.base,padding:Spacing.md,marginTop:Spacing.md,borderWidth:1,borderColor:'#F6E8E2'},infoText:{flex:1,fontFamily:Typography.regular,fontSize:12,lineHeight:18,color:BrandColors.textSecondary},submit:{minHeight:56,alignItems:'center',justifyContent:'center',backgroundColor:BrandColors.accentRose,borderRadius:Radius.full,marginTop:Spacing.lg,...Shadows.soft},submitDisabled:{opacity:.45,shadowOpacity:0},submitText:{fontFamily:Typography.bold,fontSize:16,color:'#FFF'},modalOverlay:{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(48,23,38,.38)'},sheet:{height:'78%',backgroundColor:'#FFF',borderTopLeftRadius:Radius.xl,borderTopRightRadius:Radius.xl,paddingHorizontal:Spacing.base},sheetHandle:{width:42,height:4,borderRadius:2,backgroundColor:BrandColors.borderSoft,alignSelf:'center',marginTop:Spacing.sm},sheetHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:Spacing.md},sheetTitle:{fontFamily:Typography.bold,fontSize:20,color:BrandColors.textDark},close:{width:40,height:40,alignItems:'center',justifyContent:'center',borderRadius:20,backgroundColor:'#F7F4F6'},searchBox:{minHeight:50,flexDirection:'row',alignItems:'center',gap:9,backgroundColor:BrandColors.bgPinkLight,borderWidth:1,borderColor:BrandColors.borderLight,borderRadius:Radius.base,paddingHorizontal:Spacing.md,marginBottom:Spacing.sm},searchInput:{flex:1,fontFamily:Typography.regular,fontSize:15,color:BrandColors.textDark,paddingVertical:0},bankList:{paddingBottom:Spacing.lg},bankRow:{minHeight:66,flexDirection:'row',alignItems:'center',gap:Spacing.md,borderBottomWidth:1,borderBottomColor:BrandColors.borderDivider},bankRowCopy:{flex:1},bankRowName:{fontFamily:Typography.bold,fontSize:15,color:BrandColors.textDark},bankRowFull:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textSecondary,marginTop:3},empty:{fontFamily:Typography.regular,color:BrandColors.textMuted,textAlign:'center',padding:Spacing.xl},
});
