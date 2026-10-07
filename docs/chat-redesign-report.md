# Báo cáo redesign chat BBook

## 1. Hiện trạng trước khi sửa

Audit đã thực hiện trước khi code trong [chat-redesign-audit.md](chat-redesign-audit.md). Màn chi tiết chung customer/MUA chứa bubble, composer và xử lý REST/SignalR. Mỗi tin có timestamp, avatar incoming, nút safety và nút tim trống; divider Hôm nay hardcode. Phân trang 50 tin, reply/reaction/upload/private media/read/typing đã tồn tại. Không có API delete/recall/mute/presence/search.

## 2. File đã sửa

- `app/chat/[id].tsx`: header, search, menus, list/pagination, trạng thái mạng/gửi/retry và composer integration.
- `components/chat/ChatListScreen.tsx`: dùng cùng parser UTC cho thời gian và sort hội thoại.
- `components/PrivateMediaImage.tsx`: callback load/error/load-start cho thumbnail, reset nguồn bằng key, retry public/private và bỏ kết quả async từ ảnh cũ. Endpoint cấp quyền và cachePolicy none giữ nguyên.
- Thêm `components/chat/MessageBubble.tsx`, `MessageComposer.tsx`, `ChatActionMenus.tsx`.
- Thêm `utils/chatPresentation.ts`, test utility và màn chi tiết; bổ sung test shared private media.
- Thêm audit/report này. Các thay đổi haptic-tab, hook booking và hướng dẫn closed test đang có trong working tree là phần sửa lỗi Expo Router từ yêu cầu trước, không phải thay đổi architecture chat.

Không sửa backend, service endpoints/DTO, SignalR transport, auth/token/store, route được nơi khác gọi, package/lockfile, app.json/eas.json, Android/credentials/google-services.json/permissions/versionCode.

## 3. UI/UX đã thay đổi

Header gọn, avatar 42px, tên một dòng và subtitle Tin nhắn riêng/typing thực tế. Bubble incoming trắng, outgoing dùng BrandColors.primaryPink; avatar incoming 30px tại cuối nhóm. Bỏ metadata/safety/tim trống thường trực. Quick action 34px trong thanh cuộn ngang. Composer hỗ trợ multiline/emoji/ảnh và send state, giữ bản nháp khi gửi lỗi. Không thêm nút xóa/thu hồi/mute/presence không có API.

## 4. Message grouping logic

`MESSAGE_GROUP_GAP_MS = 10 phút`; cùng sender (case-insensitive), cùng ngày theo timezone thiết bị và khoảng cách không quá ngưỡng → cùng nhóm. Trong nhóm cách 3px; nhóm mới cách 12px. Group flags được tính một lần từ danh sách chronological rồi đảo cho FlatList inverted. Bubble được memo; khi gõ input, rows/render callback giữ ổn định.

## 5. Date divider logic

Dùng sentAt hiện hữu, chính là thời gian tạo tin backend gán UTC. Tôn trọng Z/offset; ISO thiếu zone được hiểu UTC theo nguồn backend. Chia ngày theo local device: Hôm nay/Hôm qua; cùng năm: Thứ ..., DD/MM; khác năm: DD/MM/YYYY. Không hardcode ngày; nhãn cập nhật mỗi phút để xử lý qua nửa đêm. Timestamp sai có fallback, không render Invalid Date. Đã test gần 23:59/00:01 và offset +07:00.

## 6. Timestamp logic

Giờ không hiện mặc định, chạm bubble để bật/tắt. Chỉ tin outgoing gần nhất hiện Đã gửi/Đã xem dựa dữ liệu thật. Composer hiện Đang gửi… khi request pending. Không suy diễn delivered/presence hoặc lưu trạng thái gửi giả vào DTO.

## 7. Report/Block đã chuyển đi đâu

Menu ⋮ cấp conversation chứa Báo cáo người dùng/Chặn người dùng, dùng moderation service và modal xác nhận hiện có. Báo cáo từng tin incoming chỉ có trong long press, cùng Reply/Copy/reaction picker. Outgoing không có report-self hoặc xóa/thu hồi giả. MUA profile chỉ mở khi đối tác là MUA; hiện không có customer public-profile route nên không thêm navigation giả.

## 8. Search chat hoạt động thế nào

⋮ → Tìm trong cuộc trò chuyện mới mở search header. Debounce 250ms, bỏ query rỗng, so sánh chữ thường tiếng Việt, highlight literal text (không dùng regex từ input). Hiện chỉ số n/N, mũi tên luân phiên kết quả và scroll tới tin. UI ghi rõ chỉ tìm trong lịch sử đã tải. Có thể tải thêm tin bằng pagination hiện tại; không giả vờ tìm toàn bộ server.

## 9. API/backend có thay đổi không

