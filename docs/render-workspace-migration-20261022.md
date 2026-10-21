# Chuyển backend BBook sang workspace Render khác

Ngày kiểm tra: 22/10/2026, giờ Việt Nam.

## Nguyên nhân đã xác minh

API `https://beautybook-13zj.onrender.com` trả HTTP 503 tại `/health` và `/api/User/profile`, header `x-render-routing: suspend-by-user`, HTML `Service Suspended`. Ảnh dashboard bổ sung xác nhận workspace Hobby hết 5 GB bandwidth và hai service BeautyBook, bbook-admin bị Suspended by Render. Không phải bằng chứng sai mật khẩu hay mất dữ liệu.

Render hiện không hỗ trợ transfer service giữa các workspace: https://render.com/docs/faq . Cần tạo lại service trong workspace đích. Workspace trong ảnh thứ hai chỉ có bbook-web Static; static site không chạy được backend .NET.

## Trình tự chuyển an toàn

1. Giữ nguyên service cũ. Ghi lại repo, branch và commit đang deploy, region, Docker settings, health check, environment variables và secret files. Sao lưu database trước khi deploy vì backend Production tự chạy migrations khi khởi động. Không đưa secrets vào chat, Git hay EXPO_PUBLIC_*.
2. Chọn workspace đích ở góc trên trái. New > Web Service, kết nối cùng repo backend và cùng commit đã kiểm chứng. Runtime Docker, region Singapore như service cũ. Với repo tương ứng thư mục local D:/EXE/BeautyBook: Dockerfile ở gốc repo (`./Dockerfile`), Docker build context ở gốc (`.`), không chọn Dockerfile.advisor. Nếu cấu hình cũ dùng subdirectory thì sao chép cấu hình cũ thay vì áp dụng đường dẫn này máy móc. Health Check Path `/health`.
3. Sao chép đầy đủ environment variables và secret files từ backend cũ. Giữ nguyên DB hiện tại, Supabase project/buckets, Jwt__Key, Jwt__Issuer, Jwt__Audience, email, PayOS, Firebase và các cấu hình storage/financial/review hiện có. Backend hỗ trợ ConnectionStrings__DefaultConnection và DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD; tránh giữ DB_* cũ ghi đè connection string mới. Không tạo DB rỗng để thay cho DB production. Database dùng hostname nội bộ Render ở workspace cũ không truy cập nội bộ được từ workspace mới: dùng kết nối external hợp lệ cùng TLS/network allowlist hoặc lập kế hoạch di chuyển DB riêng. Không tắt ApplyMigrations để bỏ qua lỗi khởi động.
4. Deploy và kiểm tra logs: kết nối DB, migrations, kiểm tra storage và ứng dụng phải khởi động thành công. `/health` phải HTTP 200 với status Healthy; `/api/User/profile` không token phải HTTP 401. Health hiện tại là liveness, không chứng minh DB/email/payment đều hoạt động: phải kiểm tra bằng tài khoản test sau đó.
5. Ghi URL backend mới. Service mới có URL onrender.com riêng; không giả định đổi tên service lấy lại được URL cũ. Mobile: đổi EXPO_PUBLIC_API_URL trong đúng EAS profiles phát hành và các cấu hình phụ thuộc API/advisor. Admin: đổi BACKEND_API_URL rồi redeploy. Kiểm tra thêm URL tuyệt đối trong web, CORS, OAuth redirects, payment webhook/callback, asset URL và các tích hợp ngoài. Không tự ghi đè URL production khi chưa có URL đích đã kiểm tra.
6. Với app hiện đang embed API URL cũ và updates.enabled=false, thay .env không cập nhật được app đã cài: cần build APK/AAB mới và người dùng cài/cập nhật. Giữ package com.bbook.app, khóa ký phù hợp kênh phát hành và tăng versionCode. Muốn các lần chuyển sau ít ảnh hưởng hơn, dùng domain API riêng rồi đưa domain đó vào bản app mới.
7. Trước Google Play: kiểm tra đăng nhập mới, khởi động lại với token còn hạn/hết hạn, refresh token, offline rồi online, booking, chat, thông báo, upload ảnh, email OTP, tài khoản reviewer và luồng thanh toán bằng chế độ test thích hợp. Kiểm tra artifact AAB thực tế, target API hiện hành, native libraries/16 KB và Play pre-launch report. Chỉ ngừng service cũ sau khi xác nhận bản mới hoạt động và có phương án rollback tương thích DB.

## Vận hành ổn định

Chuyển workspace không loại bỏ hạn mức. Render Hobby vẫn có bandwidth quota. Theo https://render.com/docs/free , Free web service có thể ngủ sau 15 phút; tài liệu không khuyến nghị Free cho production. Với production, cân nhắc compute trả phí luôn chạy và phương thức thanh toán cho bandwidth, theo dõi Billing/Metrics và cảnh báo. Nâng workspace plan và nâng compute là hai cấu hình khác nhau. Không dùng ping lặp để thay cho giải pháp hạn mức.

## Sửa trong mobile

- Nhận biết suspension từ HTTP 503/header; dùng thông báo tiếng Việt, không đưa HTML/chi tiết lỗi server lên UI.
- Giữ thông tin phiên khi server lỗi; retry khôi phục được phiên khi backend trở lại.
- Dừng health polling ngay nếu server báo suspended; vẫn cho lần kiểm tra mới sau đó.
- Tự kiểm tra lại phiên startup lỗi khi app trở lại foreground; không cấp quyền offline dựa trên token chưa được xác thực.
- Thêm `npm run check:release-api -- production` (hoặc tên EAS profile) để smoke check GET `/health` và GET profile không token. Đây là kiểm tra routing HTTP, không thay thế device/E2E acceptance. URL lấy từ eas.json; cần đổi URL profile sau khi backend mới sẵn sàng.

Các thay đổi source chưa được đưa vào APK/AAB đã cài; chưa khôi phục hay triển khai service Render từ phiên làm việc này.
