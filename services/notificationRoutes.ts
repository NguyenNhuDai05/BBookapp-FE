const APP_NOTIFICATION_ROUTES = [
  /^\/chat\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  /^\/booking\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  /^\/refund\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
];

export function getSafeNotificationRoute(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return APP_NOTIFICATION_ROUTES.some(pattern => pattern.test(value)) ? value : null;
}
