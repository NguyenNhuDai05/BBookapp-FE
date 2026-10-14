> Latest source/config readiness: [RELEASE-READINESS.md](RELEASE-READINESS.md). Historical implementation checkpoint.

> Historical beta1/schema v1 report. Superseded by [HYBRID-IMPLEMENTATION-REPORT.md](HYBRID-IMPLEMENTATION-REPORT.md) on 2026-10-13.

# BBook AI Makeup Advisor — báo cáo candidate

Audit/implementation bắt đầu12/10/2026; báo cáo hoàn thiện13/10/2026, Asia/Bangkok. Đây là implementation candidate, **chưa được chứng nhận hoàn thành toàn bộ acceptance criteria / sẵn sàng Closed Testing**. Các phần cần thiết bị, Gemini project thật và APK cuối được ghi tách khỏi unit tests.

## 1. Source, branch và baseline

- Frontend: `D:\EXE\bbeauty-app-mlkit-advisor`, branch `candidate/mlkit-advisor`, HEAD `a037eadc0207379312bee87313c380ae14428a65`.
- Backend riêng: `D:\EXE\BeautyBook-feature-advisor`, branch `candidate/feature-summary-advisor`, HEAD `42fcc29d1f0c8fc30002109a0b09dd52b941d980`.
- Backend gốc: `D:\EXE\BeautyBook`, branch `feature/deleteupdate`, cùng HEAD trên. Không khởi chạy backend này, không chỉnh source trong worktree này.
- Không chạy commit, push, merge, Render deploy, migration, EAS build/submit, Play upload hoặc thay đổi billing/signing/Firebase identity.

Trước khi sửa, frontend candidate đã có changes ở `app/makeup-advisor.tsx`, `faceAnalysis.ts`, `useAdvisor.ts`, native module và tests, cùng ScanPhoto/errors/docs chưa commit. Các file đó được audit rồi phát triển tiếp; không reset/xóa code. Backend gốc có nhiều file AI image-upload/daily-quota và hai migration chưa commit; không copy chúng sang endpoint mới. Worktree backend được tạo từ committed HEAD sạch.

## 2. File thay đổi

Frontend sửa: `app/makeup-advisor.tsx`, `features/makeupAdvisor/faceAnalysis.ts`, `useAdvisor.ts`, `__tests__/screen.test.tsx`, `__tests__/useAdvisor.test.tsx`, `modules/bbook-face-analysis/android/build.gradle`, `BBookFaceAnalysisModule.kt`.

Frontend thêm/phát triển: `AdvisorResults.tsx`, `AdvisorMatching.tsx`, `advisorRecommendation.ts`, `faceFeatures/extractor.ts`, `ScanPhoto.tsx`, feature/overlay tests, `MeshTopology.kt`, `MeshTopologyTest.kt`, inventory/report/build scripts. ScanPhoto/errors và một số docs đã tồn tại dưới dạng untracked trước task này. `faceGeometry.ts`, recommendation engine/knowledge/catalog mapping, Explore datasource và booking routes được tái sử dụng, không viết lại booking.

Backend: `Program.cs` thêm 8 dòng đăng ký services/policy; thêm `MakeupAdvisorController.cs`, `FeatureAdvisorContract.cs`, `FeatureAdvisorProvider.cs`, `FeatureAdvisorTests.cs`, config example và endpoint docs. Không thêm model EF/table/migration. Tất cả changes để uncommitted cho chủ dự án review/commit thủ công.

## 3. ML Kit Face Detection

Dependency bundled `com.google.mlkit:face-detection:16.1.7` giữ nguyên. Pass 1 ACCURATE, LANDMARK_ALL, CLASSIFICATION_ALL, không contours: đếm tất cả faces, boxes, Euler XYZ, tất cả available landmarks và nullable eye-open/smile probabilities. Pass 2 ACCURATE, CONTOUR_ALL, không landmarks/classification, chỉ chạy cho đúng một face. Vì contour mode chỉ trả prominent face, không dùng nó để giả định face count.

Không bật tracking cho một selfie tĩnh. Không claim detector xác minh ánh sáng, độ nét hoặc che mặt. Những giới hạn này được công bố. Quality gates cần một face, box trong ảnh, mặt >=200 px, yaw/pitch <=15°, roll <=10°, outline/eyes không suy biến, tọa độ hữu hạn và trong bounds. Đây là ngưỡng MVP chưa hiệu chuẩn chuyên gia.

