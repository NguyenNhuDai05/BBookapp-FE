# BBook — đối chiếu Privacy, Data Safety và Closed Testing

Nguồn: CSV người dùng `C:/Users/Acer/Downloads/data_safety_export.csv`, source local mobile/backend/web ngày 05/10/2026 và tài liệu chính thức Google/Firebase. CSV gốc không bị sửa; chưa thay đổi Play Console, push, deploy hoặc database.

## Kết luận phát hành

Chưa xác nhận đủ điều kiện đưa bản location mới lên Closed Testing. Chưa có AAB/APK mới build thành công; backend đang dùng trong eas production là Render và chưa được xác nhận cập nhật schema/source mới. Android thực tế, PostgreSQL migration/concurrency và full backend suite còn chưa qua đầy đủ. 294 mobile tests và 29 backend tests trọng tâm đã qua; các kết quả đó không thay thế kiểm thử release thực tế.

## Policy đã sửa local

Nguồn chính `D:/EXE/bbook-web/legal/content.json`; generator đồng bộ web privacy/deletion HTML, text và `D:/EXE/bbeauty-app/docs/chinhsach.txt` dùng trong app/policy.tsx. Không thay đổi Điều khoản.

- Bỏ mô tả Google Login, thay bằng email/password và OTP đăng ký/khôi phục.
- Bỏ gợi ý địa chỉ/geocoder; mô tả GPS do người dùng chủ động chọn và địa chỉ nhập tay.
- Mô tả nơi làm việc tùy chọn, consent công khai, khoảng cách gần đúng, booking giữ địa điểm tại thời điểm tạo và không theo dõi nền.
- Nêu thao tác mở app bản đồ bên ngoài gửi địa chỉ/GPS, và copy đưa địa chỉ vào clipboard.
- Giữ Firebase/Expo cho push; nêu định danh lần cài đặt có thể được xử lý trước quyền hiển thị thông báo. Không nhầm quyền thông báo với quyền thu thập FID.
- Nêu bảng tin ưu tiên bài mới của MUA được theo dõi — hành vi có trong FeedService, không suy đoán hệ thống quảng cáo/AI.
- Thêm hướng dẫn xóa riêng nơi làm việc ở trang delete-account và policy; không tuyên bố xóa ảnh upload ngay hoặc xóa toàn bộ dữ liệu trong 90 ngày.

Đã đọc URL công khai bằng HTTP: privacy và delete-account đều trả 200; privacy online vẫn có Google Login, chưa có nội dung studio mới. Vì vậy cần publish bản web mới trước khi coi URL khớp release. Không tự deploy trong task này.

## Những ô cần sửa trong CSV

