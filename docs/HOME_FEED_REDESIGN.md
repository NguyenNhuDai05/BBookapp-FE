# Home feed redesign

## Audit and architecture

Home is `app/(tabs)/home.tsx`; it uses the existing infinite `useFeed` query, `services/feedService.ts` (`GET /Feed`), shared `PortfolioPost`, auth/favorite stores, `portfolioService` and `ApiPortfolioRepository`. Existing likes, saves, comments/replies and booking-draft callbacks remain in their screens/services. Notification count comes from `NotificationService.getUnreadCount`; notification and author-profile routes are preserved. The root tabs remain Expo Router tabs.

## Implemented note requirements

- Home contains the logo header followed directly by posts. No discovery, category, recommendation or promotional sections were added; the previous greeting and “Dành Cho Bạn” heading were removed.
- `HomeFeedHeader` uses the original `B.png`, clipping its transparent margins through layout without editing the asset. A pink gradient makes its white wordmark readable. Notification badge uses actual unread count; avatar uses auth state and icon fallback. Header and feed share a centered 640px maximum width.
- Rounded white cards have a light border and 16px separation.
- Author avatar/name keep existing profile callbacks. Name is ellipsized. No verified tick, “MUA chuyên nghiệp” or location is displayed. Valid creation time appears beneath the name; absent/invalid time is omitted. This follows section 7 of the note where it conflicts with the later illustrative location example.
- The hierarchy is **author header → title/description → gallery → service/booking (when supplied) → engagement → hashtags**.
- `PostCaption` measures full text at the actual rendered width, limits collapsed text to three lines, and expands/collapses locally. Native uses `onTextLayout`; web uses measured full-text height because the installed React Native Web does not implement `onTextLayout`. It does not slice a fixed character count or open a reading modal. Measurement text is hidden from accessibility.
- Existing image carousel/viewer callbacks are retained. Gallery uses measured width and a responsive aspect ratio, rather than a hardcoded image height. This preserves swiping; it does not replace the carousel with the reference image collage.
- Like/comment/bookmark controls keep their callbacks, have 44px touch targets and accessible labels. Active like/save uses pink. Counts use a shared compact display formatter without modifying backend values.
- Tags are pink pills at the bottom, wrap, preserve tag spaces, and normalize duplicate leading `#` characters.
- Existing `PostActionSheet` is reused. Unsupported moderation reports availability, with no fake API success.
- Home retains FlatList, pagination, refresh, initial skeleton, loading-more spinner and empty/error states. Duplicate load-more calls are guarded while fetching. Refresh releases its spinner in `finally`.
- Bottom labels are “Trang chủ”, “Khám phá”, “Lịch sử”, “Tin nhắn”, “Tài khoản”; routes are unchanged. The tab bar and Home bottom padding share the same height calculation from bottom safe-area insets and centralized tokens, without a React Navigation import incompatible with Expo 57.
- No native dependency, backend, DTO/endpoint contract, auth, signing, Google sign-in, app.json or EAS configuration change was made.

## Backend-dependent exceptions

The current frontend repositories and backend controllers expose no follow API; the feed DTO also has no follow status or share count. The existing follow control remains explicitly disabled when no real callback exists. Its reusable callback supports loading and a synchronous duplicate-press guard if a supported integration is supplied later. No follow state is fabricated.

The shared card renders a share action/count only when a real callback/count is supplied; current Home supplies neither. There is no invented share URL, count or share persistence. Save is supported by the existing `/Mua/portfolio/{id}/save` API and remains functional.

## Files

- Updated: `app/(tabs)/home.tsx`, `app/(tabs)/_layout.tsx`, `components/mua/portfolio/PortfolioPost.tsx`, `constants/theme.ts`.
- Added: `components/feed/HomeFeedHeader.tsx`, `components/feed/PostCaption.tsx`, `utils/feedDisplay.ts`, `components/feed/__tests__/homeFeed.test.tsx`, `utils/__tests__/feedDisplay.test.ts`.

## Validation limits

Automated regression checks exercise caption expansion/collapse, ordering, tag/count rendering, original interaction callbacks and follow callback locking. TypeScript, changed-file lint, whitespace and Expo production bundle checks are run. APK/AAB installation and actual Android/iOS/Web visual, keyboard, screen-reader and signing checks have not been performed in this environment; bundle success is not a native release certification.

Final automated checks: `npx tsc --noEmit` passed; changed-file ESLint passed with no errors/warnings; `git diff --check` passed; all 11 Jest suites and 76 tests passed. The production export initially caught a forbidden React Navigation import on Expo 57; that import was removed and shared safe-area height calculation replaced it before rerunning the export.

Final `expo export --platform all` completed successfully for Android, iOS and web (96 static routes). Existing web Tailwind at-rule warnings remain. Generated output is ignored under `.modal-validation/home-feed`.
