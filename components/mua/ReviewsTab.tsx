import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, ThumbsUp, Flag } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Shadows } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { CategoryChip } from '../ui/CategoryChip';
import type { ReviewDto } from '../../types/ReviewDto';

interface ReviewsTabProps {
  reviews: ReviewDto[];
  averageRating: number;
  totalReviews: number;
}

const REVIEW_FILTERS = ['Tất cả', '5 sao', '4 sao', '3 sao', 'Có ảnh'];

const RATING_ATTRIBUTES = [
  { label: 'Đúng giờ', score: 4.9 },
  { label: 'Thân thiện', score: 5.0 },
  { label: 'Chuyên môn', score: 4.8 },
];

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = Date.now();
    const diff = now - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return 'Hôm nay';
    if (days < 7) return `${days} ngày trước`;
    if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
    return `${Math.floor(days / 30)} tháng trước`;
  } catch {
    return dateStr;
  }
}

export function ReviewsTab({ reviews, averageRating, totalReviews }: ReviewsTabProps) {
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  // Calculate rating breakdown
  const starCounts = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    return { star, count, pct: totalReviews > 0 ? (count / totalReviews) * 100 : 0 };
  });

  return (
    <View style={styles.container}>
      {/* Overall Rating */}
      <View style={styles.overallCard}>
        <View style={styles.ratingCircle}>
          <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((v) => (
              <Star
                key={v}
                size={14}
                color={BrandColors.accentGold}
                fill={v <= Math.round(averageRating) ? BrandColors.accentGold : 'transparent'}
              />
            ))}
          </View>
          <Text style={styles.reviewCountText}>{totalReviews} đánh giá</Text>
        </View>

        {/* Breakdown Bars */}
        <View style={styles.breakdownColumn}>
          {starCounts.map((item) => (
            <View key={item.star} style={styles.breakdownRow}>
              <Text style={styles.breakdownStar}>{item.star}</Text>
              <Star size={10} color={BrandColors.accentGold} fill={BrandColors.accentGold} />
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.max(item.pct, 2)}%` },
                  ]}
                />
              </View>
              <Text style={styles.breakdownPct}>{Math.round(item.pct)}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Attribute Tags */}
      <View style={styles.attributeRow}>
        {RATING_ATTRIBUTES.map((attr) => (
          <View key={attr.label} style={styles.attributeTag}>
            <Text style={styles.attributeLabel}>{attr.label}</Text>
            <Text style={styles.attributeScore}>({attr.score})</Text>
          </View>
        ))}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {REVIEW_FILTERS.map((f) => (
          <CategoryChip
            key={f}
            label={f}
            active={activeFilter === f}
            onPress={() => setActiveFilter(f)}
          />
        ))}
      </View>

      {/* Review Cards */}
      {reviews.map((review) => (
        <View key={review.reviewId} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewAvatar}>
              <LinearGradient
                colors={[BrandColors.gradientStart, BrandColors.accentPinkMedium] as const}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarInitial}>
                  {review.customerName?.[0]?.toUpperCase() || 'K'}
                </Text>
              </LinearGradient>
            </View>
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewName}>{review.customerName}</Text>
              <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
            </View>
            <View style={styles.reviewStars}>
              {[1, 2, 3, 4, 5].map((v) => (
                <Star
                  key={v}
                  size={12}
                  color={BrandColors.accentGold}
                  fill={v <= review.rating ? BrandColors.accentGold : 'transparent'}
                />
              ))}
            </View>
          </View>
          <Text style={styles.reviewComment}>{review.comment}</Text>

          {/* Review Actions */}
          <View style={styles.reviewActions}>
            <TouchableOpacity style={styles.actionButton}>
              <ThumbsUp size={14} color={BrandColors.textMuted} />
              <Text style={styles.actionText}>{Strings.muaHelpful}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Flag size={14} color={BrandColors.textMuted} />
              <Text style={styles.actionText}>{Strings.muaReport}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {reviews.length === 0 && (
        <View style={styles.emptyReview}>
          <Text style={styles.emptyText}>Chưa có đánh giá nào.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  overallCard: {
    flexDirection: 'row',
    gap: Spacing.base,
    backgroundColor: BrandColors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.card,
  },
  ratingCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  ratingNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: BrandColors.textDark,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  reviewCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.textMuted,
    marginTop: 4,
  },
  breakdownColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breakdownStar: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.textDark,
    width: 10,
    textAlign: 'center',
  },
  barBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: BrandColors.borderLight,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: BrandColors.accentPink,
  },
  breakdownPct: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.textMuted,
    width: 30,
    textAlign: 'right',
  },
  attributeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  attributeTag: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: BrandColors.bgPink,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  attributeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.textDark,
  },
  attributeScore: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.accentPink,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  reviewCard: {
    backgroundColor: BrandColors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: BrandColors.textWhite,
    fontSize: 16,
    fontWeight: '800',
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.textDark,
  },
  reviewDate: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.textMuted,
    marginTop: 1,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.textBody,
    lineHeight: 20,
    marginTop: Spacing.md,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: BrandColors.borderDivider,
    paddingTop: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.textMuted,
  },
  emptyReview: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: BrandColors.bgPinkLight,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.textSecondary,
  },
});
