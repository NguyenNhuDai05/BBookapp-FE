/// <reference types="jest" />

import { getSafeNotificationRoute } from '../notificationRoutes';

describe('getSafeNotificationRoute', () => {
  const id = '01a0ef7d-4cb4-4991-8474-15223b7c283f';

  it('accepts chat and booking routes containing a UUID', () => {
    expect(getSafeNotificationRoute(`/chat/${id}`)).toBe(`/chat/${id}`);
    expect(getSafeNotificationRoute(`/booking/${id}`)).toBe(`/booking/${id}`);
  });

  it.each([
    ['/chat/not-a-room'],
    ['https://evil.example/chat/01a0ef7d-4cb4-4991-8474-15223b7c283f'],
    ['/(admin)/notifications'],
    [null],
  ])('rejects unsafe or unsupported routes: %s', route => {
    expect(getSafeNotificationRoute(route)).toBeNull();
  });
});
