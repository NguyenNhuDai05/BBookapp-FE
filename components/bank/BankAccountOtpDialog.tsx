import React,{useEffect,useState} from 'react';
import {StyleSheet,Text,TextInput,TouchableOpacity} from 'react-native';
import {AppModal} from '../ui/AppModal';
import {BrandColors,Radius,Spacing,Typography} from '../../constants/theme';
import type {BankAccountOtpResponse} from '../../types/bankAccount';

export function BankAccountOtpDialog({info,loading,onClose,onConfirm,onResend,onError}:{info:BankAccountOtpResponse;loading:boolean;onClose:()=>void;onConfirm:(otp:string)=>Promise<unknown>;onResend:()=>Promise<BankAccountOtpResponse>;onError:(error:unknown)=>void}){
  const[otp,setOtp]=useState('');const[remaining,setRemaining]=useState(info.resendAfterSeconds);
  useEffect(()=>{if(!remaining)return;const timer=setInterval(()=>setRemaining(value=>Math.max(0,value-1)),1000);return()=>clearInterval(timer);},[remaining]);
  return <AppModal visible title="Xác minh email" description={`Mã OTP 6 số đã được gửi đến ${info.maskedEmail}. Mã xác minh thao tác thay đổi nơi nhận tiền; Admin vẫn sẽ đối chiếu thông tin ngân hàng.`} onClose={onClose} dismissOnBackdrop={false} loading={loading} onActionError={onError} primaryAction={{label:'Xác nhận',disabled:!/^[0-9]{6}$/.test(otp),onPress:()=>onConfirm(otp)}} secondaryAction={{label:'Đóng',onPress:onClose}}>
    <TextInput testID="bank-otp-input" style={styles.input} value={otp} onChangeText={value=>setOtp(value.replace(/\D/g,'').slice(0,6))} keyboardType="number-pad" inputMode="numeric" maxLength={6} placeholder="Nhập 6 chữ số" textAlign="center"/>
    <TouchableOpacity disabled={remaining>0||loading} onPress={()=>void onResend().then(value=>{setOtp('');setRemaining(value.resendAfterSeconds);}).catch(onError)}><Text style={[styles.resend,(remaining>0||loading)&&styles.disabled]}>{remaining>0?`Gửi lại sau ${remaining}s`:'Gửi lại mã OTP'}</Text></TouchableOpacity>
  </AppModal>;
}
const styles=StyleSheet.create({input:{minHeight:58,borderWidth:1,borderColor:BrandColors.borderPink,borderRadius:Radius.base,marginTop:Spacing.lg,paddingHorizontal:Spacing.md,fontFamily:Typography.extraBold,fontSize:24,letterSpacing:8,color:BrandColors.textDark},resend:{fontFamily:Typography.semiBold,color:BrandColors.accentRose,textAlign:'center',marginTop:Spacing.md},disabled:{color:BrandColors.textMuted}});
