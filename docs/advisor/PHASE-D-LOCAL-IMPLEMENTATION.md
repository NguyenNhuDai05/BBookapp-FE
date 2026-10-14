# Phase D — local development controlled implementation

## Trạng thái và giới hạn phát hành

Engine runtime mới đã được tích hợp cho Android debug local opt-in, không thay engine 12 legacy. Tên/version: 20-local-reviewed-v1. Chỉ bật khi __DEV__=true, Platform.OS=android, advisorEnabled=true, advisorEngine20Local=true và releaseEnvironment=local. Cấu hình phải có BBOOK_ADVISOR_ENGINE20_LOCAL=1 và profile local hoặc advisor-development. Profile preview/closed-test/production từ chối flag này. Release JS dù có stale local extra cũng không bật engine mới.

Không sửa eas.json, production/closed-test AAB, backend/database hoặc Gemini configuration; không build APK/AAB, EAS, commit/push/merge/deploy.

Local opt-in dùng applicationId com.bbook.advisor.local. Không thay applicationId profile khác. Không có Firebase client cho package riêng, nên remote push đăng ký được tắt chỉ trên local opt-in; plugin prebuild local gỡ dòng Google Services còn sót trong app Gradle. Plugin có guard package+opt-in, không chạy trong profile phát hành. Không thay modules/bbook-face-analysis hoặc inference/guards.

## Engine và manifest

scoringMetadataManifest.json có 20 stable keys, version scoring-mixed-1.1-1.2. 12 key cũ giữ nguyên name/intensity/occasions/tags/colorPalette v1.1. 8 key mới dùng v1.2. Validator so sánh chính xác từng field với nguồn đúng version, từ chối key thiếu/extra hoặc metadata bị đổi.

Tên, mô tả, tags minh họa, palette và ảnh lấy từ catalog v1.2 đã validate 20/20. Occasion/intensity liên quan scoring trên recommendation card, detail và local catalog detail lấy từ metadata thực sự dùng, không lấy nhầm metadata mới. Ví dụ Douyin/Soft Glam vẫn scoring medium và UI hiển thị Vừa phải; Soft Glam vẫn có wedding. Không migrate metadata v1.1 sang v1.2. Phiên result ghi engineVersion, scoringManifestVersion, overlayVersion và scoringLabels theo key.

compatibilityOverlay20.json giữ mappings cũ cho 12 key; 8 mới theo mappings đã review. Ulzzang chỉ opening-low-soft + arch-low-soft, không opening-high-gradient. Igari/Sunkissed không có face rule. Không thêm rule về blush/bronzer/finish/undertone/face shape. Weights vẫn faceBudget=1, occasion=0.12, intensity=0.08, diversity chỉ khi bằng điểm, tie order đầy đủ và không random/bonus coverage.

Engine 12 localEngine.ts/styleLibrary.ts/JSON v1.1/techniqueCompatibility.ts giữ nguyên. Gateway faceScanRecommendations chỉ lazy-load engine20 sau gate; khi không opt-in trả result legacy như trước. Provider/HTTP/Gemini không nằm trong đường mới.

## Không chọn hiệu ứng và One Preference Slot

Không effect mặc định: xếp hạng nền 20 đã review Ulzzang, không có slot riêng. Optional occasion/intensity mặc định null/null vẫn nhận đủ Top 3.

Khi user chọn effects, tìm intersection AND từ effectOverlay stable keys. Nominee chọn bằng preferenceScore rồi stable tie-break, không faceScore. Nếu nominee đã trong Top 3 giữ thứ tự. Nếu chưa, giữ hai vị trí đầu nền và thay vị trí 3. Không cộng điểm hiệu ứng. Nếu không có full match giữ nền + effectConflict=true và UI báo có thể bỏ bớt hiệu ứng. Xóa lựa chọn khôi phục nền.

