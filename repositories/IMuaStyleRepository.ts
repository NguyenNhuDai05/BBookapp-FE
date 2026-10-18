import type { MakeupStyle } from '../utils/makeupStyles';
export type CatalogTermKind = 'occasion' | 'intensity' | 'color-tone' | 'effect' | 'occasion-group' | 'effect-group';
export type CatalogTerm = { id: number; kind: CatalogTermKind; key: string; label: string; groupId?: number | null; broaderTermId?: number | null; sortOrder?: number; isActive: boolean; archivedAt?: string | null; version?: number };
export type MuaStyleCatalog = {
  styles: MakeupStyle[];
  source: 'catalog' | 'legacy';
  version?: string;
  fallbackReason?: string;
  terms?: CatalogTerm[];
  capabilities?: { portfolioTaggingVersion: number };
  taggingUnavailableReason?: string;
};
export interface IMuaStyleRepository {
  getCatalog(signal?: AbortSignal): Promise<MuaStyleCatalog>;
  getActiveStyles(): Promise<MakeupStyle[]>;
  selectOrCreate(name: string): Promise<MakeupStyle>;
}
