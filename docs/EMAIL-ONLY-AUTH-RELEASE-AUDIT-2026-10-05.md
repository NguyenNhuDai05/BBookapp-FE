# BBook: email-only authentication cho Closed Testing

Ngày: 05/10/2026. Phạm vi: loại Google Authentication khỏi mobile release; giữ email auth, Google Maps và backend compatibility. Không deploy, push, migration hoặc thay đổi production database.

## Audit trước thay đổi

- Login/register chứa nút Google bị ẩn bằng `display: none`, nhưng vẫn khởi tạo hook Google.
- Chuỗi mobile: `useGoogleOAuth` native/web → `loginWithGoogleToken` trong Zustand → AuthService → ApiAuthRepository → `/Auth/google`.
- Native hook dùng `@react-native-google-signin/google-signin`; web hook dùng `expo-auth-session/providers/google`. Không tìm thấy route Google callback riêng trong auth stack; stack gồm login/register/verify-email/forgot-password.
- `app.json` có plugin Google Sign-In và iOS OAuth URL scheme. EAS không có override riêng Google Auth được thấy trong file cấu hình. `.env.example` và `.env` local có ba biến OAuth client ID.
- `app.config.ts` Maps plugin dùng `GOOGLE_MAPS_ANDROID_KEY`/`GOOGLE_MAPS_IOS_KEY`, độc lập OAuth.
- Android local có Google Services Gradle/Firebase notification metadata; đó không phải Google Login. Native folders bị ignore, không sửa/prebuild lại trong task này; cần fresh native build từ cấu hình mới để xác nhận AAB.
- Backend: AuthController `/Auth/google`, GoogleLoginDto, IAuthService/GoogleLoginAsync, `Google.Apis.Auth` dependency và `GoogleAuth:ClientIds`/`ClientId`. Token được xác minh audience và email verified; user mới có PasswordHash rỗng. User đã xóa/inactive bị từ chối.
- Đường email: request registration OTP → draft → verify-email gọi register với OTP → login email/password. Backend consume OTP trước tạo user. Forgot-password gửi OTP; reset-password consume OTP rồi thay hash. Không thay đổi các logic này.

## Google Auth removed from release UI

- Gỡ hẳn nút/logo/divider/style Google, imports, callbacks và khởi tạo hook khỏi cả login/register.
- Xóa hai hook native/web; gỡ action store và method service/repository/interface gọi Google.
- Không còn lời gọi `/Auth/google` hoặc route/navigation Google Auth trong source mobile hiện tại.
- Gỡ Google Sign-In Expo plugin và OAuth iOS URL scheme trong app.json.
- Gỡ hai dependency Google Sign-In và expo-auth-session khỏi package/lockfile; khôi phục nguyên dependency kiểm thử còn lại, không nâng phiên bản khác.
- Gỡ ba biến OAuth client ID khỏi `.env.example` và `.env` local, không in giá trị. Không đọc/xóa cấu hình environment cloud.
- Chính sách được bundle trong app đã chuyển mô tả đăng nhập sang email/password; giữ mô tả Google bản đồ/địa điểm.

## Kept intentionally

- Backend endpoint, DTO/interface/service, package Google.Apis.Auth, cấu hình mẫu GoogleAuth và dữ liệu user: không sửa để tránh compatibility/migration. Endpoint vẫn có thể được gọi bởi client cũ nếu cấu hình server hợp lệ; không phải endpoint disabled.
- Các nhánh bảo vệ user Google-only như xác minh OTP bank account: giữ để không phá tài khoản hiện có. Test có nhắc Google-only là compatibility test, không phải đường đăng nhập mobile.
- `google-services.json` và Android Google Services/Firebase config: phục vụ notifications, không gỡ theo Google Auth.
- `expo-web-browser`: đang dùng checkout/payment và external links.
- Maps/Places/Geocoding/location service, react-native-maps, Maps environment keys và plugin điều kiện: giữ nguyên.
- Tài liệu lịch sử/plan audit trước có nhắc Google Login; không phải chức năng chạy. Báo cáo này ghi nhận trạng thái mới.
- EAS/Render cloud OAuth variables nếu có: chưa sửa; mobile không còn đọc. Có thể dọn sau khi kiểm tra phạm vi các client khác.

## Email auth verification

