import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Search } from 'lucide-react-native';
import { useFollowers, useFollowerSummary } from '../hooks/useFollowers';
import { ProfileShareSheet } from '../components/profile/ProfileShareSheet';
import { BrandColors } from '../constants/theme';
import { useAuthStore } from '../store/useAuthStore';

export default function FollowersScreen() {
  const router = useRouter();
  const userId = useAuthStore(s => s.user?.id);
  const [search, setSearch] = useState('');
  const [sharing, setSharing] = useState(false);
  const query = useFollowers(search);
  const summary = useFollowerSummary();
  const total = query.data?.pages[0]?.totalCount ?? summary.data?.followersCount;
  return <SafeAreaView style={styles.safe}><View style={styles.content}>
    <View style={styles.header}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.back()} style={styles.back}><ArrowLeft size={24} color={BrandColors.textDark} /></TouchableOpacity><View><Text style={styles.title}>Người theo dõi</Text>{total != null ? <Text style={styles.muted}>{total.toLocaleString('vi-VN')} người theo dõi</Text> : null}</View></View>
    <View style={styles.search}><Search size={18} color={BrandColors.textMuted} /><TextInput accessibilityLabel="Tìm người theo dõi" placeholder="Tìm theo tên" value={search} onChangeText={setSearch} maxLength={80} style={{ flex: 1, minHeight: 44 }} /></View>
    {query.isLoading ? <ActivityIndicator accessibilityLabel="Đang tải danh sách người theo dõi" color={BrandColors.accentPink} /> : query.isError && !query.data ? <View style={styles.empty}><Text>Chưa tải được danh sách người theo dõi.</Text><TouchableOpacity accessibilityRole="button" onPress={() => { void query.refetch(); }} style={styles.button}><Text>Thử lại</Text></TouchableOpacity></View> :
      <FlatList data={query.searching ? [] : query.items} keyExtractor={item => item.userId} keyboardShouldPersistTaps="handled"
        refreshing={query.isRefetching} onRefresh={() => { void Promise.all([query.refetch(), summary.refetch()]); }}
        onEndReached={() => { if (!query.searching && query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError) void query.fetchNextPage(); }}
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={BrandColors.accentPink} /> : query.isFetchNextPageError ? <TouchableOpacity accessibilityRole="button" onPress={() => { void query.fetchNextPage(); }} style={styles.button}><Text>Tải lại phần tiếp theo</Text></TouchableOpacity> : null}
        ListEmptyComponent={<View style={styles.empty}>{query.searching ? <ActivityIndicator color={BrandColors.accentPink} /> : <><Text style={styles.muted}>{search.trim() ? 'Không tìm thấy người theo dõi phù hợp.' : 'Bạn chưa có người theo dõi. Chia sẻ hồ sơ để khách dễ tìm thấy bạn.'}</Text>{!search.trim() && <TouchableOpacity accessibilityRole="button" onPress={() => setSharing(true)} style={styles.button}><Text style={{ color: BrandColors.accentRose }}>Chia sẻ hồ sơ</Text></TouchableOpacity>}</>}</View>}
        renderItem={({ item }) => {
          const content = <><View style={styles.avatar}>{item.avatarUrl ? <Image source={{ uri: item.avatarUrl }} style={styles.avatar} /> : <Text>{item.name.charAt(0)}</Text>}</View><Text style={styles.name} numberOfLines={1}>{item.name}</Text>{item.publicMuaId ? <ChevronRight size={18} color={BrandColors.textMuted} /> : null}</>;
          return item.publicMuaId ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Hồ sơ ${item.name}`} style={styles.row} onPress={() => router.push({ pathname: '/mua-detail', params: { id: item.publicMuaId! } })}>{content}</TouchableOpacity> : <View style={styles.row}>{content}</View>;
        }} />}
    <ProfileShareSheet visible={sharing} muaId={userId} onClose={() => setSharing(false)} />
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#FFF' }, content: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }, back: { padding: 10 }, title: { fontSize: 21, fontWeight: '700', color: BrandColors.textDark },
  muted: { color: BrandColors.textMuted, fontSize: 14, lineHeight: 22 }, search: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, paddingHorizontal: 12, backgroundColor: '#FFF3F7', borderRadius: 14 },
  empty: { padding: 28, alignItems: 'center', gap: 16 }, row: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F5EDF1' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFE9F1', alignItems: 'center', justifyContent: 'center' }, name: { flex: 1, color: BrandColors.textDark, fontSize: 15, fontWeight: '600' }, button: { minHeight: 44, padding: 14, borderRadius: 14, backgroundColor: '#FFF0F5' },
});
