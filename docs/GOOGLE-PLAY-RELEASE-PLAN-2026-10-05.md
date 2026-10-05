# BBook — kế hoạch kiểm chứng và phát hành Google Play

Ngày kiểm tra: 05/10/2026. Tài khoản: cá nhân; chủ app xác nhận có 12 người sẵn sàng test.

## 1. Kết luận

Chưa đủ bằng chứng để chốt bản khai An toàn dữ liệu và đưa bản hiện tại đi xét duyệt. Có nền tảng chức năng phù hợp, nhưng cần đóng các khoảng trống về SDK, đồng ý điều khoản, bản Android thực tế và quyền truy cập của reviewer. Kế hoạch này nhằm giảm các nguyên nhân bị từ chối; không thể bảo đảm quyết định của Google.

Phạm vi đã kiểm tra: source app/backend/web, cấu hình Android/EAS, kiểm thử frontend, tài liệu reviewer và hai URL công khai. Chưa kiểm chứng tài khoản production, cấu hình EAS/Render đang chạy, dữ liệu production hay một AAB cài từ Play. Không sửa code sản phẩm, không build cloud, không upload hoặc deploy trong đợt lập kế hoạch này.

### Bằng chứng đã có

| Hạng mục | Kết quả | Giới hạn |
|---|---|---|
| TypeScript | `npx tsc --noEmit`: đạt | Không kiểm tra native/runtime |
| Frontend Jest | 40 suites, 216 tests đạt | Có mock; không thay thế thử app thật |
| Lint | 3 lỗi, 14 cảnh báo | Cần sửa lỗi và đánh giá cảnh báo |
| Expo dependency check offline | Báo dependencies up to date | Công cụ cảnh báo kiểm tra offline không đáng tin đầy đủ |
| Backend tests | Chưa đạt bước build; exit 1, chưa có lỗi cụ thể | Không tính là test backend đạt |
| Android export lần đầu | Hermes không ghi được file tạm do permission denied | Lỗi môi trường; chưa kết luận lỗi sản phẩm |
| Android export thử lại | Đạt sau khi chuyển TEMP/TMP vào workspace; xuất bundle Hermes | Không phải AAB/native build; chưa chứng minh bản cài Play chạy đúng |
| Web privacy và delete-account | HTTP 200; bản 05/10/2026 đang công khai | Chưa chứng minh toàn bộ nội dung khớp bản production |
| Cấu hình production | EAS app-bundle, API HTTPS, package `com.bbook.app` | Chưa có AAB để kiểm tra manifest/chữ ký/SDK cuối cùng |

## 2. Khoảng trống cần đóng trước bản Closed testing

### P0 — khai báo dữ liệu đúng bản release

**Không chốt “Không chia sẻ dữ liệu với bên thứ ba” lúc này.** Lập bảng từng luồng: dữ liệu → endpoint/SDK → bên nhận → mục đích → lưu giữ → ngoại lệ chia sẻ có bằng chứng. Bên nhận gồm backend/Render, Supabase, Brevo, Google đăng nhập/Maps/Places, Expo/FCM và PayOS. Việc dùng dịch vụ bên ngoài không tự động đồng nghĩa phải chọn chia sẻ; cũng không tự động được miễn chia sẻ.

Đối chiếu SDK thực sự nằm trong AAB và cấu hình runtime với tài liệu nhà cung cấp. Maps có thể tự thu thập metadata thiết bị, crash/stack trace, IP và mã định danh riêng; sự kiện bản đồ phụ thuộc cách gọi API. Không suy ra “không bắt buộc” chỉ vì người dùng có thể từ chối GPS hoặc thông báo.

