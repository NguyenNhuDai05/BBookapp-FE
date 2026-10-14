# BBook Advisor — Camera/Gallery/Memory audit, 14-10-2026

Thiết bị do người dùng xác nhận: OPPO Reno 12F CPH2637, Android 16, APK advisor-development. RAM và PSS thực tế chưa được cung cấp. Người dùng tự build/test, không dùng USB. Không chạy APK/AAB build trong lượt này.

## A. Nguyên nhân và mức độ xác nhận

| Vấn đề | Bằng chứng | Kết luận |
|---|---|---|
| Gallery báo memory trước chọn | useAdvisor.acquire trước đây gọi ensureScanAdmission trước launchImageLibraryAsync | Xác nhận lỗi thứ tự. Picker nay mở trước; hủy không chạy guard/normalize/ML Kit. |
| Gradient chỉ giữa pill | AdvisorButton outer alignItems:center, inner gradient không stretch | Xác nhận lỗi layout chung. Inner gradient nay alignSelf:stretch; áp dụng landing/permission/consent/retry. |
| Flip chậm | CameraView key trước đây chứa facing; flip clear pictureSize; onCameraReady đổi size rồi setReady ngay | Xác nhận remount và rebind thừa/premature readiness trong code. Tác động thời gian trên OPPO chưa đo. Nay stable key chỉ dùng retry, flip serialized, ready sau final OPEN. |
| Preview trắng khi flash | Front screen flash dùng không kiểm chứng trên OPPO | Không kết luận lỗi native flash. Theo UPDATE, xóa hoàn toàn tính năng; flash=off, enableTorch=false. |
| First scan E_MEMORY_BUDGET | Guard xét PSS toàn process và system reserve; screenshot không có checkpoint/số đo | Chưa xác định checkpoint hay leak. Trước đây guard frontend còn chạy trước nhận ảnh. Đã sửa thứ tự và bàn giao; bổ sung diagnostics. Không tắt guard hoặc tự nâng ngưỡng. |
| Landing cắt headline | ScrollView dùng lại giữa landing/error/results; Android clipping | Retained offset/clipping là khả năng trong code, chưa xác nhận pixel trên máy. Key theo view/stage và removeClippedSubviews=false xử lý khả năng này. SafeArea giữ nguyên. |
| Bánh răng xanh/xám | expo-dev-menu debug fab/FloatingActionButtonContent.kt dùng gear_fill, vòng xanh và idle desaturation; APK development | Overlay Expo Dev Menu, không phải control của Advisor. Không thay đổi cấu hình release để ẩn overlay. |
| Hero placeholder | advisorPortrait chưa có asset | Bỏ toàn bộ hero khi thiếu asset; không còn dòng ảnh đang bổ sung. Cần ảnh thật để hoàn thiện hero. |

Không có bằng chứng tất cả lỗi chung một nguyên nhân. Gallery admission và first-scan cùng đi qua guard, nhưng lỗi gradient độc lập. Camera remount/rebind có thể tăng tải/bộ nhớ; chưa có đo đạc để khẳng định gây E_MEMORY_BUDGET.

## B. Thay đổi và các guard giữ nguyên

- AdvisorCamera.tsx: preview fullscreen, chỉ bốn góc hồng responsive; xóa oval/flash control/import/state/handlers. Flip giữ cùng native view; ref gate chặn tap trùng, shutter đợi cấu hình size bounded và onCameraReady cuối. Gallery/capture yêu cầu pausePreview trước bàn giao. Mount/readiness/sizing có watchdog 12s, capture 20s, gallery release 12s; watchdog chỉ báo lỗi và vô hiệu callback, không dùng timer để giả ready. Late photo được xóa, gate native đang pending không được mở sớm. Back vẫn thoát được.
- useAdvisor.ts: picker trước admission, kiểm tra asset, adopt cache copy rồi guard; refusal/cancel xóa copy thuộc Advisor. Cancellation trả outcome cho route phục hồi camera. Picker lỗi, asset lỗi và native memory lỗi có mã riêng. ML Kit/feature extraction/scoring giữ nguyên.
- makeup-advisor.tsx: phục hồi camera khi hủy picker, ScrollView riêng theo stage, lỗi gọn với thumbnail tùy chọn + hai nút, header Back hủy/xóa. Consent vẫn mặc định false.
- AdvisorButton/AdvisorLanding/errors: gradient full width; hero thiếu asset không render; memory copy không nói có kết quả trước ở lần đầu.
- scanDiagnostics.ts + faceAnalysis.ts + BBookFaceAnalysisModule.kt: schema scalar, checkpoint/timestamp/elapsed/session; admission snapshot đọc về JS để xem Console không cần USB. Không URI, bitmap, mặt/landmark, token hoặc native error message. Diagnostic mode/dev only; getter trả map rỗng nếu không được phép. Guard và single-flight lease giữ nguyên.

Các ngân sách hiện có không đổi: ceiling PSS 768 MiB, reserve request 64 MiB, growth 128 MiB trên warmed idle cố định; không latch pressure. Normalizer downsample trước decode, bounds source/output và cleanup giữ nguyên. Frontend admission, normalize admission/checkpoint, analyze admission/checkpoint, mesh admission đều còn. Camera unbind/unmount request không được coi là bằng chứng hardware/graphics đã giải phóng xong.

