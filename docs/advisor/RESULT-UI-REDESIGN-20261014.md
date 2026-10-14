# Result screen redesign — 2026-10-14

## Scope and audit

Workspace: D:/EXE/bbeauty-app-mlkit-advisor. Read AGENTS.md and the required Expo version documentation. Reference image is a visual specification; no screenshot is used as the UI.

Flow: app/makeup-advisor.tsx → useAdvisor → native normalization/analyze → extractFaceFeatures → recommendFaceScan/localEngine. Face-Aware V2 returns the local AdvisorResult/MakeupRecommendation contract; result rendering does not invoke a recommendation provider endpoint. Engine ordering, scoring, preferences, scan admission, native memory guards, camera flow and session selfie ownership are preserved. The previous 10-second valid / 5-second validation presentation fix remains in place.

Local catalog: styleLibrary.ts + bbook-makeup-style-library.vi.json (12 keys, imageKey, imageBrief, visualFocus, signatureLook, palette, techniques, quickSteps). Style detail and catalog use local modal state, preserving Top 3 and scroll position without running AI again. Selfie is passed by URI from the existing session and is not uploaded or retained beyond its existing lifecycle.

API audit: services/exploreService.ts uses the existing authenticated API client for GET /Explore and GET /Explore/search. Explore DTOs provide real service price/images/owner, artist rating/reviewCount/styles/avatar/cover/city and featured portfolio image arrays. Distance is absent. No GPS is requested. Portfolio thumbnails appear only when featuredPosts contains entries for that artist; no per-artist fan-out requests.

Read-only backend audit: BeautyBook-advisor-integration-20261013/BeautyBookBackend/Services/ExploreService.cs uses PublicArtists restricted to Listed + Approved, active/non-deleted user and block rules. Services are active and owner must pass that public artist query. This frontend delegates eligibility to those existing marketplace endpoints; no new client eligibility assumptions, auth changes or booking rules.

Existing routes: /mua-detail?id=...; service navigation additionally uses tab='Dịch vụ' and serviceId. No booking/cart action is added. No favorite icons are shown. Generic marketplace navigation explicitly opens Khám phá rather than pretending the existing route accepts a style filter.

## Implemented layout

- Reference header, analysis pill, large title, explanatory text and optional session selfie thumbnail.
- Featured first recommendation with pink border/badge, large 4:5 illustration region, engine title/description, localized catalog tags, labeled illustrative color swatches and working detail action.
- Ranks 2 and 3 are both visible in a two-column row when width/font scale permits. Below 390dp or fontScale > 1.15 they stack to protect Vietnamese text and buttons. They do not require horizontal swiping.
- Services precede artists. Horizontal cards show actual records, prices and profile/service navigation. Artists show valid rating/review count, optional city and portfolio from the existing catalog. No distance is fabricated.
- A Top 3 style selector switches the existing marketplace filter. Initial selection follows rank 1. Runtime catalog numeric IDs are resolved by exact normalized aliases. Without a known ID, existing keyword search/fallback uses neutral copy and never claims personal compatibility.
- Independent TanStack infinite queries, 60s cache and retry:false. Existing matching screen shares these query caches. Opening an all-results sheet does not refetch; pagination preserves the actual query/filter/cursor, deduplicates IDs and has explicit retry. Empty keyword/broad requests are not duplicated.
- Independent lightweight skeleton, empty, failure and retry states. Failures never clear the engine result. Both bottom actions work: retake uses the existing acquisition flow; explore styles opens the local 12-style catalog.
- Shared acquisition buttons retain their earlier appearance; the result appearance is an explicit button variant.

## Changed files in this request

Modified:
- app/makeup-advisor.tsx
- features/makeupAdvisor/AdvisorResults.tsx
- features/makeupAdvisor/AdvisorMatching.tsx
- features/makeupAdvisor/matchCatalog.ts
- features/makeupAdvisor/__tests__/screen.test.tsx

Added:
- features/makeupAdvisor/AdvisorMarketplace.tsx
- features/makeupAdvisor/ResultVisuals.tsx
- features/makeupAdvisor/useAdvisorMatches.ts
- features/makeupAdvisor/styleImages.ts
- features/makeupAdvisor/__tests__/resultMarketplace.test.tsx
- assets/images/advisor/styles/README.md
- docs/advisor/RESULT-UI-REDESIGN-20261014.md

New components: AdvisorResultHeader, MakeupRecommendationCard, MakeupStylePalette, MakeupStyleImage, AdvisorImage and AdvisorMarketplace. Existing AdvisorResults owns style detail/catalog modals.

## Images and known limits

All 12 stable keys have explicit registry slots: soft-korean, douyin, clean-girl, natural, peach, strawberry, latte, soft-glam, thai-glam, smokey-eyes, bridal-soft-glam, classic-glam.

No licensed local style portraits were present. Every slot currently uses a themed placeholder, not a repeated portrait or the selfie. The asset README contains all 12 original catalog briefs, visualFocus and exact WebP paths. Add distinct licensed WebPs (suggested 720×960, under 150KB) and literal require entries in styleImages.ts. The visual match to the photographic reference is therefore incomplete until these images are supplied. Marketplace images are only actual existing API URLs; failed image loading falls back safely. Android resizeMethod='resize' requests sampled decoding for thumbnails.

Color swatches are illustrative UI mappings of catalog color names, not measured skin colors. Every catalog palette name has a mapping; unknown future names remain labeled instead of assigning a claimed color.

Marketplace relationship means style linkage to an artist/service tag. It is not a personalized score or confirmed availability. Unknown style keys may use broad marketplace fallback with neutral copy. Portfolio thumbnails are limited to existing featuredPosts, and absent portfolios are omitted. No backend matching endpoint or new API is created.

## Validation

TypeScript --noEmit: passed. ESLint on changed UI/hook/helper/tests: passed with zero warnings. Automated targeted coverage: 60 unique tests across screen, resultMarketplace, advisorMatching, useAdvisor and scanPresentation. Coverage includes real DTO values/routes, ranking, modal back/catalog behavior, API isolation, cache/no duplicate fetch on all-results opening, cursor search consistency, absent rating/images/portfolio, empty data, 12 asset slots/palette mappings and the 10/5-second scan/cancellation lifecycle.

No physical device, emulator screenshots or pixel comparison have been run. No live marketplace response/eligibility integration test has been run; eligibility was verified in backend source, with frontend DTO/API behavior tested using fixtures. Check 360/390/430dp Android layouts, large Vietnamese font sizes, safe area, real network images/offline/retry/pagination, modal back, retake/cancel, and native memory on the phone. Photographic visual acceptance remains pending assets.

## Build yourself

No APK/AAB/EAS build, commit, push, deploy, database or backend change was performed.

Use the existing project build procedure. Local preview helper, from PowerShell:

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
.\docs\advisor\Build-Preview.cmd
```

The existing helper uses the machine's configured Java/Android SDK and Gradle cache. Its log is .expo/advisor-preview-build.log; release APK normally appears at android/app/build/outputs/apk/release/app-release.apk. Install the resulting APK over the current preview using the same signing configuration. The existing advisor-preview EAS profile is also available if you choose your usual EAS workflow; it was not executed here.