| Bản khai người dùng đã điền | Việc cần xác minh/chỉnh |
|---|---|
| Tên/email/user ID | Luồng tài khoản có lưu server. Giữ mục đích chức năng/quản lý tài khoản nếu đúng luồng thực tế; phân loại bên nhận riêng |
| Địa chỉ/vị trí ước chừng bắt buộc | Phân biệt địa chỉ giao dịch, khu vực hồ sơ và IP do SDK xử lý. Kiểm tra mọi vai trò/luồng để quyết định required/optional |
| Số điện thoại/thông tin khác optional | Kiểm tra có luồng bắt buộc số điện thoại, xác minh danh tính MUA hay không; ghi rõ từng dữ liệu trong “Thông tin khác” |
| Thông tin thanh toán optional | Phân biệt tài khoản nhận tiền MUA, dữ liệu checkout PayOS, giao dịch/số dư. Kiểm tra mục đích kiểm soát gian lận thực tế, không thêm mục đích dự phòng |
| Vị trí chính xác optional | Kiểm tra vẫn dùng được luồng thay thế khi từ chối GPS; địa chỉ/toạ độ tự nhập cũng thuộc phạm vi thu thập nếu gửi server |
| Tin nhắn/ảnh/UGC optional | Kiểm tra tin nhắn và ảnh gửi server, ảnh avatar/portfolio/CCCD; phân loại dữ liệu và mục đích theo từng luồng |
| Files/documents | Không chọn chỉ vì ảnh được lưu thành file. Đối chiếu loại tài liệu thực sự nhận và taxonomy của Google; tránh khai sai hoặc trùng vì suy đoán |
| Crash/diagnostics optional | Kiểm tra SDK tự thu thập và khả năng tắt thật. Chưa có bằng chứng công tắc của app tắt toàn bộ luồng này |
| App interactions optional analytics | Tách tương tác Maps tự thu thập khỏi thao tác app lưu để vận hành; không gán mọi thao tác cho phân tích |
| Search history optional | Search có gửi query server/Places. Không có bảng lịch sử SQL không chứng minh xử lý nhất thời; kiểm tra log, cache và provider |
| Device IDs optional | Tách push token, Firebase installation ID, mã Maps; từ chối thông báo không chứng minh tất cả mã định danh ngừng thu thập |
| Không xử lý nhất thời | Chọn theo lưu giữ thực tế từng luồng; chỉ chọn nhất thời khi đáp ứng định nghĩa bộ nhớ/thời gian của Google |
| HTTPS | Kiểm tra tất cả request trên release, ảnh/file và redirect thanh toán; không suy từ API chính sang mọi endpoint |
| Không có yêu cầu xóa riêng dữ liệu | Rà khả năng xóa nội dung riêng và cơ chế yêu cầu hiện có; không chọn Có nếu không có cách dùng thật/không mô tả được |

**Đầu ra:** bảng dữ liệu có dẫn chiếu source và SDK/version, bản khai Console đề xuất cho từng loại, danh sách các mục chưa đủ bằng chứng. Chỉ chốt khi không còn ô suy đoán.

### P0 — chấp thuận điều khoản trước nội dung do người dùng tạo

`app/(auth)/register.tsx` có checkbox đồng ý. `app/(auth)/login.tsx` gọi đăng nhập Google; `BeautyBookBackend/Services/AuthService.cs`, `GoogleLoginAsync`, có thể tạo user mới khi email chưa tồn tại. Chưa thấy gate tương đương trong luồng này.

Triển khai gate cho tài khoản Google mới và người chưa đồng ý trước khi tạo/đăng nội dung. Lưu phiên bản điều khoản và thời điểm chấp thuận trên server để kiểm tra được; không chỉ dựa vào trạng thái checkbox cục bộ. Người từ chối không được tạo UGC. Không cần biến mọi lần đăng nhập thành một lần hỏi lại.

**Nghiệm thu:** Google mới/Google cũ/email; từ chối/đồng ý; cài lại/đổi thiết bị; thử gửi request trực tiếp; nội dung không được đăng khi thiếu chấp thuận theo quy tắc đã thiết kế.

### P0 — reviewer truy cập được chức năng

`docs/PLAY_REVIEW_PHASE_4B_REPORT.md` mô tả kiểm tra local/mock; các bước production và Android walkthrough còn cần xác nhận thực tế. Không coi tài liệu này là bằng chứng tài khoản đã dùng được trên server đang chạy.

Chuẩn bị App Access: tài khoản Customer và MUA hoạt động; hướng dẫn chuyển vai trò, dữ liệu mẫu và cách thử booking/chat/report. Reviewer không bị chặn bởi OTP, hết hạn mật khẩu hoặc quyền duyệt chưa được cấp. Không đưa credentials vào repo công khai.

Nếu dùng reviewer demo/simulated payment: ghi rõ dữ liệu mẫu và thanh toán mô phỏng; kiểm chứng server chặn tác động tài chính thật. Không dùng cờ reviewer để che nội dung/chức năng hoặc cho reviewer xem một sản phẩm khác. Tài khoản demo được bảo vệ khỏi xóa cần được giải thích; dùng tài khoản dùng một lần riêng để kiểm chứng luồng xóa bình thường.

**Nghiệm thu:** cài qua Play, dùng đúng credentials và hướng dẫn của Console từ đầu đến cuối; backend production phù hợp tài liệu; reviewer nhìn thấy được nội dung/chức năng cần xét duyệt.

### P0 — bản release chạy ổn

