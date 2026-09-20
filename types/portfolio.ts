export interface PortfolioItemDto {
  id: string;
  imageUrl: string;
  title?: string;
  description?: string;
  category: string;
  isCover: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  serviceId?: string;
  service?: import('./ServiceDto').ServiceDto;
  portfolioId?: string;
  imageUrls?: string[];
  muaId?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  likesCount?: number;
  commentsCount?: number;
  savesCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  isHidden?: boolean;
}

export type CreatePortfolioItemRequest = Omit<PortfolioItemDto, 'id' | 'createdAt' | 'updatedAt' | 'isCover' | 'order'>;

export interface PortfolioCommentDto {
  id: string;
  portfolioId: string;
  userId: string;
  parentCommentId?: string;
  userName?: string;
  userAvatarUrl?: string;
  content: string;
  createdAt: string;
  replies?: PortfolioCommentDto[];
}
