# BBook — Location / Nơi làm việc / Nearby / Booking / thay Google Maps

Ngày audit: 05/10/2026. Phạm vi: mã nguồn local mobile và backend; tài liệu chính thức của nhà cung cấp. Đây là đề xuất, chưa triển khai. Không đọc được cấu hình EAS cloud, APK trên điện thoại, Google Console hoặc production database; không suy đoán trạng thái các hệ thống đó.

## 1. Current Location Architecture

- Mobile dùng Expo ~57.0.24, React Native 0.86.3, react-native-maps ^1.27.2, expo-location ~57.0.19 (`package.json`).
- Become MUA: `app/mua-onboarding/apply.tsx` → `components/mua/OperatingAreaFields.tsx` → auth store/service/repository → POST `/api/Auth/become-mua` → `Services/AuthService.cs` → `Models/MakeupArtistProfile.cs` và `MuaOperatingArea`.
- Edit MUA: `app/(mua)/edit-profile.tsx` → cùng OperatingAreaFields → `repositories/ApiMuaProfileRepository.ts` → PUT `/api/Mua/profile` → `Services/MuaService.cs`.
- Chọn điểm: `components/location/LocationPicker.tsx` → `AreaMap.native.tsx` (Google provider), `AreaMap.web.tsx` (Google JS). `services/locationService.ts` quản lý GPS/catalog/search/select/reverse.
- Catalog nội bộ `/api/locations/areas`; tìm địa chỉ `/api/locations/search`; chi tiết `/api/locations/place`; reverse `/api/locations/reverse`. `Services/LocationService.cs` hiện gọi Google Places và Google Geocoding.
- Nearby: `components/location/ExploreNearby.tsx` → GET `/api/Mua/nearby` → `Controllers/NearbyMuasController.cs` → EF query trực tiếp database. Không gọi Google để tính khoảng cách.
- Booking: `app/checkout/index.tsx` → `components/booking/AddressPickerSheet.tsx` → `store/useBookingStore.ts` → booking repository/service → `DTOs/BookingDtos.cs`, `Services/BookingService.cs`, `Models/Booking.cs`.

## 2. Current “Điểm hoạt động chính” — REUSE

Entity có Latitude/Longitude nullable, OperatingLocationConfirmed, PublicMeetingPoint, OperatingLocationLabel; độc lập OperatingProvinceCode và OperatingAreas. Có Address nullable được BecomeMUA gán từ request.Address, nhưng UI chọn điểm hiện không cung cấp một luồng nhập địa chỉ nơi làm việc hoàn chỉnh. MuaUpdateDto không có Address, update service không cập nhật Address.

OperatingAreaFields yêu cầu tỉnh/khu vực; điểm riêng không bắt buộc. Bản đồ/GPS đặt tọa độ xác nhận. PublicMeetingPoint hiện yêu cầu điểm xác nhận và label. Xóa điểm xóa tọa độ/label/flags; đổi tỉnh cũng làm sạch điểm hiện có.

Owner edit nhận tọa độ thực. Public profile/detail trong MuaService chỉ trả tọa độ/label khi PublicMeetingPoint AND OperatingLocationConfirmed. Các projection này không trả profile.Address. Nearby cũng gate tọa độ/label theo hai flag. Không phát hiện Address leak trong các projection này; không đồng nghĩa đã chứng minh mọi endpoint khác an toàn.

Kết luận: **REUSE Latitude/Longitude/OperatingLocationConfirmed** làm một điểm vật lý tùy chọn. Không tạo thêm tọa độ studio tách khỏi tọa độ Nearby. Không coi label cũ là địa chỉ đầy đủ hoặc PublicMeetingPoint cũ là consent mới. Booking hiện chưa sử dụng profile point làm lựa chọn có kiểm soát.

## 3. Proposed WorkLocation Model

