import { AppBottomSheet } from '../../components/ui/AppBottomSheet';
import { HomeFeedHeader } from '../../components/feed/HomeFeedHeader';
import { useRouter } from 'expo-router';
import { Send, X } from 'lucide-react-native';
import React, { useState, useCallback, useEffect } from 'react';
import {StyleSheet, Text, View, FlatList, ActivityIndicator, Image, TouchableOpacity, TextInput} from 'react-native';
import { AppOverlay } from '../../components/ui/OverlayProvider';
import { AppAlert as appDialog } from '../../components/ui/dialogStore';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkeletonList } from '../../components/ui/SkeletonLoader';
import { ErrorView } from '../../components/ui/ErrorView';
import { useFeed } from '../../hooks/useFeed';
import { useAuthStore } from '../../store/useAuthStore';
import { BrandColors, getCustomerTabBarMetrics } from '../../constants/theme';
import { FollowPortfolioPost as PortfolioPost } from '../../components/feed/FollowPortfolioPost';
import { useBookingStore } from '../../store/useBookingStore';
import { portfolioService } from '../../services/portfolioService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFavoriteFeedStore } from '../../store/useFavoriteFeedStore';
import { NotificationService } from '../../services/NotificationService';
import { PostActionSheet } from '../../components/feed/PostActionSheet';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: tabBarHeight } = getCustomerTabBarMetrics(insets.bottom);
  const authUser = useAuthStore((s) => s.user);
  const setLastViewedPortfolioId = useBookingStore(s => s.setLastViewedPortfolioId);
  const { draft, setMua, addService, resetDraft } = useBookingStore();
  const queryClient = useQueryClient();
  const liked = useFavoriteFeedStore(s => s.liked);
  const saved = useFavoriteFeedStore(s => s.saved);
  const hydrateFavorites = useFavoriteFeedStore(s => s.hydrate);
  const toggleLiked = useFavoriteFeedStore(s => s.toggleLiked);
  const toggleSaved = useFavoriteFeedStore(s => s.toggleSaved);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [optionsPost, setOptionsPost] = useState<{ authorName?: string } | null>(null);
  const [commentItem, setCommentItem] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: NotificationService.getUnreadCount,
    enabled: Boolean(authUser?.id),
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (authUser?.id) void hydrateFavorites(authUser.id);
  }, [authUser?.id, hydrateFavorites]);

  // Queries
  const {
    data: feedData,
    isLoading: feedLoading,
    isError: feedError,
    isSessionExpired,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchFeed
  } = useFeed();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetchFeed(); } finally { setRefreshing(false); }
  }, [refetchFeed]);


  const postId = (item: any) => String(item.id || item.portfolioId);

  const handleLike = async (item: any) => {
    await toggleLiked(item);
    try {
      await portfolioService.toggleLike(postId(item));
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
    } catch {
      await toggleLiked(item);
      appDialog.alert('Không thể thả tim', 'Vui lòng đăng nhập hoặc thử lại sau.');
    }
  };

  const handleSave = async (item: any) => {
    await toggleSaved(item);
    try {
      await portfolioService.toggleSave(postId(item));
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
    } catch {
      await toggleSaved(item);
      appDialog.alert('Không thể lưu bài viết', 'Vui lòng đăng nhập hoặc thử lại sau.');
    }
  };

  const openComments = async (item: any) => {
    setCommentItem(item);
    try {
      setComments(await portfolioService.getComments(postId(item)));
    } catch {
      setComments([]);
    }
  };

  const sendComment = async () => {
    if (!commentItem || !commentText.trim()) return;
    setSendingComment(true);
    try {
      if (replyingTo) {
        const reply = await portfolioService.replyToComment(postId(commentItem), replyingTo.id, commentText.trim());
        setComments(current => current.map(comment => comment.id === replyingTo.id ? { ...comment, replies: [...(comment.replies || []), reply] } : comment));
      } else {
        const comment = await portfolioService.addComment(postId(commentItem), commentText.trim());
        setComments(current => [comment, ...current]);
      }
      setCommentText('');
      setReplyingTo(null);
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
    } catch {
      appDialog.alert('Không thể gửi bình luận', 'Vui lòng thử lại sau.');
    } finally {
      setSendingComment(false);
    }
  };

  const addPostService = (item: any) => {
    const service = item.service;
    if (!service) return;
    const muaId = String(item.muaId || item.authorId || '');
    if (!muaId) return;
    if (draft.mua && draft.mua.id !== muaId) resetDraft();
    setMua({
      id: muaId,
      name: item.authorName || 'Chuyên gia',
      avatarUrl: item.authorAvatarUrl || item.authorAvatar || '',
      rating: Number(item.rating || 0),
      reviewCount: Number(item.reviewCount || 0),
      location: item.location || '',
      yearsOfExp: Number(item.yearsOfExp || 0),
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

  const openPostOptions = (item: { authorName?: string }) => setOptionsPost(item);

  const header = <HomeFeedHeader avatarUrl={authUser?.avatarUrl || authUser?.avatar} unreadCount={unreadCount}
    onNotificationsPress={() => router.push('/customer-notifications')}
    onProfilePress={() => router.push('/(tabs)/profile')} />;

  if (feedLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.screen}>
          {header}
          <SkeletonList count={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (feedError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.screen}>
          {header}
          <ErrorView message={isSessionExpired ? 'Phiên bảng tin đã hết hạn. Vui lòng làm mới để tiếp tục.' : 'Không thể tải bảng tin. Vui lòng kiểm tra kết nối và thử lại.'} onRetry={onRefresh} />
        </View>
      </SafeAreaView>
    );
  }

  const posts = feedData?.pages?.flat() || [];


  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.screen}>
        <FlatList
          data={posts}
          keyExtractor={(item) => postId(item)}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyFeedTitle}>Chưa có bài viết mới</Text>
              <Text style={styles.emptyFeedText}>Những bài viết mới từ Makeup Artist sẽ xuất hiện tại đây.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const id = postId(item);
            const displayItem: any = {
              ...item,
              isLiked: Boolean(liked[id]) || item.isLiked,
              isSaved: Boolean(saved[id]) || item.isSaved,
            };
            return (
            <PortfolioPost
              compact
              item={displayItem}
              onLike={() => handleLike(displayItem)}
              onSave={() => handleSave(displayItem)}
              onComment={() => openComments(displayItem)}
              onOptions={() => openPostOptions(item)}
              onImagePress={setFullImage}
              onAddService={() => addPostService(displayItem)}
              onAuthorPress={() => {
                setLastViewedPortfolioId(item.id || item.portfolioId);
                router.push({ pathname: '/mua-detail', params: { id: item.muaId || item.authorId || item.id } });
              }}
            />
          );}}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: 20 }} color={BrandColors.accentPink} /> : hasNextPage ? (
            <TouchableOpacity accessibilityRole="button" onPress={() => void fetchNextPage({ cancelRefetch: false })} style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: BrandColors.accentPink, fontWeight: '700' }}>Xem thêm bài viết</Text>
            </TouchableOpacity>
          ) : posts.length > 0 ? <Text style={{ padding: 20, textAlign: 'center', color: BrandColors.textMuted }}>Bạn đã xem hết các bài viết hiện có.</Text> : null}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
        />
        <PostActionSheet visible={Boolean(optionsPost)} authorName={optionsPost?.authorName} onClose={() => setOptionsPost(null)} />
        <AppOverlay visible={!!fullImage} transparent animationType="fade" onRequestClose={() => setFullImage(null)}>
          <View style={styles.imageModal}>
            <TouchableOpacity style={styles.closeModal} onPress={() => setFullImage(null)}>
              <X size={28} color="#FFF" />
            </TouchableOpacity>
            {fullImage ? <Image source={{ uri: fullImage }} style={styles.fullImage} resizeMode="contain" /> : null}
          </View>
        </AppOverlay>
        <AppBottomSheet visible={!!commentItem} title="Bình luận" onClose={()=>setCommentItem(null)} loading={sendingComment}  contentStyle={{height:'72%'}}>

