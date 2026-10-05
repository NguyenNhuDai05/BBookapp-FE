# BBook — Zero-cost location: Phase 1

Ngày: 05/10/2026. Đây là báo cáo checkpoint Phase 1 theo yêu cầu triển khai. Chưa chuyển sang schema/migration.

## 1. Files changed

Tất cả file dưới `D:/EXE/bbeauty-app/`:

- `services/locationService.ts`
- `services/__tests__/locationService.test.ts`
- `components/location/LocationPicker.tsx`
- `components/location/ExploreNearby.tsx`
- `components/mua/OperatingAreaFields.tsx`
- `components/booking/AddressPickerSheet.tsx`
- `components/booking/__tests__/AddressPickerSheet.test.tsx` (mới)
- `store/useBookingStore.ts`
- `types/booking.ts`
- `repositories/ApiBookingRepository.ts`
- `app/checkout/index.tsx`
- Báo cáo này (mới).

Không sửa source backend. Trước sửa, mobile/backend cùng nhánh `feature/fixbeforeclosedtest`; backend clean, mobile chỉ có báo cáo audit chưa tracked. Không ghi đè thay đổi code của công việc khác.

## 2. What was implemented

- LocationPicker hiện chỉ có GPS do người dùng chủ động nhấn và bước xác nhận; bỏ bản đồ, autocomplete, chọn Google place, reverse geocoding. Đóng sheet không lưu candidate.
- Nearby chỉ hiển thị danh sách; bỏ tab bản đồ và nút Google directions. Giữ GPS/radius, lọc tỉnh/khu vực, tìm tên, paging và query backend cũ. Wording khoảng cách đường thẳng ước tính, không phải quãng đường lái xe.
- MUA picker bỏ “Chọn trên bản đồ”, dùng GPS. Không tự xác định/đổi tỉnh hoặc khu vực từ GPS. Operating Areas/catalog vẫn giữ nguyên.
- Booking address dùng helper GPS chung; GPS không tạo/thay địa chỉ. Địa chỉ nhập tay vẫn bắt buộc; GPS tùy chọn có thể bỏ riêng. GPS-only không xác nhận được địa chỉ trống.
- Tọa độ khách được giữ trong draft memory (`addressCoordinates`) và gửi `serviceLatitude`/`serviceLongitude` vào backend fields đã có. Mở lại sheet nhận tọa độ đã xác nhận; chỉnh địa chỉ không tự geocode/thay GPS. Cancel không commit pending GPS.
- Helper GPS kiểm tra quyền hiện có trước request, không request lại khi đã cấp hoặc bị chặn vĩnh viễn. GPS OFF không tự ép mở Settings. Lấy tọa độ timeout 15 giây, lỗi native/denied/blocked được báo dễ hiểu. Reject non-finite/out-of-range/0,0.

## 3. Architecture decisions

Không map/provider mới; chỉ expo-location device coordinates + manual address + internal catalog + backend Nearby. Không reverse/forward geocoding trong frontend flow mới. Không tọa độ mặc định/trung tâm tỉnh. Address và GPS độc lập, có hướng dẫn user xác nhận địa chỉ.

Không thêm schema để lưu customer GPS: reuse backend ServiceLatitude/ServiceLongitude hiện có. `addressCoordinates` là foundation nhỏ trên draft hiện tại, chưa thay thế typed location mode/sourceMuaId của Phase 5. Không persist draft.

Shared WorkLocation name/address/AllowCustomerVisit sẽ triển khai Phase 2–3; Phase 1 chưa đổi entity semantics, chưa biến PublicMeetingPoint cũ thành consent mới.

## 4. Tests run