Không có thay đổi trong yêu cầu redesign này. REST send text/image/reply/reaction/read/moderation và upload FormData/media reference giữ contract. Dedupe messageId xử lý response và SignalR cùng tin. Giữ SignalR; bổ sung đồng bộ trang mới nhất mỗi 20 giây khi màn focused/app active và khi quay lại foreground. Không bỏ các trang cũ. Listener/timer được cleanup; lỗi transient polling không xóa lịch sử.

## 10. Dependency mới

Không có. Dùng RN core, Expo packages đã cài, ActionSheet/AppBottomSheet/AppModal/ReportSheet hiện có. Native project không đổi. Kiểm tra package versions bằng metadata bundled của Expo SDK 57; `expo install --check` offline báo Dependencies are up to date kèm lưu ý validation offline không đảm bảo bằng check online.

## 11. Expo Go compatibility

Đã khởi động Metro với `expo start --go --clear` trên cổng kiểm tra riêng, gọi Android development bundle qua HTTP (dev=true, lazy=false) thành công: 4050 modules, không lỗi 500, module missing hoặc import @react-navigation từ code chat. Server kiểm tra đã dừng, không ảnh hưởng server người dùng đang chạy.

Chưa mở Expo Go trên điện thoại Android thật: không có adb/thiết bị kết nối trong môi trường này. Vì vậy chưa xác nhận reload/native runtime, bàn phím/OEM navigation bar hoặc thao tác thật. Bundle thành công không đồng nghĩa device smoke test đã pass.

## 12. Typecheck/lint result

`npx tsc --noEmit`: pass. ESLint các file code thay đổi: không lỗi/cảnh báo. `git diff --check`: pass. Không tự sửa warning ngoài phạm vi hoặc nâng dependency. Không chạy EAS production build/submit, không tăng version/versionCode.

## 13. Các test case đã pass

48 test liên quan qua các lần chạy (6 suites; các test bổ sung/chỉnh sửa đã chạy lại):

- 7 utility tests: nhóm 5 incoming; đổi sender/gap; qua nửa đêm; nhãn ngày/năm/invalid UTC; receipt latest/same minute; dedupe/reactions; search tiếng Việt/emoji/literal punctuation.
- 17 screen tests: UI không spam metadata/safety/reaction; tap time; long-press reply; menu conversation; search result navigation; send image payload; send fail giữ draft/retry; realtime dedupe/listener cleanup; quick-action routes; reaction API thực; cursor pagination/maintainVisibleContentPosition; ảnh retry không upload lại; initial network error/retry; 360/393/430px sizing simulations; copy/message report; block confirmation; slow send chống resubmit/read event.
- 3 private-media regression tests: renew URL qua endpoint hiện có/cache none; denied-access fallback; public image error/retry/callback load.
- 3 conversation-list regression tests; 3 booking-to-chat navigation tests; 15 Play review/API-contract regression tests.

Case keyboard mở và Expo Go reload: chưa pass trên thiết bị. Send/upload tests dùng mock contract, không gửi tin tới người dùng thật. Kiểm tra responsive dùng React Native test renderer và kích thước giả lập, chưa có screenshot Android thực. DTO không có deletedAt: bubble fallback Nội dung không khả dụng khi dữ liệu rỗng; không giả lập thu hồi.

## 14. Rủi ro còn lại

- Cần test Expo Go với đúng phiên bản phù hợp SDK 57: Android 360/393/430, mở/đóng keyboard, emoji/tiếng Việt/multiline/paste, safe area, search scroll, prepend và ảnh dọc/ngang/lỗi tải.
- Native Android đã có adjustResize; giữ hành vi hiện tại thay vì thêm thư viện keyboard. Cần xác minh thực tế trên máy tester, đặc biệt navigation bar/OEM keyboard.
- Timestamp-only cursor có giới hạn sẵn có nếu trên 50 tin cùng chính xác một timestamp; không sửa backend/contract để xử lý trong redesign.
- Backend không có idempotency send token: reconcile giảm gửi lặp khi mạng lỗi nhưng không bảo đảm exactly-once cho hai tin cùng nội dung được gửi sát nhau.
- Cần kiểm tra gửi/nhận hai tài khoản thật, reconnect/background, đọc/reactions/private URLs qua API production; test mock không thay thế kiểm tra này.
- Shared PrivateMediaImage có thay đổi nhỏ, đã có regression tests; cần smoke các màn verification cũng dùng nó.

## 15. Có an toàn để build Closed Test không

Frontend đã qua typecheck/lint, test và Metro development bundle. Chưa kết luận toàn bộ điều kiện phát hành đã pass vì còn Expo Go/thiết bị thật. Chưa tuyên bố “Đã sẵn sàng tăng versionCode/build bản Closed Test”.

Sau khi device smoke pass: giữ package com.bbook.app, scheme bbookapp, credentials/API/config; kiểm tra versionCode remote EAS so với Play rồi dùng production autoIncrement hiện có khi người dùng yêu cầu build. Thử cập nhật đè bản closed test cũ, giữ đăng nhập/data/chat; phát hành cùng track. Không cần backend deploy mới riêng cho redesign này. Chưa build production hoặc submit Play.
