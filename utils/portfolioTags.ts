import type { ServiceDto } from '../types/ServiceDto';
import { styleDisplayName, styleNameKey, type MakeupStyle } from './makeupStyles';

// Portfolio tags use existing database names, never catalog metadata.
export function portfolioTagOptions(styles: MakeupStyle[] = []) {
  return [...new Map(styles.filter(s => s.isActive && !s.archivedAt && styleDisplayName(s.name))
    .map(s => [styleNameKey(s.name), { ...s, name: styleDisplayName(s.name) }])).values()];
}

export function servicePortfolioTags(service: ServiceDto, styles: MakeupStyle[] = []): string[] {
  const ids = new Set([...(service.styleIds || []), ...(service.styleTags || []).map(s => s.styleId)]);
  const names = new Set((service.tags || []).map(styleNameKey));
  return portfolioTagOptions(styles).filter(s => ids.has(s.styleId) || names.has(styleNameKey(s.name))).map(s => s.name);
}

export const samePortfolioTags = (a: string[], b: string[]) =>
  a.length === b.length && a.every(tag => b.includes(tag));
