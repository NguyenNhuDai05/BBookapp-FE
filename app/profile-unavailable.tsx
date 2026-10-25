import React from 'react';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
export default function ProfileUnavailable() {
  const router = useRouter();
  return <View style={{ flex: 1, justifyContent: 'center', padding: 28, gap: 20, backgroundColor: '#FFF6F9' }}><Text style={{ fontSize: 23, fontWeight: '700' }}>Liên kết hồ sơ không hợp lệ</Text><Text>Vui lòng mở lại liên kết hồ sơ từ BBook.</Text><TouchableOpacity accessibilityRole="button" onPress={() => router.replace('/(tabs)/home')} style={{ padding: 16, backgroundColor: '#FBE2EC', borderRadius: 14 }}><Text>Về BBook</Text></TouchableOpacity></View>;
}
