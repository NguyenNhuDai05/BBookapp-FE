import React, { useRef, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { PortfolioPost } from '../components/mua/portfolio/PortfolioPost';
import { useMuaPortfolio } from '../hooks/useMuaPortfolio';
import { useMuaDetail } from '../hooks/useMuaDetail';
import { useBookingStore } from '../store/useBookingStore';
import { api } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

const { height } = Dimensions.get('window');

export default function CustomerPortfolioFeedScreen() {
  const router = useRouter();
  const { muaId, initialIndex } = useLocalSearchParams();
  const { data: portfolio } = useMuaPortfolio(muaId as string);
  const { muaInfo } = useMuaDetail(muaId as string);
  const setLastViewedPortfolioId = useBookingStore(s => s.setLastViewedPortfolioId);
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);

  const hasScrolledRef = useRef(false);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const item = viewableItems[0].item;
      setLastViewedPortfolioId(item.id || item.portfolioId);
    }
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

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

  const renderItem = ({ item }: { item: any }) => (
    <PortfolioPost
      item={{
        ...item,
        authorName: muaInfo?.brandName || muaInfo?.name || 'Chuyên gia',
        authorAvatarUrl: muaInfo?.avatar || muaInfo?.avatarUrl || '',
        muaId: muaId
      }}
      onLike={() => handleLike(item)}
      onSave={() => handleSave(item)}
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
});