## 4. Face Mesh

Thêm `com.google.mlkit:face-mesh-detection:16.0.0-beta1`. SDK còn beta, không SLA/deprecation policy; Android API >=23 theo tài liệu. Project thực tế minSdk=24, compile/target=36. Expo/RN đã cài thực tế là SDK57/RN0.86.3; đọc SDK54 theo AGENTS rồi xác minh docs SDK57, không downgrade project.

Native chạy FACE_MESH bằng `FaceMeshDetectorOptions.Builder().setUseCase(FACE_MESH).build()`. Mẫu docs có DEFAULT_OPTIONS nhưng AAR thực tế không có field này; đã kiểm tra class signatures bằng javap rồi sửa theo SDK thực tế.

Xuất đầy đủ 468 XYZ/index, triangle index triples và region-index groups từ SDK getPoints(): outline, mắt, brows top/bottom, môi outer/inner, nose bridge. MeshTopology yêu cầu indices 0..467 đầy đủ/duy nhất, triangle triple hợp lệ và có topology. Mesh bbox phải giao face bbox; extractor kiểm tra outline khớp face box. Không coi relative Z là độ sâu vật lý. Failure, canceled task, invalid mesh, multiple meshes hoặc LinkageError ở optional mesh setup => giữ Face Detection contours. Page-size guard không gọi Face Mesh beta1 trên thiết bị page>4KiB vì dependency4KiB không tương thích; vẫn dùng contours thật khi Face Detection chạy được. Guard không làm dependency trở thành Play-compatible. Không tạo điểm giả.

Autolinking hiện đã nhận `bbook-face-analysis` trong Gradle config. Native runtime trên thiết bị và point counts thực tế vẫn phải kiểm tra; synthetic topology tests không thay thế SDK inference.

## 5–7. Features thực sự có code

Xem [FEATURE-INVENTORY.md](FEATURE-INVENTORY.md): **30 feature definitions conditional**, gồm 23 summary-eligible và 7 diagnostics local. Bảng có Source/SDK groups, Native supported, Extracted, Validated, Sent, Used, Tests, formula, range. Mỗi feature có metadata ngay trong extractor. SDK region indices được lấy từ native cho mỗi kết quả, không tự gán facial coordinates.

Các nhóm: aspect/outline bands/compactness, mắt width/aspect/spacing/position/sự khác biệt hai bên, brows length/arch/eye gap, nose bridge/base ratios, môi width/aspect/centroid thickness/position, mouth-to-bottom proportion, all-mesh projected area và relative Z span. Các phép đo dùng pixel coordinates sau normalization, eye-axis roll correction, ratio không đơn vị. Missing/invalid => omit + missing list. Cười rõ bỏ tỷ lệ môi; eye-open thấp bỏ eye aspect. Không dùng biểu cảm làm thuộc tính cố định.

Không trích xuất anatomical face thirds/hairline, classifier oval/round/square/heart, eyelid labels, giới tính/dân tộc/hấp dẫn/sức khỏe/tình trạng da/undertone hoặc độ nhô xương/mũi 3D. Các width bands là polygon descriptors, không được gọi là đo xương hàm/gò má đã xác thực. 7 features diagnostics không vào Gemini summary. Local rule hiện dùng một tập con được ghi rõ trong inventory; các feature khác được chuẩn bị trong provider dictionary, không tuyên bố đã được Gemini sử dụng thật.

## 8. Gemini Free Tier và model

**BLOCKED cho facial data thật.** Điều khoản unpaid hiện hành yêu cầu không gửi personal/sensitive information và cho phép review/training. Facial geometry từ selfie thật không được tự coi là anonymous. Consent không tự loại bỏ giới hạn đó. Frontend `realUserGeminiApproved=false`; backend defaults RealUserDataApproved=false, ModelAvailabilityVerified=false, model/key trống.

Public docs có Gemini 2.5 Flash-Lite, structured outputs và free-tier pricing. Nhưng **không có model production được chọn hoặc Gemini request thật được thực hiện**. BBook-AI model availability/quota/billing/account terms vẫn NOT VERIFIED. Automatic approval review từ chối tìm khóa trong environment/appsettings/User Secrets rồi dùng khóa gọi Models API vì nguồn credential chưa được cho phép cụ thể. Command bị chặn trước khi chạy; không đọc/gửi khóa, không retry bằng nguồn khác. Cần owner chỉ định và cho phép đúng nguồn khóa cho GET Models, nếu muốn audit tiếp. Browser inventory chỉ có IAB/MCP Apps; mở AI Studio và model page dẫn tới Google Sign in, nên không có phiên đăng nhập để audit project. Không mở Paid Tier, đổi billing hoặc lấy/log API key.

