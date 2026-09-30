import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bookmark, CalendarDays, Heart, MessageCircle, MoreVertical, Send, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BrandColors, Radius, Spacing } from '../../../constants/theme';
import { PostCaption } from '../../feed/PostCaption';
import { formatFeedCount, formatPostTime, normalizeHashtags } from '../../../utils/feedDisplay';
import { AppAlert } from '../../ui/dialogStore';
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

export interface PortfolioPostProps {
  item: FeedPostItem;
  compact?: boolean;
  onLike?: () => void;
  onSave?: () => void;
  onOptions?: () => void;
  onFollow?: () => void | Promise<void>;
  onShare?: () => void | Promise<void>;
  sharesCount?: number;
  onAuthorPress?: () => void;
  onComment?: () => void;
  onImagePress?: (uri: string) => void;
  onAddService?: () => void;
}

function PortfolioPostComponent({ compact = true, item, onLike, onSave, onOptions, onFollow, onShare, sharesCount, onAuthorPress, onComment, onImagePress, onAddService }: PortfolioPostProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, true>>({});
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);

  const authorName = item.authorName || 'Chuyên gia';
  const authorAvatar = item.authorAvatarUrl || item.authorAvatar;
  const time = formatPostTime(item.createdAt);
  const caption = [item.title, item.description].filter(value => value?.trim()).join('\n');
  const followLock = useRef(false);
  const [followingBusy, setFollowingBusy] = useState(false);
  // TODO: wire follow only when a real backend contract exists; never toggle local fake follow state.
  const follow = async () => {
    if (!onFollow || followLock.current) return;
    followLock.current = true; setFollowingBusy(true);
    try { await onFollow(); }
    catch (error) { AppAlert.error(error); }
    finally { followLock.current = false; setFollowingBusy(false); }
  };
  const images = useMemo(
    () => (item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [])
      .filter((uri): uri is string => Boolean(uri?.trim()) && !failedImages[uri]),
    [failedImages, item.imageUrl, item.imageUrls],
  );

  const hashtags = useMemo(
    () => normalizeHashtags(item.hashtags?.length ? item.hashtags : item.tags || []),
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
    <View style={[styles.container, compact && compactStyles.container]} testID="post-card">
      <View style={[styles.header, compact && compactStyles.header]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Hồ sơ ${authorName}`} style={styles.authorInfo} activeOpacity={0.75} onPress={handleAuthorPress}>
          {authorAvatar && failedAvatar !== authorAvatar ? <Image source={{ uri: authorAvatar }} style={[styles.avatar, compact && compactStyles.avatar]} onError={() => setFailedAvatar(authorAvatar)} /> : (
            <View style={[styles.avatar, compact && compactStyles.avatar, styles.avatarFallback]}><Text style={styles.avatarInitial}>{authorName.charAt(0).toUpperCase()}</Text></View>
          )}
          <View style={styles.authorCopy}>
            <Text style={styles.authorName} numberOfLines={1}>{authorName}</Text>
            {time ? <Text style={styles.authorMeta} numberOfLines={1}>· {time}</Text> : null}
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.followButton, compact && compactStyles.followButton, item.isFollowing && styles.followingButton, !onFollow && styles.unsupportedButton]} onPress={() => { void follow(); }} disabled={!onFollow || followingBusy} accessibilityRole="button" accessibilityLabel={item.isFollowing ? 'Đang theo dõi' : 'Theo dõi'} accessibilityHint={!onFollow ? 'Tính năng theo dõi chưa được hỗ trợ' : undefined} accessibilityState={{ disabled: !onFollow || followingBusy, busy: followingBusy }} activeOpacity={0.75}>
            {followingBusy ? <ActivityIndicator color={BrandColors.primaryPink} /> : <Text style={[styles.followText, item.isFollowing && styles.followingText]}>{item.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton} onPress={onOptions} disabled={!onOptions} accessibilityRole="button" accessibilityLabel="Tùy chọn bài viết">
            <MoreVertical size={23} color={BrandColors.textDark} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.captionContainer}><PostCaption key={`${item.id || item.portfolioId}-${caption}`} text={compact ? item.description || '' : caption} title={compact ? item.title : undefined} compact={compact} /></View>

      <View testID="post-gallery" style={[styles.carouselFrame, compact && compactStyles.carouselFrame]} onLayout={handleLayout}>
        {carouselWidth > 0 && images.length > 0 ? (
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumEnd}
            keyExtractor={(uri, index) => `${uri}-${index}`}
            renderItem={({ item: uri, index }) => (
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Xem ảnh ${index + 1}`} activeOpacity={0.96} onPress={() => onImagePress?.(uri)} style={{ width: carouselWidth }}>
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
        {images.length > 1 ? <View style={[styles.counter, compact && compactStyles.counter]} pointerEvents="none"><Text style={[styles.counterText, compact && compactStyles.counterText]}>{Math.min(activeIndex + 1, images.length)}/{images.length}</Text></View> : null}
      </View>

      {images.length > 1 ? (
        <View style={[styles.pagination, compact && compactStyles.pagination]}>{images.map((_, index) => <View key={index} style={[styles.dot, compact && compactStyles.dot, index === activeIndex && styles.activeDot, compact && index === activeIndex && compactStyles.activeDot]} />)}</View>
      ) : null}

      {item.service ? (
        <View style={[styles.serviceCard, compact && compactStyles.serviceCard]}>
          <View style={[styles.serviceCopy, compact && compactStyles.serviceCopy]}>
            <Text style={styles.serviceName} numberOfLines={1}>{item.service.serviceName || item.service.name}</Text>
            {compact ? <Text style={styles.servicePrice} numberOfLines={1}>{Number(item.service.price || 0).toLocaleString('vi-VN')}đ</Text> : null}
            <Text style={styles.serviceDescription} numberOfLines={1}>{item.service.description || 'Dịch vụ trang điểm chuyên nghiệp'}</Text>
          </View>
          {!compact ? <Text style={styles.servicePrice} numberOfLines={1}>{Number(item.service.price || 0).toLocaleString('vi-VN')}đ</Text> : null}
          {onAddService ? (
            <TouchableOpacity style={[styles.bookButton, compact && compactStyles.bookButton]} onPress={onAddService} accessibilityRole="button" accessibilityLabel="Đặt dịch vụ" activeOpacity={0.82}>
              {!compact ? <CalendarDays size={17} color={BrandColors.textWhite} /> : null}
              <Text style={styles.bookButtonText}>Đặt dịch vụ</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.actionsContainer, compact && compactStyles.actionsContainer]}>
        <View style={[styles.leftActions, compact && compactStyles.leftActions]}>
          <TouchableOpacity onPress={onLike} disabled={!onLike} accessibilityRole="button" accessibilityLabel={item.isLiked ? 'Bỏ thích bài viết' : 'Thích bài viết'} style={[styles.action, compact && compactStyles.action]}>
            <Heart size={compact ? 25 : 27} color={item.isLiked ? BrandColors.primaryPink : BrandColors.textMuted} fill={item.isLiked ? BrandColors.primaryPink : 'transparent'} />
            <Text style={[styles.actionCount, compact && compactStyles.actionCount]}>{formatFeedCount(item.likesCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onComment} disabled={!onComment} accessibilityRole="button" accessibilityLabel="Bình luận" style={[styles.action, compact && compactStyles.action]}>
            <MessageCircle size={compact ? 25 : 27} color={BrandColors.textMuted} />
            <Text style={[styles.actionCount, compact && compactStyles.actionCount]}>{formatFeedCount(item.commentsCount)}</Text>
          </TouchableOpacity>
          {onShare ? <TouchableOpacity onPress={() => { void onShare(); }} style={[styles.action, compact && compactStyles.action]} accessibilityRole="button" accessibilityLabel="Chia sẻ bài viết">
            <Send size={25} color={BrandColors.textMuted} />
            {sharesCount !== undefined ? <Text style={[styles.actionCount, compact && compactStyles.actionCount]}>{formatFeedCount(sharesCount)}</Text> : null}
          </TouchableOpacity> : null}
        </View>
        <TouchableOpacity onPress={onSave} disabled={!onSave} accessibilityRole="button" accessibilityLabel={item.isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'} style={styles.iconAction}>
          <Bookmark size={compact ? 25 : 27} color={item.isSaved ? BrandColors.primaryPink : BrandColors.textMuted} fill={item.isSaved ? BrandColors.primaryPink : 'transparent'} />
        </TouchableOpacity>
      </View>

      {hashtags.length ? <View style={[styles.hashtags, compact && compactStyles.hashtags]} testID="post-hashtags">{hashtags.map(tag => <View key={tag} style={[styles.tag, compact && compactStyles.tag]}><Text style={styles.tagsText}>{tag}</Text></View>)}</View> : null}
    </View>
  );
}

export const PortfolioPost = memo(PortfolioPostComponent);

const styles = StyleSheet.create({
  container: { backgroundColor: BrandColors.bgCard, marginHorizontal: Spacing.base, marginBottom: Spacing.base, paddingBottom: Spacing.base, borderRadius: Radius.xl, borderWidth: 1, borderColor: BrandColors.borderDivider, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.sm },
  authorInfo: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 10, borderWidth: 1, borderColor: BrandColors.borderLight },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.bgPink },
  avatarInitial: { color: BrandColors.accentPink, fontSize: 18, fontWeight: '800' },
  authorCopy: { flex: 1, minWidth: 0 },
  authorName: { fontSize: 16, fontWeight: '700', color: BrandColors.textDark },
  authorMeta: { color: BrandColors.textMuted, fontSize: 12, marginTop: 3 },
  captionContainer: { paddingHorizontal: Spacing.base },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  followButton: { borderWidth: 1.5, borderColor: BrandColors.accentPink, borderRadius: Radius.full, paddingHorizontal: 12, height: 42, justifyContent: 'center', backgroundColor: BrandColors.bgCard },
  followingButton: { backgroundColor: BrandColors.bgPink },
  unsupportedButton: { opacity: 0.5 },
  followText: { color: BrandColors.accentPink, fontSize: 13, fontWeight: '800' },
  followingText: { color: BrandColors.accentRose },
  moreButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  carouselFrame: { marginHorizontal: Spacing.base, borderRadius: Radius.lg, overflow: 'hidden', aspectRatio: 1.5, backgroundColor: BrandColors.bgPinkLight },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  counter: { position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(24,18,22,0.72)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  counterText: { color: BrandColors.textWhite, fontSize: 13, fontWeight: '700' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 30, gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: BrandColors.textLight },
  activeDot: { backgroundColor: BrandColors.accentPink, width: 8, height: 8 },
  serviceCard: { marginHorizontal: Spacing.base, marginTop: Spacing.md, minHeight: 76, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center', borderRadius: Radius.base, padding: 10, backgroundColor: BrandColors.bgPinkLight },
  serviceCopy: { flexGrow: 1, flexShrink: 1, flexBasis: 120, minWidth: 0 },
  serviceName: { color: BrandColors.textDark, fontSize: 13, fontWeight: '800' },
  serviceDescription: { color: BrandColors.textMuted, fontSize: 10, marginTop: 3 },
  servicePrice: { color: BrandColors.accentPink, fontSize: 13, fontWeight: '900', marginRight: 7, flexShrink: 0 },
  bookButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 44, paddingHorizontal: 12, borderRadius: Radius.md, backgroundColor: BrandColors.accentPink, flexShrink: 0 },
  bookButtonText: { color: BrandColors.textWhite, fontSize: 11, fontWeight: '800' },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: 15, paddingBottom: 10 },
  leftActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44, minWidth: 44 },
  iconAction: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  actionCount: { color: BrandColors.textDark, fontSize: 15, fontWeight: '700' },
  hashtags: { paddingHorizontal: Spacing.base, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: { maxWidth: '100%', backgroundColor: BrandColors.bgPink, borderRadius: Radius.lg, paddingHorizontal: 12, paddingVertical: 7 },
  tagsText: { color: BrandColors.primaryPink, fontSize: 13, lineHeight: 20 },
});

// Shared social-feed layout; callbacks remain owned by each screen.
const compactStyles = StyleSheet.create({
  container: { width: '100%', maxWidth: 640, alignSelf: 'center', marginHorizontal: 0, marginBottom: 8, paddingBottom: 10, borderRadius: 0, borderWidth: 0, borderBottomWidth: StyleSheet.hairlineWidth },
  header: { paddingVertical: 10, gap: 6 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  followButton: { height: 32, paddingHorizontal: 10, borderWidth: 1 },
  carouselFrame: { marginHorizontal: 0, borderRadius: 0, aspectRatio: 4 / 5, maxHeight: 600 },
  counter: { top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 4 },
  counterText: { fontSize: 11 },
  pagination: { height: 18, gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  activeDot: { width: 6, height: 6 },
  serviceCard: { marginTop: 8, minHeight: 68, flexWrap: 'nowrap', gap: 8, padding: 10, borderRadius: 14 },
  serviceCopy: { flex: 1, flexBasis: 0, minWidth: 0 },
  bookButton: { paddingHorizontal: 10, minHeight: 36 },
  actionsContainer: { paddingTop: 8, paddingBottom: 0 },
  leftActions: { gap: 18 },
  action: { gap: 4 },
  actionCount: { fontSize: 14 },
  hashtags: { marginTop: 4, gap: 10 },
  tag: { backgroundColor: 'transparent', borderRadius: 0, paddingHorizontal: 0, paddingVertical: 0 },
});
