# Advisor QA trên worktree — người dùng tự build Expo

Ngày 14/10/2026. Frontend D:/EXE/bbeauty-app-mlkit-advisor; backend candidate D:/EXE/BeautyBook-advisor-integration-20261013. Người dùng tự khởi chạy build. Agent không build APK/AAB, không commit/push/merge/deploy hoặc thay database; hai repository chính giữ nguyên.

## Profile dùng lần này

`advisor-qa` trong eas.json: internal APK, assembleRelease, developmentClient=false — có JS/assets trong APK, không cần Metro/Expo Go. Engine20 hiện tại được phép **chỉ trong package QA riêng**. Chốt preview/closed-test/production cũ vẫn từ chối engine20; không đổi ranking/engine/native pipeline.

Tên BBook Advisor QA; package com.bbook.advisor.qa; scheme bbookadvisorqa. Không dùng google-services.json của package production, native push OFF; REST inbox và login/Explore/booking vẫn dùng API hiện có. QA diagnostic ON; Gemini cloud OFF, data approval pending. `BBOOK_ADVISOR_QA_ONLY=1` chỉ hợp lệ với profile này; cờ QA hoặc cloud bật nhầm sẽ làm config lỗi. Production không mở diagnostics hoặc experimental mapping.

Build settings: EAS project/owner/version source giữ nguyên, autoIncrement=false; signing cho package QA riêng. Nếu Expo hỏi Android keystore cho **com.bbook.advisor.qa**, chọn/tạo credentials của package QA. Không thay credentials của com.bbook.app. Đây là APK QA, không phải AAB cập nhật Play.

## Người dùng tự build trên Expo cloud

