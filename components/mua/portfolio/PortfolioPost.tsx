import React, { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Image, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bookmark, CalendarDays, Heart, MapPin, MessageCircle, MoreVertical, Send, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BrandColors, Radius, Shadows, Spacing } from '../../../constants/theme';
import type { PortfolioItemDto } from '../../../types/portfolio';

type FeedPostItem = PortfolioItemDto & {
  authorAvatar?: string;
  authorId?: string;
  location?: string;
  city?: string;
  tags?: string[];
  hashtags?: string[];
  isFollowing?: boolean;
  rating?: number;
  reviewCount?: number;
  yearsOfExp?: number;
};

interface PortfolioPostProps {
  item: FeedPostItem;
  onLike?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onOptions?: () => void;
  onFollow?: () => void;
  onAuthorPress?: () => void;
  onComment?: () => void;
  onImagePress?: (uri: string) => void;
  onAddService?: () => void;
}

function PortfolioPostComponent({ item, onLike, onSave, onShare, onOptions, onFollow, onAuthorPress, onComment, onImagePress, onAddService }: PortfolioPostProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, true>>({});

  const authorName = item.authorName || 'Chuyên gia';
  const authorAvatar = item.authorAvatarUrl || item.authorAvatar;
  const location = item.location || item.city || 'Chưa cập nhật';
  const images = useMemo(
    () => (item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [])
      .filter((uri): uri is string => Boolean(uri?.trim()) && !failedImages[uri]),
    [failedImages, item.imageUrl, item.imageUrls],
  );

  const hashtags = useMemo(
    () => (item.hashtags?.length ? item.hashtags : item.tags || []).filter(Boolean).map(tag => `#${tag.replace(/^#/, '').replace(/\s+/g, '')}`).join(' '),
    [item.hashtags, item.tags],
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth > 0) setCarouselWidth(nextWidth);
  }, []);

  const handleMomentumEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (carouselWidth) setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / carouselWidth));
  }, [carouselWidth]);

  const handleAuthorPress = onAuthorPress || (() => {
    router.push({ pathname: '/mua-detail', params: { id: item.muaId || item.authorId || item.id } });
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.authorInfo} activeOpacity={0.75} onPress={handleAuthorPress}>
          {authorAvatar ? <Image source={{ uri: authorAvatar }} style={styles.avatar} /> : (
            <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarInitial}>{authorName.charAt(0).toUpperCase()}</Text></View>
          )}
          <View style={styles.authorCopy}>
            <Text style={styles.authorName} numberOfLines={1}>{authorName}</Text>
            <View style={styles.authorMeta}>
              <Text style={styles.authorRole} numberOfLines={1}>MUA chuyên nghiệp</Text>
              <Text style={styles.metaDivider}>·</Text>
              <MapPin size={14} color={BrandColors.textMuted} />
              <Text style={styles.location} numberOfLines={1}>{location}</Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.followButton, item.isFollowing && styles.followingButton]} onPress={onFollow} disabled={!onFollow} activeOpacity={0.75}>
            <Text style={[styles.followText, item.isFollowing && styles.followingText]}>{item.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton} onPress={onOptions} disabled={!onOptions} hitSlop={8}>
            <MoreVertical size={23} color={BrandColors.textDark} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.carouselFrame} onLayout={handleLayout}>
        {carouselWidth > 0 && images.length > 0 ? (
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumEnd}
            keyExtractor={(uri, index) => `${uri}-${index}`}
            renderItem={({ item: uri }) => (
              <TouchableOpacity activeOpacity={0.96} onPress={() => onImagePress?.(uri)} style={{ width: carouselWidth }}>
                <Image
                  source={{ uri }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={() => setFailedImages(current => ({ ...current, [uri]: true }))}
                />
              </TouchableOpacity>
            )}
          />
        ) : <View style={styles.imagePlaceholder}><Sparkles size={34} color={BrandColors.borderPink} /></View>}
        {images.length > 1 ? <View style={styles.counter} pointerEvents="none"><Text style={styles.counterText}>{activeIndex + 1}/{images.length}</Text></View> : null}
      </View>

      {images.length > 1 ? (
        <View style={styles.pagination}>{images.map((_, index) => <View key={index} style={[styles.dot, index === activeIndex && styles.activeDot]} />)}</View>
      ) : null}

      {item.service ? (
        <View style={styles.serviceCard}>
          <View style={styles.serviceIcon}><Sparkles size={20} color={BrandColors.textWhite} /></View>
          <View style={styles.serviceCopy}>
            <Text style={styles.serviceName} numberOfLines={1}>{item.service.serviceName || item.service.name}</Text>
            <Text style={styles.serviceDescription} numberOfLines={1}>{item.service.description || 'Dịch vụ trang điểm chuyên nghiệp'}</Text>
          </View>
          <Text style={styles.servicePrice} numberOfLines={1}>{Number(item.service.price || 0).toLocaleString('vi-VN')}đ</Text>
          <TouchableOpacity style={styles.bookButton} onPress={onAddService} activeOpacity={0.82}>
            <CalendarDays size={17} color={BrandColors.textWhite} />
            <Text style={styles.bookButtonText}>Đặt dịch vụ</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.actionsContainer}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={onLike} style={styles.action} hitSlop={6}>
            <Heart size={27} color={item.isLiked ? BrandColors.accentPink : BrandColors.textDark} fill={item.isLiked ? BrandColors.accentPink : 'transparent'} />
            <Text style={styles.actionCount}>{(item.likesCount || 0).toLocaleString('vi-VN')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onComment} style={styles.action} hitSlop={6}>
            <MessageCircle size={27} color={BrandColors.textDark} />
            <Text style={styles.actionCount}>{(item.commentsCount || 0).toLocaleString('vi-VN')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onShare} style={styles.iconAction} hitSlop={6}><Send size={26} color={BrandColors.textDark} /></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onSave} style={styles.iconAction} hitSlop={6}>
          <Bookmark size={27} color={BrandColors.textDark} fill={item.isSaved ? BrandColors.textDark : 'transparent'} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.captionText}>
          <Text style={styles.authorNameInline}>{authorName}  </Text>
          {item.title ? `${item.title}${item.description ? ' - ' : ''}` : ''}{item.description || ''}
        </Text>
        {hashtags ? <Text style={styles.tagsText}>{hashtags}</Text> : null}
        {item.createdAt ? <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text> : null}
      </View>
    </View>
  );
}

