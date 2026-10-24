# Android AAB — build thủ công trên GitHub

Workflow: `.github/workflows/android-aab.yml`, tên **Android AAB (manual only)**.
Chỉ build và cung cấp artifact, không upload/xuất bản lên Google Play.

## Giống bản APK ở điểm nào?

- Đọc profile `tester-aab` hiện có; bắt buộc `env` bằng `tester-apk`.
- So sánh toàn bộ Expo config resolved của hai profile, không chỉ một vài cờ.
- Giữ `com.bbook.app`, Firebase, API trong eas.json, ML Kit, measurement ranking,
  push, cloud tắt, diagnostics tắt và JS/assets nhúng giống APK.
- Giữ Node 22.22.3, Java 17, Android SDK/build tools 36, NDK 27.1.12297006.
- Dùng ABI universal như tùy chọn universal của APK; Play chia APK theo thiết bị.
- Khác phần đóng gói: `bundleRelease` + JAR signing bằng upload key, thay vì
  `assembleRelease` + zipalign/apksigner. Không thể đổi đuôi APK để thành AAB.
- Không dùng Expo EAS Build, Expo token, Google service-account hay quota EAS.
- Không thêm Virtual Lipstick hay thay đổi code chức năng trong phần CI này.

Build thành công và config giống nhau chưa chứng minh mọi chức năng ổn định trên
điện thoại. Backend, tài khoản, PayOS webhook, Firebase/FCM là trạng thái bên ngoài.
Phải cài qua Play testing và nghiệm thu trước khi ra mắt công khai.

## Việc cần làm trên GitHub

1. Đưa các file CI sau vào `main`, giữ các thay đổi Virtual Lipstick ngoài commit:
   - `.github/workflows/android-aab.yml`
   - `scripts/ci/release-aab-config.cjs`
   - `scripts/ci/release-aab.test.cjs`
   - `scripts/ci/prepare-apk.cjs` (chỉ hunk chấp nhận profile AAB ở chế độ AAB)
   - `docs/github-actions-aab.md`
   Những thay đổi APK/ranking đã tồn tại trước task không được gom lại vô tình.
2. Repo → Settings → Secrets and variables → Actions. Dùng lại 5 repository secrets
   của APK: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
   `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `ANDROID_SIGNING_CERT_SHA256`.
   Không gửi giá trị secrets vào chat, không tạo khóa mới.
3. Play Console → tính toàn vẹn ứng dụng (App integrity) → **Upload key certificate**.
   Copy SHA-256 của khóa tải lên. Đừng copy App signing key certificate nếu khác.
   Workflow sẽ từ chối nếu khóa ký trong GitHub không khớp fingerprint này.
4. Kiểm tra versionCode cao nhất đã tải lên **mọi kênh** trong Play App Bundle
   Explorer, chọn số lớn hơn. Workflow không truy cập Play hay cập nhật EAS counter.
5. Cài APK đã kiểm thử đúng commit/cấu hình tính năng mục tiêu; thử đăng nhập,
   đặt lịch, cọc/đối soát thanh toán, chat, thông báo, quyền camera/thư viện và quét mặt.

## Chạy build

GitHub → Actions → **Android AAB (manual only)** → Run workflow:

- Branch: `main` sau khi các file CI đã có trên nhánh.
- `device_acceptance_confirmed`: tick khi đã thực sự kiểm thử APK. Mặc định tắt.
- `acceptance_reference`: URL lần build APK hoặc ID bản build, thiết bị và kết quả
  kiểm thử. Không điền mật khẩu/thông tin cá nhân. Đây là khai báo của người chạy,
  không phải chứng nhận tự động. Nếu code ứng dụng thay đổi sau lần test phải test lại.
- `version_code`: số mới lớn hơn tất cả versionCode trên Play.
- `play_upload_sha256`: SHA-256 Upload key certificate vừa copy từ Play Console.

Workflow tái kiểm tra policy/ranking/config, prebuild Android, build bundle, ký và
kiểm tra chữ ký/SHA-256, JS bundle và đủ native ABI. Chỉ upload artifact khi các
kiểm tra đạt. Khóa ký nằm tạm trên runner và được xóa kể cả khi lỗi.

## Lấy AAB và upload

1. Mở lần chạy có dấu xanh → Artifacts → tải `BBook-AAB-<run number>`.
2. Giải nén, lấy **BBook-release.aab**. Không upload ZIP artifact hay APK lên ô AAB.
3. Artifact có build-info, commit, versionCode, public config, fingerprint và
   provenance. Không chứa keystore/password. Lưu ngoài GitHub trước khi hết 7 ngày.
4. Nên upload cùng AAB này vào Internal testing, cài qua Play, kiểm tra luồng chính
   và AI. Sau đó dùng **Thêm từ thư viện** hoặc promote cùng bản sang Production;
   không rebuild một file khác nếu chưa kiểm thử file đó.
5. Điền tên bản phát hành/ghi chú, kiểm tra các lỗi Play và tự gửi xét duyệt.
   Workflow không thực hiện bước này.

## Kiểm chứng local

`node --test scripts/ci/release-policy.test.cjs scripts/ci/release-aab.test.cjs`

Các giá trị acceptance trong unit tests là fixture, không ghi vào môi trường build
thật. Chưa chạy GitHub Actions, ký AAB thực tế hay kiểm thử APK do Play tạo trong
task chuẩn bị workflow này. Vì vậy chưa tuyên bố artifact thực tế đã chạy ổn định.

Kết quả local ngày 22/10/2026: 16/16 tests policy/CI và 20/20 tests ranking/integration
đạt; YAML parse, Bash `-n` và JavaScript syntax checks đạt. APK workflow cũ giữ
nguyên; chỉ mở rộng validator dùng chung để nhận profile AAB khi job chỉ định rõ.
