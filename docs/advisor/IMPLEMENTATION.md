# BBook Makeup Advisor — candidate nội bộ

Baseline frontend alpha: `58be978`. Worktree: `D:\EXE\bbeauty-app-mlkit-advisor`, branch `candidate/mlkit-advisor`. Không commit/push/merge. Backend, Supabase, Gemini candidate và PoC gốc không được sửa.

## Luồng đã triển khai

Khám phá → Makeup Advisor → consent → camera hệ thống/Photo Picker → native bounded normalization → phân tích ML Kit → kiểm tra ảnh bằng mắt + hard quality gates → ba ý tưởng makeup → catalog thật → MUA/service → `/mua-detail` → flow booking hiện có. Không tự tạo booking. Không questionnaire bắt buộc; dịp/sở thích/ngân sách/tỉnh là tinh chỉnh tùy chọn sau kết quả. Khi không đủ dữ liệu hoặc thiếu native module/iOS, người dùng có thể chọn khám phá không dùng ảnh, với lý do rõ ràng.

Ảnh, contours, geometry chỉ ở thiết bị và state màn hình. Query keys/API chỉ có style ID, tỉnh, ngân sách. Không gửi selfie/Gemini, không base64. Ảnh source do picker sao chép vào cache và output native được xóa trên success/error/reset/blur; kết quả bất đồng bộ cũ bị loại bỏ. Output `bbook-normalized-*.jpg` quá một giờ được dọn khi mở Advisor lần sau để phục hồi sau process kill; không quét/xóa cache của chức năng khác. Không bảo đảm xóa lập tức nếu OS giết process. SDK có thể gửi thống kê vận hành theo điều khoản ML Kit.

## Những tín hiệu dùng thật

Count phải bằng 1; head angles, kích thước mặt, crop và contours phải qua gate; manual review không vượt qua hard gate. Coordinates lấy từ cùng bitmap đã chuẩn hóa, geometry đưa về trục theo đường nối tâm mắt. Khi đạt gate:

| Tín hiệu 2D | Ảnh hưởng thử nghiệm |
| --- | --- |
| Cao/rộng đường viền ≥1.40 | Tăng ưu tiên Kỷ yếu, thử cách bố trí má theo chiều ngang |
| Cao/rộng ≤1.15 | Tăng ưu tiên Sự kiện, thử nhấn vùng mắt |
| Khoảng cách mắt/rộng ≤0.46 | Tăng ưu tiên Sự kiện, thử điểm nhấn hướng ra ngoài |
| Khoảng cách mắt/rộng ≥0.52 | Tăng ưu tiên Korean, thử mắt mềm/gọn |
| Vùng trung gian hoặc thiếu tín hiệu | Giữ gợi ý khám phá; không ép khác nhau |
| Rộng môi/rộng mặt | Được kiểm tra/đo trong geometry nhưng không xếp hạng: nhạy với biểu cảm |

Các ngưỡng là heuristic sản phẩm, chưa hiệu chuẩn trên dân số hoặc đánh giá MUA. Không gọi chúng classifier dáng mặt, độ tin cậy %, undertone, tuổi, giới tính, sức khỏe hay thẩm mỹ. Các rule deterministic có unit tests chứng minh thay đổi thứ tự với tín hiệu hợp lệ, không dùng random. Thay đổi thứ tự không chứng minh người dùng sẽ thích makeup đó.

## Knowledge base và dữ liệu thị trường

Version `2026-10-12.photo-first.1`, bốn mô tả biên tập: Korean, Kỷ yếu, Sự kiện, Cô dâu. Cô dâu chỉ xuất hiện khi chọn dịp cưới; không suy từ mặt. Nguồn kỹ thuật makeup tổng quát:

