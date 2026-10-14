> Latest source/config readiness: [RELEASE-READINESS.md](RELEASE-READINESS.md). This historical APK report does not validate the current source.

# BBook — Complete Hybrid AI Makeup Advisor candidate

> Historical native/APK checkpoint. The current app/backend contract is **v3** and the current local flow/config/tests are documented in [LOCAL-E2E.md](LOCAL-E2E.md). The APK below contains the earlier v2 bundle, not the new local pipeline.

Audit/implementation: 2026-10-13, Asia/Bangkok. This report supersedes the earlier 30-feature/beta1 report. **Candidate implemented; real-user Gemini and release readiness remain gated.** No commit/push/merge/deploy, billing, migrations, Play upload, Firebase identity or alpha installation was performed.

## 1. Scope and verified baseline

Frontend `D:\EXE\bbeauty-app-mlkit-advisor`, branch `candidate/mlkit-advisor`, base `a037eadc0207379312bee87313c380ae14428a65`. Backend `D:\EXE\BeautyBook-feature-advisor`, branch `candidate/feature-summary-advisor`, base `42fcc29d1f0c8fc30002109a0b09dd52b941d980`. Existing dirty candidate changes were preserved and inspected, not reset. The original `D:\EXE\BeautyBook` image-upload/daily-quota work was not merged or edited. Expo v54 documentation was read as AGENTS.md requests; installed versions remain Expo 57.0.24/RN 0.86.3, unchanged.

## 2. What changed in this continuation

- Face Mesh beta1 → **16.0.0-beta3**, resolving MediaPipe to **17.0.0-beta10**. The new SDK's arm64 `libxeno_native.so` independently passes LOAD/RELRO 16 KiB checks. Removed the old 4 KiB runtime-only mesh restriction. Full application/device status is separate.
- Added four conditional unsigned eye/brow contour tilt descriptors, stricter optional-region bounds and conservative provenance that includes normalization prerequisites.
- **Summary schema v2** preserves every eligible measured number and its source enum. Backend attaches trusted per-feature formula, point-group description, normalization, valid range, quality gate and possible makeup use. No arbitrary client prompt text or raw coordinates.
- Added synthetic extractor-fixture → HTTP controller → provider prompt integration tests and approved-build frontend request/output tests. Provider receives measurements directly, never local recommendations to rewrite.
- Separate fixed synthetic diagnostic executable, model-list audit, hidden-key User Secrets setup script, Render instructions and default-OFF feature flags. No production diagnostic endpoint.
- Short consent bottom sheet, optional separate cloud permission, detail hero illustration and optional readable contributing-region labels. Existing automatic scan/results/matching flow retained.
- Defensive output checks for common unsupported personal assertions, invented confidence percentages and decimal measurement leakage; duplicate evidence rejected. A heuristic cannot prove all generated statements are sound.
- Added `common-page-size=16384` beside max-page-size for locally compiled native libraries. Existing prebuilt SDKs remain individually audited.

## 3. Actual native observations

Two genuine Face Detection passes: accurate count/all landmarks/classification, then accurate contours for a single face. Observations include count, bounding boxes, Euler X/Y/Z, all available landmarks/contours and nullable eye-open/smiling probabilities. Optional mesh returns 468 indexed XYZ points, SDK triangles and SDK region index groups. Normalizer rasterizes EXIF/mirror once; analysis uses bitmap pixel coordinates, rotation 0. There are no fabricated points/default face measurements. Runtime correctness on a phone is **NOT TESTED**.

## 4. How many features are valid?

**34 conditional definitions**: original 30 plus left/rightEyeTilt and left/rightBrowTilt. A synthetic complete-region fixture reaches all 34 and all documented range checks. **27 are summary eligible; 7 remain local diagnostics.** This is reachability/contract evidence, not a claim that every real selfie produces 34 features or that 27 measurements are clinically/anatomically accurate. The count for an actual device selfie is unknown until device acceptance.

Common quality gates: one face, valid in-image bitmap/box, face/outline width >=200px, yaw/pitch <=15°, roll <=10°, coherent outline/eye axes and nondegenerate spans. Optional unavailable/out-of-range/out-of-face values are omitted. Smiling >.55 omits mouth-related measurements; available eye-open <.4 omits both eye aspect/tilt. Unknown probabilities remain unknown. No calibrated lighting/occlusion classification is claimed.

