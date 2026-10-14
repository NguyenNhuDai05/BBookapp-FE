# Phase 1 — ML Kit scan recovery, 13/10/2026

## Phạm vi và trạng thái

Triển khai trên working tree `candidate/mlkit-advisor`, HEAD `a037eadc0207379312bee87313c380ae14428a65`. Giữ các thay đổi Advisor đã có; không reset/clean/stash/chuyển branch. Backup các file liên quan trước Phase 1 ở `D:\EXE\artifacts\advisor-phase1-before-20261013`; không backup secrets. Source APK đang cài chưa xác minh bằng hash/version, nên không khẳng định nó giống working tree.

Không build APK/AAB, EAS, Gradle hoặc prebuild; không commit/push/deploy; không sửa hai backend, DB, migrations, dependency versions, contract v3 hoặc privacy approval flags. Backend consolidation chưa thực hiện.

**READY FOR DEVICE TEST ở mức source/static**, không Production Ready. Native compilation, JVM unit tests và runtime ML Kit vẫn NOT RUN theo giới hạn của người dùng. Các ngưỡng bộ nhớ provisional; chưa có budget được hiệu chuẩn trên điện thoại.

## Lỗi logic đã sửa

- Bỏ latch `memoryStopped` và tác dụng phụ của `mark()`. Peak telemetry không thay đổi admission.
- Không dùng số lượt/counter làm điều kiện safety. First/later requests dùng cùng reserve; counter chỉ dùng quan sát.
- Cold PSS chỉ là số liệu chẩn đoán. Growth anchor được lấy một lần sau successful full pipeline và resource close, không lấy trước model initialization và không tăng theo mỗi lượt. No-face/skipped/failed cold mesh không thiết lập full-pipeline anchor.
- Admission kiểm tra lại current system pressure/budget mỗi lần; reset UI không thể approve hoặc mở khóa native.
- Thay hai cờ check-then-CAS bằng một lease atomic chung cho normalize và analyze.
- Terminal winner duy nhất tạo output, cleanup và settle promise. SDK tasks được xử lý bằng complete listeners; cancellation chặn stage tiếp theo, không recycle image khi task đang chạy.
- Resource closers độc lập, reverse ownership order: một close failure không ngăn closers còn lại/bitmap. Cleanup không chắc chắn được quarantine bằng `cleanup_incomplete`; không cho request mới. Đây là lỗi internal cần điều tra, không phải transient pressure hay session quota.
- Hook giữ kết quả/summary/ảnh hợp lệ trước đó nếu ảnh mới lỗi; candidate image được xóa khi thất bại. Explicit Xóa ảnh/blur/unmount vẫn clear và invalidate.
- Thử ảnh khác không còn tự xóa kết quả trước khi chọn ảnh mới. Retry Gemini chỉ dùng completed summary, không gọi picker/normalizer/analyze/admission.

## Policy provisional và safety

Giữ absolute PSS ceiling 768 MiB và growth allowance 128 MiB. Reserve 64 MiB áp dụng nhất quán cho admission, gồm system available memory trên threshold của Android; không có cap 1/2/10 lượt. Trong stage checkpoints kiểm tra current pressure/limit với reserve 0 vì request đã sở hữu resources. Mesh optional chỉ bắt đầu khi còn reserve; nếu thiếu budget có thể trả contours thật, nhưng system pressure vẫn bị từ chối.

Các giá trị này kế thừa PoC, **không phải chứng nhận an toàn hoặc hiệu năng**. Sửa cold/warm lifecycle không có nghĩa đã tìm được nguyên nhân memory growth. Growth anchor sau close vẫn là post-cleanup sample, không chứng minh SDK đã unload/cache đã ổn định. Log 5 giây chỉ quan sát và phân biệt idle với request khác đang busy; không sửa anchor hay safety.

Admission reasons: allowed, busy, system_pressure, insufficient_budget, cleanup_incomplete, unavailable. Cancellation có E_SCAN_CANCELLED riêng. Internal init/detection failures có mã riêng. System pressure hoặc insufficient budget chỉ recovery khi sample hiện tại và lease/cleanup đáp ứng điều kiện; không restart/ép GC/bypass guard.

Một analysis request có count + contours và tối đa mesh: 2–3 SDK process calls theo thiết kế, không phải 2–3 analysis requests. Logger ghi cumulative SDK invocation count riêng để phân biệt.

Lease được release sau closers chạy xong; close failures vẫn release busy để terminal không treo, nhưng cleanup quarantine từ chối admission. Không tự reset quarantine khi người dùng đổi ảnh hoặc retry. Nếu SDK task không terminal thì không unlock bằng UI timeout; giữ ownership để tránh recycle sớm. SDK hang và cleanup failure recovery vẫn cần device validation.

## File/function thay đổi trong Phase 1

