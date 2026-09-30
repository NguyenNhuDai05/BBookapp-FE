import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService } from "../../services/authService";
import { getApiError } from "../../services/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Email không hợp lệ.");
    if (sent && (!/^[0-9]{6}$/.test(otp) || password.length < 6 || password !== confirm))
      return setError(password !== confirm ? "Mật khẩu xác nhận không khớp." : "OTP phải gồm 6 số và mật khẩu tối thiểu 6 ký tự.");
    try {
      setLoading(true);
      if (!sent) {
        await authService.requestPasswordReset(email.trim());
        setSent(true);
        Alert.alert("Kiểm tra email", "Nếu email tồn tại, BBook đã gửi một mã OTP có hiệu lực trong 5 phút.");
      } else {
        await authService.resetPassword(email.trim(), otp, password);
        Alert.alert("Thành công", "Mật khẩu đã được đặt lại.", [{ text: "Đăng nhập", onPress: () => router.replace({ pathname: "/(auth)/login", params: { email: email.trim() } } as any) }]);
      }
    } catch (e) { setError(getApiError(e).message); }
    finally { setLoading(false); }
  };

  return <SafeAreaView style={s.safe}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.page}>
    <View style={s.card}><Text style={s.title}>Quên mật khẩu</Text><Text style={s.hint}>{sent ? "Nhập mã OTP trong email và mật khẩu mới." : "Nhập email đã đăng ký để nhận mã OTP."}</Text>
      {error ? <Text style={s.error}>{error}</Text> : null}
      <Field label="Email" value={email} onChangeText={setEmail} editable={!sent} keyboardType="email-address" />
      {sent ? <><Field label="Mã OTP" value={otp} onChangeText={(v: string) => setOtp(v.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" />
        <Field label="Mật khẩu mới" value={password} onChangeText={setPassword} secureTextEntry />
        <Field label="Xác nhận mật khẩu" value={confirm} onChangeText={setConfirm} secureTextEntry /></> : null}
      <TouchableOpacity style={s.button} disabled={loading} onPress={submit}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>{sent ? "Đặt lại mật khẩu" : "Gửi mã OTP"}</Text>}</TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>Quay lại đăng nhập</Text></TouchableOpacity>
    </View></KeyboardAvoidingView></SafeAreaView>;
}

function Field(props: any) { return <View style={s.field}><Text style={s.label}>{props.label}</Text><TextInput {...props} autoCapitalize="none" placeholderTextColor="#B98B99" style={s.input} /></View>; }
const s = StyleSheet.create({ safe:{flex:1,backgroundColor:"#FDE7EC"},page:{flex:1,justifyContent:"center",padding:22},card:{backgroundColor:"#fff",borderRadius:26,padding:22},title:{fontSize:27,fontWeight:"900",color:"#301726"},hint:{color:"#80606C",marginTop:7,marginBottom:18,lineHeight:20},error:{color:"#C93453",backgroundColor:"#FFF1F4",padding:10,borderRadius:12,marginBottom:12},field:{marginBottom:14},label:{fontSize:12,fontWeight:"800",color:"#6E3549",marginBottom:6},input:{height:52,borderWidth:1,borderColor:"#F0C6D0",borderRadius:16,paddingHorizontal:14,color:"#301726"},button:{height:54,borderRadius:17,backgroundColor:"#F55389",alignItems:"center",justifyContent:"center",marginTop:4},buttonText:{color:"#fff",fontWeight:"900"},back:{textAlign:"center",color:"#D33E72",fontWeight:"800",marginTop:18} });
