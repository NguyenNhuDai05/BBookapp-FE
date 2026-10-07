# BBook Location / Address — Phase 1 (08/10/2026)

Dùng Expo Location đã có: foreground GPS và native reverseGeocodeAsync khi người dùng chủ động bấm GPS. Không thêm map SDK, API key, provider account, package hoặc backend endpoint. Nearby vẫn dùng getDeviceLocation() và không reverse geocode.

## Booking

GPS → permission → lấy điểm/accuracy → reverse → preview → user xác nhận → draft. Địa chỉ resolve chỉ có phường/thành phố vẫn hợp lệ nếu GPS đủ tin cậy. Không tìm được nhãn địa chỉ thì giữ candidate cho retry; nhập địa chỉ khác luôn bỏ GPS cũ. Chi tiết địa điểm optional giữ GPS, tồn tại riêng trong draft và ghép với địa chỉ chính trước submit (tổng tối đa 500 ký tự). Notes API và dữ liệu cũ vẫn giữ, không có ô Notes trong UI chọn địa điểm.

Customer/MUA đọc cùng destination snapshot. Android geo URI và iOS Apple Map Links ưu tiên tọa độ snapshot; thiếu tọa độ thì dùng địa chỉ. Không lookup lại hồ sơ/GPS/geocoder cho booking lịch sử.

## MUA

Khu vực nhận khách khác vị trí hoạt động. GPS chỉ trở thành OperatingLocationConfirmed sau thao tác Xác nhận vị trí. Điểm riêng không gửi WorkLocationName/WorkLocationAddress/AllowCustomerVisit; nhãn địa chỉ xác nhận riêng dùng OperatingLocationLabel hiện có. API công khai tiếp tục ẩn điểm/nhãn riêng theo backend hiện tại.

Consent khách đến mặc định OFF. GPS hợp lệ đủ để xác nhận cả khi ON và reverse đang chạy/thất bại; chi tiết luôn optional, thu gọn mặc định. Nếu chưa có tên địa chỉ, snapshot dùng nhãn “Vị trí hoạt động đã xác nhận bằng GPS” để đáp ứng contract địa chỉ không rỗng hiện có; điều hướng vẫn dùng GPS. Không cập nhật nhãn tự động sau khi đã xác nhận. Disclosure phản ánh đúng việc địa chỉ và GPS chính xác được công khai khi ON. Manual không xin GPS và không giữ tọa độ cũ.

Sheet vị trí hoạt động hỗ trợ kéo vùng header/grabber bằng Gesture Handler + Animated native driver; kéo ít snap lại, đủ xa dismiss. X, backdrop, Android Back, Hủy và swipe gọi chung handler; đóng luôn bỏ draft chưa xác nhận. ScrollView/input không dùng chung pan handler. Các sheet khác không bật gesture mới.

Chuyển workplace cũ sang private operating GPS dùng clear workplace rồi set point theo API hiện có. Đây là hai request không atomic. Bước hai lỗi: không báo thành công, giải thích workplace đã xóa nhưng điểm mới chưa lưu, giữ bản nháp và cho retry. Cache profile/nearby được refresh cả khi một phần thất bại.

## Lỗi và compatibility

Candidate flow thử last-known GPS trước (tuổi tối đa 60 giây, accuracy <=100m, coordinate hợp lệ; chờ cache tối đa 1 giây), rồi fresh GPS nếu cần. Nearby getDeviceLocation giữ behavior fresh GPS cũ. GPS timeout 15 giây; reverse timeout 8 giây. GPS candidate được publish ngay trước reverse; retry địa chỉ không gọi GPS. Accuracy <=100m bình thường, 100–500m cảnh báo, >500m/unknown/invalid không coi là điểm đáng tin. Chỉ metadata local, không persist vào Zustand/backend. Đóng sheet/switch manual hủy hiệu lực request bằng operation ID; native request đến muộn không commit.

Legacy address-only/coordinate-only được giữ, không tự geocode/migrate/public. Không đổi schema/API/backend/native config/SDK. Các route backend geocoding cũ vẫn trả 410. Reverse native không được hỗ trợ trên Web nên có manual fallback.

Expo Go phải có runtime SDK phù hợp. EAS binary mới dùng cùng native dependencies/permissions; updates hiện đang tắt trong app.json nên cần phát hành binary để đưa thay đổi tới Closed Test. Bundle export/typecheck không thay thế kiểm tra runtime trên điện thoại.

## Android checklist

- GPS precise và approximate, full address và chỉ ward/city.
- Từ chối quyền, chặn hỏi lại, mở Settings, GPS OFF, offline và retry.
- Đóng sheet trong GPS/reverse; mở lại không có candidate cũ.
- Details giữ GPS; sửa main/manual bỏ GPS.
- Tạo booking; customer/MUA có cùng địa chỉ và pin bản đồ.
- MUA mới/legacy: private GPS, manual, consent ON/OFF, chuyển workplace → private; simulate network failure ở request thứ hai và retry.
- Update từ Closed Test bằng binary mới; booking/hồ sơ cũ không thay đổi.
