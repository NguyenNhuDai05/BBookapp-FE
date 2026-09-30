# Compact shared feed layout (2026-09-30)

Applies to Home, MUA community, favorites, customer portfolio feed and MUA portfolio management through the shared PortfolioPost component. Existing screen callbacks, repositories, endpoints, DTOs and routes are retained.

- Post: no outer horizontal margin, rounded shell or full-card border; 8px separation and a light bottom divider. Width 100%, centered with a 640px maximum.
- Header: 42px avatar, 10px vertical padding, compact outline follow control, existing ellipsis for author names. Follow remains disabled where the screen has no supported callback.
- Caption: title separated by 4px; description limited to three 20px lines, with the expansion control alongside the final line. Full caption remains available on expansion.
- Gallery: edge-to-edge, cover, 4:5 portrait ratio with a 600px height cap; smaller counter and 18px pagination strip.
- Booking: flexible text column with name, pink price and subtitle; fixed compact button without redundant calendar icon; 68px minimum height and no wrapping of the button into a separate row.
- Actions: 25px icons, 4px count gap, 18px between actions, existing 44px touch targets.
- Hashtags: plain pink text with wrapping instead of padded pills.

Validation: five feed regression tests cover caption expansion on native/web, original social/profile callbacks, follow locking, and booking/options/image viewing after a 320px gallery layout event. This is component-level verification, not an actual Android/iOS/Web visual check.

Final checks: TypeScript and changed-file ESLint passed; all five feed tests passed; Expo export completed for Android, iOS and Web (96 static routes). Existing Tailwind at-rule warnings remain. Generated bundles are stored outside the app checkout at D:\EXE\.build-check\compact-feed-20260930. Actual device/simulator/browser visual QA was not performed.
