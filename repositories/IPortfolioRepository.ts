import { PortfolioItemDto, CreatePortfolioItemRequest, PortfolioCommentDto, PortfolioWriteAck } from '../types/portfolio';

export interface IPortfolioRepository {
  getPortfolio(muaId: string): Promise<PortfolioItemDto[]>;
  createItem(muaId: string, item: CreatePortfolioItemRequest): Promise<PortfolioWriteAck>;
  updateItem(itemId: string, updates: Partial<CreatePortfolioItemRequest>): Promise<PortfolioWriteAck>;
  deleteItem(itemId: string): Promise<void>;
  setVisibility(itemId: string, isHidden: boolean): Promise<void>;
  toggleLike(itemId: string): Promise<void>;
  toggleSave(itemId: string): Promise<void>;
  getComments(itemId: string): Promise<PortfolioCommentDto[]>;
  addComment(itemId: string, content: string): Promise<PortfolioCommentDto>;
  replyToComment(itemId: string, commentId: string, content: string): Promise<PortfolioCommentDto>;
  getFavorites(type: 'liked' | 'saved'): Promise<PortfolioItemDto[]>;
}
