import React from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { api } from '../../services/api';
import type { ExploreFilters } from '../../types/explore';

type Artist = { id: string; name: string; city?: string; avatarUrl?: string; rating: number; label: string };
export function SponsoredMuas({ filters, q, onPress }: { filters: ExploreFilters; q: string; onPress: (id: string) => void }) {
  const query = useQuery({ queryKey: ['sponsored-muas', filters, q], queryFn: async () => (await api.get<{ items: Artist[] }>('/Mua/sponsored', { params: { ...filters, q } })).data.items, staleTime: 30_000, retry: false });
  useFocusEffect(React.useCallback(() => { void query.refetch(); }, [query.refetch]));
  const seen = React.useRef(new Set<string>());
  const track = React.useCallback((id: string, kind: string) => { void api.post('/Mua/sponsored/events', { id: Crypto.randomUUID(), muaId: id, kind }).catch(() => {}); }, []);
  const viewable = React.useRef(({ viewableItems }: { viewableItems: { item: Artist; isViewable: boolean }[] }) => {
    for (const row of viewableItems) if (row.isViewable && !seen.current.has(row.item.id)) { seen.current.add(row.item.id); track(row.item.id, 'Impression'); }
  });
  if (!query.data?.length || query.isError) return null; // Organic discovery continues independently.
  return <View style={{ marginVertical: 16 }}><Text style={{ fontSize: 19, fontWeight: '700', color: '#4b1328', marginBottom: 12 }}>MUA được quảng bá</Text>
    <FlatList horizontal data={query.data} keyExtractor={item => item.id} showsHorizontalScrollIndicator={false}
      onViewableItemsChanged={viewable.current} viewabilityConfig={{ itemVisiblePercentThreshold: 60, minimumViewTime: 1000 }}
      renderItem={({ item }) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${item.name}, quảng bá`} onPress={() => { track(item.id, 'ProfileView'); onPress(item.id); }} style={{ width: 176, marginRight: 12, padding: 16, borderRadius: 16, backgroundColor: '#fff4f7', borderColor: '#efd7e0', borderWidth: 1 }}>
        {item.avatarUrl?.startsWith('https://') && <Image source={{ uri: item.avatarUrl }} style={{ width: 54, height: 54, borderRadius: 27, marginBottom: 10 }} />}
        <Text style={{ fontWeight: '700', color: '#4b1328' }}>{item.name}</Text><Text style={{ fontSize: 12, color: '#75646d', marginTop: 4 }}>{item.city}</Text><Text style={{ fontSize: 10, color: '#c82264', marginTop: 8 }}>Quảng bá</Text>
      </TouchableOpacity>} />
  </View>;
}
