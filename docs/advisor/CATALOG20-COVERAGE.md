# Candidate coverage — engine hiện tại

Mô phỏng tổng 6912 trường hợp: 108 bộ số liệu × 32 lựa chọn sở thích (bao gồm null/null) × 2 trạng thái experimental. Tất cả dùng engine thật, không random, không sửa candidate/scoring. Bộ số liệu bao phủ mọi bucket hiện có: spacing low/neutral/high/missing; eye opening, brow arch, mouth aspect low/high/missing. Counts là số lượt trong tập tổng hợp, không phải xác suất ngoài thực tế. Không chứng minh chất lượng thẩm mỹ hay tần suất dữ liệu camera thực.

| Style key | Catalog 20 | Candidate hiện tại | Scoring rule IDs | Có ví dụ Top 3 | Lượt Top 3 bật face-aware | Lượt không chọn sở thích | Điều kiện/giới hạn |
|---|---|---|---|---|---:|---:|---|
| soft-korean | Có | Có | spacing-high-soft, opening-low-soft, arch-low-soft, lip-high-soft | Có | 872 | 22 | Theo rule + sở thích; xem ví dụ trong JSON |
| douyin | Có | Có | spacing-low-outer, opening-high-gradient, arch-low-soft, lip-high-soft | Có | 864 | 29 | Theo rule + sở thích; xem ví dụ trong JSON |
| clean-girl | Có | Có | spacing-high-soft, opening-low-soft, arch-high-natural | Có | 415 | 10 | Theo rule + sở thích; xem ví dụ trong JSON |
| natural | Có | Có | spacing-high-soft, opening-low-soft, arch-high-natural, lip-high-soft | Có | 1291 | 49 | Theo rule + sở thích; xem ví dụ trong JSON |
| peach | Có | Có | spacing-low-outer, spacing-high-soft, opening-low-soft, opening-high-gradient, arch-low-soft, lip-high-soft | Có | 2132 | 73 | Theo rule + sở thích; xem ví dụ trong JSON |
| strawberry | Có | Có | spacing-high-soft, opening-low-soft, arch-high-natural, lip-high-soft | Có | 673 | 14 | Theo rule + sở thích; xem ví dụ trong JSON |
| latte | Có | Có | spacing-low-outer, spacing-high-soft, opening-low-soft, opening-high-gradient, lip-low-outline | Có | 1159 | 22 | Theo rule + sở thích; xem ví dụ trong JSON |
| soft-glam | Có | Có | spacing-low-outer, spacing-high-soft, opening-low-soft, opening-high-gradient, lip-low-outline | Có | 1648 | 62 | Theo rule + sở thích; xem ví dụ trong JSON |
| thai-glam | Có | Có | spacing-low-outer, opening-high-gradient, lip-low-outline | Có | 566 | 21 | Theo rule + sở thích; xem ví dụ trong JSON |
| smokey-eyes | Có | Có | opening-high-gradient, arch-low-soft | Có | 195 | 7 | Theo rule + sở thích; xem ví dụ trong JSON |
| bridal-soft-glam | Có | Có, chỉ wedding | spacing-high-soft, opening-low-soft, opening-high-gradient, arch-low-soft, lip-low-outline | Có | 221 | 0 | Theo rule + sở thích; xem ví dụ trong JSON |
| classic-glam | Có | Có | spacing-low-outer, lip-low-outline | Có | 332 | 15 | Theo rule + sở thích; xem ví dụ trong JSON |
| j-beauty | Có | Không | Không | Không | 0 | 0 | Chưa được engine load; không có compatibility/tie-break được duyệt |
| igari | Có | Không | Không | Không | 0 | 0 | Chưa được engine load; không có compatibility/tie-break được duyệt |
| ulzzang | Có | Không | Không | Không | 0 | 0 | Chưa được engine load; không có compatibility/tie-break được duyệt |
| western-glam | Có | Không | Không | Không | 0 | 0 | Chưa được engine load; không có compatibility/tie-break được duyệt |
| nude-makeup | Có | Không | Không | Không | 0 | 0 | Chưa được engine load; không có compatibility/tie-break được duyệt |
| fox-eye | Có | Không | Không | Không | 0 | 0 | Chưa được engine load; không có compatibility/tie-break được duyệt |
| sunkissed | Có | Không | Không | Không | 0 | 0 | Chưa được engine load; không có compatibility/tie-break được duyệt |
| glass-skin | Có | Không | Không | Không | 0 | 0 | Chưa được engine load; không có compatibility/tie-break được duyệt |

Tắt experimental + không chọn sở thích: natural,soft-glam,classic-glam trong toàn bộ 108 bộ số liệu. Khi đó số liệu không tham gia faceScore; thứ tự curated và diversity độ đậm quyết định. Bật experimental thì 11 kiểu không phải cô dâu đều có ví dụ Top 3 khi sở thích null/null. Cô dâu chỉ tham gia khi occasion=wedding.

Candidate generation lấy styleLibrary v1.1 (12), không lấy file v1.2 mới. Thứ tự hardcode curated chỉ dùng tie-break, không tạo candidates. Các key mới chưa có trong curated sẽ có indexOf=-1 nếu nạp thẳng: có thể được ưu tiên sai khi bằng điểm. Không thể chỉ thay import JSON: validator yêu cầu v1.1/12/faceCompatibility và mọi style mới thiếu faceCompatibility.

JSON kết quả chứa conditions, score range, ví dụ input/preferences cho từng kiểu có thể xuất hiện, accepted/rejected probes và cấu hình tập mô phỏng. Missing/source/pose probes không kích hoạt rule; tests hiện có kiểm tra eyesClosed/expression. Không một kiểu mới nào được ép lọt Top 3.
