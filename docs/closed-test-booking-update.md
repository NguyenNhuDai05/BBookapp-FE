# Cập nhật closed test: booking, chat và lịch

## Phạm vi bản sửa

- MUA booking list giữ URL avatar khách hàng và ảnh dịch vụ từ API.
- Nút Nhắn tin trong chi tiết booking mở phòng chat cho hai bên; tái sử dụng phòng hiện có.
- Customer thấy booking đã cọc đang chờ xác nhận trong lịch tháng. Booking bị hủy/từ chối không còn trong lịch.
- Cả hai lịch có chọn tháng/năm. Đổi tháng đồng thời chọn ngày đầu tháng để danh sách ngày khớp tháng đang xem.
- Danh sách booking tải lại khi màn hình được focus và mỗi 15 giây khi đang xem; thay đổi từ bên còn lại được cập nhật ở lần tải kế tiếp.

## Thứ tự phát hành

1. Deploy backend có `POST /api/chat/booking/{bookingId}` trước. Endpoint mới chỉ cho customer hoặc MUA thuộc booking mở phòng, dùng lại kiểm tra khóa tương tác và demo domain hiện có. Không thay đổi schema DB hoặc endpoint cũ nên app closed test hiện tại tiếp tục dùng API cũ.
2. Smoke test backend mới bằng tài khoản tester hiện có. Sau đó build app, cài thử bản cập nhật đè lên bản closed test cũ trên thiết bị thử; kiểm tra còn đăng nhập và xem được booking/chat cũ.
3. Giữ applicationId `com.bbook.app`, project EAS và signing/upload key hiện có. `eas.json` đã dùng `appVersionSource: remote` và production `autoIncrement: true`. Kiểm tra versionCode cao nhất trên Play Console và version remote EAS; nếu chưa đồng bộ, dùng `eas build:version:set` để đặt mốc đúng trước khi build. Không dựa vào versionCode 1 trong Gradle để phát hành thủ công.
4. Build AAB: `eas build --platform android --profile production`. Upload AAB vào bản phát hành mới của chính track Closed testing đang dùng, giữ danh sách tester/link tham gia hiện tại, kiểm tra và rollout. Tester cập nhật bằng Google Play; không yêu cầu gỡ app hoặc xóa dữ liệu.
5. Bản hiện tại tắt Expo Updates (`updates.enabled: false`) nên sửa giao diện cần AAB mới qua Play. Không dùng OTA cho bản cài hiện có. Việc bật OTA tương lai cần bản native mới và kế hoạch runtime/channel riêng.

## Kiểm tra trước rollout

- MUA: avatar và ảnh dịch vụ xuất hiện trên card của đơn chờ, sắp tới và lịch sử; chi tiết vẫn xem được.
- Customer và MUA: Nhắn tin mở cùng một phòng, gửi/nhận hai chiều, không tạo phòng trùng khi nhấn nhanh; lỗi mạng hiển thị thông báo và thử lại được.
- Customer: đơn chưa cọc chưa có lịch; thanh toán thành công có lịch chờ xác nhận; MUA từ chối hoặc customer hủy làm mất lịch sau lần tải dữ liệu kế tiếp; đơn vẫn còn trong lịch sử booking.
- Hai bên: chạm tiêu đề tháng để chọn tháng/năm, thử tháng 12 sang tháng 1 năm sau và năm nhuận; mũi tên và chọn ngày ngoài tháng vẫn hoạt động.
- Kiểm tra luồng closed test hiện có: đăng nhập, thanh toán thật/mẫu, hủy/hoàn tiền, xác nhận hoàn thành, chat cũ và đổi mode.
- Kiểm tra tài khoản ngoài booking không gọi được endpoint chat mới.

## Các lần cập nhật sau

Deploy thay đổi API tương thích trước, rồi phát hành app. Giữ tên/trường/enum API cũ trong thời gian tester còn dùng app cũ; thêm trường/endpoint thay vì xóa hoặc đổi nghĩa. Nếu cần migration, dùng thay đổi bổ sung và kiểm tra cả app cũ lẫn mới trước rollout. Mỗi lần phát hành dùng versionCode mới, lưu commit backend/app cùng số build để truy vết. Không gỡ API mới khi rollback app; Play cần một bản sửa với versionCode cao hơn để cập nhật tiếp. Không nâng SDK/dependency chung trong cùng bản sửa chức năng nếu chưa có kiểm tra riêng.

Tham khảo: [Expo app versions](https://docs.expo.dev/build-reference/app-versions/), [Google Play release rollout](https://support.google.com/googleplay/android-developer/answer/9859348).

Chưa thực hiện deploy backend, build AAB hoặc rollout Play trong thay đổi này. Cần kiểm tra trực tiếp thiết bị và tài khoản Play/EAS trước khi phát hành.

## Kết quả kiểm tra mã nguồn

- TypeScript `tsc --noEmit`: đạt.
- Với SDK 57, import navigation trong mã ứng dụng phải dùng entry point của `expo-router`; không import trực tiếp `@react-navigation/*`. Kiểm tra thêm Metro Android bundle trước phát hành vì TypeScript/Jest không phát hiện được quy tắc này. Tham khảo [Expo Router migration](https://docs.expo.dev/router/migrate/sdk-55-to-56/).
- ESLint các màn hình/component/hook đã sửa: không có lỗi hoặc cảnh báo.
- 14 test frontend mới: ảnh booking, lọc trạng thái lịch, mở chat hai phía, lỗi/thử lại và chọn tháng/năm.
- 35 test hồi quy: Play review UX/contracts và địa điểm booking.
- 9 test backend: booking chat entry, chat identity và chat safety; xác minh người ngoài bị từ chối, hai phía mở cùng phòng và nhận đúng danh tính đối tác.
- Backend build thành công; còn 3 cảnh báo có sẵn ở ServiceController/MuaService ngoài phạm vi sửa.
- Chưa kiểm tra giao diện bằng thiết bị, giao dịch thật hoặc cài cập nhật đè bản closed test.
