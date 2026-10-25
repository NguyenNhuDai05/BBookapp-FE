import React, { useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MoreVertical } from 'lucide-react-native';
import { profileSharingService } from '../services/profileSharingService';
import { validProfileId } from '../utils/profileLinks';
import { getApiError } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { PostActionSheet } from '../components/feed/PostActionSheet';
import { formatPostTime } from '../utils/feedDisplay';

export default function SharedPostScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter(); const viewer = useAuthStore(s => s.user?.id);
  const [options, setOptions] = useState(false);
  const query = useQuery({ queryKey: ['shared-post', viewer ?? 'guest', id], queryFn: ({ signal }) => profileSharingService.getPost(id!, signal), enabled: validProfileId(id), staleTime: 0, retry: false });
  const { refetch } = query;
  useFocusEffect(React.useCallback(() => { if (validProfileId(id)) void refetch(); }, [id, refetch]));
  const post = query.isError ? undefined : query.data;
  const unavailable = !validProfileId(id) || getApiError(query.error).status === 404;
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/home'); };
  return <SafeAreaView style={styles.screen}>
    <View style={styles.header}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Quay lại" onPress={back}><ArrowLeft size={25} color="#22152B" /></TouchableOpacity><Text style={styles.heading}>Bài viết</Text>{post ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Tùy chọn bài viết" onPress={() => setOptions(true)}><MoreVertical size={25} color="#22152B" /></TouchableOpacity> : <View style={{ width: 25 }} />}</View>
    {query.isPending && validProfileId(id) ? <View style={styles.center}><ActivityIndicator color="#D82C77" /><Text>Đang tải bài viết…</Text></View> : !post ? <View style={styles.center}><Text style={styles.title}>{unavailable ? 'Bài viết không còn khả dụng' : 'Chưa tải được bài viết'}</Text><Text style={styles.muted}>{unavailable ? 'Bài viết có thể đã được ẩn, xóa hoặc chưa công khai.' : 'Vui lòng kiểm tra kết nối và thử lại.'}</Text>{validProfileId(id) && <TouchableOpacity accessibilityRole="button" onPress={() => { void query.refetch(); }} style={styles.button}><Text style={styles.buttonText}>Thử lại</Text></TouchableOpacity>}</View> : <ScrollView refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={() => { void query.refetch(); }} />}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Hồ sơ ${post.name}`} style={styles.author} onPress={() => router.push({ pathname: '/mua-detail', params: { id: post.muaId } })}>{post.avatarUrl ? <Image source={{ uri: post.avatarUrl }} style={styles.avatar} /> : <View style={[styles.avatar, styles.placeholder]}><Text>B</Text></View>}<View style={{ flex: 1 }}><Text style={styles.name}>{post.name}</Text><Text style={styles.muted}>{formatPostTime(post.createdAt)}</Text></View></TouchableOpacity>
      {post.title ? <Text style={styles.title}>{post.title}</Text> : null}{post.description ? <Text style={styles.caption}>{post.description}</Text> : null}
      {post.images.map((image, index) => <Image key={`${image}-${index}`} source={{ uri: image }} style={styles.image} resizeMode="contain" accessibilityLabel={`Ảnh tác phẩm ${index + 1}`} />)}
      {post.tags.length ? <Text style={styles.tags}>{post.tags.map(tag => `#${tag}`).join('  ')}</Text> : null}
      <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => router.push({ pathname: '/mua-detail', params: { id: post.muaId } })}><Text style={styles.buttonText}>Xem hồ sơ chuyên gia</Text></TouchableOpacity>
    </ScrollView>}
    <PostActionSheet visible={options && !!post} authorName={post?.name} authorId={post?.muaId} portfolioId={post?.id} onClose={() => setOptions(false)} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FFF' }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomColor: '#F3E7ED', borderBottomWidth: 1 }, heading: { fontSize: 18, fontWeight: '700' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 15 }, author: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 }, avatar: { width: 48, height: 48, borderRadius: 24 }, placeholder: { backgroundColor: '#FFE2ED', alignItems: 'center', justifyContent: 'center' }, name: { fontSize: 17, fontWeight: '700', color: '#22152B' }, muted: { color: '#716573', fontSize: 13, lineHeight: 21 }, title: { marginHorizontal: 18, marginBottom: 10, fontSize: 21, fontWeight: '700', color: '#22152B' }, caption: { marginHorizontal: 18, marginBottom: 16, fontSize: 16, lineHeight: 25, color: '#352938' }, image: { width: '100%', aspectRatio: 1, backgroundColor: '#FCF5F8', marginBottom: 8 }, tags: { padding: 18, color: '#CB236A' }, button: { padding: 16, backgroundColor: '#AC205B', borderRadius: 16, margin: 18, alignItems: 'center' }, buttonText: { color: '#FFF', fontWeight: '700' } });
