import { getApiError } from '../services/api';

export class PortfolioSavedRefreshError extends Error {
  constructor(public readonly retryRefresh: () => Promise<unknown>) {
    super('Đã lưu portfolio, nhưng chưa tải lại được dữ liệu mới.');
  }
}
export class PortfolioUncertainWriteError extends Error {
  constructor() { super('Chưa xác định được máy chủ đã lưu hay chưa. Hãy kiểm tra danh sách trước khi gửi lại.'); }
}
export function uncertainPortfolioWrite(error: unknown): boolean {
  const parsed = getApiError(error);
  return error instanceof PortfolioUncertainWriteError || parsed.isNetworkError || (parsed.status ?? 0) >= 500 || (!parsed.status && !parsed.code);
}
export function portfolioErrorMessage(error: unknown): string {
  const parsed = getApiError(error);
  const messages: Record<string, string> = {
    PORTFOLIO_VERSION_REQUIRED: 'Chưa có phiên bản tác phẩm. Hãy tải dữ liệu mới trước khi chỉnh tag.',
    PORTFOLIO_VERSION_CONFLICT: 'Portfolio đã thay đổi. Bản nháp vẫn được giữ; hãy tải bản mới để đối chiếu.',
    PORTFOLIO_TAG_LIMIT: 'Số lựa chọn vượt giới hạn của nhóm. Hãy bỏ bớt tag.',
    PORTFOLIO_TAG_DUPLICATE: 'Các lựa chọn không được trùng nhau.',
    PORTFOLIO_PRIMARY_REQUIRED: 'Chọn phong cách chính trước phong cách phụ.',
    PORTFOLIO_STYLE_INVALID: 'Phong cách không còn hợp lệ. Hãy tải lại danh mục và kiểm tra lựa chọn.',
    PORTFOLIO_TERM_INVALID: 'Tag không còn hợp lệ. Hãy tải lại danh mục và kiểm tra lựa chọn.',
    PORTFOLIO_TAG_INACTIVE: 'Một lựa chọn đã ngừng dùng. Bản nháp được giữ để bạn kiểm tra và bỏ lựa chọn đó.',
    PORTFOLIO_WRITE_BUSY: 'Hệ thống đang xử lý dữ liệu. Bản nháp được giữ; vui lòng thử lại sau.',
  };
  return messages[parsed.code || ''] || parsed.message;
}

export async function uploadPortfolioAlbum(uris: readonly string[], cache: Map<string, string>, upload: (uri: string, purpose: 'portfolio') => Promise<string>): Promise<string[]> {
  const outcomes = await Promise.allSettled(uris.map(async uri => {
    if (/^https?:\/\//i.test(uri)) return uri;
    const existing = cache.get(uri);
    if (existing) return existing;
    const url = await upload(uri, 'portfolio');
    if (!url) throw new Error('Không nhận được ảnh đã tải lên. Vui lòng thử lại.');
    cache.set(uri, url);
    return url;
  }));
  const failure = outcomes.find((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failure) throw failure.reason;
  return outcomes.map(r => (r as PromiseFulfilledResult<string>).value);
}
