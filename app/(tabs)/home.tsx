import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Sparkles } from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkeletonList } from '../../components/ui/SkeletonLoader';
import { ErrorView } from '../../components/ui/ErrorView';
import { useFeed } from '../../hooks/useFeed';
import { useAuthStore } from '../../store/useAuthStore';
import { BrandColors, Radius, Spacing } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { PortfolioPost } from '../../components/mua/portfolio/PortfolioPost';
import { useBookingStore } from '../../store/useBookingStore';

export default function HomeScreen() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const setLastViewedPortfolioId = useBookingStore(s => s.setLastViewedPortfolioId);
  
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

  const posts = feedData?.pages?.flatMap((page: any) => page.data || page.Data || page) || [];

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
              <View style={styles.logoBadge}>
                <Sparkles size={14} color={BrandColors.accentPink} />
                <Text style={styles.logoBadgeText}>BeautyBook</Text>
              </View>
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
          renderItem={({ item }) => (
            <PortfolioPost 
              item={item} 
              onLike={() => {}}
              onSave={() => {}}
              onAuthorPress={() => {
                setLastViewedPortfolioId(item.id || item.portfolioId);
                router.push({ pathname: '/mua-detail', params: { id: item.muaId || item.authorId || item.id } });
              }}
            />
          )}
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
  logoBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  logoBadgeText: {
    color: BrandColors.accentPink,
    fontSize: 12,
    fontWeight: '900',
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
  }
});