## 5. Which features reach Gemini?

When approved build, individual consent and all backend gates are enabled: outlineAspect, eyeSpacing, left/rightEyeWidth, left/rightEyeAspect, left/rightEyeTilt, left/rightBrowLength, left/rightBrowArch, left/rightBrowTilt, left/rightBrowEyeGap, noseBridgeLength, noseBaseWidth, mouthWidth, mouthAspect, upper/lowerLipThickness, lowerFaceHeight, outlineUpper/Middle/LowerWidth and chinWidth — only those actually valid for the selected image.

Local-only: eyeWidthDifference, left/rightEyePosition, mouthPosition, outlineCompactness, meshProjectedArea, meshRelativeZSpan. Relative Z/topology are consumed locally, not sent; no physical depth inference. Detection fallback source is retained conservatively even if some mesh groups exist. See `FEATURE-INVENTORY.md` for formulas/ranges/use.

## 6. Does Gemini actually use them?

Source and tests prove the request values/sources are preserved in the provider's user message alongside server-owned metadata, quality, missing keys, limitations and supported style whitelist. Changing synthetic measured eye spacing changes the forwarded number. Response citations must be keys present in that input; validated provider tips are displayed unchanged with source Gemini.

**No live Gemini generation has run with BBook-AI's key**, so actual model interpretation/contributing feature choice/usefulness is **NOT VERIFIED**. Mocked rows cite eyeSpacing; that proves validator/routing behavior only. The diagnostic uses seven synthetic input features and can establish real generation after owner key configuration. Local exploratory rules use up to 19 eligible inputs; they are labeled on-device and never sent as the Gemini prompt. Citations alone do not prove causal model reasoning; review explanations in live synthetic acceptance.

## 7. Model choice / free tier

Documentation-based first diagnostic choice: **gemini-3.5-flash-lite**, stable, structured JSON supported, public free tier listed, input/output limits 1,048,576/65,536. 3.5 Flash is deprecated and routes to 3.6; 3.6 and 3.8 Flash exist; 2.5 Flash-Lite is served but restricted to previous users. Do not guess a newer Flash-Lite text ID from TTS names. Model comparison, official source links and rates are in backend `docs/GEMINI-SETUP.md`. Public availability does not prove BBook-AI access or quota.

## 8. Real API key audit status

**NOT TESTED**. The user says the key has not been configured. No secret store probing, key lookup or real authenticated Google call was made in this continuation. The previous auto-review rejection of unsolicited credential probing was respected. This continuation prepares owner-run configuration and narrow diagnostics instead. RPM/TPM/RPD/billing/project identity remain unknown; Models API alone cannot provide those quotas.

## 9. Where to put the key

Backend only: `FeatureAdvisor:ApiKey` in .NET User Secrets for Development; `FeatureAdvisor__ApiKey` as a Render secret environment variable later. Never Expo public env or Git. Owner-run PowerShell script `D:\EXE\BeautyBook-feature-advisor\docs\Configure-FeatureAdvisorKey.ps1` uses hidden input/stdin. No key was stored by the agent. See setup guide for model and flags.

## 10. Endpoint / synthetic diagnostic status

Authenticated `POST /api/MakeupAdvisor/recommend` with summary v2 passes synthetic integration through ASP.NET TestServer and a **mocked Google provider** (HTTP 200, three whitelist rows, exact numbers/sources/metadata and no-store). This never starts production Program.cs or connects to the production database. Separate `BeautyBookAdvisor.Diagnostics` builds and prepares `--verify` (Models API + one fixed synthetic GenerateContent) and a nonce-protected loopback `/diagnostics/recommend` empty-body endpoint. Live key diagnostics are pending owner setup; no fake live success is claimed.

## 11. Conditions for actual user data

