# P0 First-scan runtime audit — 14-10-2026

## A. Root cause

Thiết bị người dùng: OPPO Reno 12F CPH2637 / Android 16. Không sử dụng USB. Profile từng xác nhận advisor-development; lần log bổ sung chưa có metadata build, không suy đoán preview/development nếu không có debuggable.

### Camera flip: cải thiện được xác nhận trên thiết bị

Session s6 có 5 flip: 580 / 642 / 702 / 501 / 452 ms (trung bình 575.4 ms), mỗi lần có camera_ready và flip_completed; capture_success 555 ms. Ghi nhận tín hiệu tốt. Không refactor facing, key, readiness, shutter, output size/quality, gallery control trong lượt này. Chỉ thêm quan sát native availability/memory vào lifecycle. Flash/torch vẫn off, không oval, bốn góc hồng.

### Công thức guard và bốn lần từ chối

- ScanSafety.kt:19–28: decide(); :20 limit; :21 cold baseline; :25–27 local/system budget.
- ScanSafety.kt:38–40: absolute limit 768*1024=786432 KB; growth 128*1024; reserve 64*1024=65536 KB.
- BBookFaceAnalysisModule.kt:31–37: Debug.getPss() và ActivityManager.MemoryInfo (availMem/threshold chia 1024).
- faceAnalysis.ts ensureScanAdmission(): insufficient_budget -> E_MEMORY_BUDGET.

Guard giữ các điều kiện: cleanup hoàn tất; sample hợp lệ; không lowMemory; available > system threshold; PSS < limit; limit-PSS >= headroom; available-systemThreshold >= headroom. Cold request cần PSS <= 720896 KB (704 MiB), không chỉ dưới 768 MiB.

| Session | PSS KB | Khoảng còn lại tới cap KB | Thiếu reserve 64 MiB KB | Lý do |
|---|---:|---:|---:|---|
| s2 | 788350 | -1918 | 67454 | vượt cap và thiếu reserve |
| s3 | 766023 | 20409 | 45127 | dưới cap nhưng reserve thiếu |
| s5 | 782168 | 4264 | 61272 | dưới cap nhưng reserve thiếu |
| s7 | 782107 | 4325 | 61211 | dưới cap nhưng reserve thiếu |

Cả bốn bị chặn ở frontend_admission, trước normalize/ML Kit. systemLowMemory=false và RAM hệ thống còn nhiều không đáp ứng điều kiện local PSS reserve. Đây là rejection theo policy, chưa phải bằng chứng Java heap OOM, native OOM, leak hay ảnh quá lớn. Ảnh 474x599 vẫn bị chặn vì guard dựa PSS toàn process.

### Baseline và cleanup

coldBaselinePssKB ghi sample hợp lệ đầu tiên ở decide, chỉ dùng diagnostics, không tham gia công thức limit. 788350 giữ nguyên là anchor đầu tiên, không phải PSS hiện tại hay latch error. Test chứng minh sau cold baseline 770 MiB, current PSS 600 MiB vẫn được phép.

warmedIdlePssKB=0 có nghĩa chưa có warm anchor: code chỉ gọi cleanedWarmIdle sau successful, fullyWarmed native analyze và close tài nguyên. Bốn lần đều dừng trước SDK, nên không có warm-up. 0 không được dùng như valid baseline; limit dùng nhánh absolute cap. Giá trị có tên warmed idle hiện được lấy ngay sau cleanup request, chưa phải chứng minh mọi native allocation đã trả RAM; chưa thay anchor lifecycle vì không có số đo peak/idle thật.

cleanupComplete là trạng thái close bitmap/detector của BBook analyser. Nó không xác nhận Expo CameraX, graphics, picker hay allocator đã giải phóng RAM. React camera_unmount ở s7 precedes admission_start chỉ 5 ms: có bằng chứng bàn giao quá sớm để coi unmount là release acknowledgement; chưa có bằng chứng PSS sẽ giảm bao nhiêu sau session đóng.

Phân biệt:
1. React unmount / pausePreview: yêu cầu bỏ view/unbindAll, không phải camera closed completion.
2. Android CameraManager onCameraAvailable: OS báo camera có thể được mở; đây là availability signal, không phải quan sát trực tiếp CameraX session CLOSED hoặc graphics buffers reclaimed.
3. RAM reclamation: cần đo PSS/MemoryInfo/allocations sau availability. Không suy ra từ bước 1 hoặc 2.

### Footprint và policy

