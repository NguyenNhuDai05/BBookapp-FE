# Redesign AI Makeup Advisor — 2026-10-13

Triển khai tại `D:\EXE\bbeauty-app-mlkit-advisor`. Đây là bản frontend cần kiểm thử trên điện thoại; chưa xác nhận production-ready.

## Audit trước khi sửa

- Route `app/makeup-advisor.tsx`; entry `AdvisorEntry`; hook `useAdvisor` quản lý start → scanning → results, gate chống thao tác trùng, generation chống kết quả muộn, hủy khi blur/background và giữ kết quả cũ khi ảnh mới thất bại.
- Camera cũ mở camera hệ thống qua Expo ImagePicker. Gallery dùng system picker; không tự upload ảnh.
- `faceAnalysis`: nhận bản cache của ImagePicker, native bounded normalization, admission/memory guard, ML Kit face detection/mesh và callback onDetection. Detector chỉ xử lý ảnh sau acquisition.
- `ScanPhoto`: beam Animated và SVG landmarks/mesh thật; không tạo tọa độ giả.
- `faceFeatures/extractor`, `localEngine`, `styleLibrary`, `techniqueCompatibility`, `advisorRecommendation`: quality gate, scoring và Top 3 thật. Local experimental/fallback được phân biệt; không kết luận undertone/dáng mặt.
- `advisorTransport` chỉ gửi summary khi build được phê duyệt và có cloud consent riêng. `MakeupProfilePreview` trước đây làm Results dài; bỏ khỏi màn chính, giữ disclosure cần thiết trong privacy sheet.
- `AdvisorMatching` dùng catalog, MUA/service thật và route mua-detail; các bộ lọc và retry vẫn có, nay chỉ mount khi người dùng mở tìm MUA.
- `AdvisorPreferences` vẫn tùy chọn, collapsed; tinh chỉnh dùng extraction đã hoàn tất, không quét lại.
- Thời gian presentation nhân tạo 10 giây/5 giây trước đây được gọi trong hook. Đã bỏ các lời gọi chờ; kết quả/lỗi xuất hiện ngay khi xử lý xong. Helper lịch sử scanPresentation vẫn tồn tại để không mở rộng phạm vi; hook không sử dụng helper chờ này. SCAN_SWEEP_MS vẫn dùng cho animation.
- Repo đã có nhiều thay đổi chưa commit trước tác vụ. Không reset chúng; không chỉnh backend, measurement, scoring, ranking, Expo SDK, React Native, applicationId, EAS profiles hoặc mã native ML Kit trong tác vụ này.

## Giao diện và interaction

- Landing: nền #FFF7FA, headline editorial, khoảng trắng, khu vực hero lớn với gradient nhẹ, ba caption icon, CTA gradient cố định dưới vùng scroll; privacy truy cập bằng icon trên header. Catalog không được gọi/tải ảnh từ ngoài ở Landing.
- Camera: preview thật phủ toàn màn, floating Back/Help, oval hồng nét mảnh và bốn góc mềm; panel đen trong suốt, shutter trắng viền hồng, Gallery/Flip thật. Safe-area được áp dụng vào header và controls; vùng căn mặt co giãn theo không gian còn lại. Khung chỉ là hướng dẫn bố cục.
- Quyền camera chỉ được hỏi khi người dùng chủ động mở camera và bấm cấp quyền; nếu bị chặn có nút mở cài đặt. Gallery vẫn sử dụng pipeline ImagePicker cũ, không cần camera permission.
- Shutter chờ native camera-ready; chống nhấn trùng; pause/unmount preview trước khi chuyển ảnh vào pipeline hiện có. Chọn output camera từ danh sách native, cạnh dài tối đa 1920px, để hạn chế bitmap lớn trước bounded normalizer. Không thay đổi chất lượng gate hoặc thuật toán ML Kit.
- Camera unmount khi background hoặc route unfocused; kiểm tra quyền khi quay foreground; ảnh trả về muộn được xóa. Có retry mount/capture và chuyển camera khác; lỗi nội bộ/URI không được hiển thị.
- Flash hiện là **flash màn hình camera trước**, sử dụng API `flash='screen'` của Expo SDK 57. Flash phần cứng camera sau được ẩn: public API không cung cấp capability hasFlashUnit để xác nhận hỗ trợ. Không tự suy đoán mọi camera sau có đèn flash; không thêm bridge native chỉ để dò flash.
- Results: header + selfie trong phiên, Top 3 theo thứ tự engine, ba hàng ngang có rank, thumbnail và mô tả tối đa hai dòng; mỗi hàng mở hướng dẫn thật (focus, steps, colors, occasions). Không hiển thị số đo hay phân loại ngoại hình trên màn chính.
- Chỉ chọn ảnh catalog có tag tương ứng; không lặp cùng URL giữa ba hạng. Khi thiếu ảnh, dùng minh họa gradient có nhãn MINH HỌA; không phải ảnh mô phỏng trên selfie.
- Chụp lại giữ kết quả cũ khi hủy camera/gallery hoặc lần xử lý mới thất bại. Khám phá MUA và CTA trong hướng dẫn mở matching hiện có.
- Analysis giữ ScanPhoto và landmarks thật, status ngắn, chỉ có action hủy; không có progress checklist, phần trăm giả hoặc nút Tiếp tục.
- Consent không chọn sẵn; có thể thu hồi, xóa ảnh và truy cập disclosure. Cloud consent riêng chỉ xuất hiện khi build đã cho phép; không tự gửi selfie/summary.

