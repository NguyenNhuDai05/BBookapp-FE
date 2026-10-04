import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { moderationService } from '../services/moderationService';
import { getApiError } from '../services/api';
import { AppAlert } from '../components/ui/dialogStore';
export default function BlockedUsers() {
  const router = useRouter(); const cache = useQueryClient();
  const [items, setItems] = useState<{ userId: string; fullName?: string }[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(''); try { setItems(await moderationService.blocks()); } catch (err) { setError(getApiError(err).message); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  async function unblock(id: string) {
    if (busy) return; setBusy(id);
    try { await moderationService.unblock(id); setItems(rows => rows.filter(row => row.userId !== id)); await cache.invalidateQueries(); }
    catch (err) { AppAlert.alert('Không thể bỏ chặn', getApiError(err).message); } finally { setBusy(null); }
  }
  return <SafeAreaView style={{ flex: 1, backgroundColor: 'white', padding: 20 }}><TouchableOpacity onPress={() => router.back()}><Text>← Quay lại</Text></TouchableOpacity><Text style={{ fontSize: 24, fontWeight: '700', marginVertical: 20 }}>Người dùng bị chặn</Text>{loading ? <ActivityIndicator /> : error ? <TouchableOpacity onPress={load}><Text>{error} — Thử lại</Text></TouchableOpacity> : <FlatList data={items} keyExtractor={item => item.userId} ListEmptyComponent={<Text>Bạn chưa chặn người dùng nào.</Text>} renderItem={({ item }) => <View style={{ flexDirection: 'row', paddingVertical: 18, alignItems: 'center' }}><Text style={{ flex: 1 }}>{item.fullName || 'Người dùng BBook'}</Text><TouchableOpacity disabled={!!busy} onPress={() => AppAlert.alert('Bỏ chặn?', 'Cho phép tương tác mới với tài khoản này.', [{ text: 'Hủy', style: 'cancel' }, { text: 'Bỏ chặn', onPress: () => unblock(item.userId) }])}><Text style={{ color: '#C71585' }}>{busy === item.userId ? 'Đang xử lý…' : 'Bỏ chặn'}</Text></TouchableOpacity></View>} />}</SafeAreaView>;
}