Nguồn PSS 748–770 MiB chưa phân rã ở log cũ. PSS toàn process gồm private và phần shared phân bổ; không phải Java heap. Memory class là giới hạn heap Java, không dùng để nâng PSS cap. Hermes allocations không được đồng nhất với Dalvik PSS. Các trường native/Java/graphics mới hỗ trợ phân biệt; graphics summary không được cộng lại với native/dalvik/other PSS vì cách phân loại khác.

Mã Expo picker đang cài: quality=1 chọn RawImageExporter; copy file + DimensionsExporter inJustDecodeBounds, không full-size decode khi base64/exif false và allowsEditing false. BoundedNormalizer đã downsample trước decode và recycle nguồn trước save. Không có normalize/ML Kit allocations trong bốn thất bại. Camera output bounded <=1920 hiện có giữ nguyên. Không có bằng chứng để giảm ảnh/độ chính xác hoặc clear cache toàn app. Không thay threshold, không GC cưỡng bức, không bỏ guard. 64 MiB chưa được xác nhận đủ cho cold ML Kit peak. Cần actual peak và comparison debug/preview trước hiệu chuẩn chính sách.

## B. Safe changes

- ScanSafety.kt: sửa riêng cold diagnostic anchor: không lưu sample PSS <=0 làm anchor, test invalid -> valid. Không đổi admission formula/threshold và không thay lý do bốn samples thật bị từ chối.
- CameraAvailabilityState.kt: scalar state front/back logical cameras; initial unknown fail closed; known availability từ OS callback, không timer giả ready. IDs không xuất ra log.
- CameraAvailabilityObserver.kt: dùng CameraManager có sẵn, không mở/điều khiển camera. Wait theo callback; deadline 5s chỉ báo E_CAMERA_RELEASE_PENDING. Hủy listener và settle waiter khi rời Advisor/module destroy. Không fixed-delay chờ RAM.
- BBookFaceAnalysisModule.kt: begin/stop observation, awaitCameraAvailable, memorySnapshot, event onCameraAvailability; instrumentation scan-camera-memory-v4. Camera handoff chỉ áp dụng khi Advisor đã dùng camera hoặc captured input yêu cầu tín hiệu. Gallery thuần từ Landing không bị ép phụ thuộc camera. Availability là điều kiện bàn giao bổ sung, không phê duyệt memory; guard vẫn kiểm tra tất cả ngưỡng trước/giữa decode/SDK.
- faceAnalysis.ts: bridge + whitelist scalar, bounded 24 checkpoint ring + first advisor-enter snapshot; stage/session/timestamp/elapsed, native memory breakdown, legacy APK không giả availability; giữ guard cũ nếu API mới chưa có.
- useAdvisor.ts: await availability trước admission, generation check sau await; cancellation/late acknowledgement không được normalize/scan; mã camera timeout riêng, cache copy cleanup giữ nguyên. Không đổi algorithm hoặc scoring.
- AdvisorCamera.tsx: chỉ begin observer và memory checkpoint tại các event hiện có; không đổi flip logic hoặc capture options.
- MemoryDiagnostics.tsx + route: diagnostic-mode copy log trên màn lỗi cho preview APK. Không upload; clipboard có fixed scalar checkpoints và mã lỗi, không ảnh/URI/landmark/token/native message.
- errors.ts, scanDiagnostics.ts và tests: phân loại/trace handoff và cancellation.

Diagnostics mới: advisor_enter (đúng lúc vào Advisor, KHÔNG giả process startup), camera_mount (React mount event, KHÔNG giả before native open), camera_ready, capture_start/success, camera_unmount, camera_availability, frontend admission, preprocessing end, ML Kit start/end, scan_cleanup. Warm anchor được hiển thị khi đã thực sự measured; không tạo checkpoint warm giả trong scan bị từ chối. Actual process startup chưa được đo; dùng cold app restart + advisor_enter để so sánh có giới hạn đó.

pssKB là sample admission dùng quyết định; memoryInfoPssKB là sample phân rã lấy sau, có breakdownTimestampMs riêng, có thể lệch do thời gian. dalvikPssKB/nativePssKB/otherPssKB, graphicsKB, javaUsedKB/javaMaxKB/nativeAllocKB, memoryClassMiB/largeMemoryClassMiB, debuggable, counters SDK/close, camera availability counts/timestamps. Diagnostic-only, snapshot hữu hạn ở checkpoint, không polling heap hoặc continuous face detection.

Không đổi ScanSafety constants/formula, ML Kit/Face-Aware Engine V2, backend/DB, SDK, dependencies, permissions/plugins, package name/EAS/Google Play config. Không APK/AAB build, commit/push/merge/deploy. JUnit jar tải riêng vào D:/EXE/.verification để chạy tests; không thêm vào app.

