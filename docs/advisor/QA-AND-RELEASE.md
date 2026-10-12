# Nghiệm thu APK nội bộ và điều kiện phát hành

## Cài bản preview an toàn

Package giữ `com.bbook.app`. APK local dùng debug certificate của môi trường build; khác certificate Play có thể gây INSTALL_FAILED_UPDATE_INCOMPATIBLE. Bản APK bàn giao ARM64: dùng máy Android ARM64 riêng chưa cài alpha. Emulator chỉ dùng nếu ABI/native bridge tương thích; emulator x86_64 thuần cần build riêng cho ABI đó. Không gỡ alpha để cài đè. Work profile không giải quyết xung đột certificate toàn thiết bị. Không tự thay Firebase/package/scheme để né lỗi.

```powershell
$adb = 'C:\Users\Acer\AppData\Local\Android\Sdk\platform-tools\adb.exe'
& $adb devices -l
# Thay serial bằng thiết bị riêng/emulator đã xác nhận; không chọn máy alpha.
$serial = 'SERIAL_MAY_TEST'
& $adb -s $serial install 'D:\EXE\bbeauty-app-mlkit-advisor\.expo\artifacts\bbook-advisor-preview.apk'
```

APK preview tự chứa JS, không cần Metro. Đăng nhập tài khoản tester có quyền dùng BBook hiện có → Khám phá → Makeup Advisor. Inference offline; marketplace cần Internet. Không tạo booking/chat Production trong QA tự động; chỉ điều hướng đến flow booking, kiểm tra submit ở môi trường/tài khoản được chủ dự án cho phép.

## Test đầu tiên và guard

Fresh process trên máy riêng → mở Advisor → chưa chọn ảnh → lấy baseline. Dùng JPEG720×960 có quyền sử dụng. Chọn đúng một lần, kiểm tra ảnh hiển thị/orientation rồi phân tích một lượt; nghỉ60s, xóa ảnh, kiểm tra PSS. Không tự loop. Nếu bất kỳ sampled stage/ADB đạt768MiB hoặc tăng128MiB so baseline, PID đổi/lag/ANR/crash: dừng, không thêm lượt dù RAM giảm. Chỉ cân nhắc lượt2 khi mọi stage pass và còn≥64MiB headroom; không có lượt3.

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
$baseline = .\docs\advisor\Check-AdvisorMemory.ps1 -Serial $serial -Label before_photo
# Tự chọn ảnh, rồi snapshot; không có lệnh inference tự động.
.\docs\advisor\Check-AdvisorMemory.ps1 -Serial $serial -Label after_photo -BaselinePssKB $baseline.PssKB -ExpectedPid $baseline.Pid
# Tự phân tích 1 lượt; snapshot sau và idle60s.
.\docs\advisor\Check-AdvisorMemory.ps1 -Serial $serial -Label after_scan1 -BaselinePssKB $baseline.PssKB -ExpectedPid $baseline.Pid
.\docs\advisor\Export-AdvisorMemory.ps1 -Serial $serial
```

Chỉ gửi scalar JSONL/snapshot, model máy/Android/page size, trạng thái PASS/FAIL; không cần selfie/URI/landmarks. Instrumentation fixed tag chỉ chứa scalar, không xuất full logcat. UI không hiển thị RAM/ratios/debugging. PSS sample không đo được peak tuyệt đối hoặc chứng minh hết retention.

## Matrix bắt buộc (candidate đều NOT TESTED cho đến khi tester xác nhận)

| Nhóm | Thiết bị cần ghi nhận | Bài test |
| --- | --- | --- |
| OPPO/Vivo/realme | Model, RAM, Android, page size | Picker/camera/mirror/1→2 lượt/idle |
| Samsung | Một máy OneUI phổ biến | Permission, EXIF, background/resume |
| Xiaomi/Redmi | Một máy HyperOS/MIUI | Kill/background/camera OEM |
| Pixel/stock | Máy thật hoặc emulator | APK boot, native presence, flow result |
| RAM thấp/Android cũ | Thiết bị minSDK24 được hỗ trợ | Guard/error fallback/crash |
| Android16KB | Môi trường page16384 | Load mọi ABI cần phát hành, native inference |

Mục tiêu tối thiểu3 nhóm hãng thực tế trước mở rộng alpha. Không tuyên bố PASS hãng chỉ từ compilation.

- Consent OFF: không picker/scan; đổi ảnh/tắt consent/reset/rời màn hình bỏ state và ảnh sở hữu.
- JPEG/PNG/WebP tĩnh, ảnh lớn/không hỗ trợ/hỏng; EXIF0/90/180/270 và mirror, camera trước; không lật hai lần.
- Một mặt/không mặt/nhiều mặt/trùng false positive/mặt nhỏ/nghiêng/cropped/thiếu contours: không vượt hard gates bằng checkbox. Giữ từ chối ảnh không rõ ràng, không tự gộp detection.
- Geometry cùng file10 lần chỉ trong test harness an toàn được duyệt, không bypass candidate budget để loop. Hiện chưa có benchmark ổn định thực nghiệm; mouth không rank.
- API offline/empty/error/retry; style rename/missing không fuzzy; IDs thật; phân biệt MUA style/service tag; không bịa lịch trống/giá.
- MUA detail/portfolio/services → chọn dịch vụ → booking screen với params thật; không auto submit.
- Auth, Customer/MUA tabs, notification/push, chat, GPS/admin regression bằng kế hoạch baseline, không sửa các chức năng này.
- Network: selfie/geometry/contours không rời thiết bị. Kiểm tra riêng telemetry SDK theo [ML Kit terms](https://developers.google.com/ml-kit/terms).

## GO/NO-GO Closed Testing

Hiện GO cho nghiệm thu APK nội bộ có guard; NO-GO upload alpha. Cần: QA nhiều máy, memory repeat/idle chấp nhận, orientation/lifecycle/privacy cleanup, UX feedback/MUA review heuristic, marketplace thực tế và booking regression, full release build signing đúng, ABI so với alpha, static+runtime16KB. Kiểm tra LOAD alignment/zipalign và RELRO end theo [hướng dẫn Android hiện hành](https://developer.android.com/guide/practices/page-sizes). Phép phân tích layout RELRO cũ chỉ giữ làm diagnostics, không thay thế tiêu chí alignment chính thức hoặc chứng minh runtime PASS.

Chủ dự án duyệt Privacy Policy/Data Safety cho cả app/SDK (on-device inputs không tự đồng nghĩa app không thu dữ liệu), bản Play signing và track alpha; versionCode>4. [Google Play Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469). Không upload/publish tự động. Production feature flag chỉ bật trong một thay đổi được phê duyệt sau QA; hiện production default OFF. Phương án này không cần migration hoặc thay backend. Nếu yêu cầu remote kill switch backend, phải xin phạm vi riêng.

Rollback local: dùng baseline/worktree cũ; không reset dirty tree. Candidate không ảnh hưởng alpha đang cài. Sau phát hành tương lai, rollback ứng dụng Play cần build sửa với versionCode cao hơn và signing đúng, không hạ versionCode; tắt server AI không điều khiển local compile-time flag hiện tại.
