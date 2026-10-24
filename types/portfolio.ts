export interface PortfolioItemDto {
  id: string;
  imageUrl: string;
  title?: string;
  description?: string | null;
  category: string;
  isCover: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  serviceId?: string | null;
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
  isPinned?: boolean;
  tags?: string[];
  version?: number;
  tagging?: PortfolioTaggingDto;
}

export type PortfolioStyleReference = { styleId: number; key?: string | null; name: string | null; isActive: boolean; archivedAt?: string | null; isSelectable: boolean };
export type PortfolioTermReference = { id: number; kind: string; key: string; label: string; groupId?: number | null; isActive: boolean; archivedAt?: string | null; isSelectable: boolean };
export type PortfolioTaggingDto = { primaryStyle: PortfolioStyleReference | null; secondaryStyles: PortfolioStyleReference[]; occasions: PortfolioTermReference[]; intensity: PortfolioTermReference | null; colorTones: PortfolioTermReference[]; effects: PortfolioTermReference[] };
export type PortfolioTaggingPatch = { primaryStyleId?: number | null; secondaryStyleIds?: number[]; occasionKeys?: string[]; intensityKey?: string | null; colorToneKeys?: string[]; effectKeys?: string[] };
export type PortfolioWriteRequest = { title?: string | null; description?: string | null; imageUrls?: string[]; tags?: string[]; serviceId?: string | null; expectedVersion?: number; tagging?: PortfolioTaggingPatch };
export type CreatePortfolioItemRequest = PortfolioWriteRequest;
export type PortfolioWriteAck = { message: string };

export interface PortfolioCommentDto {
  id: string;
  portfolioId: string;
  userId: string;
  parentCommentId?: string;
  userName?: string;
  userAvatarUrl?: string;
  isAuthorDeleted?: boolean;
  content: string;
  createdAt: string;
  replies?: PortfolioCommentDto[];
}
