import { redirectProfileLink, profileReturnRoute, requireProfileLogin } from '../profileLinks';
import { AppAlert } from '../../components/ui/dialogStore';
jest.mock('../../components/ui/dialogStore', () => ({ AppAlert: { alert: jest.fn() } }));
const id = '10000000-0000-0000-0000-000000000001';
it.each([`https://bbookmakeup.com/posts/${id}`, `https://beautybook-v3bi.onrender.com/posts/${id}`, `bbookapp://posts/${id}`, `/posts/${id}`])('opens the exact post from %s', url => expect(redirectProfileLink(url)).toBe(`/shared-post?id=${id}`));
it.each([`https://evil.test/posts/${id}`, `http://bbookmakeup.com/posts/${id}`, '/posts/invalid', `/posts/${id}/extra`])('rejects unsafe or malformed post link %s', url => expect(redirectProfileLink(url)).toBe('/profile-unavailable'));
it('keeps the exact post after login while dropping untrusted return parameters', () => {
  expect(profileReturnRoute(`/shared-post?id=${id}&muaId=wrong&redirect=https://evil.test`)).toBe(`/shared-post?id=${id}`);
  expect(profileReturnRoute('/shared-post?id=bad')).toBeNull();
  expect(redirectProfileLink(`bbookapp://shared-post?id=${id}`)).toBe(`bbookapp://shared-post?id=${id}`);
});
it.each([`https://beautybook-v3bi.onrender.com/mua/${id}`, `https://bbookmakeup.com/mua/${id}`, `https://share.bbookmakeup.com/mua/${id}`, `bbookapp://mua/${id}`, `/mua/${id}`])('opens the exact MUA from %s', url => expect(redirectProfileLink(url)).toBe(`/mua-detail?id=${id}`));
it.each([`https://evil.test/mua/${id}`, `http://bbookmakeup.com/mua/${id}`, `https://bbookmakeup.com:999/mua/${id}`, '/mua/invalid', '/mua/../admin', 'bbookapp://mua/invalid'])('does not accept invalid share link %s', url => expect(redirectProfileLink(url)).not.toMatch(/mua-detail/));
it('preserves existing notification and checkout deep links', () => {
  expect(redirectProfileLink('bbookapp://booking/123')).toBe('bbookapp://booking/123');
  expect(redirectProfileLink(`bbookapp://mua-detail?id=${id}`)).toBe(`bbookapp://mua-detail?id=${id}`);
  expect(redirectProfileLink('/checkout')).toBe('/checkout');
});
it('only permits an internal MUA return route with known actions and valid IDs', () => {
  const route = profileReturnRoute(`/mua-detail?id=${id}&intent=book&serviceId=${id}&evil=1`)!;
  expect(route).toContain(`id=${id}`); expect(route).toContain('intent=book'); expect(route).not.toContain('evil');
  for (const input of ['https://evil.test', '//evil.test/mua-detail?id=' + id, '/checkout', '/(admin)/dashboard', '/mua-detail?id=bad', ['/mua-detail']]) expect(profileReturnRoute(input)).toBeNull();
});
it('requests login with the original MUA/service and does not navigate on cancel', () => {
  const push = jest.fn(); requireProfileLogin({ push }, id, 'book', id);
  const actions = jest.mocked(AppAlert.alert).mock.calls.at(-1)![2]!;
  expect(push).not.toHaveBeenCalled(); actions[1].onPress?.();
  expect(push).toHaveBeenCalledWith({ pathname: '/(auth)/login', params: { returnTo: expect.stringContaining(`id=${id}`) } });
});

it('opens account status from the website without accepting payment proof in a return URL', () => {
  expect(redirectProfileLink('bbookapp://account-plans')).toBe('/account-plans');
  expect(redirectProfileLink('bbookapp://account-plans?status=PAID')).not.toBe('/account-plans');
});