## 9–10. API, schema, bảo vệ

`POST /api/MakeupAdvisor/recommend`, JWT authentication, <=12 KiB JSON, UUID, consent=true, SummaryV1. Unknown fields/nested fields bị reject; whitelist finite ratios/ranges, known missing keys và known limitation text. Không nhận ảnh, URI, arbitrary mesh/feature hoặc arbitrary prompt. Response cần 2–3 unique style keys từ `korean/portrait/event/bridal`, lý do, contributing features có thật trong summary, tips mắt/mày/má/môi, optional contour và limitations.

Structured schema/prompt và validation hai phía. Model/key chỉ cấu hình server. HTTP provider logging bị tắt; không log inputs/output. Rate limit 12/min/user chống abuse, không daily quota. Một active call/user và UUID duplicate TTL5 phút, chỉ cache keys; không geometry/response cache. Giới hạn này per process, chưa distributed. One attempt, timeout18 giây, provider output <=32 KiB; invalid/error/quota => LOCAL_FALLBACK. Xem [backend docs](../../../BeautyBook-feature-advisor/docs/FEATURE-ADVISOR.md) cho payload/schema đầy đủ.

Consent local xuất hiện trước camera/picker; cloud consent riêng chỉ hiện khi được phép bật feature sharing. Cloud path hiện bị khóa nên không có thao tác gửi dữ liệu thật. Geometry/selfie ở React state/ref tạm, không Zustand persist/AsyncStorage/query-cache/analytics. Expo picker copy được adopt vào bbook-advisor-input namespace riêng, xóa sau normalize hoặc lỗi; process-kill sweep chỉ dọn expired input/normalized filenames do Advisor sở hữu, không sweep ImagePicker directory/ảnh gốc. Query cache chỉ giữ public catalog/MUA/services.

## 11. Local fallback

Tái sử dụng recommendation/knowledge engine, nối validated feature summary vào các ratio tương thích. Không gán giả manual visual-review=true cho flow tự động. Hướng dẫn vùng được bổ sung từ local exploratory rules; không phải kết luận chuyên gia. Source label rõ "Gợi ý trên thiết bị". Với ảnh thiếu/quality fail, không hiện recommendation giả: hướng dẫn chọn ảnh khác. Denied cloud/no network/timeout/429/503/invalid JSON/model/backend failure đều có local path, không auto retry.

## 12–13. Bốn surface UI và overlay

1. Start/photo selection: hero hồng BBook, hình public portfolio nếu catalog có hoặc illustration cosmetics SVG tự vẽ khi offline, consent local, camera/library, tips ngắn; không gender/age/occasion/budget/GPS form.
2. Scanning: selfie raster thật, aspect fit, bo góc24, corner brackets, native-driver top-to-bottom beam, status nhận diện/phân tích/hoàn tất. Native publish contours thật khi optional mesh còn chạy; cuối cùng render valid468 points + SDK triangle edges hoặc actual contours. Một yield render cycle, không delay giả900ms. Animation dừng khi cleanup/reset; generation guard bỏ stale callbacks.
3. Results: featured suggestion + hai alternatives từ local engine, reason/source, runtime catalog images khi đúng tags hoặc cosmetics illustration rõ là minh họa, tự hiện khi kết quả ready. Không màn Gemini loading riêng, không nút Tiếp tục. Style tab/filter/detail không gọi lại native/provider.
4. Style detail modal: tips mắt/mày/má/môi + optional contour/highlight, limitations; matching surface giữ trong result flow và dùng MUA detail/booking hiện tại.

Overlay và Image dùng cùng bitmap dimensions, `contain`, aspect ratio, SVG viewBox và xMidYMid meet. EXIF rotation/mirror đã rasterize một lần trong BoundedNormalizer; không mirror lần nữa. Không crop/editor sau normalization. Rendering invalid/multiple-face data không tạo synthetic mesh. Visual alignment thực tế/motion/accessibility/đa kích thước vẫn NOT TESTED trên thiết bị.

## 14. MUA/services