Nhãn nguồn Theo đường nét / Theo lựa chọn của bạn / Gợi ý khám phá do suggestionSource/selectionBasis quyết định. DTO giữ faceEvidence, preferenceEvidence, matchedEffects, sourceEvidenceStatus và secondary faceEvidenceStatus riêng. Slot preference không suy blush/bronzer từ mặt; source explanation không dùng faceScore để biện minh slot. Không có phần trăm phù hợp trên card.

Ví dụ synthetic, features trong PHASE-D-EXAMPLES.json:

- Không chọn preferences/effect: peach → soft-glam → latte.
- daily + medium, không effect: peach → soft-glam → latte.
- daily + medium + bronzed-glow: peach → soft-glam → sunkissed; Sunkissed nguồn preference-based, faceEvidence rỗng.
- bronzed-glow + flushed-blush: không full match, giữ peach → soft-glam → latte và báo conflict.

Đây là ví dụ tổng hợp, không lời hứa mọi ảnh sẽ có Top 3 này.

## UI và marketplace

AdvisorEffects ở màn hình kết quả, sau phân tích. 9 labels tiếng Việt, chips selected rõ, có bỏ qua/xóa, lựa chọn nhiều áp dụng AND. Không có bước mới trước camera/scan.

useAdvisor giữ effects trong phiên. setEffects chỉ chạy khi stage=results, gate idle, engine20 local bật và có completed extraction. Chỉ gọi recommendation local với extraction có sẵn; không analyze/normalize/picker, không timer hoặc network. Thay occasion/intensity dùng cùng effects đã chọn. Reset/rời luồng xóa state như lifecycle ảnh hiện tại.

Service/MUA section default ưu tiên nominee explicit-effect-slot khi có; người dùng vẫn chọn một style trong Top 3. Khi nominee đổi, query dùng style key/ID/keywords mới; alias catalog mở rộng chỉ cho engine20 recommendation/local detail. Existing API GET /Explore, /Explore/search và routes /mua-detail/id/tab/serviceId không đổi. Cache reuse khi xóa effect trở về style cũ; không duplicate fetch. Không fetch trong native critical path.

## Regression đã biết

So với engine20 Phase B chưa review Ulzzang: no-effect ranking đổi 71/3456 cases bật experimental (2.05%), 0 khi tắt, do loại opening-high-gradient. Runtime đối chiếu approved research B ở 34560 cases (108 profiles × 32 preferences × 2 modes × 5 effect scenarios) khớp thứ tự/source; không có thêm drift.

So với engine12: reviewed engine20 no-effect thay 509/3456 (14.73%) cases ON và 1188/3456 (34.38%) OFF theo báo cáo nghiên cứu; đây là cạnh tranh pool mới, không đổi điểm metadata/weights của 12 kiểu. Core giới hạn legacyOnly được kiểm tra trực tiếp với engine12 thật để xác nhận thứ tự/điểm giữ nguyên.

Có effect thì thay vị trí là thay đổi chủ động của user. Dataset lưới không là xác suất production hoặc chứng minh chất lượng thẩm mỹ. Mappings vẫn experimental/pending, không verified. Không ép 20 kiểu tần suất bằng nhau.

## Kiểm tra đã chạy

- 20/20 catalog + exact manifest validation; bad metadata/labels bị từ chối.
- Deterministic 34560 runtime/research B comparisons, đủ 3/không trùng, no effect review regression 71; parity engine12/legacy subset trên 6912 inputs.
- Optional preferences/effects, AND conflict, clear/restore, UI source and displayName/localization.
- Source/quality rejection, Ulzzang high opening không face bonus; Igari/Sunkissed không face evidence; face explanation chứa contribution thật.
- Hook effect changes không chạy native acquisition lại; 10/5s waits, cancellation/background/unmount và timeout tests giữ nguyên.
- API thật theo service layer, fixture giá/rating/routes, independence errors, pagination/cache/no duplicate và query sync khi đổi nominee.
- Local config gates, release __DEV__ off, independent application id, local prebuild plugin idempotence/guard. Existing buildFlag profile tests.