Không sửa backend/database, Face-Aware Engine V2, Gemini transport, thuật toán ML Kit, Expo SDK, dependencies, permissions/plugins, EAS/package name/Google Play configuration trong lượt này. Không commit/push/merge/deploy/build.

## C. Kiểm tra

TypeScript --noEmit và ESLint các file thay đổi đều pass. Lượt cuối full Advisor regression: 28 suites / 238 tests pass, bao gồm gallery cancel/late selection cleanup, native admission reason mapping, diagnostics whitelist, camera readiness/flip/capture/background/unmount và engine regression. Lint toàn repo hiện có lỗi set-state-in-effect ở app/(admin)/payouts/[id].tsx và app/(admin)/private-media.tsx cùng các warning ngoài Advisor; không sửa các màn đó.

Jest ban đầu lỗi cache EPERM tại Windows sandbox temp; chạy lại với cache D:/EXE/.verification/jest-advisor-p0. Camera readiness watchdog test gọi callback thật đã đăng ký; không dùng fake timers làm kẹt renderer scheduler.

Native module Android chưa compile/test trên thiết bị trong lượt này. Không có bằng chứng PSS/flip latency/device release thành công. Tests JS không chứng minh CameraX hoạt động đúng trên Android 16.

## D. Rủi ro còn lại

First-scan memory refusal chưa được đóng: cần checkpoint từ APK mới. Policy PoC chưa hiệu chuẩn cho OPPO/Android16 và development process overhead. Không suy ra RAM hoặc leak từ tên máy/screenshot. Hỗ trợ lens/size khác nhau có thể cần một rebind bổ sung khi chuyển lens lần đầu; timeout giữ lối retry/gallery/back. Không có real-time face hoặc low-light detection; không tự hiển thị cảnh báo ảnh tối. Camera không còn tip ánh sáng được hiển thị tự động hoặc cảnh báo ảnh tối; chưa có detector điều kiện ánh sáng.

## E. Tự kiểm thử qua Wi-Fi, không USB

1. Tự build/cài advisor-development từ code hiện tại theo workflow đang dùng. Native getter mới cần APK mới; Metro reload APK cũ chỉ cập nhật JS/UI, không thêm memoryDiagnostics.
2. Trong PowerShell:

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
$env:BBOOK_ADVISOR_ENABLED='1'
$env:BBOOK_ADVISOR_CLOUD_ENABLED='0'
$env:BBOOK_ADVISOR_DATA_PROCESSING_APPROVAL='pending'
$env:BBOOK_ADVISOR_DIAGNOSTICS='1'
$env:EAS_BUILD_PROFILE='advisor-development'
npx expo start --dev-client --clear --lan
```

Điện thoại và máy tính cùng Wi-Fi, mở development APK qua QR/URL. Mở JS Console của React Native DevTools (phím j trong Expo CLI khi thiết bị kết nối) hoặc xem terminal Metro nếu có stream console. Lọc BBookScan, BBookMemoryCheckpoint, BBookAdvisorFailure. Không cần USB/adb.

3. Test cold start: mở Landing, cấp consent/camera, ready, flip front/back 5 lần (kể cả tap nhanh), gallery rồi Cancel, gallery chọn JPEG nhỏ, chụp selfie lần đầu, retry; background/foreground trước chụp và trong scan; Back trong pending tác vụ. Không bấm scan nhiều lần liên tục khi native đang xử lý.
4. Kỳ vọng cancel: picker_cancel và scan_cleanup, không admission_start/preprocess_start/mlkit_start. Chọn ảnh: picker_selected -> admission_start -> admission_allowed -> preprocess -> mlkit -> recommend; failure giữ đúng code. Capture không tạo base64/exif.
5. Nếu first scan lỗi, gửi nguyên các dòng BBookMemoryCheckpoint/BBookAdvisorFailure liên quan và BBookScan trước/sau thao tác; các dòng này không chứa ảnh/URI. Checkpoint có thể là frontend_admission, normalize_admission, normalize_checkpoint, analyze_admission, analyze_checkpoint, mesh_admission.

Diễn giải ngân sách (KB): request cold giới hạn 786432, headroom 65536. PSS vượt 720896 hoặc availableKB-systemThresholdKB < 65536 có thể bị insufficient_budget, dù OS lowMemory=false. Sau warm, limit=min(786432,warmedIdlePssKB+131072). reason system_pressure/cleanup_incomplete/busy/unavailable có ý nghĩa khác, không gộp thành lỗi ảnh. Không dùng timer/GC/reset UI để vượt guard. Chỉ quyết định tối ưu hoặc hiệu chỉnh sau khi có checkpoint và số đo.

Bánh răng debug có thể kéo sang vị trí khác hoặc quản lý trong Expo Dev Menu. Không xóa control app khác. So sánh advisor-preview khi người dùng tự build để phân biệt chi phí development; không coi đổi profile là bản sửa memory guard.
