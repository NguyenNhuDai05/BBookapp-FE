/**
 * Types for MUA Detail screen tabs.
 * Extends existing types from muaService.ts where applicable.
 */

export interface PortfolioFeaturedWork {
  id: string;
  title: string;
  imageUrl?: string;
  category: string;
}

export interface PortfolioGridItem {
  id: string;
  imageUrl?: string;
  label: string;
}

export interface BeforeAfterItem {
  id: string;
  title: string;
  description?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
}

export interface ReviewPhoto {
  id: string;
  url: string;
}

export interface ReviewItemExtended {
  reviewId: string;
  customerName: string;
  customerAvatarUrl?: string;
  rating: number;
  comment: string;
  createdAt: string;
  photos: ReviewPhoto[];
  helpfulCount: number;
}

export interface RatingBreakdown {
  star: number;
  percentage: number;
}

export interface RatingAttribute {
  label: string;
  score: number;
}

export interface MuaReviewSummary {
  averageRating: number;
  totalReviews: number;
  breakdown: RatingBreakdown[];
  attributes: RatingAttribute[];
  reviews: ReviewItemExtended[];
}

export interface WorkSchedule {
  dayLabel: string;
  dayNumber: number;
  isAvailable: boolean;
  isToday?: boolean;
}

export interface PolicyItem {
  icon: string;
  title: string;
  description: string;
}

export interface SocialLink {
  platform: 'instagram' | 'facebook' | 'website';
  url: string;
  label: string;
}

export interface MuaInfoData {
  bio: string;
  specialties: string[];
  serviceArea: string;
  travelRadius: string;
  workingHours: string;
  schedule: WorkSchedule[];
  policies: PolicyItem[];
  socialLinks: SocialLink[];
}

export interface PortfolioDetailData {
  id: string;
  title: string;
  categoryTag: string;
  heroImageUrl?: string;
  description: string;
  durationMinutes: number;
  mainProducts: string;
  allProducts: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  closeUpImages: string[];
}

export type MuaDetailTab = 'portfolio' | 'services' | 'reviews' | 'info';
