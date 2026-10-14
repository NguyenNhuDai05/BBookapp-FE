# Mobile hợp nhất — hướng dẫn build sau nghiệm thu

Nguồn build chính: `D:/EXE/bbeauty-app`, branch `integration/unified-mobile-tester`. Giữ Phase 2 tags và toàn bộ nghiệp vụ hiện có, thêm native Advisor/engine 20 và ScanSafety growth 256 MiB, ceiling 768 MiB, reserve 64 MiB từ candidate đã backup. Không quay về engine 12, không đổi thuật toán hoặc tăng budget thêm trong lần hợp nhất.

## Profiles

| Profile | Package | Binary | Gate |
|---|---|---|---|
| unified-qa | com.bbook.app.qa | Standalone APK | Native ON, cloud OFF, QA-only, diagnostics ON, push/Firebase cô lập |
| tester-apk | com.bbook.app | Standalone APK | Explicit tester approval + device acceptance |
| tester-aab | com.bbook.app | AAB cho Play tester | Cùng gate, signing/versionCode/16 KB/track checks thêm |
| production | com.bbook.app | AAB | Engine20 rollout vẫn bị chặn; không mở production bằng tester approval |
| ai-test | com.bbook.app.aitest | Standalone APK | Giữ luồng AI upload riêng; không bật native Advisor trong variant này |

Gemini cloud OFF mặc định. Face-aware experimental vẫn chỉ QA/local theo gate có sẵn; không tự bật cho closed-test/production chỉ vì sao chép source. Tester profiles không có diagnostics. EAS project, Firebase và identity Play của main được giữ; QA riêng không phải bản cập nhật Play.

## APK QA bạn build để thử thiết bị

Sau khi source checks được báo đạt:

```powershell
Set-Location D:\EXE\bbeauty-app
npx eas-cli build --platform android --profile unified-qa
```

Không cần Metro. Package QA cài song song với BBook; push registration bị tắt. QA vẫn có các core flows/tag và Advisor local; API URL phải trỏ backend đã xác minh. Không bật cloud/data/provider flags khi chưa có quyết định riêng. Không dùng các lệnh advisor-preview trong tài liệu lịch sử để vượt guard engine20.

Thử first scan, camera/gallery, cancel/background-resume, six scans liên tiếp trên máy RAM thấp/phổ biến, error recovery, tag/profile/service/409/retry và core flows. Unit/synthetic tests không chứng minh memory behavior trên điện thoại. Ghi log memory không kèm selfie hoặc thông tin tài khoản. Không hứa mọi thiết bị qua sáu scan khi OS đang thiếu memory.

## APK/AAB cập nhật tester

Các profile tester chủ động fail khi thiếu:

```powershell
$env:BBOOK_ADVISOR_TESTER_APPROVED='1'
$env:BBOOK_ADVISOR_DEVICE_ACCEPTANCE='approved'
```

Đây là xác nhận sau khi nghiệm thu thiết bị và quyết định release engine20 cho tester, không phải hướng dẫn bật ngay để bỏ qua kiểm tra. Với EAS cloud, phải cung cấp tương ứng trong EAS environment của build; không giả định biến shell tự được truyền tới remote worker. Không đặt Gemini/API secret vào biến EXPO_PUBLIC hoặc app config.

Kiểm package com.bbook.app, EAS project và signing/certificate hiện có. Kiểm highest versionCode trên Play và EAS remote counter trước autoIncrement, không đoán từ local config. APK ký bằng upload key có thể không đè được app Play ký bằng Play App Signing; dùng QA song song hoặc AAB qua đúng Play track, không yêu cầu tester gỡ app để né signing mismatch.

Sau khi các gate và BE/mapping đã được review:

```powershell
npx eas-cli build --platform android --profile tester-apk
npx eas-cli build --platform android --profile tester-aab
```

APK cài trực tiếp; AAB upload vào track tester BBook đang có. Không auto-submit/rollout. Kiểm artifact ELF/ZIP 16 KB, native module, manifest/permissions, debug/cloud flags, asset bundle và device 16 KB phù hợp. `updates.enabled=false`; native module/memory mới cần binary mới, không OTA.

## Những việc không được coi là đã nghiệm thu

- Deployment/migration/capabilities Render và mapping với StyleId thực; mapping mặc định rỗng sẽ dùng fallback weak.
- APK/AAB thật, signing/versionCode Play, update từ bản tester cũ, scan sáu lần trên điện thoại và kiểm ELF/ZIP/runtime 16 KB.
- Real Gemini/provider data/billing; admin mapping/tag Phase 4.
- Catalog20 hiện còn các slot ảnh placeholder từ candidate; không giả vờ có đủ ảnh makeup licensed. Placeholder không dùng selfie khách hàng.

Các fixture timer OTP và async marketplace được chỉnh để kiểm soát clock/chờ đủ query; không sửa logic ngân hàng. Historical protected-hash manifest giữ nguyên. `docs/advisor/INTEGRATION-PROTECTED-HASHES.json` pin 38 file native/engine/library/measurement hiện tại của candidate đã backup; EAS/Notification integration có functional config/push tests riêng.

Kết quả test cuối và inventory được bổ sung trong báo cáo bàn giao; không tính test fail/recovery/skip là pass.
