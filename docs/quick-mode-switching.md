# Safe Quick Mode Switching — BBook

## 1. Audit hiện trạng

- App dùng Expo Router, Zustand `store/useAuthStore.ts`, React Query và AsyncStorage; không có context/store mode riêng. `repositories/ApiAuthRepository.ts` map role backend và `/User/profile` sang `UserDto`. JWT nằm ở `user_jwt_token`; UI mode nằm ở `bbook_active_mode`.
- Role/capability và UI mode khác nhau. Account có MUA profile vẫn có thể dùng Customer để đặt chuyên viên khác. Switching không gọi become-MUA API, không đổi JWT, account id hay ownership.
- Nút cũ: Customer `app/(tabs)/profile.tsx` và MUA `app/(mua)/settings.tsx`. Trước thay đổi, từng screen tự gọi store rồi router.replace; chiều MUA → Customer đến Profile.
- Customer tabs: home, explore, bookings, chat, profile. Booking detail/review/cancel/complaint, checkout, customer notifications/refund/profile edit và onboarding là route ngoài group.
- MUA tabs: dashboard, calendar, bookings, chat, profile. Các route ẩn tab: settings, edit-profile, services, manage-portfolio, community, working-hours, earnings, withdraw, bank-accounts, bank-account-form, identity-verification, payouts/[id], mua-booking/[id], mua-booking/complete.
- Hai group tắt native header. Home dùng `components/feed/HomeFeedHeader.tsx`; dashboard và phần lớn screen tự render header/avatar.
- Cold start: initialize đọc token/mode, gọi current user; splash/route guard điều hướng theo activeMode. Login reset CUSTOMER; logout/expire/delete dọn mode và booking draft theo flow sẵn có.
- Các check role MUA tập trung ở store, route guard, splash và Customer profile. Trước đây phép OR với role MUA có thể bỏ qua `hasMuaProfile: false` rõ ràng từ server; helper mới ưu tiên capability server, fallback role chỉ khi capability vắng mặt.
- Backend chỉ đọc để audit: hasMuaProfile là profile tồn tại, không phản ánh suspended. API `/Mua/eligibility` đã có `profileStatus`. Draft/pending vẫn được vào quản lý để hoàn thiện hồ sơ; suspended bị chặn khi vào/restore MUA.
- Notification allowlist hiện chỉ nhận `/booking/{uuid}`, `/chat/{uuid}`, `/refund/{uuid}`; root layout push route chung, không chọn mode. Không sửa notification architecture. TODO: audit payload/ownership booking MUA và route `/(mua)/mua-booking/[id]` ở task riêng trước khi mở rộng allowlist.

## 2. Giải pháp đã chọn

Quick selector ở Customer Home/Explore và MUA Dashboard. Reuse `AppBottomSheet`, OverlayProvider, theme tokens, icon hiện có; không thêm dependency. Trigger tối thiểu 44px, item 56px; hỗ trợ accessibility label/selected/disabled/busy, Android Back và safe area qua component sheet sẵn có.

Customer-only thấy “Trở thành chuyên viên trang điểm”, mở `/mua-onboarding` hiện có. Account có capability thấy hai mode và dấu chọn. Không confirmation khi switching. Nút Tài khoản cũ vẫn hiện, dùng cùng `useAppMode` → `changeAppMode` → store `switchMode`.

Store vẫn là nguồn mode duy nhất. Shared lock chống double tap; guard tạm chờ transaction. Vào MUA kiểm tra eligibility bằng API hiện có; về Customer chỉ đổi local. Storage failure rollback trước navigation; navigation failure rollback mode/persistence. Account thay đổi trong lúc request chờ thì bỏ kết quả. Không clear JWT/cache/draft do switch.

Reuse key/persistence cũ. Không tạo store/auth context mới hoặc migration storage. Logout xóa key; login luôn ghi CUSTOMER nên account B không kế thừa MUA của A. Cold start revalidate user và kiểm tra eligibility khi mode lưu là MUA. Suspended/mất capability/lỗi eligibility không phải 401 fallback CUSTOMER; JWT 401 giữ cơ chế hết phiên hiện có.

