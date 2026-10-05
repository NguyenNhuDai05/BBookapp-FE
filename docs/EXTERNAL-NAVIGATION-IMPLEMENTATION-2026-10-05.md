# BBook — External navigation addition — 05/10/2026

## Phạm vi và trạng thái

Đã bổ sung Copy Address / Open Map vào chi tiết booking Customer và MUA trên các snapshot booking hiện có. Đây là phần bổ sung sau Zero-Cost Location Phase 1, không phải xác nhận toàn bộ kiến trúc WorkLocation đã hoàn tất.

Luồng tạo booking `MUA_WORK_LOCATION`, schema WorkLocation và `AllowCustomerVisit` thuộc các phase tiếp theo, chưa được triển khai trong lần bổ sung này. UI hỗ trợ snapshot có type/name rõ ràng khi backend cung cấp; không suy đoán type từ booking cũ.

Không push, merge, deploy, chạy migration, sửa production DB/env, Google Play Console hoặc Privacy Policy/Data Safety.

## 1. Files changed trong phần bổ sung này

Mobile, thư mục gốc `D:/EXE/bbeauty-app/`:

- `services/externalNavigation.ts`: helper hand-off dùng Linking hiện có.
- `utils/locationCoordinates.ts`: validator thuần dùng chung.
- `services/locationService.ts`: import/re-export validator, giữ hành vi GPS của Phase 1.
- `components/booking/BookingLocationCard.tsx`: card snapshot dùng chung.
- `app/booking/[id].tsx`: tích hợp card ở Customer.
- `app/(mua)/mua-booking/[id].tsx`: tích hợp card ở MUA.
- `app/checkout/index.tsx`: nhập chi tiết địa điểm/ghi chú.
- `types/booking.ts`: nhận coordinate snapshot và optional type/name.
- `repositories/ApiBookingRepository.ts`: giữ coordinate/type/name snapshot trong mapping.
- `package.json`, `package-lock.json`: thêm Expo Clipboard.
- `services/__tests__/externalNavigation.test.ts`.
- `components/booking/__tests__/BookingLocationCard.test.tsx`.
- `repositories/__tests__/bookingDestination.test.ts`.
- `docs/EXTERNAL-NAVIGATION-IMPLEMENTATION-2026-10-05.md`: báo cáo này.

Backend test mới: `D:/EXE/BeautyBook/BeautyBookBackend.Tests/BookingDestinationAccessTests.cs`.

Các thay đổi Phase 1 đang tồn tại trong working tree được giữ nguyên; danh sách riêng nằm trong `docs/ZERO-COST-LOCATION-PHASE-1-2026-10-05.md`. Không sửa source backend trong lần bổ sung này.

## 2. Existing fields reused

- Backend `Booking.ServiceAddress` (fallback legacy `Address`).
- Backend `Booking.ServiceLatitude`, `Booking.ServiceLongitude`.
- Backend `Booking.Notes` / mobile `draft.note`: chi tiết tòa nhà, tầng, căn hộ hoặc ghi chú khác; input tối đa 1.000 ký tự theo giới hạn backend hiện có.
- DTO mapping trước đây bỏ coordinate của response; nay giữ lại để navigation dùng đúng snapshot.
- Customer address vẫn bắt buộc, GPS vẫn không bắt buộc; GPS không tự tạo địa chỉ.

## 3. New fields added

Không thêm database field, navigation coordinate trùng lặp, Maps URL hoặc provider place ID.

Client `BookingDto` bổ sung optional nullable `serviceLatitude`, `serviceLongitude` tương ứng field backend đã có; `serviceLocationType` và `serviceLocationName` là contract snapshot dự kiến cho phase WorkLocation. Backend hiện chưa tạo/trả type/name mới này; mapper để null nếu không có. Không dùng profile làm fallback.

## 4. Android implementation

React Native `Linking.openURL`, Android `ACTION_VIEW`, không chọn package/provider:

- Có tọa độ hợp lệ: `geo:latitude,longitude?q=<encoded coordinate pair>`.
- Chỉ địa chỉ: `geo:0,0?q=<encoded address>`.