| Mục | CSV hiện tại | Cách sửa cho source release mới | Bằng chứng |
|---|---|---|---|
| Xóa dữ liệu không cần xóa tài khoản | Không, tự xóa trong 90 ngày | Bỏ lựa chọn 90 ngày. Với bản mới có xóa nơi làm việc riêng: chọn Có, URL `https://bbookmakeup.com/delete-account/` sau khi publish hướng dẫn mới. Chỉ khai báo phạm vi dữ liệu này, không cam kết xóa mọi dữ liệu. | WorkLocationFields → ClearWorkLocation → WorkLocationPolicy.Clear xóa tên/địa chỉ/GPS khỏi profile; giữ booking cũ. |
| Tương tác với ứng dụng — mục đích | Chỉ Phân tích | Chức năng của ứng dụng; bỏ Phân tích nếu không có SDK/event analytics trong artifact cuối. | Trạng thái tương tác dùng cho tính năng; chưa tìm thấy analytics instrumentation/SDK trong source đã rà. |
| Thao tác khác — mục đích | Chức năng | Giữ Chức năng, thêm Cá nhân hóa. | FeedService đọc MuaFollows và cộng ưu tiên cho bài mới của MUA được theo dõi. Google liệt kê likes trong Other actions. |
| Mã nhận dạng thiết bị — tùy chọn | Không bắt buộc | Bắt buộc với cấu hình native hiện tại; không có opt-out FCM auto-init trong manifest nguồn. Kiểm tra lại merged release manifest. | expo-notifications phụ thuộc firebase-messaging 25.0.1; FCM/Firebase Installations tự tạo/thu thập FID theo tài liệu Firebase. Chặn POST_NOTIFICATIONS không đồng nghĩa tắt việc này. |
| Mã nhận dạng thiết bị — mục đích | Chức năng + Phân tích | Giữ Chức năng. Chưa thấy FID/token được dùng cho analytics; bỏ Phân tích trừ khi release artifact có SDK/config analytics khác. | NotificationService đăng ký token cho push, không có event analytics. Firebase user agent dùng cải thiện dịch vụ không gắn user/device identifier; không tự suy ra FID dùng analytics. |
| Nhật ký sự cố | Thu thập, không bắt buộc, Phân tích | Chưa có bằng chứng thu thập app crash ra khỏi thiết bị: bỏ theo source hiện tại nếu AAB cuối xác nhận không có crash SDK. | Không tìm thấy Crashlytics/Sentry; AppErrorBoundary chỉ console.error trong __DEV__, không upload crash. Server exception khác app crash. |
| Thông tin chẩn đoán | Thu thập, không bắt buộc, Phân tích | Chưa chốt được từ AAB. Nếu khai báo cho log kỹ thuật tự động/SDK thì không đánh Không bắt buộc khi không có opt-out. Cần đối chiếu log/provider và dependency của AAB; không tự biến mọi server log thành app diagnostic telemetry. | Có server error logging và FCM user-agent/version; chưa có SDK gửi performance/diagnostic metrics được xác nhận. |

Không tạo CSV để import tự động khi hai mục app performance và artifact native chưa xác minh; tránh làm một bản khai báo chưa chắc chắn trông như đã duyệt hoàn toàn.

## Mục có thể giữ theo source

- Email/password + phương thức xác thực khác (OTP email); không chọn OAuth cho release mobile hiện tại.
- Tên/email/user ID: thu thập, không nhất thời, bắt buộc, Chức năng + Quản lý tài khoản. App hiện yêu cầu đăng nhập, chưa có guest flow.
- Địa chỉ: thu thập, không nhất thời, Chức năng. Địa điểm booking vẫn cần địa chỉ, kể cả chọn studio. Không suy ra địa chỉ là tùy chọn chỉ vì GPS tùy chọn.
- Số điện thoại: DTO registration/onboarding cho phép không cung cấp; giữ không bắt buộc, Chức năng + Quản lý tài khoản.
- Vị trí chính xác: giữ thu thập, không nhất thời, không bắt buộc, Chức năng; tọa độ có thể được lưu vào workplace/booking. Gỡ Maps không có nghĩa gỡ thu thập GPS.
- Vị trí ước chừng: vẫn có tỉnh/thành/khu vực nhận khách được gửi/lưu. Giữ loại dữ liệu; không đổi chỉ dựa trên Maps removal. Khu vực bắt buộc đối với MUA, nên không khẳng định optional cho mọi người dùng/role.
- Tin nhắn khác trong ứng dụng: chat, không phải chỉ push notifications; giữ thu thập, không nhất thời, tùy chọn, Chức năng.
- Ảnh/tài liệu/nội dung người dùng/thông tin cá nhân khác: xác minh MUA, ảnh, mô tả, đánh giá/khiếu nại vẫn tồn tại; giữ loại dữ liệu và mục đích gắn với tính năng. Không coi việc chọn nghề MUA tự nguyện là bằng chứng mọi trường xác minh đều tùy chọn trong quy trình MUA.
- Thông tin thanh toán/lịch sử giao dịch/tài chính khác: ngân hàng/QR/wallet/payout/refund vẫn có; không bỏ chỉ vì bản đồ không còn tốn phí. Giữ Chức năng; người dùng có thể chưa thêm thông tin nhận tiền, nhưng giao dịch tự ghi lịch sử khi phát sinh.
- Nhật ký tìm kiếm: q được gửi `/Explore/search` và nearby; vẫn là thu thập dù chưa có bảng lịch sử tìm kiếm. Chưa xác minh retention của HTTP/provider logs để chuyển sang nhất thời; không tự chọn ephemeral chỉ vì EF không INSERT lịch sử.
- Không khai báo Email đọc hộp thư, SMS, audio, video, contacts hoặc calendar chỉ vì app gửi OTP email/đính kèm ảnh.