## 3. Files changed

| File | Mục đích |
| --- | --- |
| components/QuickModeSwitcher.tsx | Trigger mode, selected items, onboarding, loading/accessibility |
| components/feed/HomeFeedHeader.tsx | Selector trong header Home |
| app/(tabs)/explore.tsx | Selector trong header Explore |
| app/(mua)/dashboard.tsx | Selector dưới tên trên dashboard |
| hooks/useAppMode.ts | Shared switching UI, báo lỗi, reset root navigator |
| services/appModeService.ts | Transaction, capability/eligibility check, lock, stale-account protection, rollback |
| utils/appMode.ts | Kiểu mode và helper capability dùng chung |
| store/useAuthStore.ts | Persistence lỗi có rollback; lock; safe cold-start eligibility |
| hooks/useProtectedRoute.ts | Reuse capability; chờ switching transaction |
| app/index.tsx | Splash reuse capability |
| app/(tabs)/profile.tsx | Giữ nút cũ, gọi shared helper |
| app/(mua)/settings.tsx | Giữ nút cũ, gọi shared helper về Customer Home |
| app/checkout/index.tsx | Await store persistence; lỗi được dialog hiện tại xử lý |
| services/__tests__/appModeService.test.ts | 10 kiểm tra switching/session/storage/account |
| hooks/__tests__/useAppMode.test.tsx | Reset cả stack về đúng root ở hai chiều |
| components/__tests__/QuickModeSwitcher.test.tsx | Capability/onboarding/selected/disabled UI |
| store/__tests__/playReviewSession.test.ts | Mock eligibility mới trong cold-start test hiện có |
| app/__tests__/muaSettings.test.tsx | Mock shared hook mới cho regression UI Settings |
| docs/quick-mode-switching.md | Audit, kết quả xác minh, checklist |

## 4. Mode flow

```text
Customer → Quick Mode Switcher / nút Tài khoản
         → kiểm tra capability + eligibility hiện có
         → persist MUA → reset root → (mua)/dashboard

MUA → Quick Mode Switcher / nút Tài khoản
    → persist CUSTOMER → reset root → (tabs)/home

Customer chưa có MUA → Trở thành chuyên viên trang điểm → /mua-onboarding
```

## 5. Backend changes

None. Không sửa API/DTO/database/migration/auth/JWT/approval/booking/payment/chat/notification backend.

## 6. Compatibility với Closed Test

