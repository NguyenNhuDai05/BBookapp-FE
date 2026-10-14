# Consolidate Engine 12 → 20 — 2026-10-14

## Kết quả và phạm vi

Đã nâng cấp engine hiện tại `features/makeupAdvisor/localEngine.ts` lên 20 phong cách bằng thuật toán Phase D đã kiểm thử. Không viết lại scoring, không chạy nghiên cứu/simulation mới. Catalog 20, mixed scoring manifest, reviewed compatibility overlay và One Preference Slot giữ nguyên.

Bản build cũ được khởi chạy trước yêu cầu hợp nhất đã bị dừng. Sau yêu cầu hợp nhất không chạy prebuild/build APK/AAB; không commit/push/merge/deploy. Source native pipeline không đổi. Android generated từ lần prebuild trước cần được cập nhật khi người dùng tự build; script bên dưới thực hiện việc đó.

## Kiến trúc trước/sau

Trước: Face Scan → gateway → cờ local → engine12 hoặc engine20; provider fallback gọi trực tiếp engine12. Engine20 phụ thuộc applicationId riêng và opt-in flag.

Sau:

```text
useAdvisor / provider local fallback
  → recommendFaceScan (public local recommendation gateway)
  → localEngine.ts (20 styles + One Preference Slot + explanations)
  → recommendationCore.ts (quality-gated, deterministic scoring)
  → scoringMetadataManifest + compatibilityOverlay20 + catalog v1.2
```

Một implementation runtime; không còn selector 12/20. `localRecommendations` giữ signature tương thích với module provider hiện có nhưng chỉ delegate gateway. `getRecommendations`/transport/schema Gemini giữ nguyên. Adapter fallback cho input blocked xóa toàn bộ measurements trước khi dùng cùng engine để tạo gợi ý khám phá; scan gateway mặc định vẫn từ chối input blocked.

Engine12 được chuyển sang `scripts/advisorRegression/legacyEngine12.ts`, chỉ dùng làm oracle trong tests/reports. Không có app runtime dependency vào snapshot hoặc simulator. Library JSON v1.1 và module styleLibrary vẫn được giữ vì manifest/validation cần metadata của 12 key cũ; đây là dữ liệu tương thích, không phải engine thứ hai.

## Những module/cờ đã loại bỏ khỏi runtime

- `features/makeupAdvisor/engine20.ts`: nội dung đã hợp nhất vào localEngine.
- `features/makeupAdvisor/engine20Core.ts`: chuyển thành recommendationCore; bỏ nhánh `legacyOnly` khỏi runtime.
- `plugins/withAdvisorLocalDevelopment.js`: không còn đổi applicationId hoặc gỡ Firebase plugin riêng cho package local.
- `localEngine20Enabled`, extras `advisorEngine20Local`, `advisorStandaloneLocalTest`, opt-in `BBOOK_ADVISOR_ENGINE20_LOCAL`: runtime/config không còn sử dụng.
- `docs/advisor/Build-Local-Test.ps1`: thay bằng script test cho BBook thông thường.

Tests local20Gate/localDevelopmentPlugin được chuyển thành developmentRollout/developmentBuild để kiểm tra chốt release và identity bình thường. Không xóa assertions về deterministic ranking, native isolation, quality, optional preferences/effects, duplicate Top3, metadata, explanation, timers hoặc booking routes.

## Dữ liệu và hành vi

- 20/20 catalog hợp lệ, displayName/nội dung/ảnh lấy từ catalog v1.2.
- Scoring giữ v1.1 cho 12 key cũ, v1.2 cho 8 key mới. UI occasion/intensity dùng đúng manifest scoring.
- Weights: faceBudget=1, occasionBonus=0.12, intensityBonus=0.08; không effect bonus, random hoặc coverage bonus.
- Ulzzang không có opening-high-gradient. Igari/Sunkissed không có face rules; blush, bronzer, skin finish, undertone/face shape không được suy ra từ phép đo.
- Occasion/intensity/effect mặc định không chọn. Effect chỉ ở màn kết quả; có thể xóa; AND conflict giữ baseline.
- Nominee chọn bằng preferenceScore + stable tie-break. Đã trong Top3 thì giữ thứ tự; chưa có thì giữ hai vị trí đầu, thay vị trí thứ ba.
- Đổi effect dùng completed.extraction, không gọi ML Kit, picker, normalize, timers. Services/MUA dùng API và routes hiện có ngoài critical path.
- Source labels theo suggestionSource/selectionBasis, không hiển thị phần trăm phù hợp.

Ví dụ synthetic được giữ từ Phase D: eyeSpacing=.35, eyeAspect=.15, browArch=.02, mouthAspect=.2; bật experimental, daily/medium:

| Lựa chọn | Top3 |
|---|---|
| Không effect | peach / soft-glam / latte |
| bronzed-glow | peach / soft-glam / sunkissed |
| bronzed-glow AND flushed-blush | peach / soft-glam / latte + thông báo conflict |
| Xóa effect | peach / soft-glam / latte |

Sunkissed trong ví dụ là “Theo lựa chọn của bạn”, không phải suy ra từ khuôn mặt. Không có phép đo đủ tin cậy và không chọn preferences/effects: natural / soft-glam / classic-glam, nhãn “Gợi ý khám phá”.

## Regression có chủ đích

Không thêm ranking regression so với thuật toán Phase D được duyệt: 34.560 cases của suite runtime đối chiếu One Preference Slot đã pass. Version ID đổi thành `20-reviewed-v1`; title/content/quickSteps dùng catalog v1.2. Một số quickSteps có 4–6 bước thay vì cố định 5 của JSON v1.1.

