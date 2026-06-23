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
}

export type CreatePortfolioItemRequest = Omit<PortfolioItemDto, 'id' | 'createdAt' | 'updatedAt' | 'isCover' | 'order'>;
