import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { aiMakeupService } from '../../services/aiMakeupService';
import { BrandColors as C, Radius } from '../../constants/theme';

export function AiMakeupEntry() {
  const router = useRouter();
  const { data } = useQuery({ queryKey: ['ai-makeup-capabilities'], queryFn: ({ signal }) => aiMakeupService.capabilities(signal), retry: false, staleTime: 60000 });
  if (!data?.enabled) return null;
  return <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/ai-makeup')} style={styles.card}>
    <Sparkles color={C.accentRose} size={24} /><View style={{ flex: 1 }}><Text style={styles.title}>Khám phá makeup hợp với bạn</Text>
      <Text style={styles.body}>Tìm phong cách phù hợp với diện mạo và sở thích của bạn.</Text><Text style={styles.cta}>Khám phá ngay →</Text></View><ArrowRight color={C.accentRose} size={20} />
  </TouchableOpacity>;
}
const styles = StyleSheet.create({ card: { marginHorizontal: 18, marginVertical: 14, padding: 18, borderRadius: Radius.xl, backgroundColor: C.bgPink, borderWidth: 1, borderColor: C.borderPink, flexDirection: 'row', gap: 12 }, title: { color: C.textDark, fontSize: 16, fontWeight: '700' }, body: { color: C.textBody, fontSize: 13, lineHeight: 20, marginTop: 6 }, cta: { color: C.accentRose, fontSize: 13, fontWeight: '700', marginTop: 10 } });
