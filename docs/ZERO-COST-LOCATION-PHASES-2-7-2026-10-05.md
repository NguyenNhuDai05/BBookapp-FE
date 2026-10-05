# BBook — nơi làm việc, booking và location không dùng Maps Platform

Ngày kiểm tra: 05/10/2026. Báo cáo này cập nhật trạng thái implementation trong các báo cáo audit/Phase 1 trước đó. Code được sửa local; chưa push, deploy, chạy migration vào database hoặc thay đổi production.

## Đã triển khai

- Become MUA và Edit Profile dùng chung `WorkLocationFields`: tên/địa chỉ nhập tay, GPS chỉ khi nhấn nút, xóa GPS riêng, xóa toàn bộ nơi làm việc và công tắc cho phép khách tới. Nơi làm việc không bắt buộc; khu vực nhận khách vẫn giữ điều kiện hiện có. Địa chỉ nhập tay hoạt động khi từ chối GPS.
- Backend lưu tên/địa chỉ nơi làm việc và consent riêng; tiếp tục dùng cặp tọa độ hiện có. Địa chỉ cũ và cờ PublicMeetingPoint cũ không tự trở thành địa chỉ studio công khai. Consent mới mặc định false. Public DTO chỉ công bố studio khi consent mới bật và có địa chỉ; owner vẫn chỉnh sửa được thông tin riêng.
- Nearby vẫn dùng API/catalog nội bộ, không geocoder. Tọa độ riêng được làm tròn trước khi tính khoảng cách; khoảng cách gần đúng, không phải quãng đường di chuyển.
- Checkout có CUSTOMER_ADDRESS và MUA_WORK_LOCATION. Khách nhập địa chỉ hoặc thêm GPS; lựa chọn studio chỉ xuất hiện khi MUA cho phép và có địa chỉ. Backend kiểm tra lại profile trong transaction, không tin địa chỉ/tọa độ studio từ client.
- Booking lưu bản chụp loại/tên/địa chỉ/tọa độ tại thời điểm tạo. Sửa/xóa studio hoặc tắt consent sau đó không sửa địa điểm của booking đã tạo. Booking cũ giữ nguyên dữ liệu, không backfill từ profile.
- Draft studio gắn MUA ID, được bỏ khi đổi MUA; giữ khi thay dịch vụ cùng MUA. Draft được xóa khi logout, đổi tài khoản, mất session hoặc xóa tài khoản thành công; không persist địa chỉ booking vào storage.
- Chi tiết booking của Customer/MUA dùng snapshot và quyền participant, có sao chép địa chỉ/mở ứng dụng bản đồ bên ngoài. Chỉ mở sau thao tác người dùng; ưu tiên GPS hợp lệ, fallback địa chỉ đã encode, xử lý lỗi mở app.
- Gỡ react-native-maps, AreaMap không còn consumer và Maps plugin/env reads; gỡ backend adapter Places/Geocoding. Legacy lookup routes trả 410 thay vì gọi provider. Giữ Firebase/FCM, Google services file, GPS foreground và catalog khu vực. Không yêu cầu Maps API key/billing.

## Schema và dữ liệu

Migration `20261005071302_AddWorkLocationAndBookingDestination` chỉ thêm 5 cột: profile WorkLocationName(100), WorkLocationAddress(500), AllowCustomerVisit(false); booking ServiceLocationType(30), ServiceLocationName(100). Không copy địa chỉ cũ, không tự bật consent, không cập nhật booking cũ.

Đã tạo SQL idempotent tại `D:/EXE/BeautyBook/BeautyBookBackend/docs/AddWorkLocationAndBookingDestination.sql` để review. Chưa thực thi SQL/migration. EF báo không còn model changes ngoài migration. Chưa kiểm tra apply trên PostgreSQL thật; biến môi trường test PostgreSQL chưa cấu hình.

## Kiểm tra tự động

- TypeScript: PASS; lint toàn bộ TS/TSX sửa/thêm: PASS. Full lint trước đó còn 3 lỗi/14 warnings ở các file ngoài phạm vi; chưa tuyên bố full lint sạch.
- Mobile full suite sau thay đổi cuối: 48 suites / 294 tests PASS, gồm email auth, session, GPS, WorkLocationFields, checkout destination, copy/external navigation và booking snapshot. Chạy serial, timeout 20 giây/test trên máy ít RAM; cache local tránh lỗi EPERM của thư mục cache sandbox.
- Backend targeted: 29 tests PASS (WorkLocation, MuaLocation, BookingDestinationAccess). Có kiểm tra service thực tạo booking, chống studio client spoofing, consent off, snapshot sau sửa/xóa và quyền người tham gia.
- SQLite fixture không mô phỏng locking PostgreSQL; chưa xác minh race/concurrency trên PostgreSQL. Lượt full backend test sau đó bị hủy vì testhost không kết nối trong 90 giây do môi trường máy chậm; không ghi PASS cho lượt này.
- Backend build PASS với 3 cảnh báo có sẵn. EF pending-model check PASS; SQL migration generation PASS.
- Native Android prebuild PASS, manifest nguồn chỉ có foreground coarse/fine location, không background location/Maps API key. Chưa xác minh merged release manifest.
- Android JS/Hermes export sau thay đổi cuối: PASS, 3.874 modules, bundle 8 MB tại `.expo/zero-cost-location-android`; đây không phải APK/AAB.
- Native assembleDebug chưa hoàn tất: máy 6 GB RAM, RAM trống xuống khoảng 250 MB; đã dừng build. Gradle đã cài NDK 27.1 và Android SDK Platform 36 theo license có sẵn. Chưa có APK/AAB được xác nhận.
- Android thực tế: NOT TESTED; người dùng sẽ thực hiện theo checklist bên dưới. Không coi Jest/prebuild/bundle là kiểm thử thiết bị.

