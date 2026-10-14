# Face Scan local-only và Dynamic Scan Status — 2026-10-14

Thực hiện trong `D:\EXE\bbeauty-app-mlkit-advisor`. Không sửa backend/database/migration/API contract, native ML Kit, scoring, SDK, dependency, package name hoặc cấu hình release. Không build APK/AAB, commit, push hoặc deploy. Chưa xác nhận production-ready trên điện thoại.

## Audit kiến trúc trước thay đổi

- Route hiện tại là `app/makeup-advisor.tsx`, dùng `useAdvisor`. Camera preview trả JPEG mới, gallery dùng ImagePicker. Cả hai vào admission guard → bounded normalizer → `faceAnalysis.analyze`.
- Native module `BBookFaceAnalysis`: face-count detector → contours → optional face mesh. Dữ liệu thật gồm bounding box, Euler angles, probabilities nếu có, landmarks/contours; mesh hợp lệ có 468 điểm, triangle indices và region indices. Callback `onDetection` xuất contours thật trong lúc mesh đang chạy. Mesh thiếu/hỏng có thể fallback sang contours theo logic hiện có.
- `extractFaceFeatures`: kiểm tra một mặt, dữ liệu ảnh, khung hợp lệ, mặt tối thiểu 200px, pitch/yaw ≤15° và roll ≤10°, topology/đường nét/eye alignment; tính tỷ lệ 2D cùng provenance. Không có detector ảnh tối hoặc độ mờ. Số đo không phải phân loại chắc chắn về ngoại hình.
- `localEngine.recommendFromLibrary` gọi `buildFaceProfile` V2, dùng compatibility rules, feature budget 1, occasion bonus .12, intensity bonus .08. Giữ tie-break theo thư viện và diversity ở các điểm bằng nhau, chọn 3 kết quả. Nội dung tips/descriptions lấy thư viện và rule explanation trên thiết bị.
- **Không có bằng chứng Gemini đang được gọi trong lượt scan mặc định**: route trước tác vụ gọi pick/scan với cloud consent false. `getRecommendations` khi đó trả local; EAS profiles đang cloud=0, processing approval pending. Nhánh Gemini chỉ khả dụng khi flag native/cloud/approval được bật và người dùng chủ động consent/retry.
- Nhánh tùy chọn trước đây: `retryCloud` → `getRecommendations` → capability schema v3 → `/MakeupAdvisor/recommend` gửi summary rút gọn. Không gửi selfie. Khi được phép, kết quả Gemini có thể thay Top 3 local.
- Đã đọc backend tại `BeautyBook-advisor-integration-20261013`: `MakeupAdvisorController`, `FeatureAdvisorProvider`, `FeatureAdvisorContract`, `FeatureAdvisorModule`. Provider dùng Gemini generateContent, gates model/key/approval/paid terms; controller nhận summary v3, duplicate/concurrency/rate-limit, không nhận selfie. Đây là audit checkout, không khẳng định cấu hình runtime của server đang deploy.

## Kiến trúc sau thay đổi

Camera / Gallery → admission / normalized JPEG → ML Kit count + contours + optional mesh → quality validation + measurements hiện có → Face Profile V2 → local technique matching/scoring → kiểm tra đúng 3 gợi ý local khác key → commit Results.

- Hook chỉ gọi `recommendFaceScan` local, không import runtime `advisorRecommendation`, `advisorTransport`, cloudSummary, Gemini flags hoặc request-ID Crypto.
- Bỏ `retryCloud`, cloudConsent và CTA/switch Gemini khỏi route. Results không có thông báo quota/network/fallback Gemini.
- Gemini provider/transport/summary/validator/frontend tests và backend được giữ nguyên để có thể tái sử dụng trong tương lai; không triển khai AI Chat ở tác vụ này.
- Catalog/MUA/service vẫn có request thông thường sau Results hoặc khi mở matching; không gửi ảnh/đặc trưng khuôn mặt trong các request đó. Face Scan không cần Gemini key hoặc quota.
- Các flags **face-aware experimental** hiện có giữ nguyên. Preview/local được bật theo cấu hình cũ; closed/production chưa bật thì engine vẫn chạy local nhưng chọn library fallback, không tự ý bật scoring thử nghiệm trong bản closed testing. Đây là giới hạn quan trọng, không phải phân tích cá nhân hóa được hiệu chuẩn.

## State và thời gian

Phase: idle, initializing, validating, analyzing, matching, success, validation_error, processing_error, cancelled. Stage UI vẫn có start/scanning/results và thêm error.

