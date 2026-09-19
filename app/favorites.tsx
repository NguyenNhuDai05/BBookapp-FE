import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, Bookmark, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PortfolioPost } from '../components/mua/portfolio/PortfolioPost';
import { BrandColors } from '../constants/theme';
import { portfolioService } from '../services/portfolioService';
import { useAuthStore } from '../store/useAuthStore';
import { useFavoriteFeedStore } from '../store/useFavoriteFeedStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type FavoriteTab = 'liked' | 'saved';

export default function FavoritesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: FavoriteTab }>();
  const userId = useAuthStore(s => s.user?.id);
  const liked = useFavoriteFeedStore(s => s.liked);
  const saved = useFavoriteFeedStore(s => s.saved);
  const hydrate = useFavoriteFeedStore(s => s.hydrate);
  const toggleLiked = useFavoriteFeedStore(s => s.toggleLiked);
  const toggleSaved = useFavoriteFeedStore(s => s.toggleSaved);
  const [activeTab, setActiveTab] = useState<FavoriteTab>(params.tab === 'saved' ? 'saved' : 'liked');
  const [fullImage, setFullImage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const favoritesQuery = useQuery({ queryKey: ['portfolio-favorites', activeTab], queryFn: () => portfolioService.getFavorites(activeTab) });

  useEffect(() => {
    if (userId) void hydrate(userId);
  }, [hydrate, userId]);

  const posts = useMemo(() => favoritesQuery.data || Object.values(activeTab === 'liked' ? liked : saved).reverse(), [activeTab, favoritesQuery.data, liked, saved]);

  const toggleLike = async (item: any) => {
    await toggleLiked(item);
    try {
      await portfolioService.toggleLike(String(item.id || item.portfolioId));
      await queryClient.invalidateQueries({ queryKey: ['portfolio-favorites'] });
    } catch {
      await toggleLiked(item);
    }
  };

  const toggleSave = async (item: any) => {
    await toggleSaved(item);
    try {
      await portfolioService.toggleSave(String(item.id || item.portfolioId));
      await queryClient.invalidateQueries({ queryKey: ['portfolio-favorites'] });
    } catch {
      await toggleSaved(item);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color="#22152B" />
        </TouchableOpacity>
        <Text style={styles.title}>Yêu thích</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'liked' && styles.activeTab]} onPress={() => setActiveTab('liked')}>
          <Heart size={18} color={activeTab === 'liked' ? BrandColors.accentPink : '#888'} fill={activeTab === 'liked' ? BrandColors.accentPink : 'transparent'} />
          <Text style={[styles.tabText, activeTab === 'liked' && styles.activeTabText]}>Đã thả tim ({Object.keys(liked).length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'saved' && styles.activeTab]} onPress={() => setActiveTab('saved')}>
          <Bookmark size={18} color={activeTab === 'saved' ? BrandColors.accentPink : '#888'} fill={activeTab === 'saved' ? BrandColors.accentPink : 'transparent'} />
          <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>Đã lưu ({Object.keys(saved).length})</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item, index) => String(item.id || item.portfolioId || index)}
        renderItem={({ item }) => {
          const id = String(item.id || item.portfolioId);
          return (
            <PortfolioPost
              item={{ ...item, isLiked: Boolean(liked[id]), isSaved: Boolean(saved[id]) }}
              onLike={() => toggleLike(item)}
              onSave={() => toggleSave(item)}
              onImagePress={setFullImage}
              onAuthorPress={() => router.push({ pathname: '/mua-detail', params: { id: item.muaId || item.authorId } })}
            />
          );
        }}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            {activeTab === 'liked' ? <Heart size={48} color="#D8CFD4" /> : <Bookmark size={48} color="#D8CFD4" />}
            <Text style={styles.emptyTitle}>{activeTab === 'liked' ? 'Chưa có bài đã thả tim' : 'Chưa có bài đã lưu'}</Text>
            <Text style={styles.emptyText}>Các bài bạn chọn trên trang chủ sẽ xuất hiện tại đây.</Text>
          </View>
        )}
        contentContainerStyle={posts.length === 0 ? styles.emptyList : styles.list}
      />

      <Modal visible={!!fullImage} transparent animationType="fade" onRequestClose={() => setFullImage(null)}>
        <View style={styles.imageModal}>
          <TouchableOpacity style={styles.closeModal} onPress={() => setFullImage(null)}><X size={28} color="#FFF" /></TouchableOpacity>
          {fullImage ? <Image source={{ uri: fullImage }} style={styles.fullImage} resizeMode="contain" /> : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 54, borderBottomWidth: 1, borderBottomColor: '#F1EDF0' },
  headerButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '800', color: '#22152B' },
  tabs: { flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F1EDF0' },
  tab: { flex: 1, height: 48, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: BrandColors.accentPink },
  tabText: { color: '#888', fontSize: 13, fontWeight: '600' },
  activeTabText: { color: '#22152B' },
  list: { paddingBottom: 32 },
  emptyList: { flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#22152B', marginTop: 14 },
  emptyText: { fontSize: 14, color: '#8C8390', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  imageModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center' },
  fullImage: { width: '100%', height: '88%' },
  closeModal: { position: 'absolute', top: 48, right: 18, zIndex: 2, padding: 10 },
});
