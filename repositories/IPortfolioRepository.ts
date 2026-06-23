import { PortfolioItemDto, CreatePortfolioItemRequest } from '../types/portfolio';

export interface IPortfolioRepository {
  getPortfolio(muaId: string): Promise<PortfolioItemDto[]>;
  createItem(muaId: string, item: CreatePortfolioItemRequest): Promise<PortfolioItemDto>;
  updateItem(itemId: string, updates: Partial<CreatePortfolioItemRequest>): Promise<PortfolioItemDto>;
  deleteItem(itemId: string): Promise<void>;
  reorderItems(muaId: string, itemIds: string[]): Promise<void>;
  setCoverPhoto(muaId: string, itemId: string): Promise<void>;
}
