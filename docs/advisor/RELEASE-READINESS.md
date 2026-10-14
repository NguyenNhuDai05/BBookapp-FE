# BBook Advisor — standalone APK / Closed Testing preparation

> Superseded for current Advisor Preview package, scan timing and build/deploy verdict by [PREVIEW-BUILD-CHECK-20261013.md](./PREVIEW-BUILD-CHECK-20261013.md). Historical package/Firebase/timing statements below are not current build instructions.

13/10/2026, Asia/Bangkok. **Source/config ready for owner build; closed-test release NOT ready for upload.** No APK/AAB, native compilation, prebuild, EAS build/submit, Git commit/push/merge, Render deploy/env update, billing/key change or device install/uninstall was performed.

## Audit and fixes

- Preserved ML Kit Detection 16.1.7 + Face Mesh 16.0.0-beta3, Expo 57.0.24/RN 0.86.3; no version churn. Existing two-pass count/contour, real landmarks/mesh, EXIF/mirror normalizer, memory guard, owned-photo cleanup, auto scan/results and actual Explore matching retained.
- Removed loopback-only release transport; local and online modes use one recommendation pipeline. Dedicated online Axios client validates HTTPS and adds the real existing login JWT. No local nonce in HTTPS calls; no global API/logout interceptor changed. Missing login, old/malformed capabilities, timeout/error → local fallback. Capabilities must be boolean true and schemaVersion exactly 3 before summary POST.
- Replaced the old one-bit Gemini approval with distinct native/cloud/data/release/transport/diagnostic flags. Release strips inherited local URL/nonce/key fields. Fixed Expo config's runtime failure importing a TS helper by using a shared Node/Metro-compatible JS helper + type declaration.
- APK profile remains standalone release; added store AAB profile using current remote credentials and remote version counter. No versionCode, keystore, Firebase package or EAS project identity replaced.
- Require 4-5 makeupFocus strings to cover eyes/brows/cheeks/lips; bounded local fallback tips to complete sentences for combined geometry signals. Results retain featured/alternative cards, real style-tagged portfolio image or brand illustration, color/occasion exploration and real MUA/service navigation.
- Added CMake max/common 16 KiB flags to the config plugin so EAS-generated native projects receive the source-library mitigation. This does not fix prebuilt vendor libraries. Added static APK/AAB ELF inspector; no new artifact verification claimed.
- Prepared an isolated HTTPS Advisor API using the existing contract/provider/controller and BBook's authoritative authenticated profile endpoint. No JWT signing key, DB registration or migration startup in this host. Data/provider gates keep the current unpaid real-user flow closed.

## Branches and pipeline

Frontend: `D:\EXE\bbeauty-app-mlkit-advisor`, candidate/mlkit-advisor, HEAD a037ead. Backend: `D:\EXE\BeautyBook-feature-advisor`, candidate/feature-summary-advisor, HEAD 42fcc29. Both remain dirty with preserved earlier work and new uncommitted files. Backend is 22 commits behind locally known origin/main; remote refs were not fetched. Original `D:\EXE\BeautyBook` status remains unchanged.

Selfie stays on device → normalization → genuine ML Kit count/box/Euler + contours/available 468 mesh → measured v3 summary (27 conditional share-eligible ratios, source map, normalized box/pose, quality/missing/limitations) → approved HTTPS backend with account JWT → trusted measurement metadata → Gemini → strict 3 recommendations → Explore runtime style IDs/actual MUA/services → existing detail/booking flow. No raw image/base64, coordinates, mesh Z, account identity or local recommendations in the Gemini prompt. Missing/out-of-range/expression-sensitive metrics omitted. No calibrated face-shape/undertone/health/gender/ethnicity classification. No Gemini request when viewing style details or changing matching filters.

Scan uses the actual normalized image/SDK overlay, genuine contours fallback, mesh points/edges when valid, pink line/glow/brackets and status without percentages. Results automatically appear in the same flow; no separate Gemini screen. Device EXIF/overlay/runtime/UI still needs owner-built APK acceptance. Matching uses actual Explore data and weak-match labels, not generated IDs/prices/ratings/bookings.

## Feature matrix

| Mode/profile | Native | Cloud default | Transport/backend | Data review | Diagnostic |
|---|---|---|---|---|---|
| Local / advisor-development | ON when enabled | OFF | Optional loopback + local nonce only in local mode | pending | Product mode false; separate CLI synthetic diagnostics |
| Standalone / advisor-preview | ON | OFF | HTTPS current API placeholder | pending | OFF |
| Play / advisor-closed-test | ON | OFF | HTTPS current API placeholder | pending | OFF |
| Production | OFF | OFF | No Advisor URL by default | pending | OFF |

