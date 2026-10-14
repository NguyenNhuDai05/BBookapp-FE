# Build QA trên tài khoản Expo riêng

Source nhánh `integration/unified-mobile-tester` có Unified Styles, các luồng app hiện tại và native quét mặt ML Kit/Advisor. Không cần chép thư mục android hoặc APK từ máy tác giả. Cloud Advisor/Gemini và push bị tắt trong QA; tính năng gọi API cần backend hoạt động. Không coi profile này là bản cập nhật Play hoặc bản đã bật tất cả cloud features.

## Clone và đăng nhập

```powershell
git clone --branch integration/unified-mobile-tester https://github.com/NguyenNhuDai05/BBookapp-FE.git
cd BBookapp-FE
npm ci
npx eas-cli@latest login
npx eas-cli@latest whoami
```

Nếu đã clone: commit/stash công việc riêng trước, switch nhánh rồi `git pull --ff-only`.

## Tạo project QA riêng trong checkout của người build

Chỉ chạy trên bản clone riêng để build QA. Điền username Expo đúng với whoami (hoặc organization được phép sử dụng); không sửa project chính của BBook trên remote.

```powershell
$qaOwner = Read-Host 'Username Expo cua tai khoan build QA'
if ([string]::IsNullOrWhiteSpace($qaOwner)) { throw 'Username khong duoc rong' }
$qaConfig = Get-Content app.json -Raw | ConvertFrom-Json
$qaConfig.expo.owner = $qaOwner
$qaConfig.expo.slug = 'bbook-unified-qa'
$qaConfig.expo.extra.PSObject.Properties.Remove('eas')
$qaConfig | ConvertTo-Json -Depth 100 | Set-Content app.json -Encoding utf8

$env:EAS_BUILD_PROFILE='unified-qa'
$env:BBOOK_BUILD_VARIANT='unified-qa'
$env:BBOOK_ADVISOR_QA_ONLY='1'
$env:BBOOK_ADVISOR_ENABLED='1'
$env:BBOOK_ADVISOR_CLOUD_ENABLED='0'
$env:BBOOK_ADVISOR_DIAGNOSTICS='1'
$env:BBOOK_ADVISOR_FACE_AWARE_EXPERIMENTAL='1'
$env:EXPO_PUBLIC_API_URL='https://beautybook-13zj.onrender.com/api'

npx eas-cli@latest init
npx eas-cli@latest project:info
npx eas-cli@latest build --platform android --profile unified-qa
```

Trong init, tạo project mới dưới đúng tài khoản QA. project:info phải hiện owner mới và projectId khác project BBook `eea1bcb1-6a0f-4a5d-9b53-cb6fc0250ecd`; nếu còn bbook-app thì dừng, chưa build. Không chạy build:configure để ghi đè profiles hiện có. Nếu được hỏi, tạo keystore mới chỉ cho QA package `com.bbook.app.qa`.

Không commit/push app.json đã đổi owner/projectId về nhánh dùng cho main. Không dùng tester-apk, tester-aab hoặc production với identity/signing QA này. APK QA ký bằng key mới không đè được APK QA local ký debug key; có thể cần gỡ riêng BBook QA cũ, mất dữ liệu local của QA. Không gỡ app BBook Play.

Build thành công: tải APK trên trang EAS build, cài điện thoại, nghiệm thu camera/gallery và 6 lượt scan. Login, tags, booking và marketplace phụ thuộc API Render; backend trả 503 thì đổi account build không khắc phục được. Ảnh catalog vẫn có placeholders, cloud cần nghiệm thu riêng. Không gửi Gemini secrets vào app.
