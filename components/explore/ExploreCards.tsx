import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Clock3, Heart, MapPin, Sparkles, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ImageStyle, StyleProp } from 'react-native';
import type { ExploreArtist, ExplorePost, ExploreService } from '../../types/explore';

export const EXPLORE_PINK = '#C5165D';
export const formatExplorePrice = (value?: number | null) => value != null ? `${Math.round(value).toLocaleString('vi-VN')}đ` : 'Liên hệ';
const compact = (count: number) => count >= 1000 ? `${(count / 1000).toFixed(1).replace('.0', '')}K` : String(count);

export function ExplorePhoto({ uri, style }: { uri?: string; style: StyleProp<ImageStyle> }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!uri || uri === failed) return <View style={[style, styles.fallback]}><Sparkles size={26} color="#D67C9F" /></View>;
  return <Image source={{ uri }} style={style} contentFit="cover" transition={160} recyclingKey={uri} onError={() => setFailed(uri)} />;
}
export function ExploreSection({ title, subtitle, onMore }: { title: string; subtitle?: string; onMore?: () => void }) {
  return <View style={styles.section}><View style={{ flex: 1 }}><Text style={styles.sectionTitle}>{title}</Text>
    {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}</View>
    {onMore ? <TouchableOpacity accessibilityRole="button" onPress={onMore} style={styles.more}><Text style={styles.moreText}>Xem tất cả</Text><ArrowRight size={15} color={EXPLORE_PINK} /></TouchableOpacity> : null}</View>;
}
export function ExplorePostCard({ item, onPress, featured = false }: { item: ExplorePost; onPress: () => void; featured?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Xem tác phẩm ${item.title || 'makeup'} của ${item.authorName}`} activeOpacity={0.9}
    onPress={onPress} style={[styles.postCard, featured && styles.featuredCard]}>
    <View><ExplorePhoto uri={item.imageUrls[0]} style={featured ? styles.featuredPhoto : styles.postPhoto} />
      {item.imageUrls.length > 1 ? <View style={styles.imageCount}><Text style={styles.imageCountText}>{item.imageUrls.length} ảnh</Text></View> : null}
      {featured ? <LinearGradient colors={['transparent', 'rgba(44,14,29,.8)']} style={styles.featuredShade}>
        <Text style={styles.featuredTitle} numberOfLines={2}>{item.title || item.tags[0] || 'Tác phẩm makeup'}</Text>
        <Text style={styles.featuredAuthor} numberOfLines={1}>{item.authorName}</Text>
      </LinearGradient> : null}
    </View>
    {!featured ? <View style={styles.postBody}><Text style={styles.postTitle} numberOfLines={2}>{item.title || item.tags[0] || 'Tác phẩm makeup'}</Text>
      <View style={styles.postAuthor}><ExplorePhoto uri={item.authorAvatar} style={styles.smallAvatar} /><Text style={styles.authorName} numberOfLines={1}>{item.authorName}</Text>
        <Heart size={12} color="#9F7486" /><Text style={styles.count}>{compact(item.likesCount)}</Text></View>
      {item.tags.length > 0 ? <Text style={styles.tagLine} numberOfLines={1}>{item.tags.slice(0, 2).map(tag => `#${tag.replace(/^#+/, '')}`).join('  ')}</Text> : null}
    </View> : null}
  </TouchableOpacity>;
}
export function ExploreArtistCard({ item, onPress, horizontal = false }: { item: ExploreArtist; onPress: () => void; horizontal?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" onPress={onPress} activeOpacity={0.9} style={[styles.artistCard, horizontal && styles.horizontalArtist]}>
    <ExplorePhoto uri={item.coverUrl || item.avatarUrl} style={styles.artistCover} />
    <View style={styles.artistBody}><ExplorePhoto uri={item.avatarUrl} style={styles.artistAvatar} />
      <Text style={styles.artistName} numberOfLines={1}>{item.name}</Text>
      {item.city ? <View style={styles.metaRow}><MapPin size={12} color="#8C6578" /><Text style={styles.meta} numberOfLines={1}>{item.city}</Text></View> : null}
      {item.reviewCount > 0 ? <View style={styles.metaRow}><Star size={12} color="#D28A18" fill="#D28A18" /><Text style={styles.rating}>{item.rating.toFixed(1)} <Text style={styles.meta}>({item.reviewCount} đánh giá)</Text></Text></View> : <Text style={styles.meta}>Chưa có đánh giá</Text>}
      {item.styles.length ? <Text style={styles.artistStyles} numberOfLines={1}>{item.styles.slice(0, 2).join(' · ')}</Text> : null}
      <View style={styles.artistBottom}><Text style={styles.price} numberOfLines={1}>{item.minPrice != null ? `Từ ${formatExplorePrice(item.minPrice)}` : 'Liên hệ'}</Text><ArrowRight size={17} color={EXPLORE_PINK} /></View>
    </View>
  </TouchableOpacity>;
}
export function ExploreServiceCard({ item, onPress, horizontal = false }: { item: ExploreService; onPress: () => void; horizontal?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" onPress={onPress} activeOpacity={0.9} style={[styles.serviceCard, horizontal && styles.horizontalService]}>
    <ExplorePhoto uri={item.imageUrls[0] || item.imageUrl} style={styles.servicePhoto} />
    <View style={styles.serviceBody}><Text style={styles.postTitle} numberOfLines={2}>{item.name}</Text><Text style={styles.meta} numberOfLines={1}>{item.authorName}</Text>
      <View style={styles.metaRow}><Clock3 size={12} color="#8C6578" /><Text style={styles.meta}>{item.durationMinutes} phút</Text></View>
      <Text style={styles.price}>{formatExplorePrice(item.price)}</Text>
    </View>
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 18, marginTop: 26, marginBottom: 13, flexDirection: 'row', alignItems: 'center', gap: 10 }, sectionTitle: { color: '#351C2B', fontWeight: '800', fontSize: 20 }, sectionSubtitle: { marginTop: 4, color: '#8A6C7B', fontSize: 11, lineHeight: 17 }, more: { flexDirection: 'row', gap: 4, paddingVertical: 12, alignItems: 'center' }, moreText: { color: EXPLORE_PINK, fontSize: 12, fontWeight: '700' },
  fallback: { backgroundColor: '#F9E3EC', alignItems: 'center', justifyContent: 'center' }, postCard: { borderRadius: 18, overflow: 'hidden', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F0E1E8', flex: 1 }, postPhoto: { width: '100%', aspectRatio: 0.82 }, featuredCard: { width: 228, flex: undefined, borderRadius: 22 }, featuredPhoto: { width: '100%', height: 280 }, featuredShade: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 17, paddingTop: 55 }, featuredTitle: { color: '#FFF', fontSize: 17, fontWeight: '800', lineHeight: 23 }, featuredAuthor: { color: '#FBE1ED', marginTop: 5, fontSize: 12 },
  imageCount: { position: 'absolute', right: 9, top: 9, backgroundColor: 'rgba(39,18,31,.48)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 4 }, imageCountText: { color: '#FFF', fontSize: 10, fontWeight: '600' }, postBody: { padding: 10 }, postTitle: { color: '#39232E', fontSize: 13, fontWeight: '700', lineHeight: 19, marginBottom: 6 }, postAuthor: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }, smallAvatar: { width: 20, height: 20, borderRadius: 10 }, authorName: { flex: 1, fontSize: 10, color: '#806072' }, count: { fontSize: 10, color: '#806072' }, tagLine: { color: '#B56388', fontSize: 10, marginTop: 8 },
  artistCard: { borderRadius: 18, backgroundColor: '#FFF', overflow: 'hidden', borderWidth: 1, borderColor: '#F0E1E8', flex: 1 }, horizontalArtist: { width: 190, flex: undefined }, artistCover: { width: '100%', height: 105 }, artistBody: { paddingHorizontal: 12, paddingBottom: 13 }, artistAvatar: { width: 48, height: 48, borderRadius: 24, marginTop: -24, marginBottom: 7, borderWidth: 3, borderColor: '#FFF' }, artistName: { color: '#39232E', fontSize: 14, fontWeight: '800', marginBottom: 5 }, metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 }, meta: { color: '#8B6E7D', fontSize: 10, lineHeight: 16, flexShrink: 1 }, rating: { color: '#725262', fontSize: 11, fontWeight: '600' }, artistStyles: { color: '#A25D7D', fontSize: 10, marginTop: 4 }, artistBottom: { flexDirection: 'row', gap: 5, justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }, price: { color: EXPLORE_PINK, fontSize: 13, fontWeight: '800', flexShrink: 1 },
  serviceCard: { borderRadius: 18, overflow: 'hidden', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F0E1E8', flex: 1 }, horizontalService: { width: 185, flex: undefined }, servicePhoto: { width: '100%', height: 138 }, serviceBody: { padding: 12, gap: 4 },
});