Unpaid real-user sharing remains OFF under the current [Gemini terms](https://ai.google.dev/gemini-api/terms). Geometry tied to a real selfie is not established as anonymous, and consent does not override provider restrictions. Owner review of an appropriate Paid Services/data-processing arrangement, region/audience, retention/security, budget, verified model/quota and tester/device acceptance is required. Payment alone does not establish all requirements. A concrete paid-processing/budget proposal is prepared in `GEMINI-SETUP.md`; no Paid Tier/billing change occurred.

## 12. Privacy and consent

Local processing requires consent in a short modal sheet before acquisition. Optional cloud switch is separate and defaults false; it appears only in an explicitly approved internal build. On-device path can continue without cloud consent. This APK keeps build approval false. Backend Enabled, RealUserDataApproved and ModelAvailabilityVerified all default false. A user can revisit consent before another photo. No selfie/URI/raw mesh/identity is accepted in the summary contract or provider prompt. Numbers remain transient, not in logs/database/cache. Request/response no-store; cache stores TTL admission booleans only. App reset/unmount/background cancels HTTP, invalidates generations and removes owned temporary files; gallery originals are untouched.

## 13. Fallback and request protection

One Gemini attempt per accepted scan, no automatic retry, 18s default deadline (clamped 1–25), maxOutputTokens 3,840 and upstream response cap 32 KiB. Strict schema/source/range/consent/auth/style/evidence/region-tip validation. 401/model missing/429/503/timeout/incomplete/invalid JSON or prohibited common claims → correctly labeled local recommendations. No request on style selection, detail reading or MUA filters. 12/minute anti-spam, one active call/user, duplicate UUID TTL 5min; **no daily quota**. Per-process guards do not provide distributed idempotency. Output heuristics are defensive; unsupported semantics outside their patterns need reviewer evaluation.

## 14. Scan/results UX

Same scanning screen shows actual normalized photo, real native contour event and optional final mesh points/edges. Coordinates share the photo's contain/viewBox transform. Pink line moves vertically with native-driver loop/glow/corners; no fabricated progress percentage, fake landmarks or added Gemini screen. Completion automatically shows featured and alternate styles. Detail sheet includes actual catalog portfolio or original cosmetic illustration, all region tips, limitations and optional readable contributing-region labels, never raw JSON/numbers. Physical Android animation/visual QA remains pending.

## 15. MUA/service/booking

Existing Explore runtime catalog maps supported style aliases to actual IDs; matching queries actual artists/services and optional location/price after results. Service tag vs artist specialty is distinguished; no fabricated price/rating/MUA. Existing MUA detail receives actual id/tab/serviceId and existing booking flow is reused. Fresh read-only live Explore audit at 01:29 Bangkok found 4 styles, 6 featured posts, 4 artists, 4 services, plus Korean queries returning 2 actual artists and 2 services at limit 2. Mobile end-to-end checkout is not exercised. Booking navigation/regression tests are included in this continuation.

## 16. QA evidence

| Check | Status |
|---|---|
| Advisor Jest before final geometry additions | 110/110 PASS, 11 suites |
| Final Advisor + selected booking regression | 126/126 PASS (116 Advisor + 10 selected booking tests), 14 suites |
| Backend Advisor contract/pipeline/model audit | 37/37 PASS |
| Diagnostic executable build | PASS; final build: 0 warnings/errors; earlier baseline build had 3 unrelated warnings |
| TypeScript / scoped ESLint | PASS; final logs empty |
| Full backend regression | 467 PASS / 99 SKIP / 0 FAIL at regression checkpoint; final affected Advisor suite 37 PASS; skipped tests require DB fixture |
| Kotlin/native beta3 build/tests | 9/9 PASS; release/debug compilation PASS |
| Expo preview/production flags | PASS: preview Advisor ON, production OFF, Gemini OFF both |
| APK assemble/signature/packaging | PASS; v2 signature, models/module, Advisor ON and Gemini OFF verified |
| MediaPipe beta10 arm64 static 16 KiB | PASS (LOAD=0x4000; RELRO end aligned) |
| Full APK static 16 KiB / device | FAIL: 27/27 LOAD PASS, 15 RELRO failures; ZIPALIGN PASS / device NOT TESTED |
| Real Gemini key/model/quota/generation | NOT TESTED; owner configuration needed |
| Real selfie, 468 SDK output, camera, repeated scans | NOT TESTED; ADB inventory empty |

Evidence directory: `D:\EXE\artifacts\hybrid-advisor`. Tests exclusively use synthetic fixtures/test keys/mock HTTP; fixture source `scripts/Export-AdvisorFixture.cjs` invokes the actual TypeScript extractor and is not imported in product code. Initial Jest sandbox transform-cache permission failure ran zero tests; rerun with workspace cache succeeded. Initial endpoint privacy assertion incorrectly matched the metadata group's string field, was corrected to reject raw root mesh/points, then passed.

## 17. APK

Beta3 APK assembled successfully at 08:35 Bangkok. Gradle reported 7h 21m 17s, 911 tasks (105 executed/806 up-to-date). This was a local build, not device profiling. Do not mistake the older beta1 APK for this continuation. Final artifact: `D:\EXE\artifacts\bbook-hybrid-advisor-beta3-preview-20261013.apk`. APK size **76,591,018 bytes (73.0 MiB)**; SHA-256 **E4C4112538A52A1F9E5FF9C4FB4F5BABEC5C787B0116BE3EC3257A59EAD66784**. Package remains **com.bbook.app**, versionCode1/versionName1.0.0, existing debug signing (certificate SHA256 fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c), arm64/minSDK24/target36. JS source-map audit matches all 10 key runtime source files, and the APK embeds that exact Hermes bundle. **Use a spare device without alpha; do not install over alpha.** No installation occurred. Firebase currently registers only this package; separate package/signing requires owner-approved compatible Firebase/push configuration.

## 18. Android 16 KiB

Root cause of beta1 xeno failure: prebuilt MediaPipe beta8 library had 4 KiB LOAD and bad RELRO. Beta3 pulls beta10; its AAR arm64 binary passes independently, a substantive dependency fix. Local builds now use both max/common-page-size flags to repair RELRO of compiled libraries. Old APK also had many vendor prebuilts with strict RELRO-end failures despite 16 KiB LOAD; app-level linker flags cannot rewrite those closed binaries. Full APK must pass official LOAD/RELRO and ZIP checks plus actual 16 KiB device acceptance before release readiness. No Expo/RN upgrade or binary header patch was performed. Final APK: **all 27 LOAD alignments PASS, ZIPALIGN PASS; 15 vendor prebuilt RELRO-end checks FAIL**, compared with 24 failures in the old APK. Nine libraries now pass that previously failed. All rebuilt source libraries and xeno pass. Remaining failures include libc++_shared (NDK r27), Hermes/JSI/fbjni/Fresco/image decoders, AndroidX/Datastore/zstd and face_detector_v2_jni. Link flags cannot repair prebuilts. Minimal next path is provider-supported aligned SDK/prebuilt replacements (including an appropriately reviewed newer NDK for libc++), then static and 16 KiB runtime QA; no Expo/RN upgrade or ELF header edit was used to hide the failures. Full list and segments: artifacts/hybrid-advisor/apk-16k.json. **Release blocker remains**; [official Android guidance](https://developer.android.com/guide/practices/page-sizes).

## 19. Diff / files

Main continuation files: app.config.ts, app/makeup-advisor.tsx, flags.ts, extractor.ts, advisorRecommendation.ts, responseClaims.ts, AdvisorResults.tsx, Gemini pipeline/feature/build/consent tests, Face Mesh Gradle/native module, local build/inspection scripts and fixture/config scripts. Backend: FeatureAdvisorContract/Definitions/Provider/ModelAudit, MakeupAdvisorController, narrow Program.cs registration, safe example config, three Advisor test classes/fixture, separate diagnostic project and setup docs/script. Existing other candidate work remains preserved. Source manifests and complete tracked/untracked diffs are saved as frontend/backend-manifest.json and frontend/backend-candidate.diff under the evidence directory; no index staging or commits.

## 20. Owner next actions

1. Run secure key setup and `dotnet run --project BeautyBookAdvisor.Diagnostics -- --verify`; record the sanitized result and BBook-AI limits in AI Studio. Never send the key in chat.
2. Test the new APK on a spare device without alpha: one/multiple/no face, selfie EXIF/mirror, mesh468/contour fallback, actual overlay coordinates, closed eyes/smile, cancellation/background/change photo and actual catalog/service navigation. No brand/device acceptance is claimed yet.
3. Review Paid Services processing/budget proposal before real-user flags, and approve a separate Firebase test identity if desired.
4. Resolve full APK 16 KiB/device blockers. Review git diff and existing Production migration startup separately before your commit/push/deploy; do not merge the dirty original image-upload/quota migrations.
5. After provider/data/model/device approval, enable internal cloud build/backend flags and individual consent. Then validate actual Gemini explanations and existing booking on real catalog records before owner-controlled Closed Testing.