## Những file thay đổi trong tác vụ

Frontend / cấu hình:
- `app/makeup-advisor.tsx`
- `features/makeupAdvisor/AdvisorResults.tsx`
- `features/makeupAdvisor/useAdvisor.ts`
- `app.config.ts`
- `package.json`, `package-lock.json`

Component / helper mới:
- `features/makeupAdvisor/AdvisorLanding.tsx`
- `features/makeupAdvisor/AdvisorCamera.tsx`
- `features/makeupAdvisor/cameraPhoto.ts` — chỉ nhận JPEG mới của cache/Camera, chuyển vào namespace cleanup hiện có; không xóa ảnh gốc thư viện.

Asset / tài liệu:
- `assets/images/advisor/README.md`
- `docs/advisor/PREMIUM-UI-REDESIGN.md` (tài liệu này)

Tests cập nhật/thêm:
- `features/makeupAdvisor/__tests__/screen.test.tsx`
- `features/makeupAdvisor/__tests__/useAdvisor.test.tsx`
- `features/makeupAdvisor/__tests__/buildFlag.test.ts`
- `features/makeupAdvisor/__tests__/AdvisorCamera.test.tsx`
- `features/makeupAdvisor/__tests__/cameraPhoto.test.ts`

## Dependency, permission và plugin

Theo cho phép bổ sung của người dùng, chạy `npx expo install expo-camera`; phiên bản được Expo chọn là `~57.0.6`, dùng bản 57.0.6 đã có trong dependency workspace. SDK vẫn `~57.0.24`, React Native vẫn 0.86.3.

Node_modules ban đầu là junction dùng chung. Lần npm install đầu đã gỡ junction, nên đã khôi phục đúng liên kết ban đầu, không sửa thư viện dùng chung. Sau đó chạy Expo installer với package-lock-only. Các thay đổi lockfile ngoài camera đã được loại bỏ để giữ nguyên phiên bản dependency cũ.

Chỉ thêm native dependency expo-camera. Các dependency JS bắc cầu của camera trong lockfile: barcode-detector, zxing-wasm, @types/emscripten; không thêm một native dependency độc lập khác.

Plugin expo-camera có `recordAudioAndroid:false`, `microphonePermission:false`, `barcodeScannerEnabled:false`; camera permission text dùng cho selfie và xác minh. Manifest của thư viện tự thêm CAMERA; không yêu cầu microphone. EAS profiles, package name, signing, versionCode và cấu hình Play giữ nguyên trạng thái trước tác vụ. Tác vụ không chạy prebuild hoặc build APK/AAB.

## Thiếu asset / đối chiếu thiết kế

Attachment chỉ chứa yêu cầu văn bản, chưa có ảnh tham khảo screen 1/2/4. Vì vậy layout bám theo mô tả, **chưa thể xác nhận giống ảnh tham khảo**.

Chưa có portrait thật phù hợp. `anh_dau_trang.jpg` là ảnh chụp màn hình app, không dùng làm hero. Landing hiện có vùng ảnh tạm ghi rõ đang bổ sung, không đáp ứng acceptance hero cuối cùng. Cần người dùng cung cấp portrait có quyền sử dụng và ảnh tham khảo.

Vị trí: `assets/images/advisor/landing-portrait.jpg`. Khi có ảnh, đặt `advisorPortrait` trong AdvisorLanding thành `require('../../assets/images/advisor/landing-portrait.jpg')`. Không dùng URL ngoài hay thêm thư viện ảnh.

## Chạy và kiểm thử thủ công

