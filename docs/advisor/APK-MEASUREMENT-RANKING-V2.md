# APK face measurement ranking v2

Requested 2026-10-22: repair the GitHub Actions APK from main without changing the scan/results UI.

## Cause and repair

The manual APK workflow resolves `tester-apk`. Previously that profile disabled `advisorFaceAwareExperimental`; runtime flags also rejected `closed-test`. With no preferences and face scoring disabled, deterministic tie breaking selected natural, soft-glam and classic-glam regardless of the measurements.

The tester profiles now explicitly enable local measurement ranking and face-aware experimental scoring. Both gates are verified from the actual resolved Expo configuration, including the runtime flags. Production/other rollout restrictions, package identity, Firebase/push, signing and the manual workflow remain in place. This change does not claim device acceptance or authorize a store release.

## Pipeline

Existing native ML Kit detector/mesh -> existing validated extractor -> existing quality/source/expression checks -> measurements-v2 -> same result components.

No changes to native code, camera permissions, photo normalization, scan animations, result layout, cloud consent, API credentials or image uploads. Face ranking stays on-device.

All 20 entries in `bbook-makeup-catalog-20-vi-v1.2.json` now have `recommendationProfile`: version, evidence/review status, mode, missing-feature policy and weighted feature/rule references. This configuration is actually consumed by the runtime; tests change a weight and assert that its score changes.

V2 uses eyeSpacing, eyeAspect, browArch and mouthAspect. It does not invent skin tone, undertone or anatomical classifications from these ratios. Existing provisional thresholds are smoothed over widths .03/.05/.02/.05 respectively. These are engineering heuristics, not clinically or aesthetically calibrated confidence values. Weights start at 1, preserve the current technique mappings and remain marked experimental/pending review. Other extracted measurements are not silently given arbitrary aesthetic weights.

Each accepted measurement has one bounded contribution per style; absent/rejected measurements are excluded. All styles share the available-feature denominator. Per-style evidence sums exactly to faceScore. Occasion/intensity preferences remain separate; ties remain deterministic and no random style rotation is introduced. Igari and sunkissed remain preference-only because their existing overlay has no defensible face rule. Explicit effect preferences can still select matching styles through the existing preference slot.

Ranking trace includes algorithmVersion, the four usable/rejected measurements, per-rule contributions and final scores. This is an in-memory result, not image/landmark telemetry; production diagnostic logging remains disabled.

## Verification and build

- Regression reproduces the old fixed trio with face scoring disabled, then verifies the enabled actual runtime uses measurement v2.
- Synthetic ML Kit-shaped contour data passes the real extractor before ranking; changed geometry changes scores.
- Test boundary continuity, missing/rejected features, closed eyes, expressive mouth, deterministic order, per-feature budgets and JSON weight consumption.
- 2,592 synthetic full-feature/preference combinations produced 171 distinct ordered Top 3 sets with zero score/uniqueness invariant failures. This grid selected 17/20 styles; igari, fox-eye and sunkissed did not enter Top 3 in that grid. This is not real-image accuracy or a guarantee that every style should win. Effect preferences are tested separately by the existing engine tests.
- The manual workflow runs focused face ranking regressions before native compilation, and the release provenance hashes the ranking source and JSON. `prepare-apk.cjs` refuses resolved config with either runtime gate disabled.

On GitHub: Actions -> Android APK (manual only) -> Run workflow -> branch main. Use a versionCode greater than the previously installed APK's versionCode; retain the existing signing secrets. Inspect `expo-public-config.json`: advisorEnabled, advisorFaceAwareExperimental, advisorMeasurementRanking must be true; advisorCloudEnabled must be false. Install the new artifact, not a cached landing-page APK.

Physical-device acceptance still required: camera/gallery, single/multiple/no face, low light, eyes closed, repeated scans, background/resume, low-memory phone, offline scan and cleanup. Same face can correctly retain similar recommendations; different photos are not a requirement to force different styles.

The original integration hash manifest is retained for historical audit. APK-MAIN-BASELINE-HASHES.json records canonical LF text hashes from git objects at main commit 38d5236 (the source tree before this change), so mixed Windows checkout line endings cannot create false source-change failures. A separate V2 manifest overrides only the three explicitly changed algorithm/catalog files. The same checks still pin all unchanged camera/native/UI sources. Catalog regression compares every original presentation field after removing recommendationProfile, so labels/images/text cannot drift unnoticed. No camera/UI baseline was derived from edited working files.