## File thay đổi

Mobile: `app.config.ts`, `app.json`, `package.json`, `package-lock.json`, `LOCATION_SETUP.md`; các màn `app/mua-onboarding/apply.tsx`, `app/(mua)/edit-profile.tsx`, `app/mua-detail.tsx`, `app/checkout/index.tsx`, `app/checkout/success.tsx`, `app/booking/[id].tsx`, `app/(mua)/mua-booking/[id].tsx`; components OperatingAreaFields, WorkLocationFields, LocationPicker, ExploreNearby, AddressPickerSheet, BookingLocationCard; xóa 3 AreaMap files; hooks/useMuaProfile; repositories ApiMuaProfileRepository/ApiMuaRepository/ApiBookingRepository; services locationService/externalNavigation; store useBookingStore/useAuthStore; types location/ArtistDto/booking; utils muaOnboarding/workLocation/locationCoordinates; các test và tài liệu location được liệt kê trong git status local.

Backend: Models MakeupArtistProfile/Booking; DTOs MuaApplicationRequestDto/MuaDtos/BookingDtos; Data ApplicationDbContext; Services WorkLocationPolicy/AuthService/MuaService/BookingService/AccountDeletionService/AccountDeletionData; Controllers NearbyMuasController/LocationsController; Program; xóa Services/LocationService; migration + designer + model snapshot + SQL; tests WorkLocationTests/BookingDestinationAccessTests/MuaPrivacyTests.

## Còn phải làm trước kiểm thử đầy đủ và Closed Testing

1. Có backend dev/test riêng, apply migration mới vào database test và chạy source backend mới. Backend Render hiện tại chưa được thay đổi. Chờ URL API test từ người dùng.
2. Hoàn tất native Android build trên máy đủ RAM, dùng API dev/test. Binary cũ không có thay đổi native Clipboard/gỡ Maps. Debug APK cần Metro; không phải AAB release.
3. Chạy PostgreSQL migration/concurrency tests và full backend suite trong môi trường test ổn định.
4. Người dùng chạy [checklist Android](ANDROID-LOCATION-TEST-CHECKLIST-2026-10-05.md), ghi PASS/FAIL cho GPS denied/off/timeout, manual-only, studio consent/edit/delete, booking snapshot, external maps/copy và draft/session.
5. Sau khi test qua mới đánh giá release AAB/merged permissions và đối chiếu Privacy/Data Safety với hành vi cuối cùng. Task này chưa thay đổi khai báo Play Console hoặc chính sách công khai.

## Danh sách file local đầy đủ

Mobile (bao gồm file xóa):