Metro cho development build có ML Kit và expo-camera:

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
$env:BBOOK_ADVISOR_ENABLED='1'
$env:BBOOK_ADVISOR_CLOUD_ENABLED='0'
$env:BBOOK_ADVISOR_DATA_PROCESSING_APPROVAL='pending'
$env:EAS_BUILD_PROFILE='advisor-development'
npx expo start --dev-client --clear
```

Nếu kết nối LAN không được, dùng `npx expo start --dev-client --tunnel --clear`. Expo Go không có module ML Kit tùy chỉnh; không dùng Expo Go để xác nhận flow phân tích. APK release preview không kết nối Metro như development client.

Người dùng tự build APK bằng profile EAS đang có:

```powershell
npx eas-cli build --platform android --profile advisor-preview
```

Development APK cho Metro:

```powershell
npx eas-cli build --platform android --profile advisor-development
```

Các lệnh trên là hướng dẫn, **chưa được tác vụ chạy**. Binary mới cần chứa expo-camera; Metro reload không bổ sung module native vào APK cũ. Profile preview trước tác vụ đã có package riêng com.bbook.advisor; Android source đang là com.bbook.app. Khi tự build, kiểm tra identity thực tế trong artifact theo runbook hiện có, vì EAS với thư mục android có sẵn dùng native project; tác vụ không đồng bộ/đổi identity này.

Kiểm tra điện thoại: permission lần đầu/từ chối vĩnh viễn/cấp lại Settings; camera front/back, screen flash, shutter double tap, gallery cancel; app background khi chụp/quét; back khi chụp và ảnh trả muộn; orientation/mesh alignment; một/nhiều/không có mặt; low memory và quét lại nhiều lần; ảnh cũ được giữ khi thất bại, xóa khi thu hồi consent/rời route; màn nhỏ, font lớn, status/navigation bars; Top 3/detail/matching/preference. Camera lifecycle phần cứng, release manifest, tốc độ và layout Android chưa được xác nhận trên điện thoại.

Không commit, push, merge, deploy hoặc build APK/AAB trong tác vụ này.

## Kết quả xác minh

- TypeScript toàn dự án: `tsc --noEmit` đạt, chạy lại sau thay đổi cuối.
- ESLint các file frontend/config/test thay đổi: đạt, không lỗi/cảnh báo. BuildFlag test được lint riêng sau khi thêm kiểm tra permission.
- Toàn bộ `features/makeupAdvisor`: **26 suites, 212 tests đạt** ở lượt regression đầy đủ.
- Sau chỉnh sửa cuối: các test screen/hook/cleanup đạt 36 tests; camera đạt 6 tests; config/build flags đạt 19 tests (bao gồm một test permission mới).
- `git diff --check` cho các file tracked trong phạm vi: đạt sau dọn whitespace.
- Không chạy APK/AAB build, native compilation, screenshot/visual QA hoặc camera thực tế. Kết quả Jest dùng camera mocks nên không chứng minh phần cứng hoạt động hay UI không tràn trên tất cả Android.
- Tham khảo API đúng SDK: [Expo Camera SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/camera/). AGENTS.md trỏ SDK 54 cũng đã được đọc theo yêu cầu; implementation dùng type/source dependency SDK 57 thực tế.

## Sửa lỗi Metro SDK 57 — 2026-10-14

Camera trước đó import useIsFocused trực tiếp từ @react-navigation/native, khiến Expo Router SDK 57 chặn Android bundling. Đã đổi sang expo-router/react-navigation theo migration SDK 56+; mock camera test cũng dùng entry point này. Không bật EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK và không nâng cấp SDK/package.

Typecheck, lint hai file và 6 camera tests đạt. Không còn chuỗi @react-navigation trong app/features/components/hooks. Lượt test đầu bị timeout khi chạy đồng thời với các worker Metro; chạy lại với timeout 30 giây đạt cả 6 test. Bundle Android JS/assets được kiểm tra riêng; không build APK/AAB.

Export Android JS/Hermes bundle đã hoàn tất thành công (exit 0), output .expo/advisor-router-bundle-check. Lỗi chặn import React Navigation không còn xuất hiện. Không cần biến môi trường bỏ kiểm tra. Không build APK/AAB.



Cập nhật 14-10-2026: theo chỉ đạo người dùng, màn Camera đã loại bỏ hoàn toàn tính năng flash và oval guide; chỉ còn bốn góc hồng, CameraView flash off/torch false. Hero không render khi chưa có portrait thật. Xem P0-CAMERA-GALLERY-MEMORY-20261014.md cho audit, changes và hạn chế kiểm thử hiện tại.