`0,0` ở URI truy vấn địa chỉ là cú pháp OS, không phải tọa độ destination được lưu trong BBook. OS quyết định app mặc định/chooser nếu có handler. Không ép Google Maps, không đảm bảo mọi map app hỗ trợ giống nhau.

Gọi openURL trực tiếp sau tap, bắt rejection và hiển thị fallback. Không dùng canOpenURL: tránh false negative do package visibility Android 11 mà không phải thêm manifest queries. Đã đối chiếu implementation Linking của React Native 0.86.3 trong project.

## 5. iOS implementation

Apple Map Links qua `https://maps.apple.com/`, dùng `ll` với tọa độ và `q` cho label; chỉ địa chỉ thì `q=<encoded address>`. Native OS xử lý URL, có thể mở Maps hoặc trình xử lý URL phù hợp. Không cài Google Maps và không thêm Google dependency.

Web/OS không hỗ trợ: chỉ Copy Address, không tạo link navigation giả. iOS native chưa được kiểm thử.

## 6. Dependency

Thêm `expo-clipboard ~57.0.2` bằng `expo install`, đúng bundled dependency của Expo SDK 57 hiện có. Project chưa có clipboard dependency và RN không còn core Clipboard phù hợp. Không thêm package cho navigation; dùng React Native Linking sẵn có.

Expo hiện tại ~57.0.24; React Native 0.86.3; Expo Router ~57.0.22. Native binary cần rebuild để có module Clipboard mới; không chỉ gửi JS OTA vào binary thiếu module.

## 7. Google Maps Platform / API / key

Phần bổ sung này không thêm Maps SDK, embedded map, Google/GEOAPIFY API, key, billing, tile provider, backend external-map request hoặc geocoder. Apple Map Link và Android geo URI chỉ hand-off khi user bấm.

Dependency/config Maps cũ từ trước vẫn chưa được gỡ toàn bộ: `react-native-maps`, component orphan và backend Google LocationService/config còn thuộc Phase 6 cleanup. Vì vậy chưa thể tuyên bố toàn bộ AAB/backend đã loại bỏ Google Maps Platform; chỉ phần bổ sung này không phụ thuộc vào chúng.

## 8. Address-only fallback

Địa chỉ được trim, loại control characters, sửa malformed Unicode rồi URI encode trong helper. Tiếng Việt, emoji, dấu cách, phẩy, `/`, `#`, `&` không thể đổi URI scheme hoặc chèn parameter.

Copy chỉ human-readable address; feedback “Đã sao chép địa chỉ”. Không có map handler hoặc openURL reject: giữ Copy và thông báo không mở được bản đồ. Copy reject/false có thông báo thử lại. Không tự gọi Google để tìm coordinate.

## 9. Coordinate navigation

Ưu tiên coordinate snapshot nếu cả hai là number finite, latitude [-90,90], longitude [-180,180], không phải cặp 0,0. Half pair, NaN/Infinity, ngoài giới hạn và 0,0 fallback địa chỉ. Không có địa chỉ lẫn GPS: ẩn cả hai action và hiện nội dung legacy phù hợp. Legacy GPS-only có thể mở bản đồ nhưng không có Copy Address.

Không đọc GPS hiện tại, draft hoặc live MUA profile để mở booking lịch sử. Không hiển thị/copy raw coordinate mặc định. Địa chỉ nhập tay và vị trí GPS có thể khác nhau nếu user chọn sai; BBook không geocode để đối chiếu tự động.

## 10. Privacy / WorkLocation

Card chỉ nhận booking snapshot, caller kiểm tra user hiện tại thuộc customer/mua của booking. Unauthorized card không render address, note hoặc action. Backend GET booking hiện có yêu cầu xác thực và query theo participant; không mở rộng quyền trong thay đổi này.

Helper không log raw địa chỉ/GPS, không tự mở ứng dụng và không truyền destination ra map app trước khi bấm. Địa chỉ chỉ được đưa vào clipboard khi bấm Copy.

Không truy cập/expose private MUA WorkLocation để enable map button. Tuy nhiên bảo vệ `AllowCustomerVisit` cho public DTO và việc tạo snapshot studio vẫn phải được triển khai/kiểm thử ở các phase WorkLocation. Kiểm thử hiện tại về thay đổi/xóa điểm profile là bằng chứng cho snapshot booking hiện có, không phải bằng chứng cho AllowCustomerVisit chưa tồn tại.