Trong PowerShell của bạn:

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
eas.cmd build --platform android --profile advisor-qa
```

Lệnh upload working tree đang có lên dịch vụ EAS; job chạy trên Expo cloud. Đăng nhập tài khoản có quyền bbook-app nếu cần. Mở URL build do CLI trả về để theo dõi trên expo.dev; khi FINISHED tải APK. Agent chưa chạy lệnh này.

Đã sửa lỗi preflight EAS CLI: env của advisor-qa khai báo EAS_BUILD_PROFILE=advisor-qa để config local không phụ thuộc biến built-in chỉ có trên cloud. Đã tái hiện lỗi khi chỉ có cờ QA nhưng thiếu profile; sau sửa chạy Expo config bằng đúng env đọc từ eas.json đạt exit 0. Tests QA/profile guards: 17/17 đạt. Không cần nâng CLI để xử lý lỗi này.

Nếu muốn chỉ bấm nút website: Builds → Build from GitHub → Git ref đúng → Android → advisor-qa. Nhưng trước đó GitHub phải có **toàn bộ source mới và profile**, không chỉ HEAD a037ead. Hiện chưa commit/push nên website không lấy được bản local mới này. Không tự commit/push khi chưa cho phép. Chỉ đổi tên profile trên dashboard không đưa các file local lên server.

Nguồn: https://docs.expo.dev/build/building-from-github/ và https://docs.expo.dev/build-reference/apk/ .

## Backend được gọi thực tế

EXPO_PUBLIC_API_URL vẫn là https://beautybook-13zj.onrender.com/api. Đây là backend đang triển khai, **không phải tự động chạy source backend candidate**. Quét mặt/gợi ý engine20 chạy trên thiết bị; không cần deploy Gemini/Advisor backend để nghiệm thu local scan.

Backend candidate có kết quả test local trong audit trước; chưa xác minh runtime SHA/migrations/provider trên Render. Cloud OFF nên thử APK lần này không nghiệm thu endpoint Gemini, AI upload riêng trong repo chính, hoặc deployment backend candidate. Không bật cloud chỉ để làm chức năng trông đầy đủ.

## Các bước QA sau khi có APK

1. Ghi build ID, thời gian, profile; cài BBook Advisor QA. Mở lại từ cold start; không cần máy tính/Metro. Ghi model máy, RAM và Android. Package riêng cho phép giữ BBook đang cài.
2. Dùng tài khoản tester hiện có để login. Kiểm Explore/MUA/service mở được; không tạo booking, thanh toán hoặc refund thật trên production chỉ để thử Advisor. Những luồng có ghi dữ liệu/tiền cần môi trường hoặc tài khoản/kịch bản được cho phép riêng.
3. Vào Makeup Advisor. Cấp/từ chối quyền camera, vào lại; chọn một JPEG nhỏ có quyền sử dụng từ gallery. Kiểm EXIF/hướng ảnh; với ảnh hợp lệ phải có 3 gợi ý không trùng. Engine20 thử nghiệm không có cam kết độ chính xác khuôn mặt.
4. Camera: chờ ready, đổi trước/sau, chụp một lần; tap lặp không tạo scan kép. Cancel gallery phải quay lại đúng màn, không inference. Cancel/back/background không để kết quả cũ hiện lại.
5. Thử không mặt, nhiều mặt hoặc ảnh không phù hợp: báo lỗi đúng, retry được, không bịa gợi ý từ phép đo bị chặn. Scan UI có thời gian trình bày tối thiểu 10s valid / 5s quality invalid; đây không phải % inference.
6. Nếu lượt đầu ổn và cleanup/guard cho phép, thử thêm các lượt camera/gallery có kiểm soát. Nếu có memory refusal, crash/ANR hoặc native busy/cleanup pending: dừng, ghi code/checkpoint/log; không nới guard hoặc ép loop.
7. Đổi occasion/intensity/effect ở kết quả: không quét native lần nữa, mỗi thay đổi trả 3 gợi ý; xóa effect khôi phục baseline. AND conflict không sinh dữ liệu giả. Source nhãn phải phân biệt gợi ý từ lựa chọn với face evidence.
8. Mở style, MUA, service và điều hướng booking: dùng dữ liệu API thật và ID/routes hiện có, không giá/rating/MUA tự tạo. Native push và Gemini OFF trong package QA là giới hạn có chủ đích, không tính là ca đã nghiệm thu.

Kết quả gửi lại: build ID + thiết bị/Android + bước thao tác + PASS/FAIL + code/log chẩn đoán nếu lỗi. Không cần selfie, token hoặc dữ liệu ngân hàng. Chưa có bằng chứng test thiết bị thì mỗi ca vẫn NOT TESTED.

## Cổng tiếp theo

- APK build/cài/scan đầu tiên ổn → đóng lỗi thiết bị và test UI/marketplace.
- Sau đó chốt engine20 đạt hay giữ engine12, trước khi đưa về main.
- QA đủ các luồng tài chính cần môi trường/provider/admin thực tế, không lấy mocked tests làm chứng minh tiền đã chuyển.
- AAB/Play cần package com.bbook.app và test lại FCM/deep links/signing/native 16KB; package QA này không thay thế nghiệm thu Play.

## Kiểm tra source trước build

Đã thêm/sửa chỉ app.config.ts, eas.json, features/makeupAdvisor/__tests__/qaBuild.test.ts và tài liệu này trong candidate frontend. TypeScript/lint/config/tests được ghi vào D:/EXE/artifacts/advisor-qa-*-20261014.*. Không sửa backend, hai repo chính hoặc thuật toán engine20.

Đã kiểm config QA thực tế: package/scheme riêng, Firebase không có, cloud OFF, diagnostics ON, push OFF, faceAwareExperimental ON. Chưa compile native/EAS Linux hoặc kiểm APK/16KB. Ba lỗi lint toàn app và PostgreSQL test skips trong báo cáo audit vẫn còn; profile QA không tự sửa chúng.

Config/gates/native-metadata/transport/push/cloud-disabled/development-script tests: 8 suites, 44 tests đạt trong lượt kiểm cuối. Camera có một ca timeout 5s khi chạy nhóm (cũng tái hiện trong lượt preflight), chạy lại camera riêng đạt 10/10; chưa gọi test nhóm hoàn toàn ổn định hoặc coi đó là bằng chứng camera thiết bị đạt. Không đổi camera runtime/test và không tăng timeout để che lỗi.
