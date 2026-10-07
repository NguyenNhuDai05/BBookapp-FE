# Quick Mode Switcher: avatar account menu

## Audit / UI before

QuickModeSwitcher trước đây chứa text trigger, sheet và options. Home render trigger dưới logo; Dashboard dưới greeting/name; Explore có một dòng trigger riêng. Home avatar gọi `onProfilePress` trực tiếp tới `/(tabs)/profile`. Dashboard chưa có avatar.

Đã đọc QuickModeSwitcher, HomeFeedHeader, Home/Explore/Dashboard, useAppMode, appModeService, profile/settings screens, AppBottomSheet, OverlayProvider và theme. Flow đúng là `UI → useAppMode → appModeService → auth store`. Profile/Settings vẫn giữ nút chuyển mode dự phòng. Customer không có settings screen riêng; MUA có `/(mua)/settings`.

## UI after

- Home: logo + notification + avatar ngoài cùng phải; bỏ hẳn dòng mode và wrapper tăng chiều cao.
- Dashboard: greeting/name + notification + avatar ngoài cùng phải. Tên dài truncate một dòng; identity co giãn, actions không shrink/wrap.
- Explore: avatar bên phải heading thay decoration Sparkles tại vị trí đó; không còn dòng selector riêng. Những icon Sparkles khác giữ nguyên.
- Avatar 40px, touch target 44px dùng shared AccountMenuTokens. Không có text/chevron bên cạnh avatar. Dùng avatarUrl/avatar từ auth user; Home vẫn truyền ảnh hiện có, lỗi ảnh có fallback icon.
- Avatar mở AppBottomSheet có tên/email, mode selected/check/tint nhẹ và mô tả ngắn. Account chưa có capability chỉ thấy Customer và entry onboarding tách khỏi modes.
- Account entry tới Profile tương ứng; Home giữ callback Profile cũ nhưng chỉ gọi khi chọn Account. MUA có Settings entry tới route hiện có. Không thêm logout/action/account feature mới.
- Sheet scroll được khi font lớn/màn nhỏ, reuse safe area, Android Back, overlay host hiện có. Tất cả row có selected/disabled/busy phù hợp; mode tap vẫn gọi selectMode cũ, không confirmation.

## Files changed

| File | Mục đích |
| --- | --- |
| components/QuickModeSwitcher.tsx | Avatar trigger, state mở/đóng sheet, presentation wiring |
| components/AccountModeSheet.tsx | Shared account identity, mode options, onboarding, Account/Settings |
| components/AccountAvatar.tsx | Shared ảnh avatar 40px và fallback khi ảnh lỗi |
| components/feed/HomeFeedHeader.tsx | Bỏ selector dưới logo; avatar mở menu; bell/callback Account giữ nguyên |
| app/(mua)/dashboard.tsx | Avatar ngoài cùng phải; name truncate; actions không shrink; bell action giữ nguyên |
| app/(tabs)/explore.tsx | Bỏ text selector, đặt avatar bên phải heading |
| constants/theme.ts | Shared avatar/touch/row size tokens |
| components/__tests__/QuickModeSwitcher.test.tsx | Giữ ba behavior test cũ với trigger mới; thêm identity/profile/settings/MUA selection tests |
| components/feed/__tests__/HomeFeedHeader.test.tsx | Width constraints 320/360/390dp, font scale 1.5, bell và Avatar → Account → Profile |
| docs/avatar-account-menu.md | Audit, scope, validation và Android checklist |

## Logic changes

None ngoài presentation wiring. Không sửa useAppMode, appModeService, useAuthStore, useProtectedRoute hoặc utils/appMode. Không sửa reset navigation, lock, stale-account protection, persistence, eligibility/capability, suspended, rollback, logout hoặc cold start. Tests switching/session cũ vẫn chạy nguyên vẹn.

## Backend changes

None. Không sửa JWT, API, DTO, database, backend, booking/payment/payout/chat/notification. Không upgrade dependencies, Expo hoặc router. Không deploy/upload Closed Test.

## Tests

| Kiểm tra | Kết quả |
| --- | --- |
| TypeScript `npx tsc --noEmit` | PASS |
| Jest toàn repo, cache workspace / testTimeout 30000 | PASS: 53/53 suites, 319/319 tests |
| Lint tất cả file UI/test thay đổi | PASS, không error/warning |
| `git diff --check` | PASS |
| Android production export / Hermes | PASS: entry .hbc 8.1MB và metadata trong D:/EXE/.verification/avatar-menu-android |
| Logic file checksums | PASS: useAppMode, appModeService, useAuthStore, useProtectedRoute, utils/appMode giống hệt trước thay đổi |
| UI Customer-only/onboarding, Customer có MUA, MUA selected, Profile/Settings navigation, busy trigger | PASS automated |
| Home width constraints 320/360/390dp, fontScale 1.5, notification callback, Profile qua sheet | PASS automated |

Test UI cũ được giữ và đổi cách tìm trigger sang avatar; test mới thêm coverage account identity và routing. Lần chạy đầu phát hiện lỗi helper test và thiếu import Sparkles còn dùng ở phần khác của Explore; đã sửa. Test countdown ngân hàng cũ có một lần lệch thời gian khi chạy chậm, không sửa file đó; rerun cuối pass toàn bộ.

Logs: `D:/EXE/.verification/avatar-menu-final-tests.log`, `avatar-menu-header-tests.log`, `avatar-menu-targeted.log`, `avatar-menu-android.log`. Layout tests kiểm tra cấu trúc và constraints, không thay thế visual QA/native touch testing trên Android. Chưa tạo/upload AAB hay test trên điện thoại thật.

## Manual Android checklist

- [ ] Customer-only: avatar → sheet; Customer selected, không có MUA mode; Become MUA mở onboarding hiện tại.
- [ ] Customer có MUA: avatar → sheet → MUA; vào Dashboard và mode selected đúng.
- [ ] MUA: avatar đúng ảnh, tên dài không đẩy bell/avatar; chọn Customer về Home.
- [ ] Home bell mở notifications; Dashboard bell giữ hành động bookings hiện có; badge không overlap avatar.
- [ ] Account menu mở đúng Customer/MUA Profile; MUA Settings vẫn có logout và switch dự phòng.
- [ ] Android Back đóng sheet; sau switching không quay lại mode cũ.
- [ ] Tap mode liên tục/mạng chậm: lock/loading/rollback vẫn đúng.
- [ ] Logout A ở MUA → login B Customer-only: B không kế thừa mode; force stop/reopen/reload kiểm tra persistence.
- [ ] Thiết bị 320/360/390dp+, font size lớn: logo/greeting + bell + avatar không wrap, touch targets riêng; sheet scroll được.
- [ ] Smoke test booking/customer history/MUA services/profile/chat/payment trước build Closed Test tiếp theo.