Regression so với engine12 giữ đúng kết quả nghiên cứu đã duyệt: mở candidate pool có thể đổi Top3; no-effect đổi 509/3456 cases ON (14.73%), 1188/3456 OFF (34.38%). Review Ulzzang đổi 71/3456 cases ON (2.05%) so với Phase B20 chưa bỏ mapping; OFF không đổi do mapping. Đây là lưới synthetic, không phải tỷ lệ thực tế người dùng.

## Release safety

Development/local test giữ tên BBook, applicationId `com.bbook.app`, scheme/Firebase/push hiện có. Không cần applicationId `com.bbook.advisor.local`.

Chốt config chủ động từ chối build có Advisor bật ngoài `local`, `advisor-development`, `advisor-local-test`. Vì chỉ duyệt development, các profile advisor-preview/closed-test/production có Advisor bật từ source hợp nhất hiện bị chặn, kể cả cờ production approval cũ. Không tự sửa eas.json hoặc kích hoạt production. Build BBook production với Advisor tắt giữ config hiện có; ứng dụng đã phát hành không bị thay đổi.

## Kiểm thử và giới hạn

- Full Advisor + push-isolation: 39 suites, 288 tests pass.
- Thêm kiểm tra fallback input blocked; rerun gateway/provider/boundary: 3 suites, 34 tests pass.
- Runtime suite có 34.560 combinations; baseline engine12 vẫn làm oracle cho regression.
- TypeScript noEmit: PASS. ESLint max-warnings=0: PASS, 0 errors / 0 warnings. Sau compatibility fix cũng đã kiểm tra lại cả hai; logs trong cùng thư mục.
- Hash 32 file protected không đổi: inference/extractor/profile/rules, camera, guards/cleanup/native module, scan 10/5s, timeout, transport/cloud summary, notification và eas config. CONSOLIDATION-STABILITY.json ghi chi tiết.
- Tests services/MUA kiểm tra routing/query/cache bằng mocks; chưa kiểm thử trên điện thoại hoặc server thật.
- Không build/kiểm tra binary native trong lượt này. Ảnh WebP catalog20 vẫn chưa có; UI giữ placeholder hiện có.

## Những file thay đổi trong lượt hợp nhất

Runtime/config:

- app.config.ts
- features/makeupAdvisor/localEngine.ts
- features/makeupAdvisor/recommendationCore.ts (thay engine20Core)
- features/makeupAdvisor/faceScanRecommendations.ts
- features/makeupAdvisor/advisorRecommendation.ts
- features/makeupAdvisor/flags.ts
- features/makeupAdvisor/useAdvisor.ts
- features/makeupAdvisor/AdvisorPreferences.tsx
- features/makeupAdvisor/RecommendationDebug.tsx

Regression/tests:

- scripts/advisorRegression/legacyEngine12.ts
- scripts/advisorRegression/unifiedAdapter.ts
- scripts/Simulate-EffectAlternatives.cjs (chỉ trỏ oracle mới, không chạy simulation)
- features/makeupAdvisor/__tests__/developmentRollout.test.ts
- features/makeupAdvisor/__tests__/developmentBuild.test.ts
- features/makeupAdvisor/__tests__/consolidationBoundary.test.ts
- features/makeupAdvisor/__tests__/runtime20.test.ts
- features/makeupAdvisor/__tests__/faceScanRecommendations.test.ts
- features/makeupAdvisor/__tests__/faceAwareV2.test.ts
- features/makeupAdvisor/__tests__/faceFeatures.test.ts
- features/makeupAdvisor/__tests__/styleLibrary.test.ts
- features/makeupAdvisor/__tests__/useAdvisor.test.tsx
- features/makeupAdvisor/__tests__/buildFlag.test.ts
- features/makeupAdvisor/__tests__/preferences.test.tsx
- features/makeupAdvisor/__tests__/catalogCoverage.test.ts
- features/makeupAdvisor/__tests__/engine20Simulation.test.ts
- features/makeupAdvisor/__tests__/geminiPipeline.test.ts
- features/makeupAdvisor/__tests__/AdvisorCamera.test.tsx
- features/makeupAdvisor/__tests__/MemoryDiagnostics.test.tsx
- features/makeupAdvisor/__tests__/recommendationDebug.test.tsx

Docs/script: Build-Development-Test.ps1, CONSOLIDATION-REPORT.md, CONSOLIDATION-PROTECTED-HASHES.json, CONSOLIDATION-STABILITY.json và logs verification.

## Tự build APK test trên Windows, không USB/Metro

Trong PowerShell:

```powershell
cd D:\EXE\bbeauty-app-mlkit-advisor
powershell -ExecutionPolicy Bypass -File .\docs\advisor\Build-Development-Test.ps1
```

Script dùng Android SDK/JDK/cache đang có, enable Advisor và experimental mappings cho development, cloud tắt; prebuild normal BBook rồi assembleRelease để nhúng JS/assets. Đây là release variant kỹ thuật để APK tự chạy, không phải phê duyệt phát hành production. Không EAS upload/Play submit, không tự cài lên thiết bị.

Output sau khi build thành công: `D:\EXE\bbeauty-app-mlkit-advisor\BBook-Development-Test.apk`. Gửi file sang điện thoại qua Drive/Zalo và cài. Không cần chạy Metro. Booking/service API vẫn cần internet như hiện tại.

Điều kiện còn lại: phải tự build lại binary; máy cần SDK/JDK/dependencies đầy đủ. APK test ký bằng debug keystore, cùng package BBook, nên không cài đè được bản Play có chữ ký khác; kiểm thử trên thiết bị/profile không có bản đó hoặc tự quyết định cách xử lý bản cài hiện tại. Script không gỡ app. Bản debug thông thường cũng dùng engine20 khi BBOOK_ADVISOR_ENABLED=1, nhưng debug vẫn cần Metro; dùng script trên nếu muốn APK test độc lập.

