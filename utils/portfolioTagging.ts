import type { MuaStyleCatalog } from '../repositories/IMuaStyleRepository';
import type { PortfolioTaggingDto, PortfolioTaggingPatch } from '../types/portfolio';

export type PortfolioTagDraft = Required<PortfolioTaggingPatch>;
export const emptyPortfolioTags = (): PortfolioTagDraft => ({ primaryStyleId: null, secondaryStyleIds: [], occasionKeys: [], intensityKey: null, colorToneKeys: [], effectKeys: [] });
export function portfolioTagDraft(value?: PortfolioTaggingDto): PortfolioTagDraft {
  return { primaryStyleId: value?.primaryStyle?.styleId ?? null, secondaryStyleIds: value?.secondaryStyles.map(s => s.styleId) ?? [],
    occasionKeys: value?.occasions.map(t => t.key) ?? [], intensityKey: value?.intensity?.key ?? null,
    colorToneKeys: value?.colorTones.map(t => t.key) ?? [], effectKeys: value?.effects.map(t => t.key) ?? [] };
}
export function portfolioTagPatch(value: PortfolioTagDraft, baseline: PortfolioTagDraft): PortfolioTaggingPatch | undefined {
  const patch: Record<string, unknown> = {};
  for (const key of Object.keys(value) as (keyof PortfolioTagDraft)[]) if (JSON.stringify(value[key]) !== JSON.stringify(baseline[key])) patch[key] = value[key];
  return Object.keys(patch).length ? patch : undefined;
}
export const supportsPortfolioTagging = (catalog?: MuaStyleCatalog) => catalog?.source === 'catalog' && catalog.capabilities?.portfolioTaggingVersion === 1 && Array.isArray(catalog.terms) && !catalog.taggingUnavailableReason;
export function selectableTerms(catalog?: MuaStyleCatalog) {
  const terms = catalog?.terms ?? [];
  return terms.filter(t => t.isActive && !t.archivedAt && (t.groupId == null || terms.some(g => g.id === t.groupId && g.isActive && !g.archivedAt)));
}
export function validatePortfolioTags(value: PortfolioTagDraft, baseline: PortfolioTagDraft, catalog?: MuaStyleCatalog): string | undefined {
  const limits: [readonly unknown[], number][] = [[value.secondaryStyleIds, 2], [value.occasionKeys, 3], [value.colorToneKeys, 3], [value.effectKeys, 4]];
  if (limits.some(([list, max]) => list.length > max)) return 'Số lựa chọn vượt giới hạn của nhóm.';
  if (limits.some(([list]) => new Set(list).size !== list.length) || (value.primaryStyleId != null && value.secondaryStyleIds.includes(value.primaryStyleId))) return 'Các lựa chọn không được trùng nhau.';
  if (value.secondaryStyleIds.length && value.primaryStyleId == null) return 'Chọn phong cách chính trước phong cách phụ.';
  if (value.intensityKey != null && !['light', 'medium', 'bold'].includes(value.intensityKey)) return 'Mức độ trang điểm không hợp lệ.';
  const styleActive = (id: number) => catalog?.styles.some(s => s.styleId === id && s.isActive && !s.archivedAt);
  if (value.primaryStyleId != null && !styleActive(value.primaryStyleId) && baseline.primaryStyleId !== value.primaryStyleId) return 'Phong cách chính đã ngừng dùng. Hãy tải lại danh mục.';
  if (value.secondaryStyleIds.some(id => !styleActive(id) && !baseline.secondaryStyleIds.includes(id))) return 'Không thể thêm hoặc đổi vai trò phong cách ngừng dùng.';
  const terms = selectableTerms(catalog);
  for (const [kind, selected, retained] of [
    ['occasion', value.occasionKeys, baseline.occasionKeys], ['color-tone', value.colorToneKeys, baseline.colorToneKeys],
    ['effect', value.effectKeys, baseline.effectKeys], ['intensity', value.intensityKey ? [value.intensityKey] : [], baseline.intensityKey ? [baseline.intensityKey] : []],
  ] as const) if (selected.some(key => !retained.includes(key) && !terms.some(t => t.kind === kind && t.key === key))) return 'Một tag đã ngừng dùng hoặc không còn trong danh mục. Hãy tải lại và kiểm tra lựa chọn.';
  return undefined;
}
