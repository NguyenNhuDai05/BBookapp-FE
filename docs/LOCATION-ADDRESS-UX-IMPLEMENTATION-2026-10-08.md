# Location / Address UX — implementation report

## Files changed

Paths below are relative to `D:/EXE/bbeauty-app` unless marked web.

| File | Reason |
| --- | --- |
| types/location.ts | Candidate, phase and quality types; metadata stays in frontend. |
| utils/locationAddress.ts | Central accuracy/time/length limits, native address formatting and main/details composition. |
| services/locationService.ts | Add candidate/native reverse APIs; preserve coordinates-only Nearby API. |
| hooks/useLocationSelection.ts | Request phases, reverse-only retry, cancellation and duplicate-request protection. |
| components/booking/AddressPickerSheet.tsx | Explicit preview/confirmation, partial address acceptance, optional details, manual fallback and GPS invalidation. |
| store/useBookingStore.ts | Persist only addressDetails alongside existing address and coordinates. |
| app/checkout/index.tsx | Compose address/details for submit; remove location notes input; preserve Notes contract. |
| app/checkout/success.tsx | Show composed draft address in success fallback. |
| repositories/ApiMuaBookingRepository.ts | Match customer canonical destination snapshot with legacy fallback. |
| components/mua/WorkLocationFields.tsx | Confirmed private GPS, separate visit consent, public-address disclosure and missing-detail entry. |
| utils/muaLocationPayload.ts | Omit workplace fields from private operating-point payloads. |
| repositories/ApiMuaProfileRepository.ts | Clear existing workplace then save private point; report partial failure and allow retry. |
| app/mua-onboarding/apply.tsx | Submit private operating-point payload using existing contract. |
| utils/workLocation.ts | Validate coordinates even when replacing a workplace. |
| hooks/useMuaProfile.ts | Refresh cached profile after partial failures as well as success. |
| app/(mua)/edit-profile.tsx | Enable saving when explicit location confirmation is the only change. |
| services/__tests__/locationService.test.ts | Permission, accuracy, reverse results/errors/timeouts and cancellation. |
| components/booking/__tests__/AddressPickerSheet.test.tsx | Booking preview, details/main rules, retry, manual transitions and late responses. |
| components/mua/__tests__/WorkLocationFields.test.tsx | Private/public consent, partial reverse, manual changes, replacement and cancellation. |
| app/__tests__/checkoutLocation.test.tsx | Composed request retains GPS. |
| app/__tests__/muaApply.test.tsx | Onboarding submits confirmed private GPS without workplace fields. |
| app/__tests__/muaProfileEditing.test.tsx | Confirmation-only save and partial failure retry. |
| repositories/__tests__/muaProfile.test.ts | Private payload, two-request replacement, failure/retry and legacy reads. |
| repositories/__tests__/bookingDestination.test.ts | Customer/MUA canonical and legacy destination consistency. |
| LOCATION_SETUP.md | Document implemented flow, limitations, compatibility and device checks. |
| docs/chinhsach.txt | Sync generated privacy disclosure; preserve terms. |
| docs/LOCATION-ADDRESS-UX-IMPLEMENTATION-2026-10-08.md | This evidence and file inventory. |
| web: legal/content.json | Explain native reverse geocoding and update deletion-action wording. |
| web: legal/privacy.txt | Generated privacy text. |
| web: privacy.html | Generated privacy page. |
| web: privacy/index.html | Generated alternate privacy route. |
| web: delete-account.html | Generated deletion page with current action wording. |
| web: delete-account/index.html | Generated alternate deletion route. |

## Verification

- `npm test -- --cacheDirectory D:/EXE/.jest-location-ux --testTimeout 20000 --silent`: 59 suites, 398 tests passed. This full run preceded the final duplicate-request guard and extra onboarding test.
- `npm test -- --cacheDirectory D:/EXE/.jest-location-ux --testTimeout 30000 --runTestsByPath services/__tests__/locationService.test.ts components/booking/__tests__/AddressPickerSheet.test.tsx components/mua/__tests__/WorkLocationFields.test.tsx app/__tests__/muaApply.test.tsx app/__tests__/muaProfileEditing.test.tsx repositories/__tests__/muaProfile.test.ts repositories/__tests__/bookingDestination.test.ts app/__tests__/checkoutLocation.test.tsx --silent`: final code, 8 suites / 84 tests passed.
- `npx tsc --noEmit`: passed.
- ESLint on changed runtime files and related tests: no new errors. Global `npm run lint` remains blocked by existing `react-hooks/set-state-in-effect` errors in unchanged `app/(admin)/payouts/[id].tsx:32` and `app/(admin)/private-media.tsx:17`.
- `dotnet test BeautyBook/BeautyBookBackend.Tests/BeautyBookBackend.Tests.csproj --no-restore --filter "FullyQualifiedName~WorkLocationTests|FullyQualifiedName~MuaLocationTests|FullyQualifiedName~BookingDestinationAccessTests" --verbosity minimal`: 29 passed, including existing private-location visibility and destination access rules. No backend source changes.
- `npx expo export --platform android --output-dir D:/EXE/artifacts/location-ux-android-final --max-workers 2`: passed with Hermes bytecode. Process TEMP/TMP pointed to writable `D:/EXE/.verification/location-ux-temp` for this command.
- In android directory: `./gradlew.bat :app:createBundleReleaseJsAndAssets --offline --no-daemon` with existing Android Studio JBR and SDK paths: BUILD SUCCESSFUL. This verifies release JavaScript/Hermes/assets, not a complete signed APK/AAB build.
- Release bundle bytecode header verified; source-map contents match final service, hook, Booking picker, MUA picker and MUA profile repository source.
- `git -c core.safecrlf=false diff --check`: passed for app and web.
- package.json, package-lock.json, app.json and terms text match HEAD; generated privacy variants are synchronized; backend working tree clean.
- `adb devices -l`: no connected device. Expo Go, physical-device geocoding/permissions and installed Closed Test upgrade have not been verified.

## Compatibility and remaining device checks

No backend change required. No migration, API changes, new package, Expo upgrade, native permission/config change or Maps Platform integration. Legacy snapshots are read as stored; no parsing/backfill or automatic reverse geocoding. Private GPS uses the existing operating-location branch.

Existing public workplace to private point uses two non-atomic requests. If clearing succeeds but saving fails, UI reports that state, refreshes profile and allows retry without false success.

Native reverse coverage, internet availability and approximate GPS depend on the device/OS. Booking with no reverse label must retry or enter a manual address because backend requires nonempty address. Private MUA GPS can be confirmed without reverse label.

Web legal pages are changed locally, not published. Production binary release, Expo Go and phone tests remain pending. Current app setup has OTA disabled; shipping the change follows the existing binary release process.

Android checklist:
1. Open Booking picker: no permission prompt until GPS tap; test precise/approximate, denied/blocked and Location off.
2. Confirm full and ward/city address without retyping; details optional. Editing details keeps GPS; manual/main change drops GPS.
3. Test offline reverse retry, GPS timeout, closing sheet while loading and late responses.
4. Submit Booking; compare Customer/MUA snapshot; external map must open GPS point.
5. Onboard/edit MUA with consent OFF and partial/failed reverse; verify private exact address/coordinates are absent in public view.
6. Consent ON: verify disclosure, complete only missing address and test workplace-to-private save/retry.
7. View legacy address-only/coordinate-only records; verify Expo Go and upgrade from installed Closed Test binary.
