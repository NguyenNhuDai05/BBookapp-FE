import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, UsersRound, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { PortfolioPost } from '../../components/mua/portfolio/PortfolioPost';
import { PortfolioCommentsSheet } from '../../components/feed/PortfolioCommentsSheet';
import { ErrorView } from '../../components/ui/ErrorView';
import { SkeletonList } from '../../components/ui/SkeletonLoader';
import { useFeed } from '../../hooks/useFeed';
import { portfolioService } from '../../services/portfolioService';
import { useAuthStore } from '../../store/useAuthStore';
import { useFavoriteFeedStore } from '../../store/useFavoriteFeedStore';
import { useBookingStore } from '../../store/useBookingStore';
import { BrandColors, Radius, Spacing } from '../../constants/theme';
import type { PortfolioItemDto } from '../../types/portfolio';

const postId = (item: { id?: string; portfolioId?: string }) => String(item.id || item.portfolioId || '');

export default function MuaCommunityScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const liked = useFavoriteFeedStore(state => state.liked);
  const saved = useFavoriteFeedStore(state => state.saved);
  const hydrate = useFavoriteFeedStore(state => state.hydrate);
  const toggleLiked = useFavoriteFeedStore(state => state.toggleLiked);
  const toggleSaved = useFavoriteFeedStore(state => state.toggleSaved);
  const [commentItem, setCommentItem] = useState<PortfolioItemDto | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busyPostId, setBusyPostId] = useState<string | null>(null);
  const { draft, setMua, addService, resetDraft, setLastViewedPortfolioId } = useBookingStore();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();

  useEffect(() => {
    if (user?.id) void hydrate(user.id);
  }, [hydrate, user?.id]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLike = async (item: any) => {
    const id = postId(item);
    if (!id || busyPostId === id) return;
    setBusyPostId(id);
    await toggleLiked(item);
    try {
      await portfolioService.toggleLike(id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({ queryKey: ['mua-portfolio'] }),
      ]);
    } catch {
      await toggleLiked(item);
      Alert.alert('Không thể thả tim', 'Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setBusyPostId(null);
    }
  };

  const handleSave = async (item: any) => {
    const id = postId(item);
    if (!id || busyPostId === id) return;
    setBusyPostId(id);
    await toggleSaved(item);
    try {
      await portfolioService.toggleSave(id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({ queryKey: ['mua-portfolio'] }),
      ]);
    } catch {
      await toggleSaved(item);
      Alert.alert('Không thể lưu bài viết', 'Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setBusyPostId(null);
    }
  };

  const openOptions = (item: any) => {
    const isOwnPost = String(item.muaId || '') === String(user?.id || '');
    if (isOwnPost) {
      router.push({ pathname: '/(mua)/manage-portfolio', params: { portfolioId: postId(item) } } as any);
      return;
    }
    Alert.alert('Tùy chọn bài viết', 'Bạn có thể báo cáo nội dung không phù hợp.', [
      { text: 'Báo cáo bài viết' },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const addPostService = (item: any) => {
    const service = item.service as any;
    const muaId = String(item.muaId || '');
    if (!service || !muaId || muaId === String(user?.id || '')) return;
    if (draft.mua && draft.mua.id !== muaId) resetDraft();
    setMua({
      id: muaId,
      name: item.authorName || 'Chuyên gia',
      avatarUrl: item.authorAvatarUrl || '',
      rating: Number((item as any).rating || 0),
      reviewCount: Number((item as any).reviewCount || 0),
      location: (item as any).location || '',
      yearsOfExp: Number((item as any).yearsOfExp || 0),
    });
    addService({
      id: service.serviceId || service.id,
      name: service.serviceName || service.name,
      durationMinutes: service.durationMinutes,
      price: Number(service.price),
      participantsCount: 1,
      imageUrl: service.imageUrl,
      description: service.description,
    });
    setLastViewedPortfolioId(postId(item));
    router.push('/checkout');
  };

  if (isLoading && !refreshing) {
    return <SafeAreaView style={styles.safe}><Header onBack={() => router.back()} /><SkeletonList count={3} /></SafeAreaView>;
  }

  if (isError) {
    return <SafeAreaView style={styles.safe}><Header onBack={() => router.back()} /><ErrorView message="Không thể tải cộng đồng MUA" onRetry={refresh} /></SafeAreaView>;
  }

  const posts = data?.pages.flat() || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header onBack={() => router.back()} />
      <FlatList
        data={posts}
        keyExtractor={(item, index) => postId(item) || String(index)}
        renderItem={({ item }) => {
          const id = postId(item);
          const displayItem = {
            ...item,
            id: item.id || item.portfolioId,
            imageUrl: item.imageUrls?.[0] || '',
            category: (item.tags || []).join(', '),
            isCover: false,
            order: 0,
            updatedAt: item.createdAt || '',
            service: item.service as any,
            isLiked: liked[id] ? true : item.isLiked,
            isSaved: saved[id] ? true : item.isSaved,
          } as PortfolioItemDto;
          return (
            <PortfolioPost
              item={displayItem}
              onLike={() => void handleLike(displayItem)}
              onSave={() => void handleSave(displayItem)}
              onComment={() => setCommentItem(displayItem)}
              onImagePress={setFullImage}
              onOptions={() => openOptions(displayItem)}
              onAddService={String(item.muaId || '') === String(user?.id || '') ? undefined : () => addPostService(displayItem)}
              onAuthorPress={() => {
                if (String(item.muaId) === String(user?.id)) router.push('/(mua)/profile');
                else router.push({ pathname: '/mua-detail', params: { id: item.muaId } });
              }}
            />
          );
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={BrandColors.accentPink} />}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={<View style={styles.empty}><UsersRound size={42} color={BrandColors.borderPink} /><Text style={styles.emptyTitle}>Chưa có bài viết</Text><Text style={styles.emptyText}>Các tác phẩm công khai của MUA sẽ xuất hiện tại đây.</Text></View>}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={styles.footer} color={BrandColors.accentPink} /> : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <PortfolioCommentsSheet item={commentItem} onClose={() => setCommentItem(null)} />
      <Modal visible={Boolean(fullImage)} transparent animationType="fade" onRequestClose={() => setFullImage(null)}>
        <View style={styles.imageModal}>
          <TouchableOpacity style={styles.closeImage} onPress={() => setFullImage(null)}><X size={28} color="#FFF" /></TouchableOpacity>
          {fullImage ? <Image source={{ uri: fullImage }} style={styles.fullImage} resizeMode="contain" /> : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.back}><ChevronLeft size={28} color={BrandColors.textDark} /></TouchableOpacity>
      <View style={styles.headerCopy}><Text style={styles.title}>Cộng đồng MUA</Text><Text style={styles.subtitle}>Khám phá tác phẩm từ các chuyên gia</Text></View>
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 68, paddingHorizontal: Spacing.md, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: BrandColors.borderLight },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, alignItems: 'center' },
  title: { color: BrandColors.textDark, fontSize: 18, fontWeight: '900' },
  subtitle: { color: BrandColors.textMuted, fontSize: 11, marginTop: 2 },
  listContent: { paddingBottom: 32, width: '100%', maxWidth: 560, alignSelf: 'center' },
  empty: { margin: Spacing.lg, padding: Spacing.xl, borderRadius: Radius.lg, backgroundColor: '#FFF', alignItems: 'center' },
  emptyTitle: { color: BrandColors.textDark, fontSize: 17, fontWeight: '800', marginTop: 12 },
  emptyText: { color: BrandColors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6 },
  footer: { margin: 24 },
  imageModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center' },
  closeImage: { position: 'absolute', top: 48, right: 18, zIndex: 2, padding: 10 },
  fullImage: { width: '100%', height: '88%' },
});