- TypeScript `npx tsc --noEmit`: PASS, gồm test mới.
- ESLint các file thay đổi: PASS sau sửa computed namespace reference trong test và bỏ import không dùng.
- Full Expo lint: FAIL với 3 lỗi cũ ở `app/(admin)/payouts/[id].tsx`, `app/(admin)/private-media.tsx`, `components/PrivateMediaImage.tsx`; lượt lint full ghi 14 warnings. Không sửa ngoài phạm vi.
- Full Jest lượt đầu: không chạy được test do EPERM ghi transform cache tại sandbox Temp. Đổi cache sang `.expo/jest-location-phase1` trong workspace, không đổi cấu hình project.
- Full Jest chạy lại: 38 suites PASS, 3 suites FAIL; 235 tests PASS, 4 FAIL do timeout mặc định 5 giây (QR form, ServiceFormModal, muaApply).
- Rerun muaApply + AddressPickerSheet với timeout 30 giây: 2 suites / 9 tests PASS. Test GPS-only ban đầu dùng sai node để đọc disabled; đã sửa sang accessible button và chạy lại PASS.
- Rerun QR form + ServiceFormModal với timeout 30 giây: 2 suites / 26 tests PASS. Không đổi production code hay timeout cấu hình của project để làm test qua.
- Helper GPS: 15 tests PASS cho permission/granted/denied/blocked, GPS OFF, timeout và late result, native errors, invalid coords, không geocode/provider, giữ catalog/Nearby endpoints.
- Backend `dotnet test ... --filter FullyQualifiedName~MuaLocationTests --no-restore`: 7/7 PASS và backend compile PASS; có warnings sẵn trong ServiceController/MuaService. Các test PostgreSQL chỉ kiểm tra SQL translation, không kết nối DB hoặc chạy migration. Không coi đây là live PostgreSQL integration test.
- Search runtime frontend: không còn caller AreaMap, reverseGeocodeAsync/geocodeAsync, location search/place/reverse hoặc Google directions trong app/components/services active flows. Chỉ AreaMap orphan files vẫn chứa map implementation, chờ Phase 6.
- Android JS/Hermes export: PASS (`npx expo export --platform android --output-dir .expo/location-phase1-android --max-workers 1`), 3.865 modules, xuất bundle .hbc và metadata. Các lượt sandbox trước đó chạy chậm được dừng; lượt local ngoài sandbox với một worker hoàn tất. Không phải native Gradle/EAS/AAB build.

## 5. PASS / FAIL

Foundation GPS/manual/Nearby frontend: các test kiểm chứng nêu trên PASS, bundle Android PASS. Test mới gồm 15 helper GPS và 6 AddressPickerSheet; các ca regression timeout ban đầu đều PASS khi rerun riêng như ghi ở mục4. Không tuyên bố full-suite chạy một lượt đã PASS. Full lint còn FAIL do lỗi ngoài location. Chưa thể xác nhận release native/AAB hoặc toàn bộ acceptance criteria của Phase 2–7.

## 6. Migration created / changed

Không tạo, sửa hoặc chạy migration; không kết nối/thay đổi production database. Backend schema giữ nguyên.

## 7. Dependencies added / removed

Không thêm/gỡ dependency trong Phase 1. Không MapLibre/Geoapify/OSM/Nominatim/provider account/key/billing. Giữ react-native-maps tạm thời theo thứ tự cleanup Phase 6 sau search/test xác nhận không consumer.

## 8. Remaining Google Maps dependencies

Vẫn còn `react-native-maps` trong package/lock, orphan `AreaMap.tsx`/`.native.tsx`/`.web.tsx`, Maps plugin/key config trong `app.config.ts`, backend Google LocationService và `/locations/search`, `/locations/place`, `/locations/reverse`.

Frontend mới không phụ thuộc các route đó. Backend route có thể vẫn phục vụ client cũ/call trực tiếp, nên chưa tuyên bố toàn hệ thống không còn Google Maps Platform. Đánh giá/disable compatibility routes và cleanup dependency ở Phase 6.

Firebase/google-services.json/FCM/notifications/Google Play config không sửa. Google Login ngoài phạm vi, không sửa auth code.

## 9. Privacy / security impact

Không thêm tracking/background location, không request permission khi mount. Không gửi address/GPS sang provider bản đồ/geocoder trong flow frontend mới; GPS Nearby và optional booking coordinates vẫn được gửi backend BBook theo chức năng yêu cầu. Không thêm raw address/GPS logging.

Private Nearby coarse rounding/query backend chưa sửa; 7 backend tests xác nhận validation/SQL behavior không regression. Consent/public DTO mới thuộc Phase 2–4, vì vậy public flags legacy vẫn tồn tại ở checkpoint này. Chưa sửa Privacy Policy hay Data Safety.

## 10. Risks / blockers

- Native Android/EAS/AAB và permission behavior trên máy thật chưa test; JS export không thay thế native validation.
- Full lint còn 3 lỗi cũ. Trước release phải xử lý ở công việc phù hợp.
- Chưa có WorkLocation fields/AllowCustomerVisit/mode booking; không sử dụng checkpoint này như bản đã hoàn tất tính năng release.
- react-native-maps còn đóng gói cho đến Phase 6; backend geocoder còn hoạt động cho route cũ. Chưa đáp ứng tiêu chí loại bỏ toàn bộ Maps Platform.
- Chưa sửa setMua studio-draft safety/delete-account reset; Phase 5 xử lý typed modes sau khi backend contract rõ. Hiện chỉ lưu GPS địa chỉ khách, chưa có lựa chọn studio mới.

## 11. Next phase

Phase 2: additive WorkLocation fields/DTO/validation/owner-public privacy gates và migration local default AllowCustomerVisit=false. Không tự backfill Address/PublicMeetingPoint legacy, không đổi eligibility. Báo cáo Phase 1 được bàn giao trước mọi thay đổi schema theo checkpoint user yêu cầu.

Không push/merge/deploy, production migration/env/database hoặc Play Console action trong lượt này.
