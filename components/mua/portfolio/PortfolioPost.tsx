import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { Heart, MessageCircle, Bookmark, MoreVertical, Plus } from 'lucide-react-native';
import { BrandColors } from '../../../constants/theme';

const { width } = Dimensions.get('window');

interface PortfolioPostProps {
  item: any;
  onLike?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onOptions?: () => void;
  onAuthorPress?: () => void;
  onComment?: () => void;
  onImagePress?: (uri: string) => void;
  onAddService?: () => void;
}

export const PortfolioPost: React.FC<PortfolioPostProps> = ({
  item,
  onLike,
  onSave,
  onShare,
  onOptions,
  onAuthorPress,
  onComment,
  onImagePress,
  onAddService,
}) => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const authorName = item.authorName || 'Chuyên gia';
  const authorAvatar = item.authorAvatarUrl || item.authorAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200';

  const onScroll = (e: any) => {
    const scrollPosition = e.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  let images = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : (item.imageUrl ? [item.imageUrl] : []);
  images = images.filter((uri: string) => uri && uri.trim().length > 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.authorInfo} 
          activeOpacity={0.7} 
          onPress={onAuthorPress ? onAuthorPress : () => router.push({ pathname: '/mua-detail', params: { id: item.muaId || item.authorId || item.id } })}
        >
          <Image source={{ uri: authorAvatar }} style={styles.avatar} />
          <View>
            <Text style={styles.authorName}>{authorName}</Text>
            {item.isNewMuaBoost && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>✨ MUA MỚI NỔI</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        {onOptions && (<TouchableOpacity onPress={onOptions} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><MoreVertical size={20} color="#22152B" /></TouchableOpacity>)}
      </View>

      {/* Image Carousel */}
      <View style={styles.imageContainer}>
        {images.length > 0 ? (
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item: uri }) => (
              <TouchableOpacity activeOpacity={0.95} onPress={() => onImagePress?.(uri)}>
                <Image source={{ uri }} style={[styles.image, { width }]} resizeMode="cover" />
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={[styles.image, { width, backgroundColor: '#EEE' }]} />
        )}
        {images.length > 1 && (
          <View style={styles.pagination} pointerEvents="none">
            {images.map((_: string, i: number) => (
              <View key={i} style={[styles.dot, i === activeIndex && styles.activeDot]} />
            ))}
          </View>
        )}
        {item.service && (
          <TouchableOpacity
            style={styles.serviceOverlay}
            activeOpacity={0.9}
            onPress={onAddService}
          >
            <View style={styles.serviceOverlayText}>
              <Text style={styles.serviceOverlayLabel}>DỊCH VỤ</Text>
              <Text style={styles.serviceOverlayName} numberOfLines={1}>
                {item.service.serviceName || item.service.name}
              </Text>
            </View>
            <Text style={styles.serviceOverlayPrice}>
              {Number(item.service.price || 0).toLocaleString('vi-VN')}đ
            </Text>
            <Plus size={16} color={BrandColors.accentPink} />
          </TouchableOpacity>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={onLike} style={styles.actionIcon}>
            <Heart size={24} color={item.isLiked ? BrandColors.accentPink : "#22152B"} fill={item.isLiked ? BrandColors.accentPink : "transparent"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onComment} style={styles.actionIcon}>
            <MessageCircle size={24} color="#22152B" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onSave} style={styles.actionIcon}>
          <Bookmark size={24} color={item.isSaved ? "#22152B" : "#22152B"} fill={item.isSaved ? "#22152B" : "transparent"} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.likesText}>{(item.likesCount || 0).toLocaleString('vi-VN')} lượt thích</Text>
        <TouchableOpacity onPress={onComment}>
          <Text style={styles.commentsText}>Xem {item.commentsCount || 0} bình luận</Text>
        </TouchableOpacity>
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>
            <Text style={styles.authorNameInline}>{authorName} </Text>
            {item.title ? item.title + " - " : ''}
            {item.description}
          </Text>
        </View>

        {(item.tags && item.tags.length > 0) && (
          <Text style={styles.tagsText}>
            {item.tags.map((t: string) => "#" + t.replace(/\s+/g, '')).join(' ')}
          </Text>
        )}

        <Text style={styles.dateText}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  badgeContainer: {
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
    borderWidth: 0.5,
    borderColor: BrandColors.accentPink,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.accentPink,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22152B',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4/5,
    backgroundColor: '#F8F8F8',
  },
  image: {
    height: '100%',
  },
  serviceOverlay: {
    position: 'absolute',
    right: 12,
    bottom: 14,
    maxWidth: '82%',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 24,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.94)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },
  serviceOverlayText: { flexShrink: 1 },
  serviceOverlayLabel: { fontSize: 9, color: '#8E8E8E', fontWeight: '700' },
  serviceOverlayName: { fontSize: 12, color: BrandColors.accentPink, fontWeight: '700' },
  serviceOverlayPrice: { fontSize: 12, color: '#22152B', fontWeight: '800' },
  pagination: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: BrandColors.accentPink,
    width: 6,
    height: 6,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionIcon: {
    marginRight: 16,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  likesText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#22152B',
    marginBottom: 6,
  },
  commentsText: { color: '#8E8E8E', fontSize: 13, marginBottom: 8 },
  captionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  authorNameInline: {
    fontWeight: '600',
    color: '#22152B',
  },
  captionText: {
    fontSize: 14,
    color: '#22152B',
    lineHeight: 20,
  },
  tagsText: {
    color: BrandColors.accentPink,
    fontSize: 14,
    marginBottom: 6,
  },
  dateText: {
    color: '#8E8E8E',
    fontSize: 12,
    marginTop: 4,
  },
});
