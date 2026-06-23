/**
 * Types for Home (Personalized) & Explore (Discovery) screens.
 * All data is fetched from API — these define the expected response shapes.
 */

export interface UpcomingBooking {
  id: string;
  serviceName: string;
  muaName: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  date: string;
  time: string;
  imageUrl?: string;
}

export interface PopularService {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

export interface FavoriteMUA {
  id: string;
  name: string;
  avatarUrl?: string;
  specialty: string;
  rating: number;
}

export interface FeaturedWork {
  id: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  authorName: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string;
  discountPercent: number;
}

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  tag?: string;
}

export interface TrendingItem {
  id: string;
  title: string;
  imageUrl?: string;
  likesCount: number;
  categoryTag: string;
  categoryColor: string;
}

export interface FeaturedExpert {
  id: string;
  name: string;
  avatarUrl?: string;
  bookingsCount: number;
  location: string;
  rating: number;
}

export interface NearbySalon {
  id: string;
  name: string;
  imageUrl?: string;
  distance: string;
  rating: number;
  reviewCount: number;
}

export interface SuggestionItem {
  id: string;
  imageUrl?: string;
  title?: string;
}

// ─── Aggregated response shapes ─────────────────────────────

export interface HomeData {
  upcomingBooking: UpcomingBooking | null;
  popularServices: PopularService[];
  favoriteMUAs: FavoriteMUA[];
  featuredWorks: FeaturedWork[];
  promotions: Promotion[];
  banners: BannerItem[];
}

export interface ExploreData {
  banners: BannerItem[];
  categories: PopularService[];
  trending: TrendingItem[];
  featuredExperts: FeaturedExpert[];
  nearbySalons: NearbySalon[];
  suggestions: SuggestionItem[];
}