Explore home runtime style names => exact verified-alias mapping => real styleId => Explore searches artists/services. Không hardcode IDs hoặc tạo MUA/giá/rating/service/booking draft. Default matching lấy phong cách đầu tiên có mapping; user có thể đổi sau. Services có tag đúng được phân biệt với kết quả theo style của MUA. Optional province/maxPrice sau results; không GPS bắt buộc. Empty/error states có thể đổi style/khu vực hoặc khám phá thêm.

Navigation giữ `/mua-detail` với real artist ID; service dùng muaId/tab/serviceId hiện tại. Checkout/booking không sửa. Public Explore lần đầu timeout30 giây; lần xác minh cuối đã PASS: 4 supported style names, 6 featured posts, 4 artists, 4 services; Korean search theo runtime ID trả2 artists/2 services ở limit2. Source backend map Service.Tags vào DTO.Tags, phân biệt service tag với MUA specialty. Booking/device UI end-to-end vẫn NOT TESTED. Fixtures trong tests là synthetic test data, không vào production UI.

## 15. QA evidence

| Check | Status / evidence |
|---|---|
| Advisor feature/hook/UI/overlay tests | PASS96/96, 10 suites, sau final lifecycle/owned-picker cleanup changes |
| Selected frontend booking regression + Advisor | PASS 111/111 ở lần chạy mở rộng; sau đó thêm7 tests và chỉnh helper/timing/ownership |
| Backend advisor tests | PASS18/18: consent/schema/unknown fields/ranges/structured response/429/503/404/401/malformed JSON/duplicate UUID/timeout/numeric strings/null evidence |
| Backend full baseline regression | PASS445, SKIP99, FAIL0; SKIP cần PostgreSQL/môi trường riêng |
| TypeScript | PASS, final log không lỗi |
| Scoped ESLint | PASS, final scoped log không lỗi/cảnh báo |
| Expo config | PASS preview=true, production=false, cùng package com.bbook.app |
| Native module compile / Kotlin tests | PASS release/debug compile và6/6 Kotlin tests (3 topology, 3 normalization), XML timestamp12/10/2026 23:06 ICT. Page-size guard cuối đã được compile lại trong APK assembly PASS. |
| JS/Hermes Android export | PASS: export Android/Hermes 3994 modules, output feature-advisor-export, sau workspace-temp retry |
| APK assembly / packaging / 16 KiB | APK assembleRelease PASS (870 tasks), signature v2 PASS, native module/Face Mesh DEX/model assets/JS+native flagON PASS. ZIPALIGN16KiB PASS. **Full static16KiB FAIL**: 27 arm64 libraries; libxeno_native.so LOAD4KiB; strict official RELRO-end check fails24/27 libraries (including existing stack). Runtime16KiB NOT TESTED. Evidence feature-advisor-apk-inspection-v3.json and feature-advisor-apk-16k.json. |
| SDK inference/device/repeated scans/visual QA | NOT TESTED: ADB không có thiết bị |
| Live Gemini project/quota | NOT VERIFIED; real-user path blocked |
| Live Explore/matching/booking | PASS public home + style-filtered artist/service search; booking/device UI NOT TESTED, navigation regression tests PASS |

Logs của task hiện tại: `D:\EXE\artifacts\feature-advisor-*` và candidate `.expo/advisor-native-check.log`, `.expo/advisor-preview-build.log`. Không lấy kết quả PoC trước đây thay bằng integration QA.

## 16–18. APK, devices và giới hạn

APK final: `D:\EXE\artifacts\bbook-advisor-mesh-preview-20261013.apk`, 75,207,674 bytes (71.7MiB), built13/10/2026 00:21 ICT. SHA256: `F302D8E07E6B42669E253B2EE788EA6E693BAE755D5A2E61723C03A5413146A7`. Package com.bbook.app, versionCode1/versionName1.0.0, minSDK24/target36, arm64-v8a only; existing debug certificate SHA256 fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c. Offline embedded JS/Hermes bundle, not dependent on Metro. Native module + FaceMesh classes and FaceMesh/Detection model assets present; native manifest and Expo extra advisorEnabled=true. No APK installed by agent. Build local script `docs/advisor/Build-Preview.cmd`, profile advisor-preview ON, existing debug signing, arm64-v8a, SDK24+, cache ngắn thật `D:\EXE\.ga`. Không cloud bill/EAS/Play. Source không đổi Firebase identity hoặc signing credentials.