## C. Verification

Kết quả cuối:
- PASS TypeScript --noEmit.
- PASS ESLint các file JS/TS thay đổi; không chạy sửa lint admin ngoài phạm vi.
- PASS full Advisor regression 29 suites / 241 tests. Sau thay đổi semantics handoff cuối, chạy lại useAdvisor + MemoryDiagnostics: 2 suites / 29 tests PASS.
- PASS JUnit 4.13.2: 13 Kotlin JVM tests (10 guard/resources + 3 availability state), gồm cả bốn PSS thật, biên 704 MiB, invalid sample/cold anchor và repeated availability.
- PASS compile native module cuối offline: :bbook-face-analysis:compileDebugKotlin, BUILD SUCCESSFUL (28s), không assemble APK/AAB.
- PASS git diff --check các tracked file sửa.
Không có test FAIL ở kết quả cuối. Các lần compile ban đầu thất bại vì SDK environment và cached dependency thiếu được xử lý; không đổi app dependency/version.
JVM logic tests không phải device tests. Observer Android đã compile riêng against android-36.jar; module compile chỉ target :bbook-face-analysis:compileDebugKotlin, không assemble APK/AAB. Lần đầu offline không có ANDROID_HOME; retry với SDK đi đến thiếu ML Kit artifact trong cache offline. Compile online tải dependency đã được khai báo sẵn, không thay version; đã thành công, kiểm tra cuối offline sau edits.

Remaining: chưa xác minh OS availability timeline/PSS reduction trên OPPO; chưa xác minh first scan đi qua guard hoặc native peak. Nếu PSS vẫn >704 MiB sau OS availability, guard vẫn từ chối. Đây không phải production-ready/crash-free certification. Camera callbacks toàn logical front/back có thể chịu ảnh hưởng camera dùng bởi process khác/OEM; không log ownership hoặc khẳng định CameraX CLOSED. Timeout sẽ cần log để phân biệt unknown/busy.

## D. Self-test without USB

Tự build/cài APK hiện tại vì bridge native mới cần binary scan-camera-memory-v4. Development dùng Metro cùng Wi-Fi; preview với diagnostic flag đã có dùng nút Sao chép log chẩn đoán trên màn lỗi, không cần Metro/USB.

1. Cold restart app, vào Advisor, chọn gallery trực tiếp nếu có đường chọn; hoặc mở camera -> Gallery -> Cancel (phải quay camera, không admission/scan).
2. Flip 5 lần và capture: giữ baseline cải thiện, không yêu cầu test thêm flash/oval.
3. Chụp lần đầu rồi ghi trace: camera_unmount, camera_availability/cameraAvailable=true, camera_availability_confirmed, admission_start, checkpoint. OS availability có thể xảy ra trước React unmount do pausePreview đã unbind; đó là thứ tự thật, không sửa timestamp.
4. Nếu gallery chưa từng dùng camera: camera_availability_not_required; đây không phải availability measurement. APK legacy: camera_availability_legacy, cần binary mới để có signal. Không coi hai nhãn này là native acknowledgement.
5. Nếu memory từ chối: bấm Sao chép log chẩn đoán rồi gửi text vào chat. Gửi cả session/memoryInfo breakdown, camera counts/timestamps, debuggable, sdkProcessCalls/inferenceStarted, không chỉ PSS.
6. Khi có scan thành công: test 1/2/5/10 lượt xen kẽ camera/gallery, cancel/retry/background/foreground; kiểm tra warmed baseline chỉ sau pipeline thành công và resource counters không lệch. Không yêu cầu số liệu ML Kit nếu guard chưa cho chạy.
7. Nếu có điều kiện, tự so sánh development và advisor-preview trên cùng điện thoại bằng cùng ảnh/flow; đây là đo debug overhead, không phải đổi profile để che lỗi hoặc nới guard.

Development Metro:

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
$env:BBOOK_ADVISOR_ENABLED='1'
$env:BBOOK_ADVISOR_CLOUD_ENABLED='0'
$env:BBOOK_ADVISOR_DIAGNOSTICS='1'
$env:EAS_BUILD_PROFILE='advisor-development'
npx expo start --dev-client --clear --lan
```

Nguồn API để diễn giải metrics: Android Debug.MemoryInfo https://developer.android.com/reference/android/os/Debug.MemoryInfo ; CameraManager.AvailabilityCallback https://developer.android.com/reference/android/hardware/camera2/CameraManager.AvailabilityCallback . Camera/picker behavior dựa mã SDK thực tế đang cài, không thay dependency.