- INITIALIZING: ngay sau lựa chọn ảnh, chuẩn hóa và bắt đầu native detection.
- ANALYZING: khi native phát contours thật trong lúc mesh xử lý; sau đó khi extractor thực sự tính tỷ lệ.
- VALIDATING: callback tại công đoạn kiểm tra quality thật của extractor. Subtitle “Kiểm tra số khuôn mặt và góc đầu”, không tuyên bố đo độ rõ nét.
- MATCHING: ngay trước lời gọi engine local. Không dùng timer để đưa sang bước này.
- Các bước JS local rất nhanh có thể được React batch và không hiện đủ từng nhãn trên màn hình. Không kéo dài hoặc giả lập công đoạn để ép người dùng nhìn thấy tất cả nhãn.
- SUCCESS: chỉ sau adapter xác nhận 3 kết quả local với key khác nhau. Results được commit ngay; callback animation không điều hướng hay tạo kết quả.
- ERROR: dừng beam, frame coral, giữ selfie/thông báo và actions cho tới khi người dùng chọn retry/cancel. Không có modal lỗi validation mặc định, Alert.alert hoặc tự về camera sau 2–3 giây.

**Audit 5/10 giây:** `scanPresentation.ts` vẫn giữ constants 5000ms/10000ms và helper chờ. Tuy nhiên hook đã bỏ lời gọi trong redesign 2026-10-13, trước task này. Task này không khôi phục hay sửa các mốc lịch sử. Chúng không tham gia flow đang chạy. Beam sweep 1800ms là nhịp animation, không phải thời gian phân tích. Native diagnostic có sample sau 5000ms để đo memory idle; đó không phải timer lỗi UI và không được sửa.

**Watchdog 60 giây:** công đoạn chuẩn hóa/phân tích treo sẽ chuyển sang processing_error, dừng UI loading và không nhận kết quả muộn. Đây là timeout bảo vệ, không phải presentation timer. Gate vẫn giữ cho đến khi native task thật kết thúc; retry bị vô hiệu hóa trong lúc đó để không chồng bitmap/detector. Người dùng vẫn có thể hủy/xóa ảnh/rời route. Không cố đóng ML Kit hoặc giải phóng native lease khi SDK còn xử lý. Nếu native task thật không trả về, cần đóng/mở lại app; watchdog không thể sửa một native task bị treo. Chưa kiểm chứng tình huống này trên thiết bị.

## Animation / privacy / lifecycle

- `DynamicScanStatus`: panel dark translucent radius 20, accent pink, icon loading/check/warning, main + secondary, fade/translateY 10px. Status transition 200ms, error 250ms.
- Giữ `ScanPhoto`, ảnh thật và landmarks/mesh thật; coral frame khi lỗi. Không sinh điểm hoặc phần trăm giả.
- Success crossfade 400ms nằm trên Results đã commit, pointerEvents none; landmark/beam fade cùng lúc. Không thêm màn trung gian và không chờ animation để hoàn thành scan.
- Tái sử dụng Animated native-driver hiện đang dùng cho scanning. Không thêm animation library.
- Reduced-motion và app background dừng/giảm chuyển động; listener và animation được cleanup khi unmount/phase đổi. Route blur reset session.
- Generation/single-flight chặn request muộn, double action và success sau cancel. Background sau cancel không dựng lại error.
- Ảnh lỗi mới thuộc namespace Advisor giữ trong phiên để hiển thị; xóa khi retry, hủy, thu hồi consent hoặc rời route. Có thể giữ kết quả/ảnh hợp lệ trước đó để phục hồi khi hủy retake. Không xóa ảnh gốc gallery. TTL sweep sau process kill giữ nguyên.
- Consent xử lý local vẫn không chọn sẵn. Không tự upload selfie/summary, không mở quyền Gemini.

## Lỗi thực sự được hỗ trợ

| Code / domain | Nguồn | Hiển thị |
| --- | --- | --- |
| FACE_NOT_FOUND | faceCount=0 | Chưa tìm thấy khuôn mặt |
| MULTIPLE_FACES | faceCount>1 | Chỉ để một khuôn mặt trong ảnh nhé |
| FACE_TOO_SMALL | box hợp lệ, cạnh ngắn <200px | Khuôn mặt đang ở quá xa |
| FACE_NOT_FRONTAL | Euler/eye alignment đã kiểm tra | Hãy nhìn thẳng vào camera |
| PROCESSING_ERROR | dữ liệu/contours không đủ, malformed geometry | Chưa thể phân tích ảnh này + lý do an toàn hiện có |
| E_DETECTION / native | native detector failure | Thông báo cố định của pipeline native |
| E_INPUT, E_NORMALIZATION_INPUT / input | không đọc/chuẩn hóa được ảnh | Thông báo dữ liệu ảnh, không suy đoán mặt hoặc độ mờ |
| Memory/admission/cleanup codes / resource | native guard hiện có | Giữ lý do bộ nhớ/cleanup, không gọi là validation khuôn mặt |
| E_PERMISSION / acquisition | quyền camera | Hướng dẫn cấp quyền hiện có |
| E_RECOMMENDATIONS / recommendation | response local không đủ 3 gợi ý hợp lệ | Chưa tạo được đủ 3 gợi ý makeup |
| E_PROCESSING_TIMEOUT / processing | watchdog frontend 60s | Phân tích đang mất nhiều thời gian |