| File | Function/component | Nội dung |
|---|---|---|
| modules/bbook-face-analysis/android/src/main/java/expo/modules/bbookfaceanalysis/ScanSafety.kt | ScanMemoryGuard, ScanLease, ScanTerminal, ScanResources | Pure Kotlin admission, single-flight, terminal ownership và cleanup độc lập |
| BBookFaceAnalysisModule.kt cùng thư mục | admissionDecision, normalizeBounded, analyze, complete, checkpoint, mark | Bridge reasons, task completion/cancellation, counters và diagnostic-only logging |
| BoundedNormalizer.kt cùng thư mục | normalize finally | Cleanup mọi bitmap dù một release lỗi; orphan output cleanup |
| features/makeupAdvisor/faceAnalysis.ts | ensureScanAdmission | V2 reason mapping; legacy bridge fail closed |
| features/makeupAdvisor/useAdvisor.ts | pick, run, scan, retryCloud, restore, reset | Single-flight JS, giữ completed scan, reject stale output và summary-only retry |
| features/makeupAdvisor/errors.ts | advisorFailure, advisorErrorKind | Recoverable/pressure/unavailable messages; log whitelist diagnostic-only |
| features/makeupAdvisor/AdvisorResults.tsx | AdvisorResults | Tách Thử ảnh khác và Xóa ảnh |
| app/makeup-advisor.tsx | MakeupAdvisor | Cloud retry đúng callback, error/loading bên cạnh kết quả cũ |
| app.config.ts, plugins/withAdvisor.js, eas.json | diagnostic flag/manifest | Diagnostic chỉ local/dev/manual preview; preview explicit opt-in; production/closed off |
| scripts/Check-HybridAdvisorConfig.cjs | config checks | Kiểm tra diagnostic mới, giữ cloud/privacy OFF |
| docs/advisor/Export-AdvisorMemory.ps1 | whitelist export | Export reason/terminal/counters/system samples, không raw logs |
| docs/advisor/Capture-ScanMemory.ps1 | one snapshot | Chụp meminfo/PID/PSS; không policy verdict, inference, GC hoặc restart |
| BoundedNormalizerDeviceTest.kt trong android/src/androidTest/... | Device tests (NOT RUN) | Giữ assertions ngoài callback telemetry, thêm telemetry failure không block |
| ScanSafetyTest.kt trong android/src/test/... | 7 JVM tests | Cold/warm/10 admission, peak recovery, pressure, reserve, cleanup, lease/terminal |
| Advisor Jest tests | useAdvisor/screen/buildFlag/nativeConfig + scanAdmission/cloudDisabled mới | Sequential scans, double tap, preservation, cancellation, cloud OFF/retry, flags |

## Kiểm thử đã chạy

- `node node_modules/typescript/bin/tsc --noEmit`: PASS.
- ESLint các file TS/TSX/JS sửa: PASS, 0 errors/warnings ở lượt targeted. Lint rộng Advisor có warnings có sẵn; không sửa các file ngoài Phase 1 để dọn chúng.
- `node node_modules/jest/bin/jest.js --runInBand --cacheDirectory=.expo/phase1-jest-cache --silent features/makeupAdvisor/__tests__`: Lượt cuối: 162 PASS / 16 suites, gồm test EAS diagnostic default và picker background handoff.
- Initial admission-test mock thiếu Expo core API: FAIL trong lượt đầu; đã sửa mock và admission/nativeConfig tests PASS, rồi bộ Advisor PASS.
- `node scripts/Check-HybridAdvisorConfig.cjs D:/EXE/artifacts/advisor-phase1-20261013`: PASS bốn profiles; package/EAS project giữ nguyên; cloud và data approval OFF; diagnostic chỉ preview; release nonce absent.
- PowerShell AST parse hai scripts: PASS. Không kết nối ADB để chạy scripts.
- `git diff --check`: PASS.
- Native JUnit/compile/Android runtime/16 KB/new APK: NOT RUN. Không gán kết quả Jest cho Kotlin guard tests.

Jest cover 10 sequential admitted requests, failed candidate giữ completed result, persistent pressure không bị reset bypass, recovery khi native mock approve, double tap, cancel giữ JS gate tới completion, stale provider suppression, camera/gallery background handoff không hủy acquisition, cloud-only retry không inference, và cloud OFF không HTTP. Kotlin tests kiểm tra policy/resource ownership thật nhưng chưa chạy.

## Người dùng tự build và cài

