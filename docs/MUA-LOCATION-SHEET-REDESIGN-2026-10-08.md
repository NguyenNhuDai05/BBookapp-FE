# MUA operating-location bottom sheet

## UI changes

The main form now has one compact location summary/action. Opening it does not request permission. The sheet has a grabber, X, the subtitle “Vị trí hoạt động chính cũng là nơi làm việc của bạn”, two action cards, a compact GPS result, separate visit consent, collapsed optional details and a fixed confirmation/cancel footer. Existing BBook typography/color/radius tokens are reused. Touch targets are at least 44 points; the sheet is capped at 80% of screen height with a scrollable body.

## Behavior and validation

- GPS action requests permission, checks Location services, attempts a recent accurate last-known point, then fresh GPS when needed.
- As soon as valid GPS is available, the hook publishes a candidate. The sheet shows GPS success and enables confirmation while reverse geocoding runs.
- Confirm is enabled for valid acceptable GPS OR nonempty manual address, within the existing composed-address length limit. Reverse completion, consent and optional details are not prerequisites.
- Accuracy above 500 m, missing/invalid accuracy or invalid coordinates do not enable GPS confirmation. Approximate 100–500 m candidates show a warning.
- Reverse failure preserves GPS; “Thử lại địa chỉ” only reverses the same point. GPS failure offers the appropriate permission/settings/retry/manual action.
- Manual mode never requests GPS and clears the old point. Returning to GPS creates a new candidate; only confirmation changes the parent form.
- Consent OFF retains the existing private operating-point branch. Consent ON uses the existing workplace branch and explicitly discloses public address/exact GPS.
- Backend WorkLocationPolicy.Valid/CanVisit/Resolve requires a nonempty address snapshot for visits. With valid GPS but no reverse label, frontend supplies the factual label “Vị trí hoạt động đã xác nhận bằng GPS”; it does not invent a street address. Coordinates remain the navigation destination. No backend change is needed.
- Confirming before reverse finishes freezes the confirmed snapshot; a late reverse result never overwrites it. User can choose GPS again to obtain a new named candidate.
- The generic GPS label is never prefilled as a manual address. Such snapshots use whole-location removal, preventing a generic label without its navigation point.
- Details are optional for both consent states. They compose with the label; private OperatingLocationLabel follows the existing 300-character contract, public composed address remains <=500 characters.
- Existing workplace-to-private save/retry behavior is preserved.

## GPS performance

Cached point: age <=60 seconds, accuracy <=100 m, valid coordinates, no future timestamp. Cache lookup is bounded to 1 second; stale/inaccurate/missing/error/slow cache falls back to fresh GPS. Fresh GPS timeout remains 15 seconds; reverse timeout remains a separate 8 seconds. No automatic retry loop. Existing Nearby getDeviceLocation remains fresh coordinates-only without reverse lookup.

## Gesture implementation

AppBottomSheet has an opt-in draggable branch; other callers keep the existing behavior. Existing react-native-gesture-handler PanGestureHandler and React Native Animated native driver move the sheet and fade the backdrop on the native animation path. No PanResponder, new package or native config is added.

Pan owns only header/grabber. Activate after 8 points vertically; horizontal motion beyond 24 points rejects the pan. Dismiss after min(140 points, 18% of screen height), or downward velocity >900 points/sec after at least 24 points. Otherwise spring back. Successful dismiss animates down for 180 ms before calling the shared close handler.

X, swipe, Android Back, backdrop and Cancel all reach handleDismiss, dismiss the keyboard and unmount/discard local editor state. Unmount invalidates pending requests. KeyboardAvoidingView and ScrollView preserve input/scroll ownership; actual keyboard/native gesture recognition and smoothness still require phone QA.

## Files changed for this follow-up

