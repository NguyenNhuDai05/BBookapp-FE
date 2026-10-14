# Makeup Style Library v1.1 / Local Engine

> Engine đã được nâng cấp V2: xem [FACE-AWARE-RECOMMENDATION-V2.md](./FACE-AWARE-RECOMMENDATION-V2.md). Nội dung thư viện giữ nguyên, nhưng Preview hiện có technique matching và face-aware ranking; các mô tả scoring/no-face-ranking dưới đây là lịch sử v1.1.

JSON sản phẩm: features/makeupAdvisor/bbook-makeup-style-library.vi.json. Đúng 12 styles, version 1.1 theo yêu cầu cập nhật; mô tả 20–35 từ, 6 vùng kỹ thuật, mỗi style 5 bước, palette tiếng Việt, imageKey/English briefs. Không có asset ảnh/URL ảnh/base64 hoặc marketplace IDs. Nội dung biên soạn lại, không chép hướng dẫn thương hiệu. Các trend có nhiều biến thể; Thai Glam là phiên bản biên tập nâu đồng/mi rõ, không quy chuẩn dân tộc hay classifier ngoại hình.

## Nguồn nghiên cứu

- [Douyin, Makeup.com by L'Oréal](https://www.makeup.com/makeup-tutorials/makeup-tutorials/douyin-makeup): nhũ mắt, mi chùm, eyeliner và môi tán; bản thư viện chọn phiên bản mềm hơn, không yêu cầu lens/đổi màu da.
- [Peach, Estée Lauder](https://www.esteelauder.com/blog-article-peach-makeup-tutorial): sắc đào phối trên các vùng.
- [Strawberry, L'Oréal](https://www.lorealparisusa.com/beauty-magazine/makeup/makeup-trends/strawberry-girl-makeup): má đỏ hồng/nền nhẹ.
- [Clean Girl, Charlotte Tilbury](https://www.charlottetilbury.com/us/secrets/clean-girl-makeup): nền mỏng, dưỡng môi có màu.
- [Latte, L'Oréal](https://www.loreal-paris.es/latte-makeup): bảng màu nâu/caramel, biến thể ngày/đêm.
- [Natural, Bobbi Brown](https://www.bobbibrowncosmetics.com/how-to-do-the-nude-look): no-makeup approach.
- [Smokey, Maybelline](https://www.maybelline.com/makeup-tips/eye/eyeshadow-makeup-tutorials/smokey-eyeshadow): viền đậm tán mờ.
- [Bridal, Maybelline](https://www.maybelline.com.au/makeup-tips/makeup-look/wedding-bridal-makeup): nền bền màu, lựa chọn tùy sở thích.
- [ETUDE official](https://www.etude.com/shop/): bảng màu Korean và sản phẩm mắt/môi.

Không nguồn nào chứng minh xếp hạng style bằng tỷ lệ ML Kit hoặc cung cấp ngưỡng phân loại được hiệu chuẩn.

## Engine và preference

Native scan vẫn là quality gate bắt buộc, nhưng không có questionnaire/preference bắt buộc. Scan 10 s valid/5 s quality-invalid và Phase 1 memory lifecycle giữ nguyên.

LibraryPreferences dùng occasion/intensity nullable, khởi tạo cả hai null; không chọn gì, chọn một, cả hai hoặc xóa đều hợp lệ. UI tinh chỉnh thu gọn ở kết quả; không cản camera/scan. Mỗi thay đổi dùng completed extraction local, không HTTP/ML Kit/picker/normalize và đổi nhãn nguồn thành local nếu trước đó là Gemini. Trong lúc có tác vụ, controls disabled; không tạo request race. Sau reset ảnh, lựa chọn chủ động giữ nguyên cho tới khi người dùng xóa.

Occasion +4 / intensity +3 chỉ là điểm sắp xếp lựa chọn, không điểm ngoại hình hoặc confidence. Tie chọn độ đậm khác để đa dạng; deterministic, không random/hash khuôn mặt. Không preference -> natural/soft-glam/classic-glam, ba hướng nhẹ/vừa/nổi bật. Bridal chỉ xuất khi chọn wedding. Style default có thể giống giữa người dùng: thư viện là bộ khám phá, không giả vờ chứng minh phù hợp ngoại hình.

Không còn đường scoring outline/eyeSpacing của engine cũ. knowledge.ts chỉ giữ keys/metadata contract Gemini cũ; strict provider response validation không mở rộng để nhận local library 6 focus + quickSteps. Backend/privacy/cloud flags không đổi.

## ML Kit / conditionalTips

Summary hiện chưa có reviewed/calibrated observation classifier hoặc confidence. Vì vậy tất cả conditionalTips trong JSON để [] đúng yêu cầu cho phép bỏ qua; không tự đặt low/high thresholds, suy mí/gò má/face-shape/undertone. Khi valid contour mắt có source và quality tốt, thêm hướng dẫn vị trí trung tính: kiểm tra khi mở mắt, bắt đầu viền mảnh. Không tuyên bố mắt thuộc loại nào hoặc dùng số đo để rank style. Missing/unknown không thêm điều chỉnh.

Trước khi kích hoạt conditionalTips cần bộ phân loại observation được kiểm chứng, evidence/confidence và review MUA; arrays hiện không có active rules để vô tình chạy. Không đưa low/high dựa trên MakeupProfile experimental buckets vào engine mới.

## Marketplace/ảnh

aliasesFor dùng exact catalog names, Soft Korean có alias Korean hiện có; không ánh xạ mọi glam thành Sự kiện rồi gọi exact match. Nếu thiếu catalog style, dùng search keywords hiện có và nhãn gần phù hợp. IDs/prices chỉ lấy backend catalog thật. Ảnh style riêng chưa có; dùng portfolio có tag match thật hoặc illustration thương hiệu, không giả đó là ảnh mẫu style.

## Kiểm thử và giới hạn

Tests: JSON fields/count/unique/word length/steps, các biến thể preference, null/clear, unknown, không appearance ranking, recompute không inference/HTTP, collapsed UI và exact matching. Sau sửa engine, các tests kỳ vọng geometry ranking cũ được thay bằng tests library; scan/native/cloud tests vẫn chạy.

Chưa kiểm thử device APK mới, chưa review nội dung trực tiếp bởi MUA, chưa cung cấp 12 ảnh riêng. Không build APK/AAB/Gradle, commit/push/merge, sửa BE hoặc deploy. Muốn xem trên điện thoại cần owner build advisor-preview sau review.

Kết quả kiểm thử lượt triển khai: 22 suites / 179 tests PASS; TypeScript --noEmit PASS. Sau bổ sung test UI tích hợp preferences và nhãn ảnh thiếu, rerun targeted screen/library và lint. Các lượt đầu có tests còn giả định local dùng provider schema cũ và test fixture detection thiếu fields; đã sửa để tách strict provider schema khỏi library local và giữ cloud guards nguyên vẹn.