| Thành phần | Đề xuất | Quy tắc |
|---|---|---|
| OperatingProvinceCode + OperatingAreas | Giữ nguyên | Bắt buộc theo onboarding hiện tại; không phụ thuộc studio/GPS |
| Latitude/Longitude | Tái sử dụng | Cả hai null hoặc cả hai hợp lệ; không tự chèn 0,0/trung tâm tỉnh |
| OperatingLocationConfirmed | Giữ | Xác nhận tọa độ do MUA chọn; address-only không bị buộc có tọa độ |
| WorkLocationName | Nullable mới | Studio/salon/nơi làm việc; tên không bắt buộc |
| WorkLocationAddress | Nullable mới | Địa chỉ nơi làm việc cụ thể; không tự lấy Address cũ làm địa chỉ khách đến |
| AllowCustomerVisit | Boolean mới, default false | Consent độc lập; chỉ bật nếu có địa chỉ hợp lệ, không bắt buộc tọa độ |
| PublicMeetingPoint/OperatingLocationLabel/Address cũ | Giữ tương thích | Không tự suy ra consent mới; không tự công khai dữ liệu cũ |
| Booking.ServiceAddress/Latitude/Longitude | Tái sử dụng snapshot | Address bắt buộc khi đặt; tọa độ optional pair |
| Booking.ServiceLocationType | Nullable mới cho dữ liệu cũ | CUSTOMER_ADDRESS hoặc MUA_WORK_LOCATION cho booking mới |
| Booking.ServiceLocationName | Nullable mới | Snapshot tên nơi làm việc nếu có |

Chọn WorkLocationAddress riêng thay vì đổi nghĩa Address legacy: tránh tự biến dữ liệu cũ thành nơi nhận khách. Đây chỉ thêm một chuỗi địa chỉ, không thêm điểm/tọa độ thứ hai. Owner được xem/sửa dữ liệu của mình; public/Customer chỉ nhận workplace address/coords khi consent bật. API owner DTO và public DTO phải tách rõ.

Consent OFF vẫn cho backend sử dụng tọa độ cho Nearby. Consent ON với address-only vẫn cho khách đến nơi làm việc, nhưng không được gán vị trí giả để xuất hiện trong bán kính. Xóa nơi làm việc làm sạch name/address/coords/confirmed/consent một cách nguyên tử, không xóa OperatingAreas hay booking snapshot.

## 4. MUA Without WorkLocation

Được hoàn tất Become MUA nếu đáp ứng các điều kiện onboarding khác; vẫn chịu quy trình duyệt/eligibility hiện tại. Không thêm yêu cầu workplace vào eligibility, service, portfolio hoặc nhận booking đến địa chỉ khách.

Profile không hiện thẻ địa chỉ trống. Booking không hiện lựa chọn đến nơi MUA. Tìm theo tỉnh/khu vực vẫn thấy MUA nếu đủ điều kiện public; tìm bán kính không xếp MUA chưa có tọa độ vào kết quả khoảng cách. Có thể cung cấp danh sách khu vực riêng với distance=null, không gắn nhãn “gần bạn” hoặc giả khoảng cách.

## 5. Nearby Search

Hiện controller lọc Listed + Approved + user active/not deleted. Tỉnh/khu vực và tên có thể lọc. Khi có origin GPS, chỉ lấy profile confirmed có tọa độ; khi tìm theo tỉnh không origin, có thể lấy profile không tọa độ, DistanceKm=null.

Thuật toán hiện là khoảng cách đường chim bay: bán kính trái đất 6371 km và spherical law of cosines (acos, clamp -1..1), không phải khoảng cách chạy xe. Sort distance → RankScore → MuaId; paging pageSize tối đa 30; rate policy location-lookup; no-store.

Điểm private hiện được làm tròn hai chữ số thập phân TRƯỚC khi tính distance; exact coordinates không trả ra. PublicMeetingPoint hiện dùng tọa độ thực. Do đó không nên báo rằng code hiện dùng exact private distance hoặc tự fake center tỉnh. Đề xuất giữ cách tính private coarse này, đổi public gate sang consent mới; hiển thị “khoảng cách ước tính/đường chim bay”. Rounding grid không có nghĩa riêng tư tuyệt đối; không gửi exact private coordinates cho map/provider hoặc expose marker private.

Không dùng Google Distance Matrix/Directions. Nearby vẫn hoạt động khi tile/geocoder lỗi. Địa chỉ-only hoặc null coordinates chỉ tham gia lọc khu vực, không bán kính. Kiểm tra query translation/ordering với PostgreSQL thực trong test môi trường riêng.

## 6. Customer Booking Location

