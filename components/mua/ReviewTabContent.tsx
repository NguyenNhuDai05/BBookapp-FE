import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Star, ThumbsUp, MessageCircle, X, CornerDownRight } from 'lucide-react-native';
import { Image } from 'expo-image';
import { BrandColors, Shadows } from '../../constants/theme';
import { ReviewDto } from '../../types/ReviewDto';
import { useReplyReview } from '../../hooks/useReviews';

interface ReviewTabContentProps {
  reviews: ReviewDto[] | undefined;
  isLoading: boolean;
  isOwner?: boolean;
}

const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Vừa xong";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} tuần trước`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} tháng trước`;
  return `${Math.floor(diffInSeconds / 31536000)} năm trước`;
};

export default function ReviewTabContent({ reviews, isLoading, isOwner = false }: ReviewTabContentProps) {
  const [filter, setFilter] = useState<'all' | '5' | '4' | 'has_image'>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // MUA Reply State
  const [replyingToReviewId, setReplyingToReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const { mutate: submitReply, isPending: isReplying } = useReplyReview();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BrandColors.accentPink} />
      </View>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MessageCircle size={64} color="#E0E0E0" />
        <Text style={styles.emptyTitle}>Chưa có đánh giá nào</Text>
        <Text style={styles.emptySub}>MUA này chưa nhận được đánh giá nào từ khách hàng.</Text>
      </View>
    );
  }

  const totalReviews = reviews.length;
  const averageRating = (reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1);

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingCounts[r.rating as keyof typeof ratingCounts]++;
    }
  });

  const getPercentage = (count: number) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  const handleReplySubmit = () => {
    if (!replyingToReviewId || !replyText.trim()) return;
    submitReply(
      { reviewId: replyingToReviewId, replyContent: replyText.trim() },
      {
        onSuccess: () => {
          Alert.alert('Thành công', 'Đã gửi phản hồi!');
          setReplyingToReviewId(null);
          setReplyText('');
        },
        onError: (err: any) => {
          Alert.alert('Lỗi', err.message || 'Không thể phản hồi đánh giá này.');
        }
      }
    );
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === 'all') return true;
    if (filter === '5') return r.rating === 5;
    if (filter === '4') return r.rating === 4;
    if (filter === 'has_image') return !!r.imageUrl;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* SUMMARY HEADER */}
      <View style={styles.summaryContainer}>
        {/* Left Side: Score */}
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>{averageRating}</Text>
          <View style={styles.starsWrapper}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star 
                key={s} 
                size={12} 
                color="#C71585" 
                fill={s <= Math.round(Number(averageRating)) ? "#C71585" : "transparent"} 
              />
            ))}
          </View>
        </View>

        {/* Right Side: Progress Bars */}
        <View style={styles.barsContainer}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingCounts[star as keyof typeof ratingCounts];
            const pct = getPercentage(count);
            return (
              <View key={star} style={styles.barRow}>
                <Text style={styles.barStarText}>{star}</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.barPctText}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* CATEGORY SCORES REMOVED */}

      {/* FILTER BUTTONS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterBtnText, filter === 'all' && styles.filterBtnTextActive]}>Tất cả</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterBtn, filter === '5' && styles.filterBtnActive]}
          onPress={() => setFilter('5')}
        >
          <Text style={[styles.filterBtnText, filter === '5' && styles.filterBtnTextActive]}>5 sao</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterBtn, filter === '4' && styles.filterBtnActive]}
          onPress={() => setFilter('4')}
        >
          <Text style={[styles.filterBtnText, filter === '4' && styles.filterBtnTextActive]}>4 sao</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterBtn, filter === 'has_image' && styles.filterBtnActive]}
          onPress={() => setFilter('has_image')}
        >
          <Text style={[styles.filterBtnText, filter === 'has_image' && styles.filterBtnTextActive]}>Có ảnh</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* REVIEW LIST */}
      <View style={styles.listContainer}>
        {filteredReviews.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>Không có đánh giá nào phù hợp bộ lọc.</Text>
        ) : (
          filteredReviews.map((review) => (
            <View key={review.reviewId} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.headerLeft}>
                  <Text style={styles.customerName}>{review.customerName}</Text>
                  <Text style={styles.reviewDate}>{timeAgo(review.createdAt)}</Text>
                </View>
                <View style={styles.headerRight}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      size={14} 
                      color="#C71585" 
                      fill={s <= review.rating ? "#C71585" : "transparent"} 
                    />
                  ))}
                </View>
              </View>

              <Text style={styles.commentText}>
                {review.comment || 'Khách hàng không để lại bình luận.'}
              </Text>

              <View style={styles.imageGallery}>
                {review.imageUrl ? (
                  <TouchableOpacity onPress={() => setSelectedImage(review.imageUrl!)}>
                    <Image 
                      source={{ uri: review.imageUrl }} 
                      style={styles.reviewImage} 
                      contentFit="cover"
                      transition={200}
                    />
                  </TouchableOpacity>
                ) : (
                  <>
                    <View style={styles.reviewImagePlaceholder} />
                    <View style={styles.reviewImagePlaceholder} />
                  </>
                )}
              </View>

              {/* MUA REPLY */}
              {review.muaReply ? (
                <View style={styles.replyContainer}>
                  <View style={styles.replyHeader}>
                    <CornerDownRight size={16} color="#666" style={{ marginRight: 6 }} />
                    <Text style={styles.replyTitle}>Phản hồi từ MUA</Text>
                    {review.muaReplyAt && (
                      <Text style={styles.replyDate}>{timeAgo(review.muaReplyAt)}</Text>
                    )}
                  </View>
                  <Text style={styles.replyText}>{review.muaReply}</Text>
                </View>
              ) : isOwner ? (
                <TouchableOpacity 
                  style={styles.replyBtn} 
                  onPress={() => setReplyingToReviewId(review.reviewId)}
                >
                  <MessageCircle size={14} color={BrandColors.accentPink} style={{ marginRight: 6 }} />
                  <Text style={styles.replyBtnText}>Phản hồi</Text>
                </TouchableOpacity>
              ) : null}

              {/* CARD FOOTER */}
              <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.helpfulBtn}>
                  <ThumbsUp size={16} color="#C71585" style={{ marginRight: 6 }} />
                  <Text style={styles.helpfulText}>Hữu ích (0)</Text>
                </TouchableOpacity>
                
                <TouchableOpacity>
                  <Text style={styles.reportText}>Báo cáo</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Image Modal */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeBtn} 
            onPress={() => setSelectedImage(null)}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <X size={24} color="#FFF" />
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullImage} 
              contentFit="contain"
            />
          )}
        </View>
      </Modal>

      {/* MUA REPLY MODAL */}
      <Modal visible={!!replyingToReviewId} transparent animationType="slide">
        <KeyboardAvoidingView 
          style={styles.replyModalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.replyModalContent}>
            <View style={styles.replyModalHeader}>
              <Text style={styles.replyModalTitle}>Phản hồi đánh giá</Text>
              <TouchableOpacity onPress={() => setReplyingToReviewId(null)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.replyInput}
              placeholder="Nhập nội dung phản hồi của bạn..."
              multiline
              autoFocus
              value={replyText}
              onChangeText={setReplyText}
              textAlignVertical="top"
            />
            <TouchableOpacity 
              style={[styles.replySubmitBtn, !replyText.trim() && { opacity: 0.5 }]} 
              disabled={!replyText.trim() || isReplying}
              onPress={handleReplySubmit}
            >
              {isReplying ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.replySubmitText}>Gửi phản hồi</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    backgroundColor: '#FFF9FA', // Very light pink background
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  scoreBox: {
    backgroundColor: '#FCEEF2',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#C71585', // Deep pink
    marginBottom: 4,
  },
  starsWrapper: {
    flexDirection: 'row',
    gap: 2,
  },
  barsContainer: {
    flex: 1,
    gap: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barStarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    width: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#FCEEF2',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F55389',
    borderRadius: 3,
  },
  barPctText: {
    fontSize: 12,
    color: '#888',
    width: 30,
    textAlign: 'right',
  },
  categoryScoresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  categoryTag: {
    borderWidth: 1,
    borderColor: '#FCEEF2',
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  categoryTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C71585',
  },
  filterScroll: {
    marginBottom: 24,
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 12,
    alignItems: 'center',
  },
  filterBtn: {
    backgroundColor: '#FCEEF2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  filterBtnActive: {
    backgroundColor: '#F55389',
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  filterBtnTextActive: {
    color: '#FFF',
  },
  listContainer: {
    paddingHorizontal: 12,
    gap: 16,
  },
  reviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    ...Shadows.card,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 13,
    color: '#999',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 2,
  },
  commentText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
    marginBottom: 16,
  },
  imageGallery: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  reviewImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  reviewImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#FCFBFC',
    borderWidth: 1,
    borderColor: '#F6F3F5',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C71585',
  },
  reportText: {
    fontSize: 13,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  fullImage: {
    width: width,
    height: '80%',
  },
  replyContainer: {
    backgroundColor: '#FFF0F5',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  replyDate: {
    fontSize: 12,
    color: '#888',
  },
  replyText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  replyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.accentPink,
  },
  replyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  replyModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  replyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  replyModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  replyInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    height: 120,
    fontSize: 15,
    color: '#333',
    marginBottom: 20,
  },
  replySubmitBtn: {
    backgroundColor: BrandColors.accentPink,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  replySubmitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