Sửa 3 lỗi lint: `app/(admin)/payouts/[id].tsx`, `app/(admin)/private-media.tsx`, `components/PrivateMediaImage.tsx`. Xử lý dependencies effect và tránh giải pháp bỏ rule hàng loạt; rà 14 cảnh báo theo ảnh hưởng.

Android export đã hoàn tất bằng thư mục tạm có quyền ghi. Chẩn đoán build backend/tests có log; chạy các test deletion, account protection, moderation, chat safety trên database test riêng. Không chạy test phá dữ liệu lên production.

Chốt một snapshot gồm các thay đổi MUA/ảnh/input/status trước khi build. Kiểm thử thực tế các lỗi user đã báo: avatar lưu và tải lại, không về home ngoài ý muốn, menu ba chấm, followers, xóa từng/tất cả ảnh chọn nhầm, chèn chữ giữa câu, email dài, hạng Đồng và trạng thái duyệt refresh đúng.

## 3. Xóa tài khoản và UGC — cần chứng minh end-to-end

Code xóa hiện có ẩn danh hóa user, hủy quyền truy cập và xử lý nhiều dữ liệu liên quan; giữ một số định danh giao dịch, số tiền/thời gian. File có worker xóa, xác minh và retry; một số file legacy/shared/untracked cần review. Không mô tả là mọi dữ liệu biến mất tức thì.

1. Tạo tài khoản disposable, đăng ảnh/chat/nội dung và một giao dịch test phù hợp.
2. Xóa qua app: token cũ không dùng được, chat ngắt, user không đăng nhập lại bằng tài khoản đã xóa theo quy tắc hiện tại.
3. Kiểm tra dữ liệu public không còn lộ thông tin cũ; avatar/portfolio/chat/CCCD/bank được xử lý đúng phạm vi.
4. Kiểm tra file storage, worker chạy, retry khi lỗi và hàng đợi NeedsReview; ghi rõ bản ghi nào còn giữ và mục đích.
5. Thử tài khoản có booking/thanh toán/refund/payout/complaint chưa hoàn tất: thông báo rõ cách giải quyết. Sau giải quyết, người dùng phải có đường hoàn thành yêu cầu; không hứa tự xóa tiếp nếu code chưa có.
6. Thử yêu cầu qua trang web/email với người mất quyền truy cập: mailbox hoạt động, có người phụ trách xác minh và xử lý. Không coi `mailto` tồn tại là quy trình vận hành đã hoàn tất.

Đồng bộ lời giải thích trong app/privacy/delete-account: nhãn tab Customer đúng “Tài khoản”, đường dẫn MUA đúng; loại dữ liệu xóa/giữ; thời gian nếu thực tế đã có. Không tự thêm “xóa trong 90 ngày” hoặc nghĩa vụ pháp luật không có căn cứ vận hành.

UGC: thử report user/portfolio/comment/review/message, block từ profile và chat, backend ngăn truy cập liên quan theo quy tắc. Admin phải nhận báo cáo và có quy trình phản hồi/xử lý thực tế; giao diện report chỉ là một phần của yêu cầu.

## 4. Kiểm tra artifact Android và môi trường

| Hạng mục | Hiện trạng | Điều kiện hoàn tất |
|---|---|---|
| Target API | Dependency native local mặc định target/compile 36 | AAB cuối cùng xác nhận target phù hợp yêu cầu hiện hành; hiện Google yêu cầu API 36 cho app mới/cập nhật từ 31/08/2026 |
| 16 KB | AGP/NDK hiện đại nhưng chưa kiểm .so cuối cùng | Kiểm ELF/ZIP alignment và chạy môi trường page size 16 KB; không suy từ version framework |
| Signing | Gradle local có debug config; EAS credentials chưa kiểm | Build EAS production, Play App Signing/upload key đúng; không dùng tùy tiện bản local ký debug |
| Google login | Client IDs tồn tại local | Đăng nhập được trên bản cài từ Play; package và chứng thư Play App Signing được đăng ký đúng |
| Google Maps | Plugin chỉ thêm khi có biến maps key; local chưa thấy key/metadata | Xác nhận biến trong EAS và manifest release; map/Places chạy; key được giới hạn đúng API/package/cert |
| Quyền Android | Có coarse/fine; không cần background location/mic/calendar | Kiểm merged manifest: loại quyền thừa, overlay nếu không dùng, không broad media chỉ để chọn ảnh |
| Image picker | Nguồn đã xem không thấy READ_MEDIA_IMAGES/VIDEO | Kiểm AAB và thử system picker trên Android mới; từ chối quyền vẫn chọn ảnh theo thiết kế |
| Backup/token | Local allowBackup; phiên đăng nhập lưu AsyncStorage | Rà backup rules, loại token/cache riêng tư khỏi backup phù hợp; cân nhắc secure storage theo rủi ro thực tế |
| HTTPS | Production API cấu hình HTTPS | Toàn bộ request/redirect tải file được kiểm; không kết luận release từ manifest debug |
| Backend | Source chưa chứng minh bản deploy | Xác định commit deploy, DB migrations, storage policies, worker/email/push/payment runtime đúng |

