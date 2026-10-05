# Khôi phục mật khẩu BBook — 05/10/2026

## Hành vi đã triển khai

- Từ Login: email → gửi mã → OTP sáu số → backend xác minh → mật khẩu mới và xác nhận.
- OTP có gửi lại sau 60 giây, dùng deadline để cập nhật đúng khi app ra nền; gửi lại xóa mã đang nhập. Backend vẫn bảo vệ gửi lại/OTP, không phụ thuộc countdown của UI.
- Mật khẩu mới và xác nhận có con mắt độc lập, mặc định che; áp dụng rule 6–100 ký tự và kiểm hai ô khớp nhau.
- Thành công tự về Login, có thông báo “Đã đặt lại mật khẩu”, email điền sẵn, không điền mật khẩu hoặc tự đăng nhập. Dismiss stack khôi phục trước khi replace Login.
- Customer/MUA: nút Quên mật khẩu dưới ô mật khẩu hiện tại gửi mã đến email session rồi mở thẳng OTP. Sau reset, logout phiên hiện tại trước khi về Login; demo account vẫn giữ màn read-only.
- Route guard cho phép Customer/MUA đã đăng nhập mở forgot-password; không thay đổi phân quyền Admin.

## Backend và compatibility

Endpoint mới:

1. `POST /api/Auth/reset-password/verify-otp`: email + OTP; trả resetToken và expiresInSeconds.
2. `POST /api/Auth/reset-password/complete`: email + resetToken + newPassword.

Token ngẫu nhiên 256 bit, chỉ lưu hash trong bảng EmailOtps hiện có với purpose RESET_PASSWORD_GRANT. Token hết hạn sau 5 phút, gắn với email và hash mật khẩu hiện tại; consume bằng update có điều kiện và thay mật khẩu trong transaction. Verify OTP không đổi mật khẩu. Gửi mã mới vô hiệu grant cũ. Lần xác minh OTP sai vẫn commit bộ đếm thử sai của OTP service.

Giữ endpoint reset-password cũ, email login/register và các rule bảo vệ tài khoản hiện tại. Tài khoản Google-only không có mật khẩu vẫn chưa được chuyển đổi; demo/deleted/inactive bị từ chối như trước. Không thêm schema, không chạy migration, không chỉnh Google Maps.

## Các file trong task này

App:
- app/(auth)/forgot-password.tsx
- app/(auth)/login.tsx
- app/change-password.tsx
- components/auth/PasswordField.tsx (mới)
- hooks/useProtectedRoute.ts
- repositories/IAuthRepository.ts
- repositories/ApiAuthRepository.ts
- services/authService.ts
- app/__tests__/emailOnlyAuth.test.tsx
- docs/PASSWORD-RECOVERY-IMPLEMENTATION-2026-10-05.md

Backend (D:/EXE/BeautyBook):
- BeautyBookBackend/Controllers/AuthController.cs
- BeautyBookBackend/DTOs/AuthDtos.cs
- BeautyBookBackend/Services/IAuthService.cs
- BeautyBookBackend/Services/AuthService.cs
- BeautyBookBackend.Tests/PasswordResetFlowTests.cs (mới)

## Validation

- Full frontend: 41 suites, 228 tests đạt.
- Nhóm UI auth/reviewer: 26 tests đạt, bao gồm OTP trước password, OTP reject, password mismatch, eyes, resend cooldown và Customer/MUA lấy email + logout.
- Backend: build đạt, 3 warning hiện có ngoài phần thay đổi.
- Backend tests: PasswordResetFlowTests + EmailOtpServiceTests: 7 đạt, 0 skip. SQLite in-memory; không chạm database production.
- TypeScript và ESLint phần thay đổi đạt; diff check đạt. Full lint project còn các lỗi đã nêu từ audit trước.
- Android JS/Hermes export đạt tại D:/EXE/.password-recovery-export. Chưa build AAB.
- Thử preview web qua trình duyệt bị localhost connection timeout; chưa xác nhận bố cục bằng screenshot/thiết bị thật.

## Trước khi đưa vào Closed Testing

Backend phải có hai endpoint mới trước khi phát hành mobile sử dụng chúng. Hiện task chỉ sửa local: không push, deploy, migration hoặc thay đổi production database. Chưa kiểm email gửi/nhận thật với backend mới, native keyboard/autofill, Android hardware Back hoặc session trên thiết bị thật; cần smoke các mục này sau khi chọn môi trường test phù hợp.

Khôi phục chỉ logout phiên mobile hiện tại theo phạm vi đã thống nhất; không thêm cơ chế thu hồi tất cả JWT của các thiết bị khác. OTP và reset token không lưu vào AsyncStorage, route params hoặc log.
