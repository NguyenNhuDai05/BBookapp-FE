import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, CheckSquare, Square, X } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';

export type AdminDialogMode = 'complete' | 'fail';

interface Props {
  visible: boolean;
  mode: AdminDialogMode;
  amount: string;
  bank: string;
  accountHolder: string;
  maskedAccountNumber: string;
  status: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (data: { reference: string; failureCode: string; failureMessage: string; confirmedFundsNotSent: boolean }) => void;
}

export function AdminConfirmDialog(props: Props) {
  const [reference,setReference]=React.useState('');
  const [failureCode,setFailureCode]=React.useState('');
  const [failureMessage,setFailureMessage]=React.useState('');
  const [confirmed,setConfirmed]=React.useState(false);
  const [validation,setValidation]=React.useState('');

  const reset=()=>{setReference('');setFailureCode('');setFailureMessage('');setConfirmed(false);setValidation('');};
  const close=()=>{if(!props.submitting)props.onClose();};
  const submit=()=>{
    if(props.mode==='complete'&&!reference.trim())return setValidation('Vui lòng nhập mã tham chiếu giao dịch.');
    if(props.mode==='fail'&&(!failureCode.trim()||!failureMessage.trim()))return setValidation('Vui lòng nhập đầy đủ mã lỗi và lý do thất bại.');
    if(props.mode==='fail'&&!confirmed)return setValidation('Bạn phải xác nhận tiền chưa được chuyển.');
    setValidation('');
    props.onSubmit({reference:reference.trim(),failureCode:failureCode.trim(),failureMessage:failureMessage.trim(),confirmedFundsNotSent:confirmed});
  };

  return <Modal visible={props.visible} transparent animationType="fade" onShow={reset} onRequestClose={close}>
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS==='ios'?'padding':undefined}>
      <View style={styles.card} accessibilityViewIsModal>
        <View style={styles.header}><Text style={styles.title}>{props.mode==='complete'?'Xác nhận đã chuyển khoản':'Đánh dấu payout thất bại'}</Text><TouchableOpacity onPress={close} disabled={props.submitting} accessibilityLabel="Đóng"><X size={22} color={BrandColors.textDark}/></TouchableOpacity></View>
        <ScrollView keyboardShouldPersistTaps="handled">
          {props.mode==='complete'?<View style={styles.warning}><AlertTriangle size={20} color="#9A3A12"/><Text style={styles.warningText}>Thao tác này không tự động chuyển tiền. Chỉ xác nhận sau khi tiền thực tế đã được chuyển cho MUA.</Text></View>:null}
          <View style={styles.summary}><Summary label="Số tiền" value={props.amount}/><Summary label="Ngân hàng" value={props.bank}/><Summary label="Chủ tài khoản" value={props.accountHolder}/><Summary label="Số tài khoản" value={props.maskedAccountNumber}/><Summary label="Trạng thái" value={props.status}/></View>
          {props.mode==='complete'?<Field label="Mã tham chiếu giao dịch" value={reference} onChangeText={setReference} placeholder="Nhập mã giao dịch"/>:<><Field label="Mã lỗi" value={failureCode} onChangeText={setFailureCode} placeholder="Ví dụ: BANK_REJECTED"/><Field label="Lý do thất bại" value={failureMessage} onChangeText={setFailureMessage} placeholder="Mô tả nguyên nhân" multiline/><TouchableOpacity style={styles.checkRow} onPress={()=>setConfirmed(x=>!x)} disabled={props.submitting}>{confirmed?<CheckSquare size={22} color={BrandColors.accentPink}/>:<Square size={22} color={BrandColors.textMuted}/>}<Text style={styles.checkText}>Tôi xác nhận tiền chưa được chuyển.</Text></TouchableOpacity></>}
          {validation?<Text style={styles.error}>{validation}</Text>:null}
          <View style={styles.actions}><TouchableOpacity style={styles.cancel} onPress={close} disabled={props.submitting}><Text style={styles.cancelText}>Quay lại</Text></TouchableOpacity><TouchableOpacity style={[styles.submit,props.mode==='fail'&&styles.fail]} onPress={submit} disabled={props.submitting}>{props.submitting?<ActivityIndicator color="#FFF"/>:<Text style={styles.submitText}>{props.mode==='complete'?'Xác nhận đã chuyển khoản':'Xác nhận thất bại'}</Text>}</TouchableOpacity></View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

function Summary({label,value}:{label:string;value:string}){return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>}
function Field({label,...props}:{label:string;value:string;onChangeText:(v:string)=>void;placeholder:string;multiline?:boolean}){return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} style={[styles.input,props.multiline&&styles.multiline]} editable placeholderTextColor={BrandColors.textLight}/></View>}

const styles=StyleSheet.create({overlay:{flex:1,backgroundColor:'rgba(20,14,18,.58)',alignItems:'center',justifyContent:'center',padding:Spacing.base},card:{width:'100%',maxWidth:520,maxHeight:'92%',backgroundColor:'#FFF',borderRadius:Radius.xl,padding:Spacing.lg},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:Spacing.md},title:{flex:1,fontFamily:Typography.bold,fontSize:19,color:BrandColors.textDark},warning:{flexDirection:'row',gap:10,backgroundColor:'#FFF4E8',padding:Spacing.md,borderRadius:Radius.md,marginBottom:Spacing.md},warningText:{flex:1,fontFamily:Typography.semiBold,fontSize:13,lineHeight:19,color:'#7A2E0E'},summary:{backgroundColor:'#F8F7F8',padding:Spacing.md,borderRadius:Radius.md,gap:8},summaryRow:{flexDirection:'row',justifyContent:'space-between',gap:Spacing.md},summaryLabel:{fontFamily:Typography.regular,color:BrandColors.textSecondary},summaryValue:{flex:1,fontFamily:Typography.bold,color:BrandColors.textDark,textAlign:'right'},field:{marginTop:Spacing.md},label:{fontFamily:Typography.semiBold,color:BrandColors.textDark,marginBottom:6},input:{minHeight:48,borderWidth:1,borderColor:BrandColors.borderSoft,borderRadius:Radius.md,paddingHorizontal:Spacing.md,color:BrandColors.textDark,fontFamily:Typography.regular},multiline:{minHeight:90,paddingTop:12,textAlignVertical:'top'},checkRow:{minHeight:48,flexDirection:'row',alignItems:'center',gap:10,marginTop:Spacing.md},checkText:{flex:1,fontFamily:Typography.semiBold,color:BrandColors.textDark},error:{fontFamily:Typography.semiBold,color:BrandColors.statusCancelled,marginTop:Spacing.sm},actions:{flexDirection:'row',gap:Spacing.sm,marginTop:Spacing.lg},cancel:{flex:1,minHeight:50,alignItems:'center',justifyContent:'center',borderRadius:Radius.full,backgroundColor:'#F2F0F1'},cancelText:{fontFamily:Typography.bold,color:BrandColors.textDark},submit:{flex:1.4,minHeight:50,alignItems:'center',justifyContent:'center',borderRadius:Radius.full,backgroundColor:BrandColors.statusConfirmed},fail:{backgroundColor:BrandColors.statusCancelled},submitText:{fontFamily:Typography.bold,color:'#FFF',textAlign:'center'}});
