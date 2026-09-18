import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, Dimensions, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, X, Send } from 'lucide-react-native';
import { PortfolioPost } from '../components/mua/portfolio/PortfolioPost';
import { useMuaPortfolio } from '../hooks/useMuaPortfolio';
import { useMuaDetail } from '../hooks/useMuaDetail';
import { useBookingStore } from '../store/useBookingStore';
import { api } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

export default function CustomerPortfolioFeedScreen() {
  const router = useRouter();
  const { muaId, initialIndex } = useLocalSearchParams();
  const { data: portfolio } = useMuaPortfolio(muaId as string);
  const { muaInfo } = useMuaDetail(muaId as string);
  const setLastViewedPortfolioId = useBookingStore(s => s.setLastViewedPortfolioId);
  const queryClient = useQueryClient();
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [commentItem, setCommentItem] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const { setMua, addService } = useBookingStore();
  const flatListRef = useRef<FlatList>(null);

  const hasScrolledRef = useRef(false);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const item = viewableItems[0].item;
      setLastViewedPortfolioId(item.id || item.portfolioId);
    }
  }, [setLastViewedPortfolioId]);
  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 50 }), []);

  useEffect(() => {
    if (initialIndex !== undefined && portfolio && portfolio.length > 0 && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      const targetIndex = Number(initialIndex);
      if (targetIndex >= 0 && targetIndex < portfolio.length) {
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({
              index: targetIndex,
              animated: false,
            });
          } catch (err) {
            console.log('Scroll error:', err);
          }
        }, 100);
      }
    }
  }, [initialIndex, portfolio]);

  const handleLike = async (item: any) => {
    try {
      await api.post('/mua/portfolio/' + (item.id || item.portfolioId) + '/like');
      queryClient.invalidateQueries({ queryKey: ['mua-portfolio', muaId] });
    } catch (e) {
      console.log('Like failed', e);
    }
  };

  const handleSave = async (item: any) => {
    try {
      await api.post('/mua/portfolio/' + (item.id || item.portfolioId) + '/save');
      queryClient.invalidateQueries({ queryKey: ['mua-portfolio', muaId] });
    } catch (e) {
      console.log('Save failed', e);
    }
  };

  const openComments = async (item: any) => {
    setCommentItem(item);
    const { data } = await api.get(`/mua/portfolio/${item.id || item.portfolioId}/comments`);
    setComments(data);
  };

  const sendComment = async () => {
    if (!commentText.trim() || !commentItem) return;
    setSendingComment(true);
    try {
      const { data } = await api.post(`/mua/portfolio/${commentItem.id || commentItem.portfolioId}/comments`, { content: commentText.trim() });
      setComments(prev => [data, ...prev]);
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['mua-portfolio', muaId] });
    } finally { setSendingComment(false); }
  };

  const addPostService = (item: any) => {
    const service = item.service;
    if (!service) return;
    setMua({ id: String(muaId), name: muaInfo?.name || 'MUA', avatarUrl: muaInfo?.avatar || '', rating: muaInfo?.rating || 0, reviewCount: muaInfo?.reviewCount || 0, location: '', yearsOfExp: 0 });
    addService({ id: service.serviceId || service.id, name: service.serviceName || service.name, durationMinutes: service.durationMinutes, price: Number(service.price), participantsCount: 1, imageUrl: service.imageUrl, description: service.description });
    Alert.alert('Đã thêm', 'Dịch vụ đã được thêm vào lịch đặt của bạn.');
  };

  const renderItem = ({ item }: { item: any }) => (
    <PortfolioPost
      item={{
        ...item,
        authorName: muaInfo?.name || 'Chuyên gia',
        authorAvatarUrl: muaInfo?.avatar || '',
        muaId: muaId
      }}
      onLike={() => handleLike(item)}
      onSave={() => handleSave(item)}
      onComment={() => openComments(item)}
      onImagePress={setFullImage}
      onAddService={() => addPostService(item)}
      onAuthorPress={() => router.back()}
      // No onOptions since this is customer view
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#22152B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài viết</Text>
        <View style={{ width: 28 }} />
      </View>
      
      <FlatList
        ref={flatListRef}
        data={portfolio || []}
        keyExtractor={(item: any, index: number) => item.id || item.portfolioId || index.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={{ paddingBottom: 20 }}
        getItemLayout={(data, index) => (
          { length: Dimensions.get('window').width + 200, offset: (Dimensions.get('window').width + 200) * index, index }
        )}
      />
      <Modal visible={!!fullImage} transparent animationType="fade" onRequestClose={() => setFullImage(null)}>
        <View style={styles.imageModal}><TouchableOpacity style={styles.closeModal} onPress={() => setFullImage(null)}><X size={28} color="#FFF" /></TouchableOpacity>{fullImage && <Image source={{ uri: fullImage }} style={styles.fullImage} contentFit="contain" />}</View>
      </Modal>
      <Modal visible={!!commentItem} animationType="slide" transparent onRequestClose={() => setCommentItem(null)}>
        <KeyboardAvoidingView style={styles.commentOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.commentSheet}>
            <View style={styles.commentHeader}><Text style={styles.commentTitle}>Bình luận</Text><TouchableOpacity onPress={() => setCommentItem(null)}><X size={24} /></TouchableOpacity></View>
            <FlatList data={comments} keyExtractor={item => item.id} renderItem={({ item }) => <View style={styles.commentRow}><View style={styles.commentAvatar}><Text>{(item.userName || 'U')[0]}</Text></View><View style={styles.commentBubble}><Text style={styles.commentUser}>{item.userName || 'Người dùng'}</Text><Text>{item.content}</Text></View></View>} ListEmptyComponent={<Text style={styles.emptyComments}>Chưa có bình luận.</Text>} />
            <View style={styles.emojiRow}>{['❤️','😍','😂','🔥','👏'].map(e => <TouchableOpacity key={e} onPress={() => setCommentText(v => v + e)}><Text style={styles.emoji}>{e}</Text></TouchableOpacity>)}</View>
            <View style={styles.commentInputRow}><TextInput value={commentText} onChangeText={setCommentText} placeholder="Viết bình luận..." style={styles.commentInput}/><TouchableOpacity onPress={sendComment} disabled={sendingComment || !commentText.trim()}><Send size={22} color="#E8436A" /></TouchableOpacity></View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22152B',
  },
  imageModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center' },
  fullImage: { width: '100%', height: '85%' },
  closeModal: { position: 'absolute', top: 50, right: 20, zIndex: 2, padding: 8 },
  commentOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  commentSheet: { height: '70%', backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  commentTitle: { fontSize: 18, fontWeight: '700' },
  commentRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFE5ED', alignItems: 'center', justifyContent: 'center' },
  commentBubble: { flex: 1, backgroundColor: '#F7F7F8', borderRadius: 14, padding: 10 },
  commentUser: { fontWeight: '700', marginBottom: 2 },
  emptyComments: { textAlign: 'center', color: '#888', marginTop: 30 },
  emojiRow: { flexDirection: 'row', gap: 18, paddingVertical: 10 },
  emoji: { fontSize: 24 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EEE', borderRadius: 22, paddingHorizontal: 14 },
  commentInput: { flex: 1, minHeight: 44 },
});