IMAGE_TOO_DARK và IMAGE_BLURRY **không được thêm**, vì pipeline không đo chúng. Hướng dẫn tìm nơi sáng/chụp rõ là lời khuyên retry, không phải kết luận đo ánh sáng hoặc blur.

## File thay đổi trong task này

- `app/makeup-advisor.tsx`
- `features/makeupAdvisor/useAdvisor.ts`
- `features/makeupAdvisor/AdvisorResults.tsx`
- `features/makeupAdvisor/ScanPhoto.tsx`
- `features/makeupAdvisor/errors.ts` — thêm accessor code từ whitelist, giữ nguyên message/behavior cũ.
- `features/makeupAdvisor/faceFeatures/extractor.ts` — chỉ thêm error metadata và callback phase; thresholds/formulas giữ nguyên.
- Mới: `features/makeupAdvisor/faceScanRecommendations.ts`
- Mới: `features/makeupAdvisor/scanState.ts`
- Mới: `features/makeupAdvisor/DynamicScanStatus.tsx`
- Mới: `features/makeupAdvisor/useReducedMotion.ts`
- Tests: `__tests__/useAdvisor.test.tsx`, `__tests__/screen.test.tsx`; mới `__tests__/faceScanRecommendations.test.ts`, `__tests__/DynamicScanStatus.test.tsx`.
- Tài liệu này: `docs/advisor/LOCAL-SCAN-DYNAMIC-STATUS.md`.

Repo đã có nhiều thay đổi chưa commit trước task; không reset chúng. Các file backend/native/release có dirty state cũ không phải thay đổi của task này.

## Chạy và tự build

PowerShell cho development APK đã có ML Kit và expo-camera:

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
$env:BBOOK_ADVISOR_ENABLED='1'
$env:BBOOK_ADVISOR_CLOUD_ENABLED='0'
$env:BBOOK_ADVISOR_DATA_PROCESSING_APPROVAL='pending'
$env:EAS_BUILD_PROFILE='advisor-development'
npx expo start --dev-client --clear
```

Không nhập Gemini key. Expo Go không chứa module ML Kit riêng. Mở development app BBook để kết nối Metro.

Người dùng tự build APK (task chưa chạy các lệnh này):

```powershell
npx eas-cli build --platform android --profile advisor-development
# Hoặc APK release preview chạy độc lập:
npx eas-cli build --platform android --profile advisor-preview
```

Giữ runbook identity/artifact hiện có: preview config có package riêng, còn thư mục android có sẵn sử dụng native identity của nó. Task không đổi/đồng bộ package hoặc chạy prebuild. Task này chỉ đổi JS/TS; development binary đã có module ML Kit + expo-camera có thể dùng Metro reload. Release APK cần người dùng rebuild để nhúng JS mới.

## Giới hạn kiểm chứng

Tests dùng synthetic fixtures/mocks, không thay thế camera/ML Kit trên điện thoại. Chưa kiểm chứng native hang, memory khi quét liên tục, mesh alignment, animation mượt trên máy yếu, reduced-motion hệ thống, font lớn và layout Android nhỏ. Face-aware buckets vẫn experimental/provisional theo chính sách hiện có; không tự nhận đã cá nhân hóa đáng tin cậy hoặc production-ready.

## Kết quả kiểm thử cuối

- TypeScript toàn dự án `tsc --noEmit`: đạt.
- ESLint tất cả file JS/TS frontend/test thay đổi trong task: đạt, không warning/error.
- Toàn bộ `features/makeupAdvisor`: **28 suites, 226 tests đạt** (38.842s ở lượt cuối).
- Kiểm tra gồm Top 3 thật, metadata cho 4 lỗi mặt được hỗ trợ, engine trả thiếu 3, sai dữ liệu box, Gemini module/HTTP không được import runtime, cloud flag bật nhưng Face Scan vẫn local, retry/gallery/camera, cancel giữa normalize/native work, background sau cancel, blur/unmount, timer watchdog, ảnh muộn và quét liên tục. Các test Gemini legacy còn nguyên và cũng đạt.
- Tests animation/copy kiểm tra reduced-motion, không dùng nội dung blur/dark chưa được đo, lỗi không hiện success, và Results không chờ completion của animation.
- `git diff --check` trên các file tracked trong phạm vi: đạt.
- Không chạy APK/AAB build, native compilation hoặc kiểm thử camera/ML Kit trên thiết bị. Không chạy export bundle ở task này; bundling SDK 57 đã được xác nhận ở lần sửa import trước đó.
