export type ExploreKind = 'portfolio' | 'artists' | 'services';
export type AdvisorStyleMapping = { styleKey: string; styleIds: number[] };
export type ExploreFilters = { advisorStyleKey?: string; provinceCode?: number; styleId?: number; minPrice?: number; maxPrice?: number };
export type ExploreStyle = { id: number; name: string; artistCount: number };
export type ExploreProvince = { code: number; name: string };
export type ExplorePost = {
  id: string; muaId: string; title: string; authorName: string; authorAvatar?: string;
  city?: string; imageUrls: string[]; tags: string[]; likesCount: number; savesCount: number; createdAt: string;
};
export type ExploreArtist = {
  id: string; name: string; avatarUrl?: string; coverUrl?: string; city?: string;
  rating: number; reviewCount: number; minPrice?: number | null; styles: string[];
};
export type ExploreService = {
  id: string; muaId: string; name: string; authorName: string; city?: string; price: number;
  durationMinutes: number; imageUrl?: string; imageUrls: string[]; tags: string[];
  styleIds?: number[]; styleTags?: { styleId: number; name: string; isActive: boolean }[]; matchBasis?: 'service-style' | 'mua-specialty';
};
export type ExploreItem = ExplorePost | ExploreArtist | ExploreService;
export type ExplorePage = { items: ExploreItem[]; nextCursor: string | null };
export type ExploreHome = {
  styles: ExploreStyle[]; provinces: ExploreProvince[]; featuredPosts: ExplorePost[];
  featuredArtists: ExploreArtist[]; featuredServices: ExploreService[];
};
