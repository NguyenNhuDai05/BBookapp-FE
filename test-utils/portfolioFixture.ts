import type { MuaStyleCatalog, CatalogTerm } from '../repositories/IMuaStyleRepository';
import type { PortfolioTaggingDto } from '../types/portfolio';
import { normalizePortfolio } from '../utils/portfolio';
export const catalogFixture = (): MuaStyleCatalog => {
  const terms: CatalogTerm[] = [];
  let id = 1;
  for (const [kind, keys] of [['occasion', ['date', 'work', 'daily', 'photoshoot']], ['intensity', ['light', 'medium', 'bold']], ['color-tone', ['peach', 'rose-pink', 'beige', 'nude']], ['effect', ['base-dewy', 'lip-glossy', 'eye-shimmer', 'base-matte', 'lip-red']]] as const)
    for (const key of keys) terms.push({ id: id++, kind, key, label: `${kind}:${key}`, isActive: true, groupId: kind === 'occasion' ? 100 : kind === 'effect' ? 101 : null });
  terms.push({ id: 100, kind: 'occasion-group', key: 'social', label: 'Dịp phù hợp', isActive: true }, { id: 101, kind: 'effect-group', key: 'finish', label: 'Hiệu ứng', isActive: true });
  return { source: 'catalog', version: 'v1', capabilities: { portfolioTaggingVersion: 1 }, terms,
    styles: [{ styleId: 73, key: 'natural', name: 'Natural', isActive: true }, { styleId: 94, key: 'custom', name: 'MUA Custom', isActive: true }, { styleId: 105, key: 'classic', name: 'Classic', isActive: true }, { styleId: 106, key: 'soft', name: 'Soft', isActive: true }] };
};
export const tagsFixture = (): PortfolioTaggingDto => {
  const catalog = catalogFixture();
  const term = (kind: string, key: string) => ({ ...catalog.terms!.find(t => t.kind === kind && t.key === key)!, isSelectable: true });
  return { primaryStyle: { ...catalog.styles[0], isSelectable: true }, secondaryStyles: [], occasions: [term('occasion', 'date')], intensity: term('intensity', 'light'), colorTones: [term('color-tone', 'peach')], effects: [term('effect', 'base-dewy')] };
};
export const portfolioFixture = () => normalizePortfolio({ portfolioId: 'p1', muaId: 'artist', imageUrls: ['https://media.test/one.jpg'],
  description: 'Mô tả mới từ server', tags: ['legacy'], title: 'Legacy title', serviceId: 's1', version: 7, tagging: tagsFixture() });