Hiện sheet có GPS và nhập địa chỉ; GPS dùng expo-location + reverseGeocodeAsync nhưng callback chỉ trả string nên mất tọa độ. Chưa có lựa chọn nơi MUA. Backend yêu cầu địa chỉ <=500 ký tự và validate tọa độ pair/range; đã lưu ServiceAddress/Latitude/Longitude snapshot, còn Address là alias tương thích. Chưa có location type/name hoặc kiểm tra consent workplace.

Đề xuất sheet có: “MUA đến địa chỉ của tôi” (GPS, nhập tay, tìm kiếm/chọn bản đồ) và “Tôi đến nơi làm việc của MUA” chỉ khi backend trả option hợp lệ. Manual address luôn confirm được dù GPS/provider thất bại; không bắt ép geocoding. GPS chỉ là gợi ý địa chỉ; người dùng kiểm tra/sửa rồi xác nhận.

CUSTOMER_ADDRESS: backend nhận địa chỉ do khách xác nhận và optional coordinates. MUA_WORK_LOCATION: backend lấy profile của chính createDto.MUAId, kiểm tra AllowCustomerVisit + workplace address tại thời điểm submit, tự snapshot địa chỉ/tên/tọa độ; không tin payload địa chỉ studio của client. Consent đổi OFF/address bị xóa giữa lúc chọn và submit phải trả lỗi rõ, yêu cầu chọn lại; không âm thầm đổi sang địa chỉ khách.

Booking cũ hiển thị snapshot đã lưu, không join profile mới để thay địa chỉ. Sửa/xóa workplace hoặc tắt consent chỉ ảnh hưởng booking tương lai; snapshot cũ vẫn chỉ được xem bởi các bên có quyền của booking. Account deletion/retention hiện tại phải tiếp tục được tôn trọng, không giữ snapshot trái quy tắc xóa dữ liệu.

Draft hiện in-memory, setMua chỉ đổi mua/time nên vẫn giữ address khi đổi MUA. Cần typed location object chứa mode, sourceMuaId, name/address/coords. Đổi sang MUA khác clear MUA_WORK_LOCATION và dữ liệu dịch vụ thuộc MUA trước; CUSTOMER_ADDRESS có thể giữ nếu vẫn hợp lệ. Cùng MUA/đổi dịch vụ giữ location nhưng kiểm tra lại option trước submit. Login/logout/session expiry hiện resetDraft; đường deleteAccount cần bổ sung reset vì chưa gọi. Không thêm persist draft trong release này; restart không phục hồi một lựa chọn studio cũ không được kiểm chứng.

## 7. Current Google Maps Dependencies

| Phân loại | Hiện có | Đề xuất |
|---|---|---|
| REMOVE sau thay renderer | react-native-maps; AreaMap.native Google provider | Gỡ dependency + lockfile + imports khi không còn consumer |
| REMOVE | app.config.ts maps plugin, GOOGLE_MAPS_ANDROID_KEY/IOS_KEY | Gỡ cấu hình Maps; regenerate/rebuild native sau kiểm tra diff |
| REMOVE | AreaMap.web Google JS, EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY | Dùng renderer web cùng provider mới |
| REMOVE | LocationService Google Places/Geocoding, Maps:ServerApiKey | Thay provider adapter; không có fallback Google ngầm |
| REPLACE đường gọi | expo-location.reverseGeocodeAsync | Không dựa vào OS geocoder không kiểm soát provider; route reverse qua provider mới hoặc nhập tay |
| REPLACE | directionsUrl google.com/maps/dir | Đây là outbound URL, không phải Maps SDK; bỏ hardcode, chọn cách mở chỉ đường độc lập/ngoài app sau chốt UX |
| KEEP | expo-location foreground GPS | Thu tọa độ thiết bị; không phải Google Maps rendering/Places API |
| KEEP / UNRELATED | google-services.json, Firebase/FCM, push notifications | Không xóa vì bỏ Maps |
| UNRELATED | Backend Google Auth dormant | Ngoài phạm vi; không sửa endpoint/field/migration auth |

Ảnh bản đồ đen phù hợp với thiếu/không hợp lệ native Maps config. Local app.config chỉ chèn key khi biến môi trường có; manifest local chưa có Maps API_KEY. Chưa có logcat/APK/EAS config để kết luận nguyên nhân chính xác trên máy người dùng (key restriction/billing/network/rendering cũng chưa kiểm chứng). Không đề xuất mở billing Google vì release đã chọn bỏ Maps Platform.

