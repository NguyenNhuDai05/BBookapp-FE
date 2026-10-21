# BBook — ổn định phiên, khởi động và ảnh Advisor — 18/10/2026

## Đã sửa
- Đăng nhập phân biệt HTTP 401, lỗi mạng/timeout và server 5xx; không dùng thông báo sai mật khẩu cho mọi lỗi. Đăng ký/xác minh/gửi lại OTP có thông báo mạng phù hợp; không tự lặp POST khi chưa biết server đã xử lý hay chưa.
- Health GET có giới hạn trước login/register/OTP để chờ server thức dậy. Gộp probe đồng thời, cache thành công 60 giây, tối đa 6 lần timeout 10 giây với nghỉ 1,5 giây. Lỗi offline thông thường trả ngay. Hosting không ngủ vẫn là giải pháp loại bỏ cold start; chưa xác minh gói/log Render thực tế.
- Khởi tạo phiên dùng chung promise. Root guard là nơi kiểm tra ban đầu; tabs không gọi lại profile. Bỏ delay splash và lần initialize riêng của trang index.
- Timeout/5xx khi khôi phục phiên không xóa JWT; cold start có màn hình thử lại. Khi đã có phiên trong bộ nhớ, lỗi làm mới hồ sơ tạm thời giữ giao diện đang dùng. Không khôi phục quyền Admin/MUA từ dữ liệu hồ sơ lưu offline chưa được xác minh.
- Native login xin refresh session; access token 15 phút, refresh family tối đa 30 ngày, rotation một lần cho nhiều request 401 đồng thời. Refresh lỗi mạng giữ thông tin cho lần thử sau. 401 từ request cũ/public login không được xóa phiên mới. Các thao tác lưu cặp credential được tuần tự hóa để tránh trộn token giữa hai lần đăng nhập.
- Refresh credential lưu bằng expo-secure-store 57.0.4, không lưu trong AsyncStorage. JWT ngắn hạn vẫn ở AsyncStorage để tương thích các service hiện có. Web giữ phiên JWT legacy, không lưu refresh credential trong localStorage. Android backup loại dữ liệu SecureStore; không yêu cầu sinh trắc học. Không nâng package khác.
- Login cuộn được khi bàn phím mở trên màn nhỏ; nút hiển thị trạng thái đang kết nối.
- AdvisorImage có width/height rõ ràng và khung giới hạn, tránh kích thước nội tại của WebP tràn ra ngoài. Giữ contain để hiển thị toàn bộ các poster/collage do chủ dự án cung cấp, không kéo giãn, không cắt khuôn mặt, không preload thêm ảnh lớn. Hero/card/chi tiết/selfie và các ảnh dùng chung component hưởng cùng bản sửa.
- Dữ liệu đo request giữ tối đa 30 mục trong bộ nhớ: nhóm endpoint, thời gian và status; không lưu URL cá nhân, body, JWT, mật khẩu hoặc OTP. getRequestTimings dùng cho chẩn đoán khi tái hiện, chưa phải bằng chứng đo thiết bị production.

## Audit ảnh
Đã mở contact sheet của 20 style + 1 bảng hero, kiểm tra kích thước: tổng 1.962.974 bytes, rộng tối đa 1535, cao tối đa 1200. Tất cả là WebP hợp lệ; không đổi asset gốc/mapping/scoring/ranking trong đợt này. Nhiều ảnh là collage/poster có chữ. Classic Glam có người mẫu và chữ trong cùng asset; sửa render sẽ hiện cả hai, không thể xóa chữ mà vẫn giữ nguyên toàn bộ ảnh. Nhãn Classic Glam/mô tả môi đỏ cần chủ nội dung đối chiếu với mẫu gốc trước khi thay asset. Không lấy ảnh phong cách khác để lấp chỗ.

Ảnh hero của source hiện tại là bảng phong cách, khác ảnh cô dâu trên screenshot APK được gửi. Cần dùng commit/provenance của APK mới để xác nhận đúng source. Không kết luận các screenshot cũ được tạo từ working tree hiện tại.

Asset inventory/contact sheet: D:/EXE/artifacts/auth-stability/advisor-assets.json và advisor-assets.png.

