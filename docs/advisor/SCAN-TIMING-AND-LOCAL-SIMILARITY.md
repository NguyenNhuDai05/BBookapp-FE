# Audit gợi ý giống nhau và thời gian quét

Nội dung screenshot người dùng khớp chuỗi localRecommendations, không phải chứng cứ provider Gemini. Preview cloud OFF; Gemini không nhận lần quét này.

## Nguyên nhân đã xác nhận từ source/tests

recommend({}, geometry) chọn top 3 từ knowledge. Không có occasion wedding nên bridal luôn bị loại, chỉ còn korean/portrait/event: bộ ba style không thay đổi; ranking có thể thay đổi nếu geometry hợp lệ và vượt ngưỡng. Titles, mô tả, bảng màu phần lớn cố định. Nếu thiếu bất kỳ outlineAspect/eyeSpacing/mouthWidth, recommendationGeometry trả undefined và ranking mất toàn bộ geometry. Geometry ngoài experimental range cũng bỏ ranking.

makeupFocus gồm câu mẫu và một số điều kiện khá rộng. Có dữ liệu BrowArch là thêm cùng một câu, không phân biệt giá trị. whyItFits có evidence là một câu chung. Vì vậy hai summary khác nhau nhưng cùng rule buckets có thể tạo kết quả giống hệt; localSimilarity.test.ts tái hiện điều này. Input vượt nhóm khác có thể đổi ranking/tips; không đúng rằng mọi giá trị đều cho cùng output. Không có actual summaries hai ảnh nên không khẳng định mapping native bị cache/đo giống nhau.

Không đổi scoring hoặc ngẫu nhiên hóa gợi ý trong lượt này. Đây vẫn là fallback rule-based, chưa đáp ứng trải nghiệm tư vấn cá nhân hóa sâu. Không gắn nhãn Gemini hoặc tự bật cloud để che hạn chế.

## Thời gian mới (thay thế mốc 3,6 s trong tài liệu cũ)

- Ảnh valid: min 10000 ms từ run/inference start; recommendation và native xử lý ngay. Chậm hơn 10 s không cộng delay. Không thể cam kết đúng 10 s nếu inference thực sự lâu hơn.
- Quality invalid: min 5000 ms từ inference start, sau đó hiện lý do quality gate. Không rerun ML Kit và không gọi recommendation khi invalid.
- Empty/multi face được báo riêng; pose/ảnh nhỏ/che đường viền giữ reason có cơ sở đo đạc. Không tuyên bố phát hiện blur/ánh sáng nếu không có detector cho chúng.
- Native failures/memory/permission/admission báo ngay: không kéo dài lỗi an toàn hệ thống như thể đang phân tích ảnh.
- Thông báo lỗi Modal centered, dismissible; kết quả cũ vẫn giữ khi ảnh mới invalid. Không tạo điểm/mesh giả.
- Reset/background/blur abort timer và ngăn stale result. Giữ Phase 1 cleanup/native memory guard.

Files: scanPresentation.ts, useAdvisor.ts, extractor.ts, app/makeup-advisor.tsx; tests presentation/hook/screen và localSimilarity. BE không đổi. Cần tự build advisor-preview mới để thấy thay đổi; không deploy BE chỉ cho timing. Tests mock/JS không thay thế kiểm thử device/native.