## 8. Map Replacement Recommendation

Đề xuất **MapLibre React Native v11 + Geoapify OSM tiles + Geoapify address APIs**; web dùng MapLibre GL JS. MapLibre là renderer, không tự cấp dữ liệu, tìm địa chỉ hoặc API quota.

MapLibre docs yêu cầu RN >=0.80, New Architecture v11, Android >=23. Dự án RN0.86.3 nằm trên yêu cầu tối thiểu, nhưng đó chưa chứng minh compile/runtime SDK57. Phải thử development native build trước; không dùng Expo Go. Plugin Expo được hỗ trợ và cần rebuild; docs hiện dùng MapLibre Android13.6.1/iOS6.31.0. Pin bản package và native dependency đã xác minh, không tự upgrade Expo/RN.

Nguồn: [MapLibre requirements](https://maplibre.org/maplibre-react-native/docs/setup/getting-started/), [Expo setup](https://maplibre.org/maplibre-react-native/docs/setup/expo/).

Geoapify cung cấp style.json tương thích MapLibre và raster/vector OSM tiles, address autocomplete, forward và reverse geocoding. BBook backend proxy address APIs, chuẩn hóa response nội bộ; không trả Google place IDs sang provider mới. Autocomplete selection phải có provider/opaque token hợp lệ, hoặc tọa độ đã được adapter chuẩn hóa; không coi Place Details Geoapify là bản thay thế trực tiếp Google Places ID.

Nguồn: [Map styles](https://apidocs.geoapify.com/docs/maps/), [Forward geocoding](https://apidocs.geoapify.com/docs/geocoding/), [Autocomplete](https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/).

Free hiện 3.000 credits/ngày, tối đa 5 requests/second theo bảng plan; commercial production được phép với attribution/quota. API10 hiện $59/tháng, 10.000 credits/ngày, 12 requests/second (giá chưa thuế). Đây không phải 3.000 lần mở bản đồ: tile 0,25 credit/request; autocomplete/forward/reverse mỗi request 1 credit. Map loads gồm nhiều tile; phải đo usage của 12 tester thay vì hứa miễn phí đủ mãi. Map tile rate có quy tắc riêng theo tài liệu provider.

Nguồn: [Pricing/commercial use](https://www.geoapify.com/pricing/), [Credit costs](https://www.geoapify.com/pricing-details/).

MVP: mở map khi người dùng yêu cầu; debounce search 400–600ms, min 3 ký tự, cancel stale query; giới hạn endpoint/rate/cache theo policy provider; timeouts và quota handling. Geocoder key chỉ server; tile key client phải xem là public, tách key/quota theo môi trường và xác minh khả năng restriction cho native. Không giả định referrer restriction web bảo vệ AAB. Hiển thị attribution Geoapify/OSM theo style/license kể cả custom UI. Chọn style OSM phù hợp, kiểm tra không kéo Google/third-party style ngoài lựa chọn đã duyệt.

Không dùng public OSM tiles hoặc public Nominatim làm hạ tầng unlimited. Nominatim public có giới hạn 1 request/second và cấm client autocomplete; OSM public tile có policy riêng, cache/attribution/identification và giới hạn sử dụng. [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/), [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/).

Nâng cấp trả phí cùng Geoapify khi đo usage vượt quota; provider abstraction cho phép thay nhà cung cấp sau này. Chưa đề xuất tự host tiles/geocoder hoặc routing engine cho bản đầu. Độ phủ địa chỉ Việt Nam và tên hành chính mới phải thử bằng địa chỉ thực ở các khu vực mục tiêu; không hứa bằng Google. Catalog operating areas nội bộ vẫn là nguồn chuẩn, không bị provider tự ghi đè.

## 9. Migration — YES, nhưng chưa tạo/chạy

Additive tối thiểu: WorkLocationName nullable, WorkLocationAddress nullable, AllowCustomerVisit non-null default false trên MUA; ServiceLocationType nullable, ServiceLocationName nullable trên Booking. Tái sử dụng tọa độ/snapshot hiện có, không tạo bảng nhiều studio.

Không backfill consent từ PublicMeetingPoint; không tự copy Address/label cũ vào địa chỉ công khai. Owner có thể xem dữ liệu legacy như thông tin hiện có và chủ động xác nhận vào form mới. Giữ toàn bộ dữ liệu/booking cũ. Booking type cũ nullable và UI hiển thị địa chỉ legacy, không đoán là studio. Migration review trên DB test có bản dữ liệu mẫu, rồi mới lên kế hoạch production riêng; không chạy trong audit này.

## 10. API Changes — proposal only

- Extend BecomeMUA/owner profile update/read DTO với optional workplace name/address/consent + tọa độ cũ. Giữ validation OperatingAreas. Phân biệt omitted (giữ), explicit clear (xóa) và giá trị mới; cho phép sửa address-only/tắt consent không cần gửi tọa độ.
- Public detail/profile chỉ trả workplace option khi consent true và address hợp lệ; private profile coordinate không trả. Deprecated PublicMeetingPoint không được bypass consent mới.
- Nearby giữ distance algorithm/private rounding, đổi gate public point; area-only không coords vẫn null distance.
- Booking create nhận location type; studio source-of-truth theo MUAId trong backend; response trả snapshot type/name/address/coords. Alias Address legacy vẫn nhận để tránh phá client cũ; payload cũ được coi customer-address chứ không tự suy ra studio.
- Giữ route locations hiện có nếu contract chuẩn hóa được; implementation provider có interface cho autocomplete/select/forward/reverse. Input tọa độ pair/range, q bounded, cancel/timeout/rate-limit; không log raw địa chỉ/token/key không cần thiết.
- Cần test tất cả public serializers/controller projections và cache invalidation profile/Nearby sau update. Không có endpoint tạo/thay studio ở MUA khác; owner ID lấy từ auth context.

## 11. UI Changes

Shared form Become/Edit: giữ Tỉnh/Thành phố + Khu vực nhận khách; đổi “Điểm hoạt động chính” thành “Nơi làm việc (không bắt buộc)”. Có tên optional, địa chỉ manual, chọn map/GPS/search optional và checkbox “Cho phép khách đến nơi làm việc này”. Giải thích bật là hiển thị địa chỉ cho khách; không bật vẫn có thể dùng điểm để tính Nearby nhưng không hiện địa chỉ chính xác.

Cho phép thêm/sửa/xóa; dữ liệu chỉ commit khi xác nhận/save. Đóng sheet không làm đổi form đã lưu. Sửa địa chỉ sau khi chọn pin phải clear hoặc yêu cầu xác nhận lại tọa độ để tránh mismatch. Provider không tìm thấy không chặn nhập tay. Không tự bật visit sau chọn map. Consent chỉ bật khi địa chỉ không trống; không bắt tên hay GPS.

Booking sheet như mục6; summary trước đặt hiển thị mode + địa chỉ; trang chi tiết Customer/MUA dùng snapshot. MUA không workplace không hiện nút đến studio. Nearby private chỉ list distance; public markers nếu consent hợp lệ. Không hiển thị marker ở 0,0.

## 12. Privacy Impact

Workplace có thể là nhà riêng, vì vậy consent mặc định false; exact address/coords không được gửi vào public profile/Nearby khi OFF. Tile provider có thể nhận IP/viewport; geocoder nhận truy vấn địa chỉ/tọa độ qua backend. Cần mô tả dễ hiểu bên cung cấp bản đồ và mục đích, đánh giá vai trò xử lý dữ liệu/retention thực tế; không mặc định mọi vendor transfer đều phải tick “chia sẻ”, cũng không khẳng định “không chia sẻ” trước rà policy/contract.

Chỉ xin foreground location khi nhấn GPS; không background tracking. Nhập tay và area selection hoạt động khi từ chối quyền. Balanced accuracy không bảo đảm chỉ approximate; phải kiểm tra tọa độ thực và khai báo tương ứng. Không lưu lịch sử vị trí liên tục.

Chưa sửa Privacy Policy/Data Safety trong audit. Chốt sau implementation và inventory SDK/AAB/network/log thực tế; không coi đổi sang OSM là tự động hết thu thập vị trí. Account deletion cần xử lý fields mới, booking retention/redaction theo chính sách hiện hành, và reset draft local.

## 13. Android / EAS / Google Play Impact

MapLibre là native dependency nên rebuild dev client/AAB; OTA hoặc JS export không đủ. Expo Go không test được phần này. Kiểm tra generated manifest/Gradle không còn Maps SDK/key/plugin, nhưng Firebase/FCM vẫn còn đúng cấu hình.

Android local compile/target36 và AGP8.12.0 không tự chứng minh AAB cuối đúng: cần kiểm tra artifact EAS, ABI/native libraries/16KB alignment, runtime trên thiết bị, minSDK tương thích, permissions foreground và không background. Native folders local không phải bằng chứng cloud build đang dùng cùng config. Ghi lại build config/version và test AAB qua Closed Testing sau duyệt phạm vi.

Kiểm tra auth email-only/OTP/reset-password/push không regression; Maps removal không được kéo theo Google Authentication hay FCM changes. Không build/push/deploy trong audit này. Không thể bảo đảm reviewer chấp thuận chỉ bằng báo cáo source audit.

## 14. Files Expected To Change

Mobile (đường dẫn dưới `D:/EXE/bbeauty-app/`):

- `package.json`, `package-lock.json`, `app.config.ts`; `app.json`/`eas.json` chỉ nếu cần config native/provider tương ứng.
- `components/location/AreaMap.native.tsx`, `AreaMap.web.tsx`, `AreaMap.tsx`, `LocationPicker.tsx`, `ExploreNearby.tsx`; adapter renderer/provider mới nếu cần.
- `components/mua/OperatingAreaFields.tsx`, `app/mua-onboarding/apply.tsx`, `app/(mua)/edit-profile.tsx`.
- `types/location.ts`, `types/onboarding.ts`, `types/booking.ts`, MUA profile DTO/types liên quan.
- `services/locationService.ts`, `repositories/ApiMuaProfileRepository.ts`, auth repository mapping BecomeMUA, booking request mapping.
- `components/booking/AddressPickerSheet.tsx`, `app/checkout/index.tsx`, `store/useBookingStore.ts`, `store/useAuthStore.ts` (reset on deletion); booking summary/detail components sử dụng snapshot.
- Location/workplace/booking test files; env example/doc config (chỉ names, không secret). Privacy screen/content chỉ ở giai đoạn kiểm chứng xong.

Backend (đường dẫn dưới `D:/EXE/BeautyBook/BeautyBookBackend/`):

- `Models/MakeupArtistProfile.cs`, `Models/Booking.cs`, `DTOs/MuaApplicationRequestDto.cs`, `DTOs/MuaDtos.cs`, `DTOs/BookingDtos.cs`.
- `Services/AuthService.cs`, `Services/MuaService.cs`, `Services/BookingService.cs`, `Controllers/NearbyMuasController.cs`.
- `Services/LocationService.cs`, `Controllers/LocationsController.cs`, `Program.cs` DI/config; provider interface/adapter mới.
- `Data/ApplicationDbContext.cs`, additive migration + model snapshot (chỉ sau phê duyệt triển khai).
- `Services/AccountDeletionService.cs`, `Services/AccountDeletionData.cs` nếu bổ sung redaction field mới; review quyền truy cập snapshots.
- `D:/EXE/BeautyBook/BeautyBookBackend.Tests/` location/nearby/booking/update/deletion tests.

Web `D:/EXE/bbook-web/`: policy content tương ứng ở giai đoạn cuối nếu vendor/data flow thay đổi; không cần thay website bằng MapLibre nếu website không có renderer Maps.

## 15. Risks — observed or unresolved

1. Google renderer/platform dependencies thực sự còn trong source; map đen trên ảnh chưa có log để kết luận cloud key/billing.
2. LocationService Google adapter chưa trừu tượng; Google place IDs không portable.
3. Native MapLibre SDK57/RN0.86 compile/runtime chưa kiểm chứng; JS/typecheck không thay native smoke test.
4. PublicMeetingPoint legacy không phải consent mới; phải thay tất cả gate public, không chỉ UI checkbox.
5. Legacy Address khác semantics; không tự công khai/copy consent. Owner update chưa hỗ trợ workplace address-only.
6. GPS booking bỏ tọa độ và chưa có timeout chung; draft address giữ khi đổi MUA. New typed draft cần tránh stale studio snapshots.
7. Provider quota và độ phủ địa chỉ VN chưa đo bằng project/account thực; manual fallback bắt buộc.
8. Rounding private point giảm độ chính xác nhưng không phải ẩn danh tuyệt đối; Nearby không được expose exact distance/coords private qua endpoint khác.
9. Đổi địa chỉ/tắt consent trong lúc checkout và xóa tài khoản cần test transaction/authorization/cache behavior.

## 16. Recommended Implementation Order

1. Chốt audit/model: một nơi làm việc, shared coords, explicit consent false, manual address, backend studio snapshot. Phê duyệt provider và phạm vi trước sửa.
2. Compatibility spike cô lập: pin MapLibre, dev native build SDK57/RN0.86, render style/marker/tap/camera + bottom sheet trên Android; kiểm tra attribution, loading/error, không Google Maps dependency. Nếu thất bại, báo blocker trước mở rộng thay đổi.
3. Backend additive DTO/model/validation + migration proposal review; giữ client cũ. Provider adapter Geoapify autocomplete/forward/reverse, timeout/rate limit. Chỉ chạy DB test trong giai đoạn được phép.
4. Owner/public consent gates + Nearby privacy; kiểm tra dữ liệu cũ defaultfalse, area-only/null coords, khôngfake origin; tests SQL/provider failures.
5. Shared Become/Edit workplace form + MapLibre renderer web/native; manual fallback; chỉ xin GPS qua thao tác người dùng.
6. Typed booking draft/sheet + backend studio source-of-truth + immutable snapshot; test switching MUA/service, consent/address race, unauthorized request.
7. Regression/typecheck/lint/tests; native dev/release build/AAB + actual devices; search toàn source/deps/generated manifest/network để không còn Google Maps Platform calls/config. Giữ Firebase/FCM.
8. Rà Privacy/Data Safety với hành vi cuối; test deletion/retention; sau đó mới có kế hoạch build/phát hành riêng và Closed Testing.

### Ma trận nghiệm thu cho bước triển khai

| Nhóm | Ca bắt buộc | Kết quả cần đạt |
|---|---|---|
| Become MUA | Không workplace; chỉ address; address+pin; GPS deny | Vẫn theo onboarding/approval hiện tại; không ép location |
| Edit | Add/edit/delete; đổi tỉnh; cancel; restart | Save đúng; cancel không commit; legacy không mất hoặc tự public |
| Consent | OFF→ON→OFF; address-only; blank address | Không exact leak OFF; ON phải địa chỉ; OFF xóa lựa chọn tương lai |
| GPS/map | Permission denied/permanent deny, services OFF, timeout | Fallback manual; không loading vô hạn; không background |
| Provider | Tile/search/reverse fail, offline, quota, stale autocomplete | Manual confirm được; thông báo đúng; không fallback Google |
| Nearby | Private/public/no coords; radius/area; paging/filter | Coarse private; area-only null distance; nofake markers; SQL chạy đúng |
| Booking | Customer GPS/manual/map; studio with/without coords | Backend snapshot đúng mode/address/coords, ownership MUA đúng |
| Race | Consent OFF/delete/change address trước submit | Backend kiểm tra lại; báo lỗi hoặc snapshot dữ liệu hợp lệ thời điểm submit |
| Snapshot | MUA sửa/xóa nơi làm việc sau booking | Booking cũ không bị sửa theo profile, access control đúng |
| Draft | Đổi MUA; cùng MUA đổi service; rebooking; logout/switch/deletion/restart | Không giữ studio MUA cũ; session mới không leak draft |
| Security | Sửa MUAId/studio payload, half coords, out-of-range, empty/long address | Server reject hoặc tự lấy dữ liệu đúng MUA, không tin client studio |
| Release | Native build/dev/release, permissions, FCM/email auth, AAB libs | Không MapsPlatform key/SDK/call; các luồng ngoài location vẫn hoạt động |

Validation trong lượt này: đọc và đối chiếu source/config local + tài liệu official; chưa chạy test/build cho chức năng đề xuất vì chưa sửa/được phê duyệt. File mới duy nhất trong lượt audit là báo cáo này. Dừng ở audit.
