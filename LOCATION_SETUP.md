# Khu vực MUA, GPS và MUA gần bạn

Đã bổ sung chọn nhiều quận/huyện cũ hoặc phường/xã mới trong 34 tỉnh/thành; form tạo và sửa dùng chung. Hồ sơ cũ giữ mã khu vực cũ và chuyển sang danh sách một mục bằng migration `AddMuaOperatingAreasAndConfirmedLocation`.

Backend phải được deploy trước ứng dụng mới. Backend hiện tự chạy migration khi khởi động production. Chưa chạy migration lên database production trong lần sửa này.

## Cấu hình dịch vụ địa điểm

Trong Google Cloud, bật billing và Places API (New), Geocoding API. Tạo key cho Backend, giới hạn theo các API này; đặt biến môi trường trên dịch vụ Backend:

```text
Maps__ServerApiKey=<key-backend>
```

Không đặt key Backend trong EXPO_PUBLIC. Chưa có key: chọn khu vực thủ công và GPS trên điện thoại vẫn dùng được; tìm địa chỉ sẽ báo dịch vụ chưa cấu hình.

## Bản đồ

Expo Go dùng thư viện react-native-maps có sẵn. Khi build ứng dụng riêng, bật Maps SDK for Android/iOS, dùng key riêng được giới hạn theo package/SHA-1 hoặc bundle identifier:

```text
GOOGLE_MAPS_ANDROID_KEY=<key-android>
GOOGLE_MAPS_IOS_KEY=<key-ios>
```

`app.config.ts` lấy các biến này khi build. Cần build lại binary sau khi thêm key.

Với bản web, bật Maps JavaScript API, tạo browser key giới hạn đúng các domain web, đặt:

```text
EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY=<key-browser>
```

Build và deploy lại web. Key trình duyệt có thể công khai nhưng phải giới hạn domain và API. Tham khảo https://docs.expo.dev/versions/v57.0.0/sdk/map-view/.

## Cách sử dụng

MUA chọn tỉnh/thành và nhiều khu vực, sau đó tùy chọn xác nhận điểm hoạt động bằng GPS hoặc chạm bản đồ. Vị trí riêng được làm gần đúng trước khi tính khoảng cách và hiển thị. Chỉ bật điểm hẹn công khai cho studio hoặc địa điểm thực sự muốn công khai; điểm đó mới có nút chỉ đường.

Customer chọn GPS hoặc tìm và xác nhận địa điểm ở Khám phá, chọn bán kính 5/10/20/50 km, xem danh sách hoặc bản đồ. Có thể chọn khu vực thủ công nếu không cấp quyền GPS. Khoảng cách hiển thị là đường thẳng; nút chỉ đường mở Google Maps với điểm xuất phát đã chọn.

Vị trí tìm kiếm của Customer chỉ nằm trong phiên màn hình. Không theo dõi vị trí trực tiếp của MUA. Hồ sơ cũ phải xác nhận điểm hoạt động trước khi xuất hiện trong kết quả theo khoảng cách.

## API mới

- GET `/api/locations/areas`: danh mục phiên bản 2025-07.
- GET `/api/locations/capabilities`: tình trạng cấu hình tìm địa điểm.
- GET `/api/locations/search?q=...&sessionToken=...`: gợi ý địa chỉ, cần đăng nhập.
- GET `/api/locations/place?id=...&sessionToken=...`: lấy tọa độ địa điểm đã chọn, cần đăng nhập.
- POST `/api/locations/reverse`: tọa độ sang gợi ý khu vực, cần đăng nhập.
- GET `/api/Mua/nearby`: tìm theo latitude/longitude/radiusKm hoặc provinceCode/areaId, phân trang trên Backend.

Danh mục được đóng gói từ https://provinces.open-api.vn/api/v2/?depth=2; quận/huyện cũ là phạm vi độc lập, không tự coi một quận cũ tương đương một phường mới cùng tên.
