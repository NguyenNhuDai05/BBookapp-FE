> Báo cáo này ghi nhận hành vi trước bản sửa mở rút ngay. Quy tắc giữ 48 giờ bên dưới đã được thay thế; xem D:/EXE/BeautyBook/docs/IMMEDIATE-PAYOUT-MVP.md.

# Kiểm tra màn Thu nhập & rút tiền — 02/10/2026

## Kết luận từ mã
- Thu nhập backend cộng riêng từng trạng thái OnHold / Available / Frozen / PayoutPending / PaidOut; không lấy số tiền trong lịch sử payout để cộng vào đang giữ.
- Complete payout cập nhật Paid và PaidOut trong cùng transaction. Reconcile kiểm tra lại trạng thái sau khi khóa, không đưa PaidOut về OnHold.
- Hai khoản cùng 6.600đ chưa chứng minh cùng booking/receivable. Không tự trừ số dư hoặc sửa ledger dựa trên ảnh.
- OnHold theo thời hạn khiếu nại 48 giờ từ CompletedAt. Worker xét lại mỗi phút khi backend hoạt động; server ngủ có thể làm trễ việc chuyển Available.

## Bản sửa local
- Tải lại earnings, payout và eligibility khi màn hình được focus, bỏ staleTime 5 phút của earnings.
- Hiển thị Frozen riêng và từng booking đang giữ/tạm khóa; cho mở booking để đối chiếu.
- Lịch sử Paid hiển thị PaidAt nếu có, thay vì CreatedAt của yêu cầu.
- Không thay đổi phép tính tiền, nghiệp vụ payout, migration hoặc production.

## Kiểm tra sau khi build
1. Đối chiếu booking của khoản đang giữ với receivableIds của payout 6.600đ trong API đã đăng nhập đúng MUA.
2. Nếu khác ID: đây là hai khoản khác nhau, không phải cộng trùng.
3. Nếu cùng ID mà payout Paid và receivable không PaidOut: lưu dữ liệu đối chiếu để tìm writer/phiên bản backend gây sai; không sửa tiền tự động.
4. Kiểm thử admin hoàn tất payout bằng dữ liệu thử; quay lại màn thu nhập, xác nhận đang xử lý giảm và đã chi trả tăng đúng một lần.
5. Khoản hết 48 giờ vẫn giữ: kiểm CompletedAt, khiếu nại/refund/payment và log worker reconcile; không bỏ qua hold để phát hành nhanh.

Chưa đọc database production, chưa push/deploy hoặc chạy job production.