Chạy kiểm tra dependency online có log; không nâng cấp hàng loạt chỉ để dẹp cảnh báo. Dùng EAS production sau khi chốt snapshot và môi trường. Lưu build ID, commit, versionCode, checksum AAB và kết quả kiểm tra. Build/upload có thể tiêu tốn quota và thay đổi Console: thực hiện trong bước triển khai được người dùng giao tiếp theo.

## 5. Đồng bộ chính sách và Console

Sau khi ma trận dữ liệu hoàn tất, cập nhật đồng thời source chính sách app, trang web và câu trả lời Console. Ngôn ngữ hướng tới người dùng: thông tin nào, dùng làm gì, ai nhận, quyền lựa chọn, cách xóa và phần được giữ. Bổ sung phần dữ liệu vận hành/diagnostics/mã thiết bị của SDK nếu đúng bản release; không đưa tên bảng hay tên API vào chính sách.

Hai URL công khai hiện hoạt động: https://bbookmakeup.com/privacy/ và https://bbookmakeup.com/delete-account/. Web deploy Render từ main theo thông tin chủ app đã cung cấp. Sau thay đổi phải kiểm nội dung live thật và link trong app, không chỉ kiểm local build.

Console cần rà thêm: App Access, content rating, target audience đúng chủ trương 18+ nếu tiếp tục dùng chính sách đó, Ads declaration theo SDK thực sự, store screenshots/mô tả đúng bản build, developer contact, xác minh tài khoản/thiết bị nếu Console yêu cầu. Không chọn nhóm tuổi thấp chỉ để mở rộng lượt cài. Không đưa giao dịch mô phỏng hoặc số liệu mẫu thành quảng cáo chức năng thật.

Thanh toán makeup là dịch vụ ngoài đời: không tự chuyển sang Play Billing chỉ vì app có PayOS. Nếu thêm bán tính năng/sản phẩm số như boost, subscription hoặc quyền app, phải đánh giá riêng trước phát hành.

## 6. Trình tự triển khai và các cổng nghiệm thu

| Giai đoạn | Công việc | Cổng chuyển bước |
|---|---|---|
| A — audit dữ liệu | Chốt SDK/runtime và ma trận; quyết định các ô Console chưa chắc | Mỗi khai báo có bằng chứng; không còn blanket no-sharing chưa giải thích |
| B — sửa source | Consent gate, lint, release config và lỗi luồng còn tồn tại | TypeScript/lint/test cần thiết đạt; backend test thực sự chạy |
| C — vận hành/quyền riêng tư | Test xóa/report/block; kiểm production reviewer; đồng bộ policy | Reviewer dùng được; xóa và moderation có kết quả/log kiểm chứng |
| D — release candidate | Build AAB, manifest/signing/API/16KB; Google/Maps/permissions | Cài từ Play Internal testing và smoke đạt |
| E — Closed testing | Hoàn thành App content, gửi bản ổn định cho tester | 12 người opt-in; track/bản test dùng được; bắt đầu đếm thời gian |
| F — Production access | Thu feedback/sửa lỗi, đủ thời gian, trả lời form trung thực | Console xác nhận đủ điều kiện; không còn lỗi nghiêm trọng chưa xử lý |

Ưu tiên hoàn thành A–D trước khi bắt đầu đếm 14 ngày. Không lấy 14 ngày làm thời hạn bắt buộc phải gửi production khi vẫn còn lỗi. Lịch sửa/build phụ thuộc kết quả kiểm chứng, không cam kết một số ngày cố định khi chưa có AAB.

## 7. Kế hoạch Closed testing 14 ngày

Yêu cầu áp dụng cho tài khoản cá nhân mới thuộc diện Google quy định: ít nhất 12 tester đã opt-in liên tục trong 14 ngày liền trước lúc nộp xin production access. Có 12 người sẵn sàng chưa đồng nghĩa đã bắt đầu thời gian. Internal testing không thay cho Closed testing. Mời thêm người dự phòng nếu có thể; 15–20 là đề xuất, không phải quy định.