Client env: `BBOOK_ADVISOR_ENABLED`, `BBOOK_ADVISOR_CLOUD_ENABLED`, `BBOOK_ADVISOR_BACKEND_URL`, `BBOOK_ADVISOR_DATA_PROCESSING_APPROVAL` (pending/approved). Local-only `BBOOK_ADVISOR_LOCAL_URL`/`LOCAL_NONCE` is stripped from release. Production native requires additional `BBOOK_ADVISOR_PRODUCTION_APPROVED=1`. Old `BBOOK_ADVISOR_GEMINI_APPROVED=1` is rejected, not treated as data-review proof. `EXPO_PUBLIC_API_URL` remains the existing Explore/auth/booking API. No Google API key is referenced or bundled by Advisor frontend config/source.

Cloud=1 requires enabled + reviewed approval + valid endpoint; server independently requires provider/data/model/environment approvals and per-user consent. Currently **unpaid real-data OFF** according to newest owner instructions. Consent alone does not meet Google data conditions. See backend [ONLINE-ADVISOR.md](D:/EXE/BeautyBook-feature-advisor/docs/ONLINE-ADVISOR.md) for term assessment, architecture/cost/auth/migration/rollback comparison, Render variables and owner steps. No billing was activated.

## APK you build yourself

Profile advisor-preview: APK, developmentClient=false, internal distribution, release/Hermes bundled by EAS, existing remote credentials, com.bbook.app, existing Firebase com.bbook.app and EAS project eea1bcb1-6a0f-4a5d-9b53-cb6fc0250ecd. Generated native folders are excluded by existing gitignore, so EAS runs its own native generation from source/plugins during **your** build. Module source under modules/bbook-face-analysis remains included. No dependency reinstall/upgrade needed here.

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
npx eas-cli@latest build --platform android --profile advisor-preview
```

Agent did not run this command. Current APK will test ML Kit/local recommendations + existing online BBook functions; **Gemini online is not enabled or deployed**. No Metro/USB/ADB/Expo Go/dev client is needed for this standalone APK. Once data/provider review and HTTPS staging are approved, owner changes this profile's public cloud/data/Advisor URL fields and builds again; setting Render flags alone cannot turn a cloud-OFF client ON. No key or nonce belongs in the profile.

Owner signs in to the existing bbook-app EAS account/project, verifies existing remote Android keystore/upload certificate and selects reuse, not generate new. After success, open EAS build URL, download .apk on a spare Android phone and allow installation from that browser/file manager. Open the file and install. Package matches alpha; conflicting signing/version may prevent installation. Do not overwrite/uninstall your alpha installation blindly. A spare device is the safest manual acceptance path. Production upload key identity was not accessed or verified by this task.

## AAB you build after acceptance

Profile advisor-closed-test: app-bundle, developmentClient=false, distribution=store, credentialsSource=remote, autoIncrement=true, EAS environment preview. Existing production profile is unchanged. Both use cli.appVersionSource=remote. No arbitrary versionCode was assigned.

Before AAB build, owner checks the highest versionCode across Play tracks/App bundle explorer and checks EAS remote counter:

```powershell
npx eas-cli@latest build:version:get --platform android --profile advisor-closed-test
```

If the counter is missing/behind Play, owner runs `npx eas-cli@latest build:version:set`, chooses Android and initializes with the actual latest Play versionCode. Then this profile increments on build. Verify the resulting AAB versionCode is greater than all used Play codes. Do not guess 2/3/etc from local generated Gradle versionCode=1. Follow [EAS version management](https://docs.expo.dev/build-reference/app-versions/).

After blockers below are resolved:

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
npx eas-cli@latest build --platform android --profile advisor-closed-test
```