## Backend và rollout
Chi tiết: D:/EXE/BeautyBook/docs/AUTH-REFRESH-SESSIONS-20261018.md.
Migration mới 20261018093324_RefreshSessions là additive; có guard account deletion/private media của repo. Xóa tài khoản dọn các refresh session. Không sửa migration lịch sử hoặc bypass guard. Backend mới giữ tương thích client cũ. Frontend mới có thể đăng nhập backend cũ nhưng sẽ chưa có refresh token.

Cần backend/migration tương thích trước khi nghiệm thu giữ phiên dài hạn. Không tự deploy: Program tự chạy toàn bộ migration pending khi production khởi động, nên các gate R1 về mapping/migration/backup vẫn giữ nguyên. Không truy cập database production, không build APK/AAB, commit, push hoặc deploy trong đợt này.

## Nghiệm thu trên APK mới
1. Ghi commit SHA/config của APK; cài mới, đăng nhập đúng/sai, đăng ký/OTP, mất mạng và server vừa thức dậy.
2. Đóng/mở app, để nền, mở lại sau access expiry; kiểm tra refresh không yêu cầu nhập mật khẩu nếu family hợp lệ. Sau logout/đổi mật khẩu/khóa/xóa tài khoản phải không gia hạn được phiên cũ.
3. Kiểm tra đủ 20 ảnh ở Top 3/chi tiết và bảng hero: không tràn, không đè chữ, không méo, giữ đủ nội dung gốc. Kiểm tra màn nhỏ, font lớn, keyboard, safe area và nút đóng/modal.
4. Quét/mở chi tiết/đóng lặp lại để kiểm tra memory Android. Unit tests không thay được nghiệm thu native layout, native SecureStore và cold start thực tế.

Kết quả kiểm thử cuối được ghi trong verification.json tại thư mục artifacts/auth-stability; các baseline checksum Advisor chưa được duyệt không tự cập nhật.

## Kết quả kiểm thử cuối
| Kiểm tra | Kết quả |
|---|---|
| TypeScript cuối | PASS, không có diagnostics |
| Lint các file nguồn thay đổi | 0 errors, 5 warnings import axios |
| Lint phạm vi app/hooks/services/store/repositories/Advisor trước lượt chỉnh concurrency cuối | 0 errors, 26 warnings |
| Frontend cuối: auth readiness, session recovery, email auth, auth store, app mode, Advisor images | 48/48, 6 suites; CLI timeout 15 giây do máy kiểm thử chậm; không sửa timeout trong source tests |
| Backend cuối: refresh + OTP + reset password + account deletion | 30/30 trên PostgreSQL disposable/SQLite fixtures; 8 tests refresh trong đó |
| APK release policy sau thêm SecureStore plugin | 8/8 |
| EF snapshot | Không có pending model changes; SQL migration mới đã sinh offline để review |
| Full Jest ở lượt trung gian | 851/854; 2 checksum ScanPhoto có sẵn và 1 chat timeout 5 giây |
| Chat chạy riêng, timeout mặc định | PASS; lượt auth/chat lúc đó 49/49 |

Sau lượt full, phần credential concurrency và keyboard được kiểm tra lại qua các suites cuối liên quan. Không tuyên bố toàn bộ tests đã xanh. Hai assertions checksum và manifest bảo vệ giữ nguyên; đối chiếu toàn bộ manifest hiện chỉ ScanPhoto khác baseline, giống audit trước. Full Jest còn cảnh báo open handles đã xuất hiện ở R1; đã lưu JSON đầy đủ rồi dừng process, không sửa source ngoài phạm vi để che cảnh báo.

Lượt regression backend đầu tiên phát hiện thiếu writer triggers ở bảng phiên mới. Đã sửa migration mới chưa triển khai, bổ sung dọn phiên trong account deletion và test chống ghi phiên cho owner đã xóa; lượt cuối 30/30. PostgreSQL test đã dừng. Backend build có warnings cũ và NU1900 vì môi trường không lấy được vulnerability feed NuGet; không có compile errors.

Chưa nghiệm thu Android layout/SecureStore/memory, chưa xác nhận cold-start Render qua log. Build APK mới và backend rollout vẫn do chủ dự án thực hiện theo các gate đã nêu.