**Package com.bbook.app trùng alpha.** Không cài đè trên điện thoại tester đang giữ alpha. APK local signed bằng debug key hiện có nên có thể conflict signature hoặc overwrite nếu signature khớp. Cách an toàn: spare device/emulator không có alpha; candidate package/Firebase identity riêng chỉ làm sau khi chủ dự án duyệt. Không tự uninstall alpha hoặc xóa dữ liệu.

Thiết bị thực tế đã test task này: **không có**. Samsung/Xiaomi/OPPO/Vivo/realme/Pixel đều NOT TESTED. Repeated inference, background/foreground thật, format/orientation/camera picker/EXIF thực tế, native crash và16-KiB runtime là release gates còn lại. Giữ native memory guards đã có; không daily/use-count quota nhưng có thể bị chặn nếu thiếu headroom. Không claim memory stability.

## 19. Checklist trước Closed Testing

- [x] Native compile + Kotlin tests cuối PASS; APK cuối build và checksum rõ.
- [x] Inspect APK module/model/ABI/signature/flag và ELF + zipalign16KiB đã thực hiện. ZIP PASS, strict ELF FAIL; release blocker chưa giải quyết.
- [ ] 5–10 lượt scan hợp lệ liên tiếp, no-face/multi-face/tilted/closed eyes/smile/cropped ảnh.
- [ ] JPEG/PNG/WebP, high-res, EXIF1–8/mirror, camera vs library trên device thật.
- [ ] Background/unmount/back/reset/double tap trong normalization/inference/provider; không crash/hang/stale navigation.
- [ ] Overlay align và scan animation trên nhiều màn hình, portrait/landscape input, accessibility.
- [ ] Real Explore/MUA/service empty/error/filter/detail; booking hiện tại end-to-end.
- [ ] Quyết định data-processing phù hợp trước Gemini thật; verify project model/quota/terms. Không bật paid tier tự động.
- [ ] Privacy review: không ảnh/URI/raw mesh upload, không geometry persistence/logging, owned temp cleanup.
- [ ] Chủ dự án nghiệm thu APK trên spare device; xác định package/signing strategy cho Closed Testing.
- [ ] Review/commit/push/deploy thủ công từng candidate; không merge old migrations/image upload/quota code.
- [ ] Chỉ update Google Play sau nghiệm thu; production flag policy phải kiểm tra riêng.

## 20. Chủ dự án làm thủ công

Review diff tại hai worktrees, commit/push riêng sau nghiệm thu. Backend chỉ deploy endpoint tối thiểu khi quyết định phù hợp; không migration mới. Không bật FeatureAdvisor flags trước khi xử lý terms/project blocker. Chạy device matrix và booking thật. Phê duyệt package/Firebase/signing strategy nếu cần preview riêng. Không có production, alpha hay Closed Testing release nào được thay đổi bởi task này.






### Cài nghiệm thu an toàn

Dùng Android ARM64, API24+, page size4KiB, spare device chưa có com.bbook.app. Không dùng `adb install -r`, không uninstall alpha. Có thể tải APK vào máy rồi mở file cài, hoặc chạy `adb install D:\EXE\artifacts\bbook-advisor-mesh-preview-20261013.apk` trên đúng spare device. Nếu app cùng package đã có, lệnh sẽ báo lỗi thay vì cài đè. Bản này không được chứng nhận16KiB; APK debug-signed không phải artifact để upload Google Play. Mở Khám phá → AI Makeup Advisor → consent local → selfie → scan → local suggestions → style tips → real MUA/service → existing detail/booking. Gemini thật vẫn tắt.

### Evidence và Git snapshot cuối

Frontend status: `D:\EXE\artifacts\feature-advisor-frontend-status.txt`; backend status: `feature-advisor-backend-status.txt`. All changes uncommitted. Packaging inspector mới tách riêng `Inspect-PreviewPackage.ps1`; reuse `Inspect-Apk.ps1` v3 có sẵn cho full ELF/RELRO/layout diagnostics. Các output nằm trong `feature-advisor-apk-inspection/`, `feature-advisor-apk-inspection-v3.json`, `feature-advisor-apk-16k.json`, `feature-advisor-apk-signature.txt`. Strict RELRO failure không được thay bằng layout-safe diagnostic để claimPASS. Không có thiết bị/runtime proof.