Không thay backend contract hoặc yêu cầu dữ liệu mới. Frontend gọi API eligibility đã tồn tại và giữ cách xác thực cũ. Build cũ tiếp tục gọi backend như trước; code chưa được deploy/upload Google Play trong task này. Không nâng Expo/React Native hoặc dependencies. Repo thực tế đang dùng Expo 57 dù AGENTS yêu cầu đọc docs 54; navigation dùng API của phiên bản cài đặt, không import React Navigation ngoài Expo Router. Đã đối chiếu [tài liệu Expo Router SDK 56+](https://docs.expo.dev/router/migrate/sdk-55-to-56/) và implementation cài trong node_modules.

## 7. Test results

Các test unit không thay thế thiết bị thật hoặc dữ liệu booking trên server.

| Kiểm tra | Kết quả |
| --- | --- |
| TypeScript `npx tsc --noEmit` | PASS |
| Jest toàn repo | PASS: 52/52 suites, 312/312 tests; cache trong workspace, CLI testTimeout=30000 cho môi trường render chậm |
| Lint các file production/test mới hoặc sửa | PASS, không có error/warning |
| `npm run lint` toàn repo | FAIL sẵn có: 3 errors và 14 warnings; errors ở admin/payouts/[id], admin/private-media, components/PrivateMediaImage, đều không sửa trong task |
| Android production export, Hermes | PASS: `expo export --platform android --max-workers 2`; xuất entry .hbc 8.1MB và metadata trong D:/EXE/.verification/quick-mode-android |
| Expo Doctor | Chưa xác minh: npm registry DNS ENOTFOUND, tool chưa cài sẵn; không nâng/cài dependency app |
| `git diff --check` | PASS |

Lần Jest đầu không chạy được do EPERM ghi cache tạm Windows. Lần sau có timeout 5s và lỗi đọc icon; rerun cuối với cache workspace/30s đã pass toàn bộ, không sửa code unrelated để chữa lỗi môi trường. Android export đầu phát hiện import React Navigation ngoài Expo Router do thay đổi mới; đã sửa dùng navigation.reset từ Expo Router. Lỗi Hermes ghi temp sau đó được giải quyết bằng TEMP/TMP trong workspace; export cuối thành công.

Logs: `D:/EXE/.verification/quick-mode-final-tests.log`, `quick-mode-android.log`, `quick-mode-doctor.log`, `quick-mode-lint-changed.log`.

| Case | Mức xác minh |
| --- | --- |
| 1 Customer chưa MUA | PASS: capability và UI/onboarding |
| 2 Customer → MUA | PASS unit: route reset, identity/JWT/state; tải dữ liệu server cần Android |
| 3 MUA → Customer | PASS unit: mode và root reset |
| 4 MUA booking chuyên viên khác | PASS unit: giữ draft/cache/identity; booking server chưa xác minh trên device |
| 5 Booking khách đặt MUA | PASS code audit: Customer dùng ['userBookings'], MUA dùng ['mua-bookings', muaId, ...], không đổi endpoint/ownership; cần booking thật trên Android |
| 6 Restart Customer | PASS unit: initialize/storage |
| 7 Restart MUA | PASS unit: initialize/storage/eligibility |
| 8 Suspended/removed | PASS unit: reject entry, fallback và persist Customer ở cold start |
| 9 Double tap | PASS unit: lock và single navigation |
| 10 Logout A → login B | PASS unit: xóa persistence/reset Customer; pending switch không áp dụng sang B |

## 8. Remaining risks

- Chưa chạy APK/AAB trên điện thoại thật: layout/font scaling, Android hardware Back, push notifications, process kill/reload và dữ liệu booking/payout/chat thật cần manual QA.
- Vào/restore MUA phụ thuộc một request eligibility hiện có. Lỗi mạng khi switch giữ mode cũ; cold start eligibility không tải được sẽ mở Customer, có thể thử chuyển MUA lại khi mạng ổn định.
- JWT hết hạn vẫn theo flow logout/expire hiện có. Đây là auth expiration, khác với lỗi đổi mode thông thường.
- Suspension được kiểm tra khi vào/restore MUA. Task không thêm polling quyền trên mọi screen; suspension xảy ra giữa phiên vẫn theo các kiểm tra/backend errors hiện có.
- Navigation reset bỏ lịch sử điều hướng trước, giữ draft/cache. Không phục hồi form chưa lưu chỉ nằm trong state của screen.
- Notification MUA cross-mode là giới hạn có trước, chưa được mở rộng.

## 9. Manual test checklist trước build Closed Test

- [ ] Customer-only: Home/Explore mở selector; chỉ có onboarding, không vào MUA; đăng ký MUA dùng flow cũ.
- [ ] MUA ở Customer: chuyển từ Home/Explore và nút Tài khoản đến Dashboard; kiểm tra bookings/services/profile/earnings.
- [ ] MUA → Customer từ Dashboard và Settings: đến Home; Android Back không quay lại mode cũ.
- [ ] Đặt một MUA khác trong Customer; đổi hai chiều; kiểm tra đúng booking Customer và đúng booking nhận khách của chính mình.
- [ ] Kiểm tra History, Explore, Chat, Review, Notifications, bank/refund/payment screens hiện có.
- [ ] Force stop/mở lại ở từng mode; reload; suspended hoặc mất capability mở Customer an toàn.
- [ ] Tap liên tục; mạng chậm/mất mạng; không crash hoặc logout vì switching failure.
- [ ] Logout A ở MUA; login B Customer-only; force stop/mở lại; B luôn Customer. Kiểm tra register/login/logout email hiện có.
- [ ] Font size lớn/màn 320–360dp: trigger không đè notification/avatar, item chạm được, sheet/back/safe area đúng.
- [ ] Tạo Android build bằng pipeline hiện có; smoke test trên thiết bị trước upload Closed Test.