| File relative to D:/EXE/bbeauty-app | Reason |
| --- | --- |
| components/mua/WorkLocationFields.tsx | Compact form entry and redesigned editor, immediate GPS confirmation, optional details, consent/error labels, unified dismissal. |
| components/ui/AppBottomSheet.tsx | Opt-in native-driven dragging, snap/dismiss threshold and accessibility close label. |
| services/locationService.ts | Bounded last-known fallback and candidate callback before reverse. |
| hooks/useLocationSelection.ts | Publish GPS during resolving and expose typed error code. |
| utils/locationAddress.ts | Central cached-location age/lookup-time limits. |
| services/__tests__/locationService.test.ts | Cache freshness/accuracy/future/timeout and early candidate publication. |
| components/mua/__tests__/WorkLocationFields.test.tsx | Updated flow; loading/failed reverse confirmation, optional details, retries, settings, transitions and consent. |
| components/mua/__tests__/WorkLocationSheetGesture.test.tsx | Dismissal, draft discard/reopen, threshold logic and focused-input cases using mocked native gesture/animation adapters. |
| app/__tests__/muaApply.test.tsx | Onboarding integration follows new sheet entry. |
| LOCATION_SETUP.md | Update current cache, GPS confirmation, label fallback and gesture behavior. |
| docs/MUA-LOCATION-SHEET-REDESIGN-2026-10-08.md | This implementation evidence. |

## Tests and build checks

- `npm test -- --cacheDirectory D:/EXE/.jest-location-ux --testTimeout 30000 --silent`: 60 suites / 416 tests passed, 149.705 seconds. Run before the final generic-label/manual guard.
- `npm test -- --cacheDirectory D:/EXE/.jest-location-ux --testTimeout 30000 --runTestsByPath components/mua/__tests__/WorkLocationFields.test.tsx components/mua/__tests__/WorkLocationSheetGesture.test.tsx app/__tests__/muaApply.test.tsx --silent`: final guard included, 3 suites / 31 tests passed.
- `npx tsc --noEmit`: passed.
- `npx eslint components/mua/WorkLocationFields.tsx components/ui/AppBottomSheet.tsx hooks/useLocationSelection.ts services/locationService.ts utils/locationAddress.ts components/mua/__tests__/WorkLocationFields.test.tsx components/mua/__tests__/WorkLocationSheetGesture.test.tsx services/__tests__/locationService.test.ts`: passed.
- `npx expo export --platform android --output-dir D:/EXE/artifacts/mua-location-sheet-android-final --max-workers 2`: Hermes export passed. Process TEMP/TMP uses existing writable D:/EXE/.verification/location-ux-temp. This is not a signed APK/AAB build.
- `git -c core.safecrlf=false diff --check`: passed; package.json, package-lock.json and app.json have no changes; backend working tree is clean.
- ADB read-only device inventory: empty list. No app was installed/deployed and no physical-runtime pass is claimed.

Gesture tests mock native recognition and native animation completion and exercise the callback actually registered by AppBottomSheet. They verify threshold/confirmation/discard behavior, not device frame rate or actual keyboard presentation.

## Phone checklist / remaining risks

No device is connected (`adb devices -l` returned an empty list). Expo Go, physical Android keyboard plus swipe, native recognition/smoothness and Closed Test upgrade are not verified. Native geocoder availability and first uncached GPS acquisition remain device/OS dependent. The last-known point may be up to 60 seconds old, so preview/confirmation remains essential. Generic GPS snapshots remain generic until the user selects/confirms a new location. Existing two-request workplace-to-private replacement is still non-atomic.

1. Open sheet, verify no permission until GPS tap; verify two cards and initial disabled CTA.
2. Drag a little and release; drag beyond threshold; repeat with manual keyboard open. Test X, Back, backdrop and reopen without saving edits.
3. Verify cached/fresh GPS success, approximate warning, denied/blocked, Location off and timeout recovery.
4. Slow/offline reverse: GPS success remains visible and Confirm works with consent OFF and ON; retry address does not restart GPS.
5. Expand optional details, leave empty/enter text, confirm; switch GPS/manual and confirm no old-point mismatch.
6. Save/onboard, verify public view/map with consent ON and private location hidden with OFF; test existing workplace replacement retry.