Agent did not run it. Owner downloads .aab from EAS, checks package/version/upload certificate, new artifact inspection, HTTPS service/config and device acceptance. In Play Console select existing BBook → Testing → Closed testing → existing alpha track → create release → upload AAB → release notes/tester list/opt-in link → review warnings/Data safety/privacy/permissions → save/review and explicitly roll out only when satisfied. Do not create a new package or signing key and do not use EAS submit automatically. [Google closed-test instructions](https://support.google.com/googleplay/android-developer/answer/9845334). An AAB is uploaded to Play, not directly installed like an APK.

## Android 16 KiB — unresolved blocker

Existing installed RN Gradle plugin specifies AGP 8.12.0, above Google's packaging baseline 8.5.1; no AGP/Expo/RN update made. Local checkpoint used NDK r27 with explicit max/common-page flags. New config plugin brings those proven source-linker flags into EAS generation, but **has not been compiled in this task**. Vendor/prebuilt ELF cannot be repaired by app linker flags or ZIPALIGN alone. Do not patch ELF headers or turn layout heuristics into PASS.

Historical APK E4C411... had ZIPALIGN PASS, all 27 LOAD alignments PASS, **15 RELRO-end failures**: androidx.graphics.path, animation-decoder-gif, libc++_shared, datastore counter, face_detector_v2_jni, fbjni, gifimage, hermestooling, hermesvm, imagepipeline, jsi, native-filters, native-imagetranscoder, static-webp, zstd-kmp. Face Mesh beta3/MediaPipe beta10 xeno passed at that checkpoint; removing mesh would not fix the other failures. Face Detection remains the officially documented bundled 16.1.7; no verified replacement fixing its ELF was found. Future dependency work needs compatible vendor rebuilds/versions and new artifact/device checks, not arbitrary RN/Expo churn. [Official Android page-size checks](https://developer.android.com/guide/practices/page-sizes).

The new inspector was exercised **only on that old artifact** and reproduced ELF FAIL/ZIP PASS; this is a checker validation, not current-source evidence. After owner build:

```powershell
.\docs\advisor\Inspect-ReleaseArtifact.ps1 -Artifact 'C:\path\your-new.apk' -Output 'D:\EXE\artifacts\your-new-apk-16k.json'
.\docs\advisor\Inspect-PreviewPackage.ps1 -Apk 'C:\path\your-new.apk'
.\docs\advisor\Inspect-ReleaseArtifact.ps1 -Artifact 'C:\path\your-new.aab' -Output 'D:\EXE\artifacts\your-new-aab-elf.json'
```

Inspector reads 64-bit arm64/x86_64 ELF in APK/AAB; no native build. APK also runs static zipalign. AAB full static PASS remains null until packaging is separately verified. Owner uses existing bundletool `dump config --bundle=...` and checks PAGE_ALIGNMENT_16K, inspects generated/Play APKs and runs on a genuine 16 KiB device/emulator. Do not infer full AAB/device PASS from ELF alone. 32-bit ABIs are listed, not treated as proof for 64-bit page-size support.

## Tests and blockers

Source checks: TypeScript/ESLint PASS, Advisor Jest 141 tests + 12 selected booking regressions = **153 PASS / 17 suites**, 56 Advisor backend PASS, full backend 487 PASS/99 fixture SKIP/0 FAIL. Real Gemini synthetic diagnostic updated to 4-region schema: OK/selectedModelAvailable true/syntheticOnly true/3 recommendations. Actual Expo configs PASS for production, preview, closed-test and development; package/Firebase/EAS project unchanged, release nonce absent. Static .NET publish file plan excludes legacy backend settings. No new APK/AAB, cloud container or native runtime was tested.

**Do not upload the AAB yet:** 16 KiB vendor findings unresolved; no new artifact inspection/device scan/EXIF/overlay/UI acceptance; HTTPS service not deployed/live-JWT compatibility unverified; current unpaid real-data processing not approved; upload certificate/current Play versionCode not verified. Native-only manual APK acceptance on an appropriate spare phone can begin after owner build; it cannot prove online Gemini readiness. Privacy notice/Data safety must reflect actual enabled data flows before closed/production rollout. Real booking/chat/notification/login acceptance still requires device tests; no fake booking or production DB write was performed.

## Files changed in this release-preparation turn

Frontend: app.config.ts, eas.json, plugins/withAdvisor.js; features/makeupAdvisor/{flags.ts,backendUrl.js,backendUrl.d.ts,advisorTransport.ts,advisorRecommendation.ts}; app/makeup-advisor.tsx; __tests__/{buildFlag,advisorTransport,geminiPipeline,faceFeatures,nativeConfig}; scripts/{Check-HybridAdvisorConfig.cjs,Start-LocalAdvisor.ps1}; docs/advisor/{Build-Native.cmd,Build-Preview.cmd,Inspect-ReleaseArtifact.ps1,RELEASE-READINESS.md}; superseded-report banners. Existing extractor/native implementation/scan/results/matching were audited and retained.

Backend: BeautyBookBackend/Program.cs; Services/{FeatureAdvisorProvider.cs,FeatureAdvisorContract.cs}; Controllers/MakeupAdvisorController.cs; BeautyBookAdvisor.Api/{csproj,Program.cs,AdvisorApiHost.cs,AdvisorAuthentication.cs,appsettings.json}; Dockerfile.advisor; feature-advisor.example.json; tests csproj/FeatureAdvisorTests/FeatureAdvisorPipelineTests/FeatureAdvisorOnlineTests; docs/{Configure-FeatureAdvisorKey.ps1,Start-LocalAdvisor.ps1,ONLINE-ADVISOR.md}; superseded-document banners. No database or migration files changed.