## 11. Tests run

- `npx tsc --noEmit`: PASS.
- ESLint các file của phần bổ sung: PASS.
- Mobile Jest toàn bộ: **45 suites / 282 tests PASS**, runInBand, timeout 30s.
- Trong đó GPS/manual address + external helper/card/mapper: **5 suites / 58 tests PASS**.
- Backend `BookingDestinationAccessTests`: **3 tests PASS**, SQLite trong bộ nhớ, không kết nối production DB. Test participant/stranger và sửa/xóa profile point không thay snapshot booking.
- `git diff --check`: PASS.
- Android JS/Hermes export: PASS, 3.873 modules, bundle khoảng 8 MB ở `.expo/external-navigation-android`. Đây không phải native APK/AAB build.

Coverage bổ sung: coordinate ưu tiên address; địa chỉ tiếng Việt/ký tự đặc biệt; injected scheme; malformed Unicode; half pair/out-of-range/NaN/Infinity/0,0; legacy address/GPS/empty; no handler/openURL reject; Clipboard false/reject; không tự mở map; unauthorized không render; mapper dùng snapshot và không suy đoán type; create request forward GPS/note. Phase 1 regression kiểm tra GPS-only không xác nhận địa chỉ và permission denied vẫn nhập tay.

Các test Linking/Clipboard là mock, không chứng minh native hand-off. Backend test là repository integration, không phải live HTTP/production hoặc end-to-end tạo booking studio.

Full lint ở Phase 1 có 3 lỗi và 14 cảnh báo tồn tại trước trong admin payouts/private-media và PrivateMediaImage; không sửa các file đó trong phạm vi này.

## 12. Native Android result

**Real/native Android hand-off: NOT TESTED.** `adb devices -l` không có thiết bị kết nối. Không cài/chạy app trên thiết bị và không chứng minh tọa độ đích hoặc Back-to-BBook thực tế.

Đã thử local Gradle assembleDebug; thiếu tài nguyên hệ thống khi chạy cùng các kiểm tra khác, phải dừng, chưa tạo APK được xác nhận. Không gọi đây là build PASS hoặc tính năng hoàn tất native. Typecheck/backend được chạy lại tuần tự và PASS.

## 13. Remaining limitations / release checklist

1. Hoàn thành Phase 2–5 WorkLocation/AllowCustomerVisit và backend tạo snapshot `MUA_WORK_LOCATION`. Kiểm tra Visit OFF không lộ address/coordinate; Visit ON address-only hoặc có GPS; đổi/xóa studio không đổi booking cũ.
2. Phase 6 gỡ SDK/config Maps còn lại sau audit, không ảnh hưởng GPS/internal catalog/nearby.
3. Rebuild native Android có Clipboard và test bằng thiết bị: GPS → booking → MUA detail → map đúng destination → Back về BBook; address-only; denied/off; no handler nếu có thể. Không phát hành dựa riêng Jest/JS export.
4. Kiểm tra UI trên màn hình nhỏ/font lớn. Test render hiện tại không phải screenshot QA thực tế.
5. iOS native chưa kiểm thử; web chỉ Copy.
6. Map app bên ngoài tự xử lý tìm địa chỉ/chỉ đường và chính sách của app đó. BBook không kiểm soát độ đúng của kết quả địa chỉ hoặc tính năng của handler.

## 14. Schema / migration impact

**Không có schema change hoặc migration trong phần bổ sung này.** Backend thay đổi chỉ là test. Không lưu Maps URL/place ID/navigation coordinates mới. Không migrate type của booking cũ bằng phỏng đoán.

## Tài liệu platform đã đối chiếu

- [Android common intents — Maps](https://developer.android.com/guide/components/intents-common#Maps).
- [React Native Linking](https://reactnative.dev/docs/linking).
- [Apple Map Links](https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html).
- [Expo SDK 57 Clipboard](https://docs.expo.dev/versions/v57.0.0/sdk/clipboard/).
