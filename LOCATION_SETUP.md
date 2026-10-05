# BBook — Location zero-cost (05/10/2026)

Release dùng GPS thiết bị khi người dùng chủ động yêu cầu, địa chỉ nhập tay và danh mục tỉnh/khu vực nội bộ. Không có embedded map, autocomplete, geocoder hoặc map API key/billing.

## Nơi làm việc

Tỉnh/thành + khu vực nhận khách vẫn bắt buộc. Nơi làm việc không bắt buộc: tên, địa chỉ, optional GPS và quyền cho khách đến (mặc định tắt). Có địa chỉ không GPS vẫn hợp lệ. GPS không điền địa chỉ và sửa địa chỉ không thay GPS. Xóa nơi làm việc không xóa khu vực nhận khách hoặc snapshot booking cũ.

Địa chỉ/GPS riêng không trả qua public profile khi quyền tắt. Nearby vẫn dùng điểm đã xác nhận, làm gần đúng trước khi tính khoảng cách cho điểm riêng. MUA không GPS vẫn tìm được theo khu vực và không có khoảng cách giả.

## Booking

Customer chọn MUA đến địa chỉ mình nhập (GPS không bắt buộc) hoặc đến nơi làm việc MUA nếu MUA cho phép và có địa chỉ. Backend lấy nơi làm việc từ đúng hồ sơ MUA, kiểm tra quyền trong transaction và lưu snapshot. Không tin địa chỉ studio/coordinate của client. Booking cũ không thay đổi khi studio được sửa/xóa hoặc quyền tắt.

Chi tiết booking có Sao chép địa chỉ và Mở bản đồ ngoài. Android dùng geo URI do OS xử lý; iOS dùng Apple Map Links. Chỉ gửi destination khi bấm; GPS snapshot được ưu tiên. Không có handler thì copy địa chỉ.

## API

- `/api/locations/areas`: danh mục nội bộ.
- `/api/locations/capabilities`: addressSearch=false.
- `/api/locations/search`, `/place`, `/reverse`: route cũ có xác thực trả 410, không gọi provider.
- `/api/Mua/nearby`: GPS/radius hoặc provinceCode/areaId, distance đường thẳng, phân trang backend.

## Chuẩn bị test

Backend/test database phải có migration additive `AddWorkLocationAndBookingDestination` trước khi dùng app mới. Không tự apply lên production. Trong task này chỉ tạo migration/script và chạy SQLite trong bộ nhớ; xem báo cáo kiểm thử mới nhất để biết build/native trạng thái.

Giữ Firebase/FCM/google-services.json. Không cần map provider account. Rebuild binary sau khi đổi native dependency; không dùng JS OTA thay cho rebuild.
