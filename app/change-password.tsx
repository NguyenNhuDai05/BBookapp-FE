import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppAlert as appDialog } from '../components/ui/dialogStore';
import { SafeAreaView } from "react-native-safe-area-context";
import { authService } from "../services/authService";
import { getApiError } from "../services/api";

export default function ChangePasswordScreen() {
  const router = useRouter(); const [current,setCurrent]=useState(""); const [next,setNext]=useState(""); const [confirm,setConfirm]=useState(""); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  const submit=async()=>{setError("");if(next.length<6)return setError("Mật khẩu mới phải có ít nhất 6 ký tự.");if(next!==confirm)return setError("Mật khẩu xác nhận không khớp.");if(current===next)return setError("Mật khẩu mới phải khác mật khẩu hiện tại.");try{setLoading(true);await authService.changePassword(current,next);appDialog.alert("Thành công","Đã đổi mật khẩu.",[{text:"OK",onPress:()=>router.back()}]);}catch(e){setError(getApiError(e).message);}finally{setLoading(false);}};
  return <SafeAreaView style={s.safe}><View style={s.page}><TouchableOpacity onPress={()=>router.back()}><Text style={s.back}>‹ Quay lại</Text></TouchableOpacity><Text style={s.title}>Đổi mật khẩu</Text><Text style={s.hint}>Nhập mật khẩu hiện tại để bảo vệ tài khoản.</Text>{error?<Text style={s.error}>{error}</Text>:null}<Field label="Mật khẩu hiện tại" value={current} onChangeText={setCurrent}/><Field label="Mật khẩu mới" value={next} onChangeText={setNext}/><Field label="Xác nhận mật khẩu mới" value={confirm} onChangeText={setConfirm}/><TouchableOpacity style={s.button} disabled={loading} onPress={submit}>{loading?<ActivityIndicator color="#fff"/>:<Text style={s.buttonText}>Đổi mật khẩu</Text>}</TouchableOpacity></View></SafeAreaView>;
}
function Field(props:any){return <View style={s.field}><Text style={s.label}>{props.label}</Text><TextInput {...props} secureTextEntry autoCapitalize="none" style={s.input}/></View>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:"#FFF9FA"},page:{padding:22},back:{color:"#D33E72",fontWeight:"800",marginBottom:24},title:{fontSize:27,fontWeight:"900",color:"#301726"},hint:{color:"#80606C",marginTop:7,marginBottom:22},error:{color:"#C93453",backgroundColor:"#FFF1F4",padding:10,borderRadius:12,marginBottom:14},field:{marginBottom:15},label:{fontSize:12,fontWeight:"800",color:"#6E3549",marginBottom:7},input:{height:54,borderWidth:1,borderColor:"#F0C6D0",backgroundColor:"#fff",borderRadius:16,paddingHorizontal:14},button:{height:54,borderRadius:17,backgroundColor:"#F55389",alignItems:"center",justifyContent:"center",marginTop:6},buttonText:{color:"#fff",fontWeight:"900"}});