<FlatList
                data={comments}
                keyExtractor={(item, index) => String(item.id || index)}
                renderItem={({ item }) => (
                  <View style={styles.commentRow}>
                    <View style={styles.commentAvatar}><Text>{(item.userName || 'U')[0]}</Text></View>
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentUser}>{item.userName || 'Người dùng'}</Text>
                      <Text>{item.content}</Text>
                      <TouchableOpacity onPress={() => setReplyingTo(item)}><Text style={styles.replyAction}>Trả lời</Text></TouchableOpacity>
                      {(item.replies || []).map((reply: any) => (
                        <View key={reply.id} style={styles.replyRow}>
                          <Text style={styles.commentUser}>{reply.userName || 'Người dùng'}</Text>
                          <Text>{reply.content}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyComments}>Chưa có bình luận.</Text>}
              />

{replyingTo ? <View style={styles.replyingBanner}><Text style={styles.replyingText}>Đang trả lời {replyingTo.userName || 'người dùng'}</Text><TouchableOpacity onPress={() => setReplyingTo(null)}><X size={16} /></TouchableOpacity></View> : null}

<View style={styles.commentInputRow}>
                <TextInput value={commentText} onChangeText={setCommentText} placeholder="Viết bình luận..." style={styles.commentInput} />
                <TouchableOpacity onPress={sendComment} disabled={sendingComment || !commentText.trim()}>
                  {sendingComment ? <ActivityIndicator color={BrandColors.accentPink} /> : <Send size={22} color={BrandColors.accentPink} />}
                </TouchableOpacity>
              </View>
</AppBottomSheet>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
safeArea: {
    flex: 1,
    backgroundColor: BrandColors.bgPrimary,
  },
screen: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    backgroundColor: BrandColors.bgPrimary,
  },
emptyFeed: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 56 },
emptyFeedTitle: { color: BrandColors.textDark, fontSize: 17, fontWeight: '800' },
emptyFeedText: { color: BrandColors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 7, textAlign: 'center' },
imageModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center' },
fullImage: { width: '100%', height: '88%' },
closeModal: { position: 'absolute', top: 48, right: 18, zIndex: 2, padding: 10 },
commentRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
commentAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFE5ED', alignItems: 'center', justifyContent: 'center' },
commentBubble: { flex: 1, backgroundColor: '#F7F7F8', borderRadius: 14, padding: 10 },
commentUser: { fontWeight: '700', marginBottom: 2 },
replyAction: { color: BrandColors.accentPink, fontWeight: '600', fontSize: 12, marginTop: 6 },
replyRow: { marginTop: 8, marginLeft: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#FFD4E1' },
replyingBanner: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF2F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginTop: 8 },
replyingText: { color: '#6C5360', fontSize: 12 },
emptyComments: { textAlign: 'center', color: '#888', marginTop: 30 },
commentInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EEE', borderRadius: 22, paddingHorizontal: 14, marginTop: 10 },
commentInput: { flex: 1, minHeight: 44 }
});
