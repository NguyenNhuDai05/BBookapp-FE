import type { PortfolioItemDto, PortfolioTaggingDto } from '../types/portfolio';

const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((s): s is string => typeof s === 'string') : [];

export function normalizePortfolio(value: unknown): PortfolioItemDto {
  const row = object(value);
  const imageUrls = Array.isArray(row.imageUrls) ? strings(row.imageUrls) : typeof row.imageUrl === 'string' && row.imageUrl ? [row.imageUrl] : [];
  const service = object(row.service);
  const tags = strings(row.tags);
  const tagging = row.tagging == null ? undefined : object(row.tagging);
  if (tagging && (!['secondaryStyles', 'occasions', 'colorTones', 'effects'].every(k => Array.isArray(tagging[k])) ||
    !('primaryStyle' in tagging) || !('intensity' in tagging))) throw new Error('Dữ liệu tag portfolio không hợp lệ. Vui lòng tải lại.');
  if (tagging) {
    const validStyle = (raw: unknown) => { const s = object(raw); return Number.isSafeInteger(s.styleId) && Number(s.styleId) > 0 && (s.name === null || typeof s.name === 'string') && typeof s.isActive === 'boolean' && typeof s.isSelectable === 'boolean'; };
    const validTerm = (raw: unknown, kind: string) => { const t = object(raw); return Number.isSafeInteger(t.id) && Number(t.id) > 0 && t.kind === kind && typeof t.key === 'string' && Boolean(t.key) && typeof t.label === 'string' && typeof t.isActive === 'boolean' && typeof t.isSelectable === 'boolean'; };
    if ((tagging.primaryStyle !== null && !validStyle(tagging.primaryStyle)) || !(tagging.secondaryStyles as unknown[]).every(validStyle) ||
      (tagging.intensity !== null && !validTerm(tagging.intensity, 'intensity')) ||
      !(['occasions', 'colorTones', 'effects'] as const).every((key, index) => (tagging[key] as unknown[]).every(t => validTerm(t, ['occasion', 'color-tone', 'effect'][index])))) throw new Error('Dữ liệu tag portfolio không hợp lệ. Vui lòng tải lại.');
  }
  return { ...row, id: String(row.id || row.portfolioId || ''), portfolioId: String(row.portfolioId || row.id || ''),
    imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : imageUrls[0] || '', imageUrls,
    category: typeof row.category === 'string' ? row.category : tags.join(', '), tags,
    isCover: Boolean(row.isCover || row.isPinned), isPinned: Boolean(row.isPinned || row.isCover), order: Number(row.order || 0),
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : '', updatedAt: String(row.updatedAt || row.createdAt || ''),
    serviceId: (row.serviceId ?? service.serviceId ?? service.id ?? null) as string | null,
    authorAvatarUrl: (row.authorAvatarUrl ?? row.authorAvatar) as string | undefined,
    version: Number.isSafeInteger(row.version) && Number(row.version) > 0 ? Number(row.version) : undefined,
    tagging: tagging as PortfolioTaggingDto | undefined } as PortfolioItemDto;
}