109 tests liên quan trong 11 suites đạt. TypeScript --noEmit đạt. ESLint các file đổi đạt, zero warnings. PHASE-D-STABILITY.json xác nhận 13 file bảo vệ không đổi (gồm engine12, feature extraction/profile, native wrapper, timers, camera UI, eas.json); useAdvisor và app.config là các file được phép nối state/gate trong Phase D. Không coi checksum/mock là device/native runtime testing.

## Files thay đổi

Modified: app.config.ts; app/makeup-advisor.tsx; features/makeupAdvisor/flags.ts; useAdvisor.ts; faceScanRecommendations.ts; advisorRecommendation.ts (frontend optional fields); presentationCatalog.ts; AdvisorResults.tsx; AdvisorMarketplace.tsx; __tests__/useAdvisor.test.tsx; screen.test.tsx; resultMarketplace.test.tsx; engine20Simulation.test.ts (protection snapshot theo Phase D được duyệt).

Added: engine20.ts; engine20Core.ts; scoringMetadata.ts; scoringMetadataManifest.json; compatibilityOverlay20.json; effects.ts; effectOverlay.json; AdvisorEffects.tsx; plugins/withAdvisorLocalDevelopment.js; __tests__/runtime20.test.ts; local20Gate.test.ts; AdvisorEffects.test.tsx; localDevelopmentPlugin.test.ts; PHASE-D-PROTECTED-HASHES.json; PHASE-D-STABILITY.json; PHASE-D-EXAMPLES.json; báo cáo này.

## Chưa kiểm thử / còn thiếu

Không có APK hoặc kiểm thử điện thoại/native/visual trong lượt này theo giới hạn user. Cần kiểm tra local debug package, camera, ảnh lớn/closed eyes, memory, fonts 360–430dp, effect conflict/source labels, actual API responses và profile/service navigation trên máy. 20 ảnh WebP minh họa còn thiếu, hiện placeholder theo manifest cũ. Không có bước training/kiểm chứng thẩm mỹ mới.

## Tự build Android debug local

Các lệnh dưới đây do người dùng chạy; agent chưa chạy prebuild hoặc build. Android SDK/JDK dùng cấu hình máy hiện có. Trong cùng PowerShell:

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
$env:EAS_BUILD_PROFILE = 'advisor-development'
$env:BBOOK_ADVISOR_ENABLED = '1'
$env:BBOOK_ADVISOR_ENGINE20_LOCAL = '1'
$env:BBOOK_ADVISOR_FACE_AWARE_EXPERIMENTAL = '1'
$env:BBOOK_ADVISOR_CLOUD_ENABLED = '0'
$env:EXPO_PUBLIC_API_URL = 'https://beautybook-13zj.onrender.com/api'
npx expo prebuild --platform android
npx expo run:android --variant debug --device
```

Prebuild cần áp dụng package riêng và local plugin vào generated Android project đang còn package chính. Không dùng --clean để xóa checkout native hiện tại. APK debug thường ở android/app/build/outputs/apk/debug/app-debug.apk. Nó là development client, cần Metro; lần sau dùng cùng env rồi npx expo start --dev-client --clear. Không dùng helper Build-Preview.cmd cho Phase D: helper đó build release/preview và engine20 bị gate tắt. Không chạy EAS hoặc closed-test/production profile với flag này.

Kiểm tra app tên BBook Advisor Local, package com.bbook.advisor.local, sau quét có bộ chọn effects + source labels. Để quay về legacy local, đặt BBOOK_ADVISOR_ENGINE20_LOCAL=0 và reload/restart Metro với config tương ứng. Production/closed-test mặc định không bật; APK Google Play hiện tại không bị thay bởi các thao tác source trong lượt này.
