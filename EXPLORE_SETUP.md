# Khám phá B-Book

## Đã triển khai

- Cảm hứng makeup từ portfolio công khai; chuyên gia và dịch vụ lấy từ database.
- Phong cách phổ biến tính từ MUA đã được duyệt, đang hiển thị. Danh sách khu vực lấy từ các hồ sơ này và catalog khu vực Backend.
- Ba danh sách Tác phẩm / Chuyên gia / Dịch vụ hỗ trợ tìm kiếm trên Backend, lọc phong cách, tỉnh/thành phố và ngân sách.
- Tác phẩm sắp xếp mới nhất; chuyên gia xếp hạng theo độ đầy đủ hồ sơ và đánh giá có tính số lượng; dịch vụ theo giá tăng dần.
- Mọi danh sách đều phân trang. Giới hạn các thẻ giới thiệu không giới hạn tổng kết quả.
- Các thẻ cảm hứng đã hiển thị phía trên không lặp lại trong lưới phía dưới; khi tìm kiếm/lọc, lưới hiển thị đầy đủ kết quả tương ứng.
- MUA gần bạn tiếp tục được ẩn. Trang này không gọi GPS, bản đồ hoặc API nearby.
- Không dùng ảnh, tên MUA, giá, đánh giá, lượt thích hay tag mẫu. Thiếu ảnh dùng placeholder; thiếu dữ liệu thì ẩn section.

## API

`GET /api/Explore` trả `styles`, `provinces`, `featuredPosts`, `featuredArtists`, `featuredServices`.

`GET /api/Explore/search` hỗ trợ:

| Tham số | Ý nghĩa |
| --- | --- |
| kind | portfolio / artists / services |
| q | Từ khóa, tối đa 100 ký tự; tìm không phân biệt hoa/thường |
| provinceCode | Mã tỉnh/thành phố từ API Khám phá |
| styleId | ID phong cách từ API |
| minPrice, maxPrice | Khoảng giá VNĐ; tác phẩm lọc theo tác giả có dịch vụ trong khoảng giá |
| limit | 1–24, Frontend dùng 12 |
| cursor | Cursor Backend trả về, dùng nguyên giá trị cùng bộ lọc |

Response: `{ items, nextCursor }`. `nextCursor: null` nghĩa là hết kết quả.

Cursor được bảo vệ bằng ASP.NET Data Protection, ràng buộc với bộ lọc và hết hạn sau 30 phút. Portfolio giữ mốc thời gian của trang đầu để bài mới đăng không đẩy lệch trang đang xem. Ẩn/xóa bài sẽ có hiệu lực ở request tiếp theo. Thay đổi điểm xếp hạng hoặc giá trong lúc cuộn có thể đổi vị trí kết quả; Frontend loại trùng theo ID. Làm mới để lấy danh sách mới nhất.

Frontend debounce tìm kiếm 350ms, hủy request cũ khi đổi bộ lọc, có skeleton, trạng thái trống, nút thử lại, làm mới khi cursor hết hạn và nút xem thêm. Đăng/sửa/ẩn/xóa portfolio, thay đổi dịch vụ hoặc hồ sơ MUA sẽ làm mất hiệu lực cache Khám phá.

## Đưa lên bản đang chạy

1. Deploy **BeautyBookBackend trước**. Migration `AddExplorePagingIndexes` thêm index để phục vụ phân trang; các migration khu vực MUA có trước cũng phải được áp dụng. Cơ chế khởi động production hiện có sẽ áp dụng migration còn thiếu.
2. Mở `/api/Explore`: cần trả JSON HTTP 200 trước khi cập nhật ứng dụng.
3. Build/cập nhật **bbeauty-app** với `EXPO_PUBLIC_API_URL` trỏ đúng Backend, có hậu tố `/api`.
4. Không cần Google Maps API key cho trang Khám phá hiện tại. Không cần thay đổi bbook-admin cho phần này.

Chưa push Git, deploy hay áp dụng migration lên database production trong lần triển khai local này. Các kiểm tra đã thực hiện: biên dịch Backend, TypeScript, ESLint các file liên quan và dịch các truy vấn sang SQL PostgreSQL mà không kết nối database. Chưa kiểm tra trực tiếp trên điện thoại hoặc chạy bộ test toàn bộ.