export const PortfolioPost = memo(PortfolioPostComponent);

const styles = StyleSheet.create({
  container: { backgroundColor: BrandColors.bgCard, marginBottom: Spacing.md, paddingBottom: Spacing.base },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.sm },
  authorInfo: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 10, borderWidth: 1, borderColor: BrandColors.borderLight },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.bgPink },
  avatarInitial: { color: BrandColors.accentPink, fontSize: 18, fontWeight: '800' },
  authorCopy: { flex: 1, minWidth: 0 },
  authorName: { fontSize: 16, fontWeight: '800', color: BrandColors.textDark },
  authorMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3, minWidth: 0 },
  authorRole: { color: BrandColors.textMuted, fontSize: 12, flexShrink: 1 },
  metaDivider: { color: BrandColors.textMuted, marginHorizontal: 5 },
  location: { color: BrandColors.textMuted, fontSize: 12, marginLeft: 2, flexShrink: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  followButton: { borderWidth: 1.5, borderColor: BrandColors.accentPink, borderRadius: Radius.full, paddingHorizontal: 14, height: 36, justifyContent: 'center', backgroundColor: BrandColors.bgCard },
  followingButton: { backgroundColor: BrandColors.bgPink },
  followText: { color: BrandColors.accentPink, fontSize: 13, fontWeight: '800' },
  followingText: { color: BrandColors.accentRose },
  moreButton: { paddingLeft: 8, paddingVertical: 7 },
  carouselFrame: { marginHorizontal: Spacing.base, borderRadius: Radius.lg, overflow: 'hidden', aspectRatio: 0.78, backgroundColor: BrandColors.bgPinkLight },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  counter: { position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(24,18,22,0.72)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  counterText: { color: BrandColors.textWhite, fontSize: 13, fontWeight: '700' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 30, gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: BrandColors.textLight },
  activeDot: { backgroundColor: BrandColors.accentPink, width: 8, height: 8 },
  serviceCard: { marginHorizontal: Spacing.base, marginTop: 2, minHeight: 76, flexDirection: 'row', alignItems: 'center', borderRadius: Radius.base, padding: 10, backgroundColor: BrandColors.bgPinkLight, ...Shadows.sm },
  serviceIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: BrandColors.accentPink, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  serviceCopy: { flex: 1, minWidth: 46, marginRight: 6 },
  serviceName: { color: BrandColors.textDark, fontSize: 13, fontWeight: '800' },
  serviceDescription: { color: BrandColors.textMuted, fontSize: 10, marginTop: 3 },
  servicePrice: { color: BrandColors.accentPink, fontSize: 13, fontWeight: '900', marginRight: 7, flexShrink: 0 },
  bookButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 42, paddingHorizontal: 9, borderRadius: Radius.md, backgroundColor: BrandColors.accentPink, flexShrink: 0 },
  bookButtonText: { color: BrandColors.textWhite, fontSize: 11, fontWeight: '800' },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: 15, paddingBottom: 10 },
  leftActions: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  iconAction: { alignItems: 'center', justifyContent: 'center' },
  actionCount: { color: BrandColors.textDark, fontSize: 15, fontWeight: '700' },
  contentContainer: { paddingHorizontal: Spacing.base },
  captionText: { color: BrandColors.textDark, fontSize: 14, lineHeight: 21 },
  authorNameInline: { fontWeight: '800' },
  tagsText: { color: BrandColors.accentPink, fontSize: 14, lineHeight: 20, marginTop: 4 },
  dateText: { color: BrandColors.textMuted, fontSize: 12, marginTop: 10 },
});
