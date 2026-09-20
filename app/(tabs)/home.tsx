import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Send, X } from 'lucide-react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Image, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkeletonList } from '../../components/ui/SkeletonLoader';
import { ErrorView } from '../../components/ui/ErrorView';
import { useFeed } from '../../hooks/useFeed';
import { useAuthStore } from '../../store/useAuthStore';
import { BrandColors, Radius, Spacing } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { PortfolioPost } from '../../components/mua/portfolio/PortfolioPost';
import { useBookingStore } from '../../store/useBookingStore';
import { portfolioService } from '../../services/portfolioService';
import { useQueryClient } from '@tanstack/react-query';
import { useFavoriteFeedStore } from '../../store/useFavoriteFeedStore';

const homeLogo = require('../../assets/images/LOGO_Finalllll.png');

export default function HomeScreen() {
  const router = useRouter();
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
  const [commentItem, setCommentItem] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);

  useEffect(() => {
    if (authUser?.id) void hydrateFavorites(authUser.id);
  }, [authUser?.id, hydrateFavorites]);
  
  // Queries
  const { 
    data: feedData, 
    isLoading: feedLoading, 
    isError: feedError, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch: refetchFeed 
  } = useFeed();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchFeed();
    setRefreshing(false);
  }, [refetchFeed]);

  const userName = authUser?.name || 'bạn';

  const postId = (item: any) => String(item.id || item.portfolioId);

  const handleLike = async (item: any) => {
    await toggleLiked(item);
    try {
      await portfolioService.toggleLike(postId(item));
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
    } catch {
      await toggleLiked(item);
      Alert.alert('Không thể thả tim', 'Vui lòng đăng nhập hoặc thử lại sau.');
    }
  };

  const handleSave = async (item: any) => {
    await toggleSaved(item);
    try {
      await portfolioService.toggleSave(postId(item));
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
    } catch {
      await toggleSaved(item);
      Alert.alert('Không thể lưu bài viết', 'Vui lòng đăng nhập hoặc thử lại sau.');
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
      Alert.alert('Không thể gửi bình luận', 'Vui lòng thử lại sau.');
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

  const openPostOptions = () => {
    Alert.alert('Tùy chọn bài viết', 'Các thao tác này cần backend hỗ trợ.', [
      { text: 'Báo cáo bài viết' },
      { text: 'Chặn người dùng' },
      { text: 'Ẩn bài viết' },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  if (feedLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <View style={styles.headerGradientPlaceholder} />
          <SkeletonList count={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (feedError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <ErrorView message="Không thể tải dữ liệu trang chủ" onRetry={onRefresh} />
        </View>
      </SafeAreaView>
    );
  }

  const posts = feedData?.pages?.flat() || [];

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        {/* ── Hero Header ── */}
        <LinearGradient
          colors={[BrandColors.gradientHeroStart, BrandColors.gradientHeroMid, BrandColors.gradientHeroEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View>
              <Image source={homeLogo} style={styles.homeLogo} resizeMode="contain" />
              <Text style={styles.greeting}>
                {Strings.homeGreeting(userName)}
              </Text>
              <Text style={styles.subtitle}>{Strings.homeSubtitle}</Text>
            </View>
            <View style={styles.bellCircle}>
              <Bell size={20} color={BrandColors.accentPink} />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>Dành Cho Bạn</Text>
          <Text style={styles.feedSubtitle}>Khám phá các chuyên gia phù hợp</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <FlatList
          data={posts}
          keyExtractor={(item, index) => item.portfolioId ? item.portfolioId.toString() : index.toString()}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyFeedTitle}>Chưa có bài viết phù hợp</Text>
              <Text style={styles.emptyFeedText}>Kéo xuống để làm mới hoặc quay lại sau nhé.</Text>
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
              item={displayItem}
              onLike={() => handleLike(displayItem)}
              onSave={() => handleSave(displayItem)}
              onComment={() => openComments(displayItem)}
              onOptions={openPostOptions}
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
            if (hasNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: 20 }} color={BrandColors.accentPink} /> : null}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
        <Modal visible={!!fullImage} transparent animationType="fade" onRequestClose={() => setFullImage(null)}>
          <View style={styles.imageModal}>
            <TouchableOpacity style={styles.closeModal} onPress={() => setFullImage(null)}>
              <X size={28} color="#FFF" />
            </TouchableOpacity>
            {fullImage ? <Image source={{ uri: fullImage }} style={styles.fullImage} resizeMode="contain" /> : null}
          </View>
        </Modal>
        <Modal visible={!!commentItem} animationType="slide" transparent onRequestClose={() => setCommentItem(null)}>
          <KeyboardAvoidingView style={styles.commentOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.commentSheet}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentTitle}>Bình luận</Text>
                <TouchableOpacity onPress={() => setCommentItem(null)}><X size={24} /></TouchableOpacity>
              </View>
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
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
    maxWidth: 430,
    alignSelf: 'center',
    backgroundColor: BrandColors.bgPrimary,
  },
  headerGradientPlaceholder: {
    height: 180,
    borderRadius: Radius.xxl,
    margin: Spacing.lg,
    backgroundColor: BrandColors.bgPink,
  },
  headerContainer: {
    paddingBottom: Spacing.md,
  },
  hero: {
    marginHorizontal: 18,
    marginTop: 12,
    borderRadius: Radius.xxl,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  homeLogo: {
    alignSelf: 'flex-start',
    width: 70,
    height: 54,
    marginTop: -8,
    marginLeft: -10,
  },
  bellCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    color: BrandColors.textWhite,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 16,
    lineHeight: 32,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    fontWeight: '600',
  },
  bannerScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bannerCard: {
    width: 296,
    height: 160,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bannerTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  bannerTagText: {
    color: BrandColors.textWhite,
    fontSize: 11,
    fontWeight: '800',
  },
  bannerTitle: {
    color: BrandColors.textWhite,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  feedHeader: {
    paddingHorizontal: 18,
    marginTop: 24,
    marginBottom: 8,
  },
  feedTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#22152B',
  },
  feedSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyFeed: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 56 },
  emptyFeedTitle: { color: BrandColors.textDark, fontSize: 17, fontWeight: '800' },
  emptyFeedText: { color: BrandColors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 7, textAlign: 'center' },
  imageModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center' },
  fullImage: { width: '100%', height: '88%' },
  closeModal: { position: 'absolute', top: 48, right: 18, zIndex: 2, padding: 10 },
  commentOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  commentSheet: { height: '70%', backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  commentTitle: { fontSize: 18, fontWeight: '700', color: '#22152B' },
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
  commentInput: { flex: 1, minHeight: 44 },
});


