const ALLOWED_HOSTS = {
  instagram: new Set(['instagram.com', 'www.instagram.com']),
  facebook: new Set(['facebook.com', 'www.facebook.com']),
} as const;

export type SocialPlatform = keyof typeof ALLOWED_HOSTS;

export function normalizeSocialUrl(value: string, platform: SocialPlatform) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!ALLOWED_HOSTS[platform].has(url.hostname.toLowerCase())) return null;
    url.protocol = 'https:';
    return url.toString();
  } catch {
    return null;
  }
}
