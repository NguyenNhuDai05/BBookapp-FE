# BBook — Unified Mobile: bàn giao triển khai local

Ngày: 2026-10-15.

## Kết quả

Đã tích hợp Unified Makeup Styles và Makeup Advisor vào beauty-app chính, giữ các luồng AI hiện có. Onboarding, hồ sơ MUA và dịch vụ dùng chung danh mục phong cách; thay đổi làm mới cache Advisor. Picker giữ được tag lịch sử có tên NULL.

Advisor kết nối marketplace qua mapping được duyệt giữa styleKey và StyleIds. Backend ưu tiên phong cách dịch vụ, sau đó chuyên môn MUA khi dịch vụ chưa có phong cách. Mapping mặc định rỗng; chưa ánh xạ thì dùng gợi ý từ khóa với mức khớp yếu. Không tự suy đoán ID từ tên tag.

Cấu hình mobile có unified-qa cô lập và tester-apk/tester-aab có điều kiện nghiệm thu thiết bị. Gemini/cloud tắt mặc định. Engine và native đã được kiểm tra bằng manifest 38 file giữ nguyên. Face-aware thử nghiệm vẫn giới hạn ở QA/local.

Nhánh local: mobile `integration/unified-mobile-tester`; backend `integration/unified-mobile-backend`. Chưa commit, push, deploy hoặc build APK/AAB trong lượt triển khai này. Chưa merge/rebase backend integration lên origin/main mới; cần kiểm tra diff upstream trước khi đưa nhánh này lên remote.

## Kiểm chứng cuối cùng

| Kiểm tra | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| Mobile, 110 suites | 775 | 0 | 0 |
| Backend toàn bộ | 671 | 0 | 0 |
| PostgreSQL integration, nằm trong 671 | 117 | 0 | 0 |
| Native Kotlin | 23 | 0 | 0 |

TypeScript pass; lint toàn bộ không có lỗi, còn 5 cảnh báo có sẵn; lint các file kiểm tra cuối không có lỗi/cảnh báo. Clean npm install offline và Expo prebuild trong bản sao cô lập pass. Native compileReleaseKotlin và testDebugUnitTest pass. EF báo không có thay đổi model so với migration cuối. Database PostgreSQL test localhost cô lập đã dừng sau nghiệm thu.

Các lượt chạy trước có lỗi fixture, cấu hình và tài nguyên PostgreSQL không được tính là pass; số trên lấy từ lượt hoàn tất cuối cùng.

## Bằng chứng và source

Thư mục: `D:\EXE\artifacts\unified-mobile-integration-20261014`.

- `delivery-results.json`: tổng hợp kết quả.
- `mobile-delivery.json`, `mobile-delivery.log`: mobile cuối cùng.
- `backend-delivery/backend-delivery.trx`, `backend-delivery.log`: backend cuối cùng.
- `native-tests.log`, `typescript-final.log`, `lint.log`, `lint-delivery.log`: native và static checks.
- `model-check-final.log`, `expo-cli-config-matrix.json`: model và cấu hình Expo thực tế.
- `source-before.json`, các ZIP source-before: snapshot trước triển khai, loại trừ secrets.
- `source-changes.json`: đối chiếu thay đổi 207 file FE và 23 file BE trước khi thêm báo cáo bàn giao này; bao gồm source được chuyển và tài liệu.

Bản clean install/prebuild: `D:\EXE\artifacts\unified-mobile-clean-20261014`. Không tạo Android build artifact trong source chính.

## Điều kiện còn lại trước phát hành tester

1. Chạy QA trên điện thoại thật: 5–6 lượt scan liên tục, ảnh lớn, quay lại màn hình, background/foreground và toàn bộ luồng onboarding/hồ sơ/dịch vụ. Unit test native chưa chứng minh độ ổn định trên từng thiết bị.
2. Xác minh backend Render thực tế đã có contract tương ứng; cấu hình mapping bằng StyleIds thật được duyệt. Chưa truy cập production Supabase hoặc cấu hình mapping production.
3. Kiểm tra signing cùng ứng dụng Play cũ, application ID, versionCode, EAS environment và yêu cầu native 16 KB trên artifact release thực tế. Chưa build nên chưa kiểm chứng các điều kiện này.
4. 20 vị trí ảnh phong cách hiện vẫn là placeholder; cần tài sản ảnh có quyền sử dụng nếu muốn bộ minh họa đầy đủ.
5. Chỉ bật cờ nghiệm thu tester sau khi kiểm tra thiết bị đạt. Cloud/Gemini cần nghiệm thu riêng trước khi bật; quản trị tags Phase 4 chưa thuộc lượt này.

Source đã qua kiểm tra local và sẵn sàng cho bước build QA khi được yêu cầu. Chưa đủ bằng chứng để tuyên bố bản release đã nghiệm thu trên thiết bị.

Hướng dẫn profile và build tiếp theo: `docs/UNIFIED-MOBILE-BUILD-READINESS-20261014.md`. Contract và cấu hình backend: `D:\EXE\BeautyBook\docs\UNIFIED-MOBILE-BACKEND-20261014.md`.
