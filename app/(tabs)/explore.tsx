import { useRouter } from 'expo-router';
import { QuickModeSwitcher } from '../../components/QuickModeSwitcher';
import { ArrowRight, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { ExploreArtistCard, ExplorePostCard, ExploreServiceCard, ExploreSection, EXPLORE_PINK as PINK, formatExplorePrice as price } from '../../components/explore/ExploreCards';
import { ExploreFilterSheet } from '../../components/explore/ExploreFilterSheet';
import { getCustomerTabBarMetrics } from '../../constants/theme';
import { useExplore } from '../../hooks/useExplore';
import { exploreErrorMessage, isExploreSessionError } from '../../services/exploreService';
import type { ExploreArtist, ExploreItem, ExploreKind, ExplorePost, ExploreService } from '../../types/explore';
import { useAuthStore } from '../../store/useAuthStore';
import { ReviewNotice } from '../../components/ReviewNotice';

const KINDS: { key: ExploreKind; label: string }[] = [
  { key: 'portfolio', label: 'Tác phẩm' }, { key: 'artists', label: 'Chuyên gia' }, { key: 'services', label: 'Dịch vụ' },
];
function LoadingCards() {
  return <View style={styles.skeletonGrid}>{[0, 1, 2, 3].map(id => <View key={id} style={styles.skeletonCard}>
    <SkeletonLoader height={190} borderRadius={18} /><SkeletonLoader height={15} width="80%" style={{ marginTop: 12 }} /><SkeletonLoader height={12} width="60%" style={{ marginTop: 8 }} />
  </View>)}</View>;
}
export default function ExploreScreen() {
  const router = useRouter();
  const reviewUser = useAuthStore(state => state.user);
  const insets = useSafeAreaInsets();
  const bottom = getCustomerTabBarMetrics(insets.bottom).height;
  const list = useRef<FlatList<ExploreItem>>(null);
  const explore = useExplore();
  const { home, results, items, filters, setFilters, kind, setKind, searchQuery, setSearchQuery, isTyping, isFiltered } = explore;
  const [filterVisible, setFilterVisible] = useState(false);
  const openArtist = (id: string) => router.push({ pathname: '/mua-detail', params: { id } });
  const openPost = (item: ExplorePost) => router.push({ pathname: '/portfolio-feed', params: { muaId: item.muaId, portfolioId: item.id } });
  const openService = (item: ExploreService) => router.push({ pathname: '/mua-detail', params: { id: item.muaId, tab: 'Dịch vụ', serviceId: item.id } });
  const browse = (next: ExploreKind) => { setKind(next); list.current?.scrollToOffset({ offset: 0, animated: true }); };
  const filtersCount = Object.values(filters).filter(value => value !== undefined).length;
  const province = home.data?.provinces.find(p => p.code === filters.provinceCode);
  const style = home.data?.styles.find(s => s.id === filters.styleId);
  const pending = isTyping || results.isLoading;
  const showFeatured = !isFiltered && kind === 'portfolio';
  const featuredPosts = home.data?.featuredPosts.slice(0, 3) || [];
  const featuredIds = new Set(showFeatured ? featuredPosts.map(post => post.id) : []);
  const gridItems = items.filter(item => !featuredIds.has(item.id));
  const clearAndTop = () => { explore.clearFilters(); list.current?.scrollToOffset({ offset: 0, animated: true }); };
  const renderItem = ({ item }: { item: ExploreItem }) => <View style={styles.gridCell}>
    {kind === 'portfolio' ? <ExplorePostCard item={item as ExplorePost} onPress={() => openPost(item as ExplorePost)} /> : kind === 'artists' ?
      <ExploreArtistCard item={item as ExploreArtist} onPress={() => openArtist(item.id)} /> : <ExploreServiceCard item={item as ExploreService} onPress={() => openService(item as ExploreService)} />}
  </View>;
  const header = <>
    {reviewUser?.isDemoAccount && reviewUser.demoCounterpartMuaId ? <TouchableOpacity accessibilityRole="button" onPress={() => openArtist(reviewUser.demoCounterpartMuaId!)}><ReviewNotice title="MUA mẫu cho đánh giá" message="Xem hồ sơ, chọn dịch vụ và trải nghiệm đặt lịch với MUA mẫu." /></TouchableOpacity> : null}
    <View style={styles.titleRow}><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.eyebrow}>B-BOOK / KHÁM PHÁ</Text><Text style={styles.heading}>Đẹp theo cách của bạn</Text></View><QuickModeSwitcher /></View>
    <View style={styles.searchRow}><View style={styles.searchBox}><Search size={19} color="#7E6372" />
      <TextInput accessibilityLabel="Tìm kiếm tác phẩm, chuyên gia và dịch vụ" placeholder="Tìm phong cách, MUA, dịch vụ..." placeholderTextColor="#947F8A" style={styles.searchInput}
        value={searchQuery} onChangeText={text => setSearchQuery(text.slice(0, 100))} returnKeyType="search" maxLength={100} />
      {searchQuery ? <TouchableOpacity accessibilityLabel="Xóa từ khóa" onPress={() => setSearchQuery('')} style={styles.clear}><X size={16} color="#7E6372" /></TouchableOpacity> : null}
    </View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Mở bộ lọc" onPress={() => setFilterVisible(true)} style={[styles.filterButton, filtersCount > 0 && styles.filterActive]}>
      <SlidersHorizontal size={20} color={filtersCount ? '#FFF' : PINK} />{filtersCount ? <Text style={styles.filterBadge}>{filtersCount}</Text> : null}</TouchableOpacity></View>
    {home.data?.styles.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      <TouchableOpacity style={[styles.chip, !filters.styleId && styles.chipSelected]} onPress={() => setFilters({ ...filters, styleId: undefined })}><Text style={[styles.chipText, !filters.styleId && styles.chipTextSelected]}>Tất cả phong cách</Text></TouchableOpacity>
      {home.data.styles.map(tag => <TouchableOpacity key={tag.id} accessibilityRole="button" accessibilityState={{ selected: tag.id === filters.styleId }} style={[styles.chip, tag.id === filters.styleId && styles.chipSelected]}
        onPress={() => setFilters({ ...filters, styleId: filters.styleId === tag.id ? undefined : tag.id })}><Text style={[styles.chipText, tag.id === filters.styleId && styles.chipTextSelected]}>{tag.name}</Text></TouchableOpacity>)}
    </ScrollView> : null}
    {isFiltered ? <View style={styles.activeFilters}><Text style={styles.activeText} numberOfLines={2}>{[province?.name, style?.name,
      filters.minPrice != null ? `Từ ${price(filters.minPrice)}` : '', filters.maxPrice != null ? `Đến ${price(filters.maxPrice)}` : ''].filter(Boolean).join(' · ') || 'Kết quả tìm kiếm'}</Text>
      <TouchableOpacity onPress={clearAndTop} style={styles.clear}><Text style={styles.moreText}>Xóa lọc</Text></TouchableOpacity></View> : null}
    {home.isError && !results.isError ? <TouchableOpacity onPress={() => void home.refetch()} style={styles.errorBanner}><Text style={styles.errorText}>Chưa tải được gợi ý Khám phá. Chạm để thử lại.</Text></TouchableOpacity> : null}
    {showFeatured && home.isLoading ? <View style={{ paddingHorizontal: 18, paddingTop: 16 }}><SkeletonLoader height={245} borderRadius={22} /></View> : null}
    {showFeatured && home.data?.featuredPosts.length ? <>
      <ExploreSection title="Cảm hứng makeup" subtitle="Những tác phẩm từ cộng đồng Makeup Artist" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {featuredPosts.map(post => <ExplorePostCard key={post.id} featured item={post} onPress={() => openPost(post)} />)}
      </ScrollView>
    </> : null}
    {showFeatured && home.data?.featuredArtists.length ? <>
      <ExploreSection title="Chuyên gia đáng khám phá" subtitle="Tìm phong cách và mức giá phù hợp với bạn" onMore={() => browse('artists')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {home.data.featuredArtists.map(artist => <ExploreArtistCard key={artist.id} item={artist} horizontal onPress={() => openArtist(artist.id)} />)}
      </ScrollView>
    </> : null}
    {showFeatured && home.data?.featuredServices.length ? <>
      <ExploreSection title="Khám phá dịch vụ" subtitle="Giá và thời gian do Makeup Artist cung cấp" onMore={() => browse('services')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {home.data.featuredServices.map(service => <ExploreServiceCard key={service.id} item={service} horizontal onPress={() => openService(service)} />)}
      </ScrollView>
    </> : null}
    <ExploreSection title={isFiltered ? 'Kết quả dành cho bạn' : 'Khám phá thêm'} subtitle={kind === 'services' ? 'Sắp xếp theo giá từ thấp đến cao' : kind === 'portfolio' ? 'Tác phẩm mới nhất từ các Makeup Artist' : 'Chuyên gia đã được duyệt hồ sơ'} />
    <View style={styles.tabs}>{KINDS.map(tab => <TouchableOpacity key={tab.key} accessibilityRole="tab" accessibilityState={{ selected: kind === tab.key }} style={[styles.tab, kind === tab.key && styles.tabSelected]} onPress={() => setKind(tab.key)}>
      <Text style={[styles.tabText, kind === tab.key && styles.tabTextSelected]}>{tab.label}</Text></TouchableOpacity>)}</View>
    {pending ? <LoadingCards /> : null}
    {!pending && results.isError && items.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Chưa tải được nội dung</Text><Text style={styles.emptyText}>{exploreErrorMessage(results.error)}</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={() => void results.refetch()}><Text style={styles.primaryText}>Thử lại</Text></TouchableOpacity></View> : null}
    {!pending && !results.isError && items.length === 0 ? <View style={styles.empty}><Sparkles size={34} color="#D990AD" /><Text style={styles.emptyTitle}>{isFiltered ? 'Chưa tìm thấy kết quả phù hợp' : 'Nội dung mới đang chờ bạn'}</Text>
      <Text style={styles.emptyText}>{isFiltered ? 'Thử một phong cách khác hoặc mở rộng bộ lọc.' : 'Các tác phẩm, chuyên gia và dịch vụ công khai sẽ xuất hiện tại đây.'}</Text>
      {isFiltered ? <TouchableOpacity style={styles.primaryButton} onPress={clearAndTop}><Text style={styles.primaryText}>Xóa bộ lọc</Text></TouchableOpacity> : null}</View> : null}
  </>;
  return <SafeAreaView style={styles.safe} edges={['top']}>
    <FlatList ref={list} data={pending ? [] : gridItems} renderItem={renderItem} numColumns={2} keyExtractor={item => `${kind}-${item.id}`} keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header} columnWrapperStyle={styles.gridRow} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottom + 24 }}
      refreshing={home.isRefetching || (results.isRefetching && !results.isFetchingNextPage)} onRefresh={() => void explore.refetch()}
      onEndReached={() => { if (!pending && results.hasNextPage && !results.isFetching && !results.isFetchNextPageError) void results.fetchNextPage({ cancelRefetch: false }); }} onEndReachedThreshold={0.35}
      ListFooterComponent={!pending && items.length > 0 ? <View style={styles.footer}>{results.isFetchingNextPage ? <ActivityIndicator color={PINK} /> : results.isError ?
        <><Text style={styles.emptyText}>{exploreErrorMessage(results.error)}</Text><TouchableOpacity style={styles.secondaryButton} onPress={() => void (results.isFetchNextPageError && !isExploreSessionError(results.error) ? results.fetchNextPage({ cancelRefetch: false }) : results.refetch())}><Text style={styles.moreText}>{isExploreSessionError(results.error) ? 'Làm mới' : 'Thử lại'}</Text></TouchableOpacity></> : results.hasNextPage ?
        <TouchableOpacity style={styles.secondaryButton} onPress={() => void results.fetchNextPage({ cancelRefetch: false })}><Text style={styles.moreText}>Xem thêm</Text><ArrowRight size={16} color={PINK} /></TouchableOpacity> : <Text style={styles.endText}>Bạn đã xem hết kết quả hiện có.</Text>}</View> : null}
    />
    <ExploreFilterSheet visible={filterVisible} filters={filters} provinces={home.data?.provinces || []} onClose={() => setFilterVisible(false)} onApply={next => { setFilters(next); setFilterVisible(false); list.current?.scrollToOffset({ offset: 0, animated: true }); }} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', backgroundColor: '#FFF7FA' }, titleRow: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: '#9C637C', fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 7 }, heading: { color: '#351C2B', fontSize: 25, fontWeight: '800' },
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 18 }, searchBox: { flex: 1, height: 48, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEDFE6', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  searchInput: { flex: 1, color: '#35212B', fontSize: 13, height: 48, paddingVertical: 0 }, clear: { minWidth: 32, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  filterButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFE6EF', justifyContent: 'center', alignItems: 'center' }, filterActive: { backgroundColor: PINK }, filterBadge: { position: 'absolute', top: 2, right: 3, color: '#FFF', fontSize: 10, fontWeight: '800' },
  chips: { gap: 8, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 }, chip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 22, borderWidth: 1, borderColor: '#EBD6DF', backgroundColor: '#FFF' }, chipSelected: { backgroundColor: PINK, borderColor: PINK }, chipText: { color: '#775167', fontSize: 12, fontWeight: '600' }, chipTextSelected: { color: '#FFF' },
  activeFilters: { marginHorizontal: 18, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }, activeText: { flex: 1, color: '#7B4E66', fontSize: 12, lineHeight: 19 }, moreText: { color: PINK, fontSize: 12, fontWeight: '700' }, horizontal: { paddingHorizontal: 18, gap: 12, paddingBottom: 2 },
  tabs: { marginHorizontal: 18, marginBottom: 17, flexDirection: 'row', padding: 4, gap: 4, borderRadius: 15, backgroundColor: '#F3E4EB' }, tab: { flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center' }, tabSelected: { backgroundColor: '#FFF' }, tabText: { color: '#937384', fontSize: 12, fontWeight: '600' }, tabTextSelected: { color: PINK, fontWeight: '800' },
  gridRow: { paddingHorizontal: 18, gap: 12, marginBottom: 14 }, gridCell: { flex: 1, maxWidth: '50%' }, skeletonGrid: { paddingHorizontal: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, skeletonCard: { width: '48%', marginBottom: 16 },
  empty: { paddingHorizontal: 32, paddingVertical: 35, alignItems: 'center' }, emptyTitle: { color: '#4B2C3E', fontSize: 16, fontWeight: '800', marginTop: 12 }, emptyText: { color: '#89697B', fontSize: 12, textAlign: 'center', lineHeight: 20, marginTop: 9 }, primaryButton: { minHeight: 46, backgroundColor: PINK, borderRadius: 16, paddingHorizontal: 22, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', marginTop: 18 }, primaryText: { color: '#FFF', fontSize: 13, fontWeight: '700' }, secondaryButton: { minHeight: 46, borderWidth: 1, borderColor: '#E9CBDA', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 }, footer: { paddingHorizontal: 30, paddingVertical: 22, alignItems: 'center', gap: 10 }, endText: { color: '#957A88', fontSize: 11 }, errorBanner: { marginHorizontal: 18, padding: 12, backgroundColor: '#FFE6EB', borderRadius: 14, marginTop: 12 }, errorText: { color: '#AA3050', fontSize: 12, lineHeight: 19 },
});
