import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ReviewNotice } from './ReviewNotice';

export function ReviewReadOnlyScreen({ message }: { message?: string }) {
  const router = useRouter();
  return <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF7FA', padding: 20 }}><TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#D33E72', padding: 12 }}>‹ Quay lại</Text></TouchableOpacity><ReviewNotice message={message} /></SafeAreaView>;
}
