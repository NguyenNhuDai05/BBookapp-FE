import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  MapPin, Search, Sparkles, Star,
} from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import type { ImageStyle, StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExplore, type ExploreFeedItem } from '../../hooks/useExplore';
import type { ArtistDto } from '../../types/ArtistDto';

const PINK = '#C5165D';
const SOFT_PINK = '#FFF4F7';

const compact = (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`;
const money = (value?: number | null) => value != null ? `${Math.round(value / 1000)}K` : 'Liên hệ';

function RemoteImage({ uri, style }: { uri?: string; style: StyleProp<ImageStyle> }) {
  if (!uri) return <View style={[style, styles.imageFallback]}><Sparkles size={28} color="#E789A9" /></View>;
  return <Image source={{ uri }} style={style} contentFit="cover" transition={180} />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

function PortfolioCard({ item, onPress }: { item: ExploreFeedItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.trendCard} activeOpacity={0.9} onPress={onPress}>
      <RemoteImage uri={item.imageUrl} style={styles.trendImage} />
      <View style={styles.trendOverlay} />
      <View style={styles.trendContent}>
        <Text style={styles.trendTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.trendMeta}>{compact(item.likesCount)} lượt thích</Text>
        <View style={styles.whitePill}><Text style={styles.whitePillText}>Xem ngay</Text></View>
      </View>
    </TouchableOpacity>
  );
}

function ArtistCard({ artist, onPress }: { artist: ArtistDto; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.artistCard} activeOpacity={0.9} onPress={onPress}>
      <RemoteImage uri={artist.avatar || artist.coverImage} style={styles.artistAvatar} />
      <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
      {artist.reviewCount > 0 ? <View style={styles.ratingLine}><Star size={11} color="#FFA800" fill="#FFA800" /><Text style={styles.ratingText}>{artist.rating.toFixed(1)} ({artist.reviewCount})</Text></View> : <Text style={styles.unrated}>Chưa có đánh giá</Text>}
      <Text style={styles.fromPrice}>{artist.minPrice != null ? `Từ ${money(artist.minPrice)}` : money(null)}</Text>
      <View style={styles.bookButton}><Text style={styles.bookButtonText}>Đặt ngay</Text></View>
    </TouchableOpacity>
  );
}

function NearbyCard({ artist, onPress }: { artist: ArtistDto; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.nearCard} activeOpacity={0.9} onPress={onPress}>
      <View>
        <RemoteImage uri={artist.coverImage || artist.avatar} style={styles.nearImage} />
        {artist.reviewCount > 0 ? <View style={styles.ratingBadge}><Star size={10} color="#FFA800" fill="#FFA800" /><Text style={styles.ratingBadgeText}>{artist.rating.toFixed(1)}</Text></View> : null}
      </View>
      <View style={styles.nearBody}>
        <Text style={styles.nearName} numberOfLines={1}>{artist.name}</Text>
        {artist.city ? <View style={styles.locationLine}><MapPin size={11} color="#8D6674" /><Text style={styles.distance}>{artist.city}</Text></View> : null}
        <Text style={styles.nearPrice}>{artist.minPrice != null ? `Từ ${money(artist.minPrice)}` : money(null)}</Text>
        <View style={styles.nearButton}><Text style={styles.nearButtonText}>Đặt lịch</Text></View>
      </View>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const { artists, feed, isLoading, isRefreshing, artistsError, feedError, isFullError, refetch, searchQuery, setSearchQuery } = useExplore();
  const openArtist = (id: string) => router.push({ pathname: '/mua-detail', params: { id } });
  const openPost = (item: ExploreFeedItem) => router.push({ pathname: '/portfolio-feed', params: { muaId: item.muaId, portfolioId: item.id } });
  const topArtists = artists.filter((artist) => artist.reviewCount > 0).sort((a, b) => b.rating - a.rating);

  if (isLoading) return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large" color={PINK} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor={PINK} colors={[PINK]} />}
      >
        <View style={styles.topBar}>
          <View style={styles.searchBox}>
            <Search size={19} color="#655B64" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm trong danh sách đang hiển thị..."
              placeholderTextColor="#8E8790"
              style={styles.searchInput}
            />
          </View>
        </View>

        {isFullError ? <TouchableOpacity onPress={refetch} style={styles.fullError}><Text style={styles.errorTitle}>Không thể tải Khám phá</Text><Text style={styles.errorText}>Kiểm tra kết nối và chạm để thử lại.</Text></TouchableOpacity> : null}

        {!isFullError && feedError ? <InlineError message="Không tải được tác phẩm nổi bật." onRetry={refetch} /> : null}
        {!feedError && feed.length > 0 ? <>
          <SectionTitle>Xu hướng makeup nổi bật</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
            {feed.slice(0, 6).map((item) => <PortfolioCard key={item.id} item={item} onPress={() => openPost(item)} />)}
          </ScrollView>
        </> : null}

        {!isFullError && artistsError ? <InlineError message="Không tải được danh sách chuyên gia." onRetry={refetch} /> : null}
        {!artistsError && artists.length > 0 ? <>
          <SectionTitle>Chuyên gia nổi bật</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
            {artists.slice(0, 6).map((artist) => <ArtistCard key={artist.id} artist={artist} onPress={() => openArtist(artist.id)} />)}
          </ScrollView>
        </> : null}

        {topArtists.length > 0 ? <><SectionTitle>Top MUA được đánh giá cao</SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
          {topArtists.slice(0, 5).map((artist, index) => (
            <TouchableOpacity key={`top-${artist.id}`} style={styles.topCard} onPress={() => openArtist(artist.id)}>
              <RemoteImage uri={artist.coverImage || artist.avatar} style={styles.topImage} />
              <View style={styles.topShade} />
              <View style={styles.rank}><Text style={styles.rankText}>#{index + 1}</Text></View>
              <View style={styles.topCopy}><Text style={styles.topName}>{artist.name}</Text><Text style={styles.topMeta}>{artist.rating.toFixed(1)} · {compact(artist.reviewCount)} đánh giá</Text></View>
            </TouchableOpacity>
          ))}
        </ScrollView></> : null}

        {artists.some((artist) => artist.city) ? <><SectionTitle>Theo khu vực</SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
          {artists.filter((artist) => artist.city).slice(0, 6).map((artist) => <NearbyCard key={`area-${artist.id}`} artist={artist} onPress={() => openArtist(artist.id)} />)}
        </ScrollView></> : null}

        {!isFullError && !artistsError && !feedError && artists.length === 0 && feed.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Không có kết quả phù hợp</Text><Text style={styles.emptyText}>{searchQuery ? 'Thử từ khóa khác trong dữ liệu đang hiển thị.' : 'Hiện chưa có nội dung khám phá.'}</Text></View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <TouchableOpacity onPress={onRetry} style={styles.error}><Text style={styles.errorText}>{message} Chạm để thử lại.</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SOFT_PINK }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { paddingBottom: 128 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 15 },
  searchBox: { height: 46, flex: 1, borderRadius: 24, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9 },
  searchInput: { flex: 1, height: 46, paddingVertical: 0, fontSize: 13, color: '#33222B' }, bell: { width: 34, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  notification: { position: 'absolute', right: 13, top: 5, width: 18, height: 18, borderRadius: 9, backgroundColor: '#C22A35', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: SOFT_PINK }, notificationText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  categoryRow: { paddingHorizontal: 18, paddingVertical: 8, gap: 15 }, category: { width: 61, alignItems: 'center' }, categoryRing: { width: 57, height: 57, borderRadius: 29, borderWidth: 1.5, borderColor: '#F49AB9', padding: 3 }, categoryImage: { width: '100%', height: '100%', borderRadius: 26 }, categoryText: { marginTop: 6, fontSize: 11, fontWeight: '700', color: '#443039' },
  imageFallback: { backgroundColor: '#FFE4EC', alignItems: 'center', justifyContent: 'center' }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 18, marginTop: 29, marginBottom: 12 }, sectionTitle: { fontFamily: 'serif', fontSize: 23, lineHeight: 28, fontWeight: '800', color: '#351C2B' }, sectionAction: { fontSize: 12, color: PINK, fontWeight: '600' }, horizontal: { paddingHorizontal: 18, gap: 11 },
  trendCard: { width: 156, height: 205, borderRadius: 21, overflow: 'hidden', backgroundColor: '#EEE' }, trendImage: { width: '100%', height: '100%' }, trendOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,5,14,.22)' }, trendContent: { position: 'absolute', left: 13, right: 10, bottom: 11 }, trendTitle: { color: '#FFF', fontSize: 13, fontWeight: '800' }, trendMeta: { color: '#F4E9EE', fontSize: 10, marginTop: 2 }, whitePill: { backgroundColor: '#FFF', alignSelf: 'flex-start', borderRadius: 18, marginTop: 10, paddingVertical: 7, paddingHorizontal: 13 }, whitePillText: { fontSize: 10, color: PINK, fontWeight: '800' }, dots: { height: 25, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }, dotActive: { width: 15, height: 5, borderRadius: 4, backgroundColor: PINK }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#F0CADA' },
  artistCard: { width: 132, backgroundColor: '#FFF', borderRadius: 20, padding: 10, alignItems: 'center' }, artistAvatar: { width: 55, height: 55, borderRadius: 28 }, artistName: { marginTop: 7, fontSize: 12, fontWeight: '800', color: '#3D2933', maxWidth: 110 }, ratingLine: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }, ratingText: { fontSize: 10, color: '#51434A', fontWeight: '600' }, slotPill: { backgroundColor: '#FFF0F5', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6, marginTop: 9 }, slotText: { color: '#E5437D', fontSize: 9, fontWeight: '600' }, fromPrice: { fontSize: 10, fontWeight: '700', color: '#54434B', marginVertical: 8 }, bookButton: { width: '100%', backgroundColor: PINK, borderRadius: 18, paddingVertical: 7, alignItems: 'center' }, bookButtonText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  promo: { marginHorizontal: 18, marginTop: 34, height: 86, borderRadius: 20, backgroundColor: '#FF699B', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }, giftCircle: { width: 39, height: 39, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.2)', alignItems: 'center', justifyContent: 'center' }, promoCopy: { flex: 1, marginLeft: 10 }, promoTitle: { color: '#FFF', fontSize: 14, fontWeight: '800' }, promoText: { color: '#FFE8F0', fontSize: 10, marginTop: 2 }, promoButton: { backgroundColor: '#FFF', borderRadius: 22, paddingHorizontal: 17, paddingVertical: 13 }, promoButtonText: { color: '#FF5790', fontSize: 11, fontWeight: '700' },
  makeoverCard: { width: 260 }, makeoverImages: { height: 148, flexDirection: 'row', borderRadius: 20, overflow: 'hidden' }, makeoverHalf: { width: '50%', height: '100%' }, before: { position: 'absolute', left: 8, top: 8, backgroundColor: 'rgba(43,35,38,.65)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }, after: { position: 'absolute', right: 8, top: 8, backgroundColor: PINK, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }, compareText: { color: '#FFF', fontSize: 8, fontWeight: '700' }, makeoverCaption: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, paddingTop: 9 }, makeoverName: { flex: 1, fontSize: 12, color: '#3E2D35', fontWeight: '700' }, makeoverRating: { fontSize: 10, color: '#5F5057' },
  topCard: { width: 188, height: 132, borderRadius: 20, overflow: 'hidden' }, topImage: { width: '100%', height: '100%' }, topShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(31,14,21,.24)' }, rank: { position: 'absolute', top: 8, left: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFD400', alignItems: 'center', justifyContent: 'center' }, rankText: { color: '#FFF', fontWeight: '900', fontSize: 12 }, topCopy: { position: 'absolute', left: 14, right: 12, bottom: 12 }, topName: { color: '#FFF', fontWeight: '800', fontSize: 14 }, topMeta: { color: '#EEE', fontSize: 9, marginTop: 2 },
  serviceTile: { width: 112, minHeight: 103, borderRadius: 18, backgroundColor: '#FFE8EF', padding: 17, justifyContent: 'center' }, serviceName: { fontSize: 12, lineHeight: 16, color: '#462F39', fontWeight: '800', marginTop: 9 }, serviceMeta: { fontSize: 9, color: '#8A7680', marginTop: 2 },
  nearCard: { width: 148, backgroundColor: '#FFF', borderRadius: 19, overflow: 'hidden' }, nearImage: { width: '100%', height: 130 }, ratingBadge: { position: 'absolute', top: 7, right: 7, backgroundColor: '#FFF', flexDirection: 'row', gap: 3, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 10 }, ratingBadgeText: { fontSize: 9, fontWeight: '700', color: '#4C3F45' }, nearBody: { padding: 10 }, nearName: { fontSize: 13, fontWeight: '800', color: '#422D36' }, locationLine: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }, distance: { fontSize: 9, color: '#8D6674' }, nearPrice: { color: PINK, fontWeight: '800', fontSize: 11, marginTop: 8 }, nearButton: { backgroundColor: PINK, borderRadius: 13, paddingVertical: 7, alignItems: 'center', marginTop: 8 }, nearButtonText: { color: '#FFF', fontWeight: '700', fontSize: 10 },
  unrated: { color: '#7D6973', fontSize: 9, marginTop: 3 },
  error: { marginHorizontal: 18, marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#FFE2E7' },
  fullError: { marginHorizontal: 18, marginTop: 40, padding: 22, borderRadius: 16, backgroundColor: '#FFE2E7' },
  errorTitle: { color: '#8E1D3A', textAlign: 'center', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  errorText: { color: '#A42544', textAlign: 'center', fontSize: 12 },
  empty: { marginHorizontal: 18, marginTop: 48, padding: 24, alignItems: 'center' },
  emptyTitle: { color: '#442D38', fontSize: 16, fontWeight: '800' },
  emptyText: { color: '#7D6973', fontSize: 12, textAlign: 'center', marginTop: 7 },
});
