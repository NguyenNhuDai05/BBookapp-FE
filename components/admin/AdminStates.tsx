import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, Inbox, ShieldX } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';

export function AdminLoadingState({ message = 'Đang tải dữ liệu...' }: { message?: string }) {
  return <View style={styles.state}><ActivityIndicator size="large" color={BrandColors.accentPink}/><Text style={styles.message}>{message}</Text></View>;
}

export function AdminEmptyState({ title, message }: { title: string; message: string }) {
  return <View style={styles.state}><Inbox size={44} color={BrandColors.textMuted}/><Text style={styles.title}>{title}</Text><Text style={styles.message}>{message}</Text></View>;
}

export function AdminErrorState({ title = 'Không thể tải dữ liệu', message, onRetry, retrying }: { title?: string; message: string; onRetry?: () => void; retrying?: boolean }) {
  return <View style={styles.state}><AlertTriangle size={44} color={BrandColors.statusCancelled}/><Text style={styles.title}>{title}</Text><Text style={styles.message}>{message}</Text>{onRetry ? <TouchableOpacity style={styles.button} onPress={onRetry} disabled={retrying}>{retrying ? <ActivityIndicator color="#FFF"/> : <Text style={styles.buttonText}>Thử lại</Text>}</TouchableOpacity> : null}</View>;
}

export function AdminAccessDenied() {
  return <View style={styles.state}><ShieldX size={48} color={BrandColors.statusCancelled}/><Text style={styles.title}>Bạn không có quyền truy cập</Text><Text style={styles.message}>Tài khoản hiện tại không được phép thực hiện thao tác này.</Text></View>;
}

const styles = StyleSheet.create({
  state:{flex:1,minHeight:280,alignItems:'center',justifyContent:'center',padding:Spacing.lg,backgroundColor:BrandColors.bgPrimary},
  title:{fontFamily:Typography.bold,fontSize:18,color:BrandColors.textDark,textAlign:'center',marginTop:Spacing.md},
  message:{fontFamily:Typography.regular,fontSize:14,lineHeight:20,color:BrandColors.textSecondary,textAlign:'center',marginTop:Spacing.sm},
  button:{minWidth:120,minHeight:46,alignItems:'center',justifyContent:'center',marginTop:Spacing.lg,paddingHorizontal:Spacing.lg,borderRadius:Radius.full,backgroundColor:BrandColors.accentPink},
  buttonText:{fontFamily:Typography.bold,color:'#FFF'},
});