Test UI/API mock: checkbox chưa đồng ý không gửi OTP/không tạo draft; đồng ý mới gửi OTP và chuyển verify-email; OTP đúng gửi register kèm password/email/OTP rồi email login; OTP server từ chối không login; email login thành công chuyển home; sai credentials ở lại login và thông báo; forgot-password gửi OTP rồi gửi OTP/password mới.

Test store/storage mock: token lưu sau email login; initialize lấy profile để khôi phục session; logout xóa token/mode và state; login lại được; token expired/server reject được xóa. Test registration draft/cooldown vẫn đạt. Tổng nhóm auth/session: 3 suites, 15 tests đạt.

Audit static: auth stack không có Google auth route; scan app/components/hooks/store/services/repositories/types/config/package/lockfile không còn Google auth keyword/call. Kiểm tra config Expo resolved không có plugin Google Sign-In, vẫn giữ Firebase services file.

Giới hạn: chưa gửi email thật, chưa tạo/xóa tài khoản production, chưa thử SMTP/OTP rate limit thực tế hoặc native restart trên thiết bị. Các test không chứng minh những phần đó đã hoạt động.

## Release dependencies

Đã bỏ `@react-native-google-signin/google-signin` và `expo-auth-session` trực tiếp. `npm ci --offline --ignore-scripts` với lockfile chính xác đã đạt; không giữ peer-dependency pruning ngoài ý muốn từ lần uninstall ban đầu.

Không gỡ SDK Maps/Firebase chỉ vì có chữ Google. Cần build native mới; bundle JS hiện tại không đủ để chứng minh Google Sign-In library đã biến mất trong AAB cuối cùng. Với EAS, xác nhận native folder không được đưa vào build và dùng cấu hình mới; không phát hành AAB cũ đã build trước thay đổi.

## Files changed trong task này

1. `.env.example`
2. `app.json`
3. `app/(auth)/login.tsx`
4. `app/(auth)/register.tsx`
5. `hooks/useGoogleOAuth.ts` — xóa
6. `hooks/useGoogleOAuth.web.ts` — xóa
7. `package.json`
8. `package-lock.json`
9. `repositories/ApiAuthRepository.ts`
10. `repositories/IAuthRepository.ts`
11. `services/authService.ts`
12. `store/useAuthStore.ts`
13. `docs/chinhsach.txt` — chỉ thay hai đoạn Google Auth trong task này; có chỉnh sửa trước đó của user/task trước
14. `app/__tests__/emailOnlyAuth.test.tsx` — mới
15. `store/__tests__/playReviewSession.test.ts` — thêm hai test email session
16. `docs/EMAIL-ONLY-AUTH-RELEASE-AUDIT-2026-10-05.md` — báo cáo này

Ngoài Git: `.env` local đã gỡ đúng ba biến OAuth-only. Các file MUA/portfolio/privacy/terms đang chỉnh trước task được giữ, không revert.

## Validation và Remaining blockers

- Android JS/Hermes export đạt: `D:/EXE/.play-email-only-export`; bundle 3.900 modules; asset policy xác nhận có đoạn email-only mới. Không phải AAB/native compile.
- Nhóm auth/session 15 tests đạt. Full regression cuối: 41 suites, 224 tests đạt.
- Typecheck `npx tsc --noEmit` đạt. ESLint tất cả file TypeScript thay đổi trong task này đạt, không lỗi/cảnh báo. `git diff --check` đạt.
- Full lint vẫn 3 errors/14 warnings từ trước ở payouts, private-media và PrivateMediaImage/tests khác; không sửa ngoài phạm vi auth.
- Chưa có AAB: kiểm manifest/autolink/dependency/signing/API36/16KB trên artifact thật trước Closed Testing.
- Google-only user cũ có PasswordHash rỗng: ResetPasswordAsync hiện từ chối user đó; không tự thêm password enrollment. Release email-only chưa cho họ đăng nhập mới. Không thu hồi session hiện có; initialize vẫn dùng token + profile bình thường.
- Cần kiểm email registration/login/OTP/forgot-password thật trên môi trường phù hợp và bản cài Play, gồm OTP sai/hết hạn/resend/lỗi mạng, logout/restart.
- Web privacy còn mô tả Google Login của bản trước; cần đồng bộ với release mới trước phát hành. Không sửa web/deploy trong task này.
- Việc bỏ Google Auth không xử lý các vấn đề Maps/SDK Data safety, reviewer production access, moderation/deletion đã ghi trong kế hoạch release; vẫn cần đóng từng mục.
