const LEGACY_HTTP_ORIGINS = new Set([
  'beautybook-13zj.onrender.com',
]);

export const normalizeMediaUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!/^http:\/\//i.test(trimmed)) return value;

  try {
    const parsed = new URL(trimmed);
    if (LEGACY_HTTP_ORIGINS.has(parsed.hostname.toLowerCase())) {
      parsed.protocol = 'https:';
      return parsed.toString();
    }
  } catch {
    return value;
  }

  return value;
};

export const normalizeMediaUrlsInPayload = (value: unknown): unknown => {
  if (typeof value === 'string') return normalizeMediaUrl(value);
  if (Array.isArray(value)) return value.map(normalizeMediaUrlsInPayload);
  if (!value || typeof value !== 'object') return value;

  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    record[key] = normalizeMediaUrlsInPayload(record[key]);
  }
  return record;
};
