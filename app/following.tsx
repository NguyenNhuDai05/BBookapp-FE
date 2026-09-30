import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { followService, FollowedMua } from '../services/followService';
import { useAuthStore } from '../store/useAuthStore';
import { useFollow } from '../hooks/useFollow';
import { BrandColors } from '../constants/theme';
function FollowRow({ item }: { item: FollowedMua }) {
  const router = useRouter();
  const follow = useFollow(item.muaId);
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 }}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={'Hồ sơ ' + item.name} onPress={() => router.push({ pathname: '/mua-detail', params: { id: item.muaId } })}
      style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {item.avatarUrl ? <Image source={{ uri: item.avatarUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} /> : <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: BrandColors.bgPink, alignItems: 'center', justifyContent: 'center' }}><Text>{item.name.charAt(0)}</Text></View>}
      <Text numberOfLines={1} style={{ flex: 1, fontWeight: '700', color: BrandColors.textDark }}>{item.name}</Text>
    </TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" onPress={() => { if (follow.error) void follow.refetch(); else void follow.toggle(); }} disabled={follow.loading || follow.busy}
      style={{ padding: 10, borderRadius: 18, backgroundColor: BrandColors.bgPink }}>
      {follow.busy ? <ActivityIndicator color={BrandColors.primaryPink} /> : <Text style={{ color: BrandColors.primaryPink }}>{follow.error ? 'Thử lại' : follow.status?.isFollowing === false ? 'Theo dõi' : 'Đang theo dõi'}</Text>}
    </TouchableOpacity>
  </View>;
}
export default function FollowingScreen() {
  const router = useRouter();
  const userId = useAuthStore(s => s.user?.id);
  const query = useInfiniteQuery({ queryKey: ['following-list', userId], queryFn: ({ pageParam }) => followService.list(pageParam),
    initialPageParam: 1, enabled: !!userId, getNextPageParam: (last, pages) => last.length === 20 ? pages.length + 1 : undefined });
  const items = query.data?.pages.flat() ?? [];
  return <SafeAreaView style={{ flex: 1, backgroundColor: BrandColors.bgCard }}>
    <View style={{ width: '100%', maxWidth: 640, alignSelf: 'center', flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 14 }}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.back()} style={{ padding: 8 }}><ArrowLeft size={24} color={BrandColors.textDark} /></TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: BrandColors.textDark }}>Đang theo dõi</Text>
      </View>
      {query.isLoading ? <ActivityIndicator color={BrandColors.primaryPink} /> : query.isError ? <TouchableOpacity onPress={() => { void query.refetch(); }} style={{ padding: 20 }}><Text>Không tải được danh sách. Nhấn để thử lại.</Text></TouchableOpacity> :
        <FlatList data={items} keyExtractor={item => item.muaId} renderItem={({ item }) => <FollowRow item={item} />}
          refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); }}
          onEndReached={() => { if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage(); }} onEndReachedThreshold={0.5}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={BrandColors.primaryPink} /> : null}
          ListEmptyComponent={<View style={{ padding: 24 }}><Text style={{ color: BrandColors.textMuted }}>{userId ? 'Bạn chưa theo dõi chuyên gia nào.' : 'Đăng nhập để xem danh sách đang theo dõi.'}</Text></View>} />}
    </View>
  </SafeAreaView>;
}
