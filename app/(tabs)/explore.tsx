import { useRouter } from 'expo-router';
import {
  Bell, BookOpen, Camera, Crown, Heart, Menu, Scissors, Search, SlidersHorizontal, Sparkles, Star,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingCard } from '../../components/cards/TrendingCard';
import { ExpertCard } from '../../components/cards/ExpertCard';
import { NearbySalonCard } from '../../components/cards/NearbySalonCard';
import { SuggestionCard } from '../../components/cards/SuggestionCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SkeletonList } from '../../components/ui/SkeletonLoader';
import { ErrorView } from '../../components/ui/ErrorView';
import { useExplore } from '../../hooks/useExplore';
import { useMuas } from '../../hooks/useMuas';
import { BrandColors, Radius, Spacing, Shadows, Typography } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import type { FeaturedExpert } from '../../types/home';
import type { ArtistDto } from '../../types/ArtistDto';

const CATEGORY_ITEMS = [
  { id: 'cat-1', name: 'Cô dâu', Icon: Heart },
  { id: 'cat-2', name: 'Tiệc', Icon: Sparkles },
  { id: 'cat-3', name: 'Kỷ yếu', Icon: BookOpen },
  { id: 'cat-4', name: 'Photoshoot', Icon: Camera },
  { id: 'cat-5', name: 'Hàn Quốc', Icon: Star },
  { id: 'cat-6', name: 'Luxury', Icon: Crown },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { data, isLoading: loading, isError, error, searchQuery, setSearchQuery, refetch } = useExplore();
  
  const { data: muas = [], isLoading: muaLoading } = useMuas();

  // Fallback: load MUAs from existing service for featured experts
  const muaExperts: FeaturedExpert[] = React.useMemo(() => {
    return muas.slice(0, 5).map((m: ArtistDto) => ({
      id: m.id,
      name: m.name,
      avatarUrl: m.avatar,
      bookingsCount: m.reviewCount,
      location: m.city,
      rating: m.rating,
    }));
  }, [muas]);

  const experts = (data?.featuredExperts && data.featuredExperts.length > 0) ? data.featuredExperts : muaExperts;

  const openMuaDetail = (id: string) => {
    router.push({ pathname: '/mua-detail', params: { id } });
  };

  if (loading && muaLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>{Strings.exploreTitle}</Text>
          </View>
          <SkeletonList count={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError && experts.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>{Strings.exploreTitle}</Text>
          </View>
          <ErrorView message={error?.message || "Không thể tải dữ liệu"} onRetry={refetch} />
        </View>
      </SafeAreaView>
    );
  }

  // Ensure data exists before rendering the main view
  if (!data) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {/* ── Header Bar ── */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.headerIcon}>
            <Menu size={22} color={BrandColors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{Strings.exploreTitle}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon}>
              <Bell size={20} color={BrandColors.textDark} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Search size={20} color={BrandColors.textDark} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Greeting ── */}
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>{Strings.exploreGreeting}</Text>
            <Text style={styles.subtitle}>{Strings.exploreSubtitle}</Text>
          </View>

          {/* ── Search Bar ── */}
          <View style={styles.searchBar}>
            <Search size={18} color={BrandColors.textMuted} />
            <TextInput
              placeholder={Strings.exploreSearchPlaceholder}
              placeholderTextColor={BrandColors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            <TouchableOpacity style={styles.filterButton}>
              <SlidersHorizontal size={16} color={BrandColors.textWhite} />
            </TouchableOpacity>
          </View>

          {/* ── Banner Carousel ── */}
          {data.banners.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bannerScroll}
              snapToInterval={290}
              decelerationRate="fast"
            >
              {data.banners.map((banner, index) => (
                <LinearGradient
                  key={banner.id}
                  colors={
                    index % 2 === 0
                      ? (['#2A1B35', BrandColors.accentPink] as const)
                      : ([BrandColors.accentPink, BrandColors.gradientStart] as const)
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bannerCard}
                >
                  {banner.tag && (
                    <View style={styles.bannerTagBadge}>
                      <Text style={styles.bannerTagText}>{banner.tag}</Text>
                    </View>
                  )}
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                </LinearGradient>
              ))}
            </ScrollView>
          )}

          {/* ── Category Grid (2x3) ── */}
          <View style={styles.categoryGrid}>
            {CATEGORY_ITEMS.map((cat) => {
              const Icon = cat.Icon;
              return (
                <TouchableOpacity key={cat.id} style={styles.categoryItem} activeOpacity={0.8}>
                  <View style={styles.categoryIconCircle}>
                    <Icon size={24} color={BrandColors.accentPink} />
                  </View>
                  <Text style={styles.categoryLabel}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Trending ── */}
          {data.trending.length > 0 && (
            <>
              <SectionHeader title={Strings.exploreTrending} actionText={Strings.exploreViewAll} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {data.trending.map((item) => (
                  <TrendingCard key={item.id} item={item} />
                ))}
              </ScrollView>
            </>
          )}

          {/* ── Featured Experts ── */}
          {experts.length > 0 && (
            <>
              <SectionHeader
                title={Strings.exploreFeaturedExperts}
                actionText={Strings.exploreViewAll}
              />
              <View style={styles.expertsList}>
                {experts.slice(0, 3).map((expert) => (
                  <ExpertCard
                    key={expert.id}
                    expert={expert}
                    onPress={() => openMuaDetail(expert.id)}
                  />
                ))}
              </View>
            </>
          )}

          {/* ── Nearby ── */}
          {data.nearbySalons.length > 0 && (
            <>
              <SectionHeader title={Strings.exploreNearby} actionText={Strings.exploreViewAll} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {data.nearbySalons.map((salon) => (
                  <NearbySalonCard key={salon.id} salon={salon} />
                ))}
              </ScrollView>
            </>
          )}

          {/* ── Suggestions ── */}
          {data.suggestions.length > 0 && (
            <>
              <SectionHeader title={Strings.exploreSuggestions} />
              <View style={styles.suggestionsGrid}>
                {data.suggestions.map((item) => (
                  <SuggestionCard key={item.id} item={item} />
                ))}
              </View>
            </>
          )}
        </ScrollView>
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
  scrollContent: {
    paddingBottom: 120,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: BrandColors.accentPink,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 4,
  },
  greetingSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '900',
    color: BrandColors.textDark,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.textSecondary,
    marginTop: 4,
  },
  searchBar: {
    marginHorizontal: Spacing.lg,
    height: 50,
    borderRadius: Radius.xl,
    backgroundColor: BrandColors.bgCard,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.base,
    paddingRight: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    padding: 0,
    color: BrandColors.textDark,
    fontSize: 14,
    fontWeight: '600',
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: BrandColors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    paddingVertical: Spacing.base,
  },
  bannerCard: {
    width: 276,
    height: 150,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bannerTagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
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
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  categoryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColors.bgPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.textDark,
  },
  horizontalList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  expertsList: {
    gap: Spacing.md,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
});
