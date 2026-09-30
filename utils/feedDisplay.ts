export function formatFeedCount(value: number | undefined): string {
  const count = Number.isFinite(value) ? Math.max(0, Math.trunc(value!)) : 0;
  if (count < 1000) return String(count);
  const divisor = count < 1_000_000 ? 1000 : 1_000_000;
  return `${(count / divisor).toFixed(1).replace(/\.0$/, '')}${divisor === 1000 ? 'K' : 'M'}`;
}

export function normalizeHashtags(tags: readonly string[]): string[] {
  return [...new Set(tags.filter(tag => typeof tag === 'string')
    .map(tag => tag.trim().replace(/^#+\s*/, '')).filter(Boolean).map(tag => `#${tag}`))];
}

export function formatPostTime(value?: string, now = Date.now()): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const minutes = Math.max(0, Math.floor((now - date.getTime()) / 60_000));
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}
