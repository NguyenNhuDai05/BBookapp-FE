import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';
import { createSubmissionGuard } from '../../utils/submissionGuard';

interface Props {
  visible: boolean;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (password: string) => Promise<void> | void;
}

function PasswordPrompt({loading,onCancel,onSubmit}:Omit<Props,'visible'>){
  const [password,setPassword]=useState('');
  const guard=useRef(createSubmissionGuard()).current;
  const submit=async()=>{if(password.length<6||loading)return;await guard(()=>onSubmit(password));};
  return <View style={styles.overlay}><View style={styles.card}>
      <Text style={styles.title}>Đặt làm mặc định</Text>
      <Text style={styles.message}>Nhập mật khẩu để xác nhận thay đổi tài khoản nhận tiền mặc định.</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" placeholder="Mật khẩu hiện tại" style={styles.input} editable={!loading}/>
      <View style={styles.actions}><TouchableOpacity style={styles.cancel} onPress={onCancel} disabled={loading}><Text style={styles.cancelText}>Hủy</Text></TouchableOpacity><TouchableOpacity style={[styles.confirm,(password.length<6||loading)&&styles.disabled]} onPress={submit} disabled={password.length<6||loading}>{loading?<ActivityIndicator color="#FFF"/>:<Text style={styles.confirmText}>Xác nhận</Text>}</TouchableOpacity></View>
    </View></View>;
}

export function BankDefaultPasswordModal({visible,loading,onCancel,onSubmit}:Props){
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    {visible?<PasswordPrompt loading={loading} onCancel={onCancel} onSubmit={onSubmit}/>:null}
  </Modal>;
}

const styles=StyleSheet.create({overlay:{flex:1,backgroundColor:'rgba(48,23,38,.42)',alignItems:'center',justifyContent:'center',padding:Spacing.lg},card:{width:'100%',maxWidth:420,backgroundColor:'#FFF',borderRadius:Radius.lg,padding:Spacing.lg},title:{fontFamily:Typography.bold,fontSize:20,color:BrandColors.textDark},message:{fontFamily:Typography.regular,fontSize:13,lineHeight:19,color:BrandColors.textSecondary,marginTop:8},input:{height:54,borderWidth:1,borderColor:BrandColors.borderLight,borderRadius:Radius.base,paddingHorizontal:Spacing.md,fontFamily:Typography.regular,color:BrandColors.textDark,marginTop:Spacing.md},actions:{flexDirection:'row',gap:Spacing.sm,marginTop:Spacing.lg},cancel:{flex:1,height:48,alignItems:'center',justifyContent:'center',borderRadius:Radius.full,backgroundColor:BrandColors.bgPinkLight},confirm:{flex:1,height:48,alignItems:'center',justifyContent:'center',borderRadius:Radius.full,backgroundColor:BrandColors.accentRose},disabled:{opacity:.45},cancelText:{fontFamily:Typography.bold,color:BrandColors.textBody},confirmText:{fontFamily:Typography.bold,color:'#FFF'}});
