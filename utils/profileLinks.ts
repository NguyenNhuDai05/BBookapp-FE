import type { router as expoRouter } from 'expo-router';
import { AppAlert } from '../components/ui/dialogStore';
export const PROFILE_SHARE_HOSTS = ['beautybook-v3bi.onrender.com', 'bbookmakeup.com', 'share.bbookmakeup.com'];
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const validProfileId = (id: unknown): id is string => typeof id === 'string' && idPattern.test(id);
export function profileReturnRoute(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 400) return null;
  try {
    const url = new URL(value, 'https://bbook.internal');
    if (value.startsWith('/shared-post?') && url.origin === 'https://bbook.internal' && !url.hash && validProfileId(url.searchParams.get('id'))) return `/shared-post?id=${url.searchParams.get('id')!.toLowerCase()}`;
    if (!value.startsWith('/mua-detail?') || url.origin !== 'https://bbook.internal' || url.hash || !validProfileId(url.searchParams.get('id'))) return null;
    const result = new URLSearchParams({ id: url.searchParams.get('id')! });
    const intent = url.searchParams.get('intent');
    if (intent && ['follow', 'chat', 'book'].includes(intent)) result.set('intent', intent);
    const serviceId = url.searchParams.get('serviceId');
    if (validProfileId(serviceId)) { result.set('serviceId', serviceId); result.set('tab', 'Dịch vụ'); }
    return `/mua-detail?${result.toString()}`;
  } catch { return null; }
}
export function redirectProfileLink(path: string): string {
  try {
    const url = new URL(path, 'https://bbook.internal');
    if (url.protocol === 'bbookapp:' && url.hostname === 'account-plans' && (!url.pathname || url.pathname === '/') && !url.search && !url.hash) return '/account-plans';
    const post = url.pathname.startsWith('/posts/') || (url.protocol === 'bbookapp:' && url.hostname === 'posts');
    const custom = url.protocol === 'bbookapp:' && (url.hostname === 'mua' || url.hostname === 'posts');
    const shared = custom ? url.pathname : url.pathname.startsWith('/mua/') ? url.pathname.slice(4) : post ? url.pathname.slice(6) : null;
    if (shared == null) return path;
    if (!custom && url.hostname !== 'bbook.internal' && (url.protocol !== 'https:' || !PROFILE_SHARE_HOSTS.includes(url.hostname) || url.port || url.username || url.password)) return '/profile-unavailable';
    const id = shared.replace(/^\//, '').replace(/\/$/, '');
    return validProfileId(id) ? `/${post ? 'shared-post' : 'mua-detail'}?id=${id.toLowerCase()}` : '/profile-unavailable';
  } catch { return '/profile-unavailable'; }
}
export function requireProfileLogin(router: Pick<typeof expoRouter, 'push'>, id: string, intent: 'follow' | 'chat' | 'book', serviceId?: string) {
  if (!validProfileId(id)) return;
  const params = new URLSearchParams({ id, intent });
  if (validProfileId(serviceId)) { params.set('serviceId', serviceId); params.set('tab', 'Dịch vụ'); }
  AppAlert.alert('Đăng nhập để tiếp tục', 'Đăng nhập xong, bạn sẽ quay lại hồ sơ chuyên gia này.', [
    { text: 'Để sau', style: 'cancel' }, { text: 'Đăng nhập', onPress: () => router.push({ pathname: '/(auth)/login', params: { returnTo: `/mua-detail?${params}` } }) },
  ]);
}
