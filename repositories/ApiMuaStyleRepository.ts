import { api, getApiError } from '../services/api';
import type { MakeupStyle } from '../utils/makeupStyles';
import { uniqueStyles } from '../utils/makeupStyles';
import type { CatalogTerm, IMuaStyleRepository, MuaStyleCatalog } from './IMuaStyleRepository';
function parseTerms(value: unknown): CatalogTerm[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const kinds = ['occasion', 'intensity', 'color-tone', 'effect', 'occasion-group', 'effect-group'];
  if (value.some(t => !t || !Number.isSafeInteger(t.id) || t.id < 1 || !kinds.includes(t.kind) ||
    typeof t.key !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(t.key) || typeof t.label !== 'string' || !t.label.trim() || typeof t.isActive !== 'boolean' ||
    (t.groupId != null && (!Number.isSafeInteger(t.groupId) || t.groupId < 1)) ||
    (t.kind === 'intensity' && !['light', 'medium', 'bold'].includes(t.key)))) return undefined;
  if (new Set(value.map(t => t.id)).size !== value.length || new Set(value.map(t => `${t.kind}:${t.key}`)).size !== value.length) return undefined;
  if (value.some(t => t.groupId != null && !value.some(g => g.id === t.groupId && g.kind === (t.kind === 'occasion' ? 'occasion-group' : t.kind === 'effect' ? 'effect-group' : 'invalid')))) return undefined;
  return value as CatalogTerm[];
}
function parseStyles(value: unknown): MakeupStyle[] {
  if (!Array.isArray(value) || value.some(row => !row || !Number.isSafeInteger(row.styleId) || row.styleId < 1 || !(row.name === null || typeof row.name === 'string') || typeof row.isActive !== 'boolean')) throw new Error('Dữ liệu phong cách không đúng định dạng. Vui lòng thử lại.');
  return uniqueStyles(value as MakeupStyle[]).filter(row => row.isActive && !row.archivedAt);
}
export class ApiMuaStyleRepository implements IMuaStyleRepository {
  async getCatalog(signal?: AbortSignal): Promise<MuaStyleCatalog> {
    let response;
    try { response = await api.get('/makeup-catalog', { signal }); }
    catch (error) {
      const parsed = getApiError(error);
      // Never bypass auth errors or turn cancellation into a second request.
      if (signal?.aborted || parsed.status === 401 || parsed.status === 403 || !(parsed.isNetworkError || [404, 405, 500, 502, 503, 504, 501].includes(parsed.status ?? 0))) throw error;
      const legacy = await api.get('/Mua/styles', { signal });
      return { styles: parseStyles(legacy.data), source: 'legacy', fallbackReason: 'Catalog mới chưa truy cập được. Đang dùng danh sách phong cách từ API hiện có; bạn có thể thử tải lại.' };
    }
    if (!response.data || typeof response.data.version !== 'string' || !Array.isArray(response.data.terms)) throw new Error('Dữ liệu catalog không đúng định dạng. Vui lòng thử lại.');
    const terms = parseTerms(response.data.terms);
    const capability = response.data.capabilities?.portfolioTaggingVersion;
    return { styles: parseStyles(response.data.styles), source: 'catalog', version: response.data.version,
      terms, capabilities: Number.isSafeInteger(capability) ? { portfolioTaggingVersion: capability } : undefined,
      taggingUnavailableReason: !terms ? 'Danh mục tag chưa hợp lệ. Bạn vẫn có thể lưu tác phẩm không tag.' : capability !== 1 ? 'Máy chủ chưa hỗ trợ gắn tag portfolio. Bạn vẫn có thể lưu tác phẩm không tag.' : undefined };
  }
  async getActiveStyles() { return (await this.getCatalog()).styles; }
  async selectOrCreate(name: string): Promise<MakeupStyle> {
    const response = await api.post('/Mua/styles/select-or-create', { name });
    const styles = parseStyles([response.data]);
    if (!styles[0]) throw new Error('Phong cách đã ngừng sử dụng.');
    return styles[0];
  }
}
