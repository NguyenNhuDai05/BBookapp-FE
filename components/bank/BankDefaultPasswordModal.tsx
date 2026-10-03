import React, { useState } from 'react';
import { StyleSheet, TextInput, Text, TouchableOpacity } from 'react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';
import { AppModal } from '../ui/AppModal';
import { bankAccountService } from '../../services/bankAccountService';
import { getApiError } from '../../services/api';
interface Props { accountId?:string; visible:boolean; loading:boolean; onCancel:()=>void; onSubmit:(password:string,otp?:string)=>Promise<void>|void }
export function BankDefaultPasswordModal({accountId,visible,loading,onCancel,onSubmit}:Props){
 const [password,setPassword]=useState(''),[otp,setOtp]=useState(''),[email,setEmail]=useState(''),[error,setError]=useState(''),[sending,setSending]=useState(false);
 const send=async()=>{if(!accountId||sending)return;setSending(true);setError('');try{const result=await bankAccountService.requestDefaultOtp(accountId);setEmail(result.maskedEmail);setOtp('');}catch(e){setError(getApiError(e).message);}finally{setSending(false);}};
 return <AppModal visible={visible} variant="confirm" title="Đặt làm mặc định" description={email?'Nhập OTP đã gửi tới '+email:'Nhập mật khẩu hiện tại. Nếu tài khoản chưa có mật khẩu, xác nhận bằng OTP email.'} onClose={onCancel} loading={loading||sending} onShow={()=>{setPassword('');setOtp('');setEmail('');setError('');}} primaryAction={{label:'Xác nhận',disabled:email?!/^\d{6}$/.test(otp):password.length<6,loading,onPress:()=>onSubmit(email?'':password,email?otp:undefined)}} secondaryAction={{label:'Hủy',onPress:onCancel}}>
 {email?<TextInput accessibilityLabel="OTP đặt mặc định" value={otp} onChangeText={x=>setOtp(x.replace(/\D/g,''))} keyboardType="number-pad" maxLength={6} style={styles.input}/>:<TextInput accessibilityLabel="Mật khẩu hiện tại" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="Mật khẩu hiện tại" style={styles.input} editable={!loading}/>}
 {accountId&&<TouchableOpacity disabled={sending||loading} onPress={send}><Text style={styles.link}>{email?'Gửi lại OTP':'Chưa có mật khẩu? Xác nhận bằng email'}</Text></TouchableOpacity>}{error?<Text accessibilityRole="alert" style={styles.error}>{error}</Text>:null}
 </AppModal>;
}
const styles=StyleSheet.create({input:{minHeight:54,borderWidth:1,borderColor:BrandColors.borderLight,borderRadius:Radius.base,paddingHorizontal:Spacing.md,fontFamily:Typography.regular,color:BrandColors.textDark,marginTop:Spacing.md},link:{color:BrandColors.accentRose,marginTop:Spacing.md},error:{color:BrandColors.statusCancelled,marginTop:Spacing.sm}});
