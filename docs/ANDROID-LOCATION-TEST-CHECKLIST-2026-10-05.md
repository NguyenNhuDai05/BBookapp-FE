# BBook — checklist Android location

Trạng thái kiểm thử thực tế: **NOT TESTED** cho đến khi người test chạy trên điện thoại và ghi kết quả. Jest, TypeScript, prebuild hoặc Gradle compile không thay thế kết quả này.

## Điều kiện trước khi test

- Backend dev/test đã chạy source mới và có migration `20261005071302_AddWorkLocationAndBookingDestination`. Không dùng database production cho việc thử migration.
- App Android dùng đúng API URL dev/test đó. Backend Render cũ chưa đủ để test các trường/mode mới; không tự deploy trong task này.
- Một tài khoản Customer và một MUA hợp lệ nhận booking; dùng dữ liệu và địa chỉ test, tránh số tiền thật. Nếu dùng tài khoản reviewer, dùng flow thanh toán mẫu hiện có; không biến tài khoản thường thành reviewer bằng client.
- Cài native binary rebuild sau khi đổi Clipboard/gỡ Maps; không dùng binary cũ hoặc chỉ reload JS.
- Nếu APK là debug/development client: máy tính chạy `npx expo start --dev-client`; điện thoại và máy tính cùng mạng/USB được thiết lập. APK debug không phải AAB để gửi Play.
- Ghi phiên bản APK, URL môi trường test, model Android/phiên bản OS và app bản đồ đang dùng. Không gửi mật khẩu/token hoặc địa chỉ nhà thật trong báo cáo.

## 1. Become MUA

1. Mở form: không hiện permission vị trí tự động.
2. Chọn tỉnh + khu vực, không nhập nơi làm việc: vẫn tạo hồ sơ được, eligibility không thêm yêu cầu nơi làm việc.
3. Nhập tên/địa chỉ nơi làm việc, không GPS, để quyền khách đến tắt: lưu được.
4. Bật quyền khách đến với địa chỉ, không GPS: lưu được.
5. Chọn GPS và cho phép foreground: trạng thái đã lưu GPS; địa chỉ không bị tự điền/thay đổi; quyền khách đến không tự bật.
6. Chỉ GPS, địa chỉ trống: yêu cầu nhập địa chỉ hoặc xóa nơi làm việc; không tạo nơi làm việc thiếu địa chỉ.
7. Từ chối GPS, GPS tắt và timeout: không crash/loading vô hạn; vẫn nhập tay/lưu được.

## 2. Edit Profile

1. Thêm/sửa tên và địa chỉ, lưu, mở lại: dữ liệu đúng.
2. Sửa địa chỉ sau GPS: GPS không bị geocode/thay đổi; có lời nhắc lấy lại/bỏ GPS khi chuyển nơi.
3. Lấy lại GPS và bỏ GPS: lưu/mở lại đúng.
4. Bật/tắt quyền khách đến, lưu/mở lại: đúng trạng thái.
5. Mở hồ sơ bằng Customer khi quyền tắt: không thấy địa chỉ/GPS chính xác hoặc lựa chọn đến nơi MUA.
6. Xóa nơi làm việc, lưu/mở lại: tên/địa chỉ/GPS/confirmation/quyền đã xóa; tỉnh/khu vực vẫn còn.
7. Sửa rồi Back không lưu: mở lại vẫn là dữ liệu server trước đó.
8. Hồ sơ legacy: không tự lấy Address cũ làm địa chỉ nơi làm việc, không dùng PublicMeetingPoint cũ làm consent mới.

## 3. Nearby

1. Bấm tìm bằng GPS rồi cấp quyền: danh sách/khoảng cách hoạt động.
2. MUA có GPS xác nhận, quyền khách đến tắt: vẫn có thể nằm trong Nearby, khoảng cách gần đúng; không có tọa độ/địa chỉ riêng hiển thị.
3. MUA không GPS: tìm bằng tỉnh/khu vực vẫn thấy nếu eligibility hợp lệ; không gắn khoảng cách giả.
4. Từ chối quyền vị trí: tìm bằng khu vực vẫn hoạt động.
5. Kiểm tra không có map/autocomplete và không cần map API key.

## 4. Customer address booking

1. Nhập địa chỉ không GPS, chọn ngày/giờ/dịch vụ: booking được tạo với địa chỉ snapshot.
2. Nhập địa chỉ + GPS: booking có địa chỉ và tọa độ snapshot.
3. GPS denied: vẫn đặt bằng địa chỉ tay.
4. GPS có nhưng địa chỉ trống, hoặc cả hai trống: không đặt được.
5. MUA mở booking: thấy đúng địa chỉ và ghi chú tòa nhà/tầng.

## 5. Booking nơi làm việc MUA

1. Quyền ON + địa chỉ, không GPS: Customer chọn “Đến nơi làm việc của MUA”; backend lưu tên/địa chỉ từ hồ sơ server.
2. Quyền ON + địa chỉ + GPS: snapshot có tọa độ đã xác nhận của MUA, không phải GPS Customer.
3. Quyền OFF hoặc không có địa chỉ: không có lựa chọn studio.
4. Customer đang checkout studio; MUA tắt quyền/xóa nơi làm việc trước khi submit: backend từ chối; chuyển sang địa chỉ Customer được.
5. Tạo booking, sau đó MUA sửa/xóa nơi làm việc/tắt quyền: chi tiết booking cũ giữ tên/địa chỉ/GPS cũ.
6. Chọn studio A rồi đổi sang MUA B: không còn studio A trong lựa chọn/destination gửi booking B. Cùng MUA đổi dịch vụ vẫn giữ lựa chọn đúng.
7. Logout/login tài khoản khác, session hết hạn, xóa tài khoản thành công: draft địa điểm được xóa. Khởi động app mới không phục hồi draft studio cũ.

## 6. Copy / Open Map — cả Customer và MUA

1. Address + GPS: Copy chỉ địa chỉ; “Mở bản đồ” tới đúng GPS snapshot.
2. Address-only: mở search địa chỉ tiếng Việt đúng; thử địa chỉ có khoảng trắng, dấu phẩy, `/`, `#`, `&`.
3. Bấm Back trong map app: về BBook an toàn; không tự mở lại bản đồ.
4. Nếu có nhiều map apps: Android dùng default/chooser tùy OS; không buộc cài Google Maps.
5. Nếu có thể dùng thiết bị không map handler: không crash, thông báo copy fallback.
6. Clipboard thành công có feedback, paste vào nơi thích hợp để kiểm tra; không copy raw GPS mặc định.
7. Booking legacy address-only/GPS-only/empty: không crash; action đúng dữ liệu có sẵn.
8. Chỉ tải màn booking thì không mở map tự động, không xin GPS.

## Ghi kết quả

Mỗi case ghi PASS/FAIL/NOT TESTED. Khi FAIL, ghi bước tái hiện, kết quả mong muốn/thực tế, ảnh hoặc lỗi đã che thông tin riêng và phiên bản APK/backend. Cần đặc biệt xác nhận điểm đến GPS và Back từ app bản đồ trên Android thực tế; chưa được đánh dấu PASS bằng unit test.
