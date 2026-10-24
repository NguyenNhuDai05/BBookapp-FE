# Virtual Lipstick — Phase 1

## Scope

Local Android preview on a single normalized selfie. No camera, detector,
normalization, ranking, catalog, marketplace, booking, backend, environment,
dependencies or production configuration changes are needed for this feature.
No photo or geometry is uploaded. No export/save feature is advertised.

## Data and ownership

`useAdvisor` already commits `{photo, analysis, extraction, result}` together.
The existing results CTA switches a boolean substage in `app/makeup-advisor.tsx`.
Studio receives that photo and raw analysis without native inference. Its back
buttons and Android hardware back close only the substage. The Advisor hook stays
mounted and focused. Existing route blur/unmount/reset cleanup retains ownership
of the temporary JPEG. Studio creates no image files or native detector objects.

Trying another photo uses the existing acquisition/consent flow. Cancelling that
flow retains the previous Advisor result. Leaving the Advisor session still
triggers its existing cleanup.

## Geometry evidence and renderer

The native module forwards `FaceContour.faceContourType` and its point polyline
unchanged. Existing `faceFeatures/extractor.ts` identifies contours 8/9/10/11 as
upper outer / upper inner / lower inner / lower outer, with counts 11/9/9/9.
Studio consumes these ordered polylines, pairing endpoints by geometric distance;
it does not assume their left-to-right direction, sort points by X, or invent
landmarks. Outer and inner loops use the actual returned vertices. SVG `evenodd`
subtracts the mouth opening. Missing inner contours are rejected.

Mesh regions are arrays of indices from SDK `getPoints(type)`. Their polygon
winding/order is not established by the bridge contract. Phase 1 deliberately
uses verified Face Contours even when mesh exists. Missing mesh is supported;
mesh without usable contours is unsupported, not replaced by a guessed mask.

Validation rejects wrong face count/pose, malformed/count-mismatched contours,
non-finite/out-of-image points, geometry outside the lower face, implausible
dimensions, disconnected corners, self-intersecting loops, and openings outside
the outer lip. Closed-mouth zero-area openings require coincident inner curves.
These conservative geometry checks do not detect darkness or occlusion reliably.

## Coordinates

Native `BoundedNormalizer` rasterizes EXIF orientation 1–8 (including mirrored
orientations), resizes the long edge to at most 1280, and writes a local JPEG.
Analysis decodes that JPEG with rotation 0. Studio accepts only that normalized
filename namespace, matching Photo/Analysis dimensions and one frontal face.
It also waits for Image.onLoad and checks the decoded image dimensions before
painting. A mismatch or image load error offers recovery instead of an overlay.

Image and SVG share one explicit contain rectangle:

`scale = min(viewWidth / imageWidth, viewHeight / imageHeight)`

`left = (viewWidth - imageWidth * scale) / 2`

`top = (viewHeight - imageHeight * scale) / 2`

SVG viewBox remains in bitmap pixels. No additional EXIF rotation or mirroring
is applied. Unit tests cover mapping of already normalized pixels; they do not
constitute real EXIF decoding or Android rendering verification.

## UI

Advisor Results → **Thử makeup trên tôi** → **Thử makeup**.
Five lipstick presets, accessible opacity adjustment (0–100), original/makeup
toggle, header/footer back, and retry photo. Default opacity is 45%. Color and
opacity changes update SVG props only. Unsupported images show Vietnamese
instructions and recovery actions. No new route is pushed.

## Changed files

Modified:

- `app/makeup-advisor.tsx`: Studio substage, hardware back and existing acquisition.
- `features/makeupAdvisor/AdvisorResults.tsx`: optional Studio CTA.
- `features/makeupAdvisor/__tests__/screen.test.tsx`: return/session regression.

Created under `features/makeupStudio/`:

- `lipGeometry.ts`: lip validation, outer contour and mouth opening.
- `imageTransform.ts`: shared contain rectangle and pixel mapping.
- `LipstickOverlay.tsx`: Image dimension check and SVG overlay.
- `MakeupStudio.tsx`: local controls and recovery UI.
- `lipstickPresets.ts`: five named colors.
- `testSupport/fixtures.ts`: synthetic, non-personal contour data for tests only.
- `__tests__/lipGeometry.test.ts`: geometry and unsupported input checks.
- `__tests__/imageTransform.test.ts`: normalized-coordinate mapping checks.
- `__tests__/MakeupStudio.test.tsx`: controls and image failure checks.

This document records the architecture and physical-device acceptance checklist.

## Limitations and device acceptance

This is a flat translucent SVG color overlay, not physically based lipstick.
At 100% opacity it covers texture; lighting and original lip color affect the
preview. No calibrated color, feathering, gloss, tooth segmentation or occlusion
model is claimed. A contour around an obstruction may pass geometric checks.
Large mouth openings or crossing/noisy inner contours may be rejected.

Local tests use synthetic contour fixtures and mocked native/image events.
Real selfie alignment, teeth exclusion, EXIF decoder behavior, memory usage and
visual quality still require an Android APK on physical devices:

1. Build the intended branch with the existing Android workflow after these
   changes are reviewed and integrated. This task does not commit/push/build it.
2. Scan a frontal selfie and open the Studio CTA; verify the same image appears.
3. Check all five colors and opacity 0, 45, 100. At 0, the image must be unchanged.
4. Test closed lips and a small smile showing teeth; inspect corners, lip edges,
   and the mouth opening at full screen. Reject the release if teeth are painted.
5. Test portrait/landscape gallery JPEGs, EXIF-rotated and mirrored originals,
   front camera selfies, different viewport sizes and device rotation.
6. Test occluded/dark/profile/multiple-face photos; verify rejection or accurately
   aligned results, never an invented rectangular mask.
7. Switch original/makeup; return with both header and hardware back. Results and
   selfie must remain. Repeat opening/closing and inspect memory for growth.
8. Retry and cancel capture, then try another photo. Leave Advisor and verify
   its normalized cache file is deleted by the existing owner.
9. Repeat offline (after the app is ready) to verify lipstick preview needs no API.

## Next phase

After device acceptance: draggable before/after comparison, refined local blend
and presets. Add blush only after validating a separate cheek mask and occlusions.

## Local verification — 2026-10-22

- Advisor + Studio Jest regression: **46 suites, 345 tests passed**.
- `npx --no-install tsc --noEmit`: passed.
- `npm run lint -- --no-cache`: exit 0; 20 pre-existing warnings in unrelated files.
- ESLint scoped to Studio and the three changed Advisor files: passed, no warnings.
- `git diff --check` for modified Advisor files: passed.
- JSON test results: `D:/EXE/artifacts/virtual-lipstick-tests.json`.
- Physical Android / APK / real selfie acceptance: **not performed**.
- No commit, push, deploy, production request or dependency installation performed.