- [Bobbi Brown — natural/dewy](https://www.bobbibrowncosmetics.com/trends-natural-dewy-makeup)
- [Bobbi Brown — makeup trends](https://www.bobbibrowncosmetics.com/trends-filter)
- [NYX — cách bố trí blush](https://www.nyxcosmetics.com/blog/where-how-to-apply-blush-for-your-face-shape.html)
- [Bobbi Brown — bridal](https://www.bobbibrowncosmetics.com/bride-wedding-makeup)

Đây là hướng dẫn thương hiệu, không nghiên cứu xác thực classifier/threshold hay kiểm chứng phù hợp cá nhân. Nội dung được đối chiếu nguồn và diễn đạt lại; chưa có MUA đánh giá chuyên môn. Tên nhóm đã đối chiếu GET `/Explore` thật ngày 12/10/2026. ID được resolve theo tên chính xác từ API, không fuzzy/hardcode ID.

GET `/Explore`: styles, provinces và catalog công khai. GET `/Explore/search?kind=artists|services&styleId=...`: matching theo contract hiện có. Service search có thể match style của MUA hoặc tag dịch vụ; UI phân biệt hai trường hợp, không khẳng định service có đúng tag khi thiếu. Giá/tên/avatar/tỉnh/review từ API; portfolio/service detail lấy qua màn hình MUA hiện có. Chỉ trang đầu 12 kết quả, không khẳng định lịch trống. Lỗi/empty API không tạo dữ liệu giả. Không cache ảnh hoặc geometry vào React Query.

## Native/config

Tái sử dụng bounded normalizer và detection/geometry từ PoC, không đổi detector options/reuse. Bundled ML Kit `com.google.mlkit:face-detection:16.1.7`; AndroidX EXIF `1.4.2`. Camera qua `expo-image-picker` baseline, không thêm expo-camera. Giữ package `com.bbook.app`, scheme/Firebase/push baseline. Expo SDK57, RN0.86.3; native module cần APK, Expo Go chỉ có fallback.

Normalizer đọc bounds thật trước decode, max40MP/max40MiB nguồn, sample tới ≤4MP/maxedge2560, bitmap decode max16MB, EXIF đủ8 orientations, output cạnh dài≤1280 JPEG90/max5MiB, không upscale. JPEG/PNG/WebP tĩnh; HEIC/AVIF/GIF/RAW/animated WebP không được nghiệm thu và không cam kết hỗ trợ. Synthetic native policy tests không thay thế kiểm thử pixel/orientation thực tế.

Production default OFF ở config và Android metadata. Chỉ `advisor-development`/`advisor-preview` được bật khi có EAS_BUILD_PROFILE; profile production cố bật sẽ fail. Flag là compile-time nội bộ, chưa có backend remote kill switch. Tối đa2 task phân tích mỗi lifetime native module; reset ảnh không reset budget. Native latches stop khi low-memory hoặc sampled PSS ≥min(768MiB, baseline trước picker+128MiB), lượt sau cần64MiB headroom. Đây là mitigation; sampled stages có thể bỏ sót peak giữa hai mốc. Không tuyên bố memory leak đã sửa. Close calls không chứng minh model/native allocation đã unload; không sửa lifecycle theo phỏng đoán.

## Phạm vi diff

Tracked: app.config.ts (flag/profile/plugin), eas.json (hai profile APK nội bộ), app/(tabs)/explore.tsx (entry flag). New: app/makeup-advisor.tsx, features/makeupAdvisor/*, modules/bbook-face-analysis/*, plugins/withAdvisor.js, nativewind-env.d.ts, docs/advisor/*. `package.json`, lockfile, app.json, Firebase, auth, chat, booking, GPS, admin runtime giữ nguyên nội dung baseline. Generated android/.expo/build/artifacts bị ignore.

## Giới hạn nghiệm thu

Candidate UI/native/booking xuyên suốt chưa được test trên máy thật. OPPO đã test PoC trước đó, không phải APK tích hợp này. Android16 trên OPPO có page4096, không chứng minh runtime16KB. Các hãng khác chưa test. Production alpha vẫn versionCode4, chưa cập nhật. Không áp migration và không có backend AI deployment cho phương án local này.