- D:/EXE/bbeauty-app/app.config.ts
- D:/EXE/bbeauty-app/app.json
- D:/EXE/bbeauty-app/app/__tests__/checkoutLocation.test.tsx
- D:/EXE/bbeauty-app/app/(mua)/edit-profile.tsx
- D:/EXE/bbeauty-app/app/(mua)/mua-booking/[id].tsx
- D:/EXE/bbeauty-app/app/booking/[id].tsx
- D:/EXE/bbeauty-app/app/checkout/index.tsx
- D:/EXE/bbeauty-app/app/checkout/success.tsx
- D:/EXE/bbeauty-app/app/mua-detail.tsx
- D:/EXE/bbeauty-app/app/mua-onboarding/apply.tsx
- D:/EXE/bbeauty-app/components/booking/__tests__/AddressPickerSheet.test.tsx
- D:/EXE/bbeauty-app/components/booking/__tests__/BookingLocationCard.test.tsx
- D:/EXE/bbeauty-app/components/booking/AddressPickerSheet.tsx
- D:/EXE/bbeauty-app/components/booking/BookingLocationCard.tsx
- D:/EXE/bbeauty-app/components/location/AreaMap.native.tsx
- D:/EXE/bbeauty-app/components/location/AreaMap.tsx
- D:/EXE/bbeauty-app/components/location/AreaMap.web.tsx
- D:/EXE/bbeauty-app/components/location/ExploreNearby.tsx
- D:/EXE/bbeauty-app/components/location/LocationPicker.tsx
- D:/EXE/bbeauty-app/components/mua/__tests__/WorkLocationFields.test.tsx
- D:/EXE/bbeauty-app/components/mua/OperatingAreaFields.tsx
- D:/EXE/bbeauty-app/components/mua/WorkLocationFields.tsx
- D:/EXE/bbeauty-app/docs/ANDROID-LOCATION-TEST-CHECKLIST-2026-10-05.md
- D:/EXE/bbeauty-app/docs/EXTERNAL-NAVIGATION-IMPLEMENTATION-2026-10-05.md
- D:/EXE/bbeauty-app/docs/LOCATION-WORKPLACE-MAP-REPLACEMENT-AUDIT-2026-10-05.md
- D:/EXE/bbeauty-app/docs/ZERO-COST-LOCATION-PHASE-1-2026-10-05.md
- D:/EXE/bbeauty-app/docs/ZERO-COST-LOCATION-PHASES-2-7-2026-10-05.md
- D:/EXE/bbeauty-app/hooks/useMuaProfile.ts
- D:/EXE/bbeauty-app/LOCATION_SETUP.md
- D:/EXE/bbeauty-app/package-lock.json
- D:/EXE/bbeauty-app/package.json
- D:/EXE/bbeauty-app/repositories/__tests__/bookingDestination.test.ts
- D:/EXE/bbeauty-app/repositories/ApiBookingRepository.ts
- D:/EXE/bbeauty-app/repositories/ApiMuaProfileRepository.ts
- D:/EXE/bbeauty-app/repositories/ApiMuaRepository.ts
- D:/EXE/bbeauty-app/services/__tests__/externalNavigation.test.ts
- D:/EXE/bbeauty-app/services/__tests__/locationService.test.ts
- D:/EXE/bbeauty-app/services/externalNavigation.ts
- D:/EXE/bbeauty-app/services/locationService.ts
- D:/EXE/bbeauty-app/store/__tests__/bookingLocationDraft.test.ts
- D:/EXE/bbeauty-app/store/__tests__/playReviewSession.test.ts
- D:/EXE/bbeauty-app/store/useAuthStore.ts
- D:/EXE/bbeauty-app/store/useBookingStore.ts
- D:/EXE/bbeauty-app/types/ArtistDto.ts
- D:/EXE/bbeauty-app/types/booking.ts
- D:/EXE/bbeauty-app/types/location.ts
- D:/EXE/bbeauty-app/utils/locationCoordinates.ts
- D:/EXE/bbeauty-app/utils/muaOnboarding.ts
- D:/EXE/bbeauty-app/utils/workLocation.ts

Backend (bao gồm file xóa):

- D:/EXE/BeautyBook/BeautyBookBackend.Tests/BookingDestinationAccessTests.cs
- D:/EXE/BeautyBook/BeautyBookBackend.Tests/MuaPrivacyTests.cs
- D:/EXE/BeautyBook/BeautyBookBackend.Tests/WorkLocationTests.cs
- D:/EXE/BeautyBook/BeautyBookBackend/Controllers/LocationsController.cs
- D:/EXE/BeautyBook/BeautyBookBackend/Controllers/NearbyMuasController.cs
- D:/EXE/BeautyBook/BeautyBookBackend/Data/ApplicationDbContext.cs
- D:/EXE/BeautyBook/BeautyBookBackend/docs/AddWorkLocationAndBookingDestination.sql
- D:/EXE/BeautyBook/BeautyBookBackend/DTOs/BookingDtos.cs
- D:/EXE/BeautyBook/BeautyBookBackend/DTOs/MuaApplicationRequestDto.cs
- D:/EXE/BeautyBook/BeautyBookBackend/DTOs/MuaDtos.cs
- D:/EXE/BeautyBook/BeautyBookBackend/Migrations/20261005071302_AddWorkLocationAndBookingDestination.cs
- D:/EXE/BeautyBook/BeautyBookBackend/Migrations/20261005071302_AddWorkLocationAndBookingDestination.Designer.cs
- D:/EXE/BeautyBook/BeautyBookBackend/Migrations/ApplicationDbContextModelSnapshot.cs
- D:/EXE/BeautyBook/BeautyBookBackend/Models/Booking.cs
- D:/EXE/BeautyBook/BeautyBookBackend/Models/MakeupArtistProfile.cs
- D:/EXE/BeautyBook/BeautyBookBackend/Program.cs
- D:/EXE/BeautyBook/BeautyBookBackend/Services/AccountDeletionData.cs
- D:/EXE/BeautyBook/BeautyBookBackend/Services/AccountDeletionService.cs
- D:/EXE/BeautyBook/BeautyBookBackend/Services/AuthService.cs
- D:/EXE/BeautyBook/BeautyBookBackend/Services/BookingService.cs
- D:/EXE/BeautyBook/BeautyBookBackend/Services/LocationService.cs
- D:/EXE/BeautyBook/BeautyBookBackend/Services/MuaService.cs
- D:/EXE/BeautyBook/BeautyBookBackend/Services/WorkLocationPolicy.cs