Không cần backend/Gemini để nghiệm thu Phase 1. `advisor-preview` hiện cloud OFF và diagnostic ON; closed-test/production diagnostic OFF. Không sửa approval flags.

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
npx eas-cli@latest build --platform android --profile advisor-preview
```

Sau khi tải APK mới về, tự chọn đúng file/device:

```powershell
$adb = 'C:\Users\Acer\AppData\Local\Android\Sdk\platform-tools\adb.exe'
& $adb devices -l
$serial = 'SERIAL_THAT'
$apk = 'DUONG_DAN_APK_MOI.apk'
Get-FileHash -LiteralPath $apk -Algorithm SHA256
& $adb -s $serial install -r $apk
& $adb -s $serial shell dumpsys package com.bbook.app |
  Select-String 'versionCode|versionName|lastUpdateTime'
& $adb -s $serial shell getconf PAGE_SIZE
```

Nếu install báo signature/version mismatch, dừng và xác minh signing/version; không tự uninstall hoặc dùng downgrade để vượt lỗi. Cùng package với bản closed test, nên đây là update app hiện có trên thiết bị đó.

Nếu muốn chạy Kotlin unit tests, sau khi bạn tự có thư mục android được tạo bởi workflow native của mình:

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor\android
.\gradlew.bat :bbook-face-analysis:testDebugUnitTest --tests 'expo.modules.bbookfaceanalysis.ScanSafetyTest'
```

Lệnh này compile native tests; Codex không chạy. Không gọi Build-Native.cmd/Build-Preview.cmd trong nhiệm vụ này.

## Snapshot ở lượt 1/2/5/10

Mở Advisor trên APK mới. Tự thao tác từng lượt; chờ result/terminal cleanup rồi tiếp tục. Dùng Thử ảnh khác, không Xóa ảnh nếu đang kiểm tra preservation. Không tự restart/ép GC giữa chuỗi. Chụp baseline trước lượt đầu:

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
.\docs\advisor\Capture-ScanMemory.ps1 -Serial $serial -Label baseline
```

Sau từng mốc, chạy lệnh tương ứng (không chạy cả bốn khi chưa thao tác):

```powershell
.\docs\advisor\Capture-ScanMemory.ps1 -Serial $serial -Label scan1
.\docs\advisor\Capture-ScanMemory.ps1 -Serial $serial -Label scan2
.\docs\advisor\Capture-ScanMemory.ps1 -Serial $serial -Label scan5
.\docs\advisor\Capture-ScanMemory.ps1 -Serial $serial -Label scan10
```

Sau mốc 1 và 10, lấy thêm snapshot idle sau 5 và 30 giây bằng label `scan1_idle5`, `scan1_idle30`, `scan10_idle5`, `scan10_idle30`. Quan sát thời gian thực, không cần script sleep/loop.

Nếu bị chặn, không cố lặp 10 lần: chụp `blocked`, export scalar logs để xem reason. Khi system pressure đã hết, thử lại thủ công; không reset guard.

```powershell
.\docs\advisor\Capture-ScanMemory.ps1 -Serial $serial -Label blocked
.\docs\advisor\Export-AdvisorMemory.ps1 -Serial $serial
& $adb -s $serial logcat -d -v brief 'ReactNativeJS:W' '*:S' |
  Select-String 'BBookAdvisorFailure'
```

Files nằm `.expo/profiling`. Gửi scalar JSONL và snapshot meminfo/PID của cùng process; không gửi ảnh, URI, geometry, full logcat, token hoặc key. Script Check-AdvisorMemory.ps1 cũ dùng cold-baseline PoC policy; không dùng Stop/PASS của script đó để đánh giá Phase 1.

## Acceptance còn lại

- Đúng APK mới, version/hash và cùng PID; 1/2/5/10 scans, same image, large/no-face/damaged image, camera/library.
- Native start/end cân bằng, resource close/cleanup reason; không duplicate independent analysis. Cancel/background/blur giữ lock tới actual task completion, không stale UI.
- Warmed idle PSS/native heap cần plateau trong các chu kỳ; đo cold/peak/idle riêng. Nếu tăng đều, tiếp tục profiler để phân biệt SDK cache, allocator retention, GC delay và leak.
- Pressure persistent phải reject; pressure cleared/budget đủ mới recovery. Cleanup failure fail closed, cần điều tra native exception class không chứa URI/raw message.
- Retry cloud không native inference; flags OFF không HTTP. Real-data Gemini vẫn chưa approved và không bật trong Phase 1.
- Các vấn đề 16 KB của artifact cũ chưa được giải quyết bởi task memory guard. Kiểm tra static artifact mới và thiết bị 16 KB trước closed testing; không Production Ready.
- Backend consolidation chỉ làm nhiệm vụ riêng sau device acceptance, trên production baseline đã xác minh.

Nguồn tham khảo: [ML Kit FaceDetector lifecycle](https://developers.google.com/android/reference/com/google/mlkit/vision/face/FaceDetector), [Android memory](https://developer.android.com/topic/performance/memory), [Android 16 KB](https://developer.android.com/guide/practices/page-sizes). Source checks không thay thế profiling hoặc native runtime tests.