## Chia sẻ dữ liệu

CSV chưa chọn chia sẻ cho loại nào. Có thể giữ nếu các provider thực sự xử lý thay BBook và chuyển dữ liệu sang maps là thao tác người dùng chủ động, được mong đợi. Google miễn khai báo sharing cho service providers và một số chuyển dữ liệu do người dùng chủ động; đây không phải khẳng định không có dữ liệu đi tới bên khác. Policy đã nêu nhà cung cấp và maps. Cần xác minh điều khoản/config PayOS, Render, Supabase, Brevo, Expo/FCM và những tích hợp bật ngoài source; không thể chứng nhận các cấu hình dashboard từ code local.

## Checklist trước khi mời 12 tester

1. Xác nhận backend release có source/schema mới trên môi trường dùng cho Closed Testing; chạy migration trên DB test và các test PostgreSQL trước khi triển khai thật. Program.cs có auto-migrate trong Production: deployment mới có thể áp dụng migration khi khởi động. Chưa thực hiện trong task.
2. Publish web privacy/delete-account đã sửa, kiểm tra HTTP 200, nội dung mới và email hỗ trợ thật sự có người tiếp nhận; build app chứa policy đồng bộ.
3. Sửa Data Safety như bảng và chốt SDK/merged manifest/AAB cuối. Xác minh HTTPS cho API, storage, chat, push, email và payment thực tế; eas production dùng HTTPS là bằng chứng cấu hình, chưa chứng nhận toàn bộ traffic runtime.
4. Build AAB release ký đúng package/versionCode. Chưa có AAB được xác nhận tại local outputs; bundle JS không thay AAB.
5. Internal testing/smoke Android thật: email register/consent/OTP/login/reset/logout/session; MUA work/nearby/booking snapshot/maps/copy; xóa tài khoản; chat/ảnh/private media và báo cáo/chặn; payment reviewer không giao dịch tiền thật. Test native notifications và permissions.
6. Sau khi qua smoke, đưa AAB sang Closed Testing và mời ít nhất 12 người opt-in. Giữ ít nhất 12 người opt-in liên tục 14 ngày, thực sự sử dụng và ghi feedback/khắc phục lỗi. Chỉ thêm email vào danh sách không bắt đầu đủ điều kiện 14 ngày. Production access vẫn phải xin xét duyệt sau đó, không tự được chấp thuận.

## Tham khảo chính thức

- https://support.google.com/googleplay/android-developer/answer/10787469 — Data Safety, optional/required, collection/sharing exceptions, purpose definitions; áp dụng cho Closed Testing.
- https://firebase.google.com/docs/android/play-data-disclosure — FCM và Firebase Installations automatic collection.
- https://firebase.google.com/docs/cloud-messaging/android/get-started — auto initialization gửi định danh/config tới Firebase.
- https://support.google.com/googleplay/android-developer/answer/14151465 — 12 người opt-in liên tục 14 ngày, production application.

## Validation và file sửa trong lượt audit

Web legal generator PASS, web build PASS, diff check PASS. Kiểm tra tự động 8 điều kiện PASS: app giữ nguyên phần terms và khớp privacy text; root/index privacy và deletion giống nhau; không còn đoạn Google Login/geocoder cũ; có disclosure external maps, personalization và partial deletion. Không có runtime auth/location code sửa trong lượt này; không chạy lại 294 tests cho thay đổi văn bản.

Files: bbook-web/legal/content.json, legal/privacy.txt, privacy.html, privacy/index.html, delete-account.html, delete-account/index.html; bbeauty-app/docs/chinhsach.txt; báo cáo này. File legal/privacy-reviewed-2026-10-05.md là bản review lịch sử trước thay đổi, không phải nguồn generator hiện hành.