Ngày 0: phát hành Closed testing, gửi link opt-in, xác nhận tester dùng đúng tài khoản Google trong danh sách, vào chương trình và cài bản qua Play. Ghi thời điểm; nếu 12 người tham gia khác giờ, chờ người thứ 12 đủ thời gian và trạng thái Console. Tester không opt-out; người rời và vào lại phải đáp ứng lại thời gian liên tục của họ.

| Khoảng thời gian | Kịch bản và feedback |
|---|---|
| Ngày 1–2 | Cài mới, Google/email login, consent; từ chối quyền; font lớn/email dài; mở lại app |
| Ngày 3–4 | Customer tìm MUA, nhập/chọn địa chỉ, GPS gần đúng/chính xác, Maps, xem dịch vụ |
| Ngày 5–6 | MUA avatar/profile, service/portfolio thêm và xóa ảnh, chèn chữ giữa câu, refresh trạng thái duyệt |
| Ngày 7–8 | Booking, hủy và lỗi mạng; luồng thanh toán test được phép; trạng thái quay lại app và chống ghi trùng |
| Ngày 9–10 | Chat/ảnh/push, report/block, admin xử lý; kiểm nội dung riêng tư không lộ |
| Ngày 11–12 | Xóa tài khoản disposable qua app/web; token/file/retention; sửa lỗi và regression |
| Ngày 13–14 | Walkthrough reviewer, pre-launch report, cập nhật cuối nếu cần, tổng hợp phản hồi và trạng thái opt-in |

Đây là lịch tổ chức, không yêu cầu mọi tester làm đủ mọi kịch bản hay mở app theo số phút cố định. Phân vai Customer/MUA; dùng nội dung mẫu hợp lệ, không thu CCCD/bank thật của tester để chạy test. Chỉ test giao dịch thật nhỏ nếu có kế hoạch/đồng thuận rõ; không mặc định dùng tiền thật.

Google cho phép cập nhật app trong Closed testing. Tiếp tục giữ tester opt-in và thu phản hồi có thật; không chế tạo số liệu tương tác hoặc trả lời form theo mẫu không có bằng chứng. Đủ 14 ngày là điều kiện xin quyền production, không phải tự động được phê duyệt hoặc app lập tức công khai.

## 8. Nhật ký và hồ sơ cuối

Mỗi bug ghi: ngày, versionCode, model/Android, vai trò, bước tái hiện, kết quả mong đợi/thực tế, ảnh đã che dữ liệu riêng tư, mức độ, commit sửa, ai thử lại và kết quả. Không ghi mật khẩu, JWT, CCCD hoặc bank đầy đủ.

Trước khi nộp production access lưu:

- AAB/build ID/commit/versionCode và kiểm target/signing/16KB/quyền.
- Ma trận An toàn dữ liệu đã chốt + bản export Console cuối cùng.
- Privacy/terms/delete-account khớp app và URL live.
- App Access được thử từ bản cài Play; hướng dẫn rõ dữ liệu mẫu/thanh toán test.
- Pre-launch report và xử lý crash/ANR/lỗi quan trọng.
- Feedback thật, các thay đổi đã làm và danh sách giới hạn còn lại.
- Console xác nhận điều kiện 12 tester/14 ngày; trả lời đúng form About testing/app/production readiness.

Người triển khai xử lý source/build/kiểm chứng và chuẩn bị tài liệu. Chủ app quản lý tester, tài khoản/credentials qua kênh riêng, thông tin pháp lý/vận hành lưu giữ, mailbox xử lý xóa/report và thao tác Console. Không cần cung cấp email tester hay mật khẩu trong chat này.

## 9. Nguồn chính thức

- Data safety: https://support.google.com/googleplay/android-developer/answer/10787469?hl=vi
- Maps disclosure: https://developers.google.com/maps/documentation/android-sdk/play-data-disclosure
- Firebase disclosure: https://firebase.google.com/docs/android/play-data-disclosure
- UGC: https://support.google.com/googleplay/android-developer/answer/9876937
- Closed testing: https://support.google.com/googleplay/android-developer/answer/14151465
- Target API: https://developer.android.com/google/play/requirements/target-sdk
- 16 KB: https://developer.android.com/guide/practices/page-sizes
- Photo/video permissions: https://support.google.com/googleplay/android-developer/answer/14115180
- Payments: https://support.google.com/googleplay/android-developer/answer/9858738

Các yêu cầu có thể thay đổi; kiểm lại trang chính thức và cảnh báo của Console vào ngày upload.
