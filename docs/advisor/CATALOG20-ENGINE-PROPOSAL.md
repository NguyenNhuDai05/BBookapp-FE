# Đề xuất engine 20 kiểu — CHƯA ÁP DỤNG

Cần người dùng duyệt trước khi sửa candidate generation, dữ liệu engine, rule mappings, scoring hoặc tie-break. Không cần thay backend để thực hiện local engine; đề xuất này không chạy trong app.

## Bước 1: dữ liệu

Sửa dữ liệu nguồn có xác nhận: classic-glam có 5 tags/4 tagLabels; cần bổ sung nhãn đúng cho timeless ở đúng vị trí. Có nhãn warm brown trong soft-glam/western-glam và soft peach trong bridal-soft-glam. Bản chỉnh nhãn đề xuất: thêm "Cổ điển" ở vị trí timeless của classic-glam; đổi nhãn "warm brown" thành "Nâu ấm" trong soft-glam và western-glam; đổi "soft peach" thành "Đào nhạt" trong bridal-soft-glam. Đây là nhãn UI, không đổi machine fields. Không ghi đè JSON của người dùng trong lượt audit. Chốt nhãn rồi cập nhật cả file runtime theo bản đã duyệt.

Catalog mới có thay đổi intensity/occasions/tags/colorPalette của các key cũ (xem CATALOG20-INPUT-DIFF.json). Nếu thay catalog engine thì ranking preference cũng thay đổi, dù trọng số giữ nguyên. Cần duyệt cả thay đổi metadata này, không chỉ 8 key mới.

## Bước 2: candidate và tie-break

Cho engine dùng catalog 20 đã validate cùng một compatibility overlay theo stable key, được review riêng. Không suy rule từ title/tag hay tự động dịch mã. Giữ key/name/intensity/occasions/tags/colorPalette theo file mới đã duyệt. Kiểm tra compatibility của 12 kiểu cũ với nội dung kỹ thuật mới thay vì sao chép mù quáng.

Mở candidate pool lên 20. Giữ điều kiện cô dâu hiện có nếu được duyệt. Khai báo vị trí tie-break tường minh cho mọi key; không dùng indexOf=-1 cho key mới. Từ chối cấu hình thiếu key. Giữ quy tắc diversity chỉ khi bằng điểm, không trộn random và không tăng điểm chỉ để tạo coverage.

## Bước 3: rule mapping có cơ sở quan sát

Đây là gợi ý kỹ thuật thử nghiệm, không là kết luận style phù hợp thẩm mỹ. Chỉ sử dụng eyeSpacing/eyeAspect/browArch/mouthAspect hiện có qua quality gate; không thêm ngưỡng phân loại cho outlineAspect/mouthWidth, undertone, skin type hay face shape trong thay đổi này.

| Kiểu mới | Mapping kỹ thuật có thể review | Tín hiệu sở thích từ file mới | Giới hạn |
|---|---|---|---|
| j-beauty | soft-eyeliner với opening-low-soft; natural-brow-styling với arch-high-natural | light, daily/school/date theo JSON | Phải kiểm tra kỹ thuật nền/tone không suy từ ML Kit |
| igari | Không ép rule khuôn mặt; điểm nhấn má hồng chưa có rule đáng tin | medium và occasions của JSON | Có thể cần lựa chọn sở thích phong cách/má hồng mới, cũng phải duyệt; không tự thêm trong lượt này |
| ulzzang | gradient-eyeshadow/soft-eyeliner theo eyeAspect; soft-brow-shaping theo browArch, sau review mô tả | medium và occasions của JSON | Gradient lips trong mô tả không tự suy từ mouthWidth |
| western-glam | defined-lip-outline theo lip-low-outline; gradient-eyeshadow theo opening-high-gradient | bold, party/photoshoot | Không suy tạo khối tương ứng với dáng mặt |
| nude-makeup | soft-eyeliner, natural-brow-styling nếu đúng kỹ thuật trong JSON | medium, work/date/daily | Tông màu là lựa chọn nghệ thuật, không đo undertone |
| fox-eye | outer-eye-emphasis theo spacing-low-outer | bold, party/photoshoot/date | Chỉ gợi ý thử kỹ thuật, không đánh giá giải phẫu mắt |
| sunkissed | Không ép rule face; bronzer/nền khỏe không có phép đo được duyệt | medium, daily/date/photoshoot | Không suy màu da, tình trạng da hoặc tông da |
| glass-skin | soft-eyeliner và natural-brow-styling cho các phần kỹ thuật mắt/mày | light, daily/date/work | Không khẳng định ML Kit đo da đủ ẩm/căng bóng |

Cần review MUA các mappings; metadata evidenceStatus=experimental/reviewStatus=pending không biến thành verified. Nếu kiểu preference-only bị áp đảo thì báo cáo giới hạn. Không tự thêm điểm thưởng hay ưu tiên để ép tất cả 20 kiểu được chọn. Một selector sở thích phong cách có thể giải quyết nhu cầu chọn tone/blush/finish nhưng là phạm vi riêng cần duyệt.

## Bước 4: scoring và acceptance

Đề xuất ban đầu giữ faceBudget=1, occasionBonus=0.12, intensityBonus=0.08; mở candidates/mappings đã duyệt vẫn có thể đổi ranking. Nếu cần đổi trọng số hay cách tính specificity, trình bày một diff riêng và mô phỏng trước khi duyệt. Không sửa native inference, measurements, guards, timers, camera, cleanup, consent hoặc cấu hình Free Tier/Gemini.

Chạy lại tập bucket/quality/preference đầy đủ với engine 20. Xuất coverage + score distribution + ví dụ deterministic + trường hợp không có sở thích + explanations gắn đúng contribution. Không yêu cầu 20 kiểu có tần suất bằng nhau; ghi rõ kiểu chưa vào Top 3 và nguyên nhân. Snapshot regression trên 12 kiểu cũ để reviewer xem thay đổi.

## Backend

API Khám phá hiện tại đã có styles/filter/styleId, artists/services/portfolio. UI vẫn dùng API/IDs thật và keyword fallback trung lập. Chỉ nếu cần toàn bộ 20 kiểu có numeric StyleId và quan hệ MUA/service trong DB mới xem xét bổ sung metadata/style relations như một thay đổi backend/database riêng cần duyệt. Không tạo endpoint hoặc sửa schema trong lượt này.
