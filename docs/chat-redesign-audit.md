# Audit chat trước redesign

Màn chi tiết: `app/chat/[id].tsx`, dùng chung customer/MUA. Bubble, composer, reply, keyboard và FlatList đang nằm trong màn này. Danh sách: `components/chat/ChatListScreen.tsx`, được gọi bởi `app/(tabs)/chat.tsx` và `app/(mua)/chat.tsx`.

Service: `services/chatService.ts`. Endpoints hiện hữu: GET `/chat/rooms`; POST `/chat/mua/{muaId}` và `/chat/booking/{bookingId}`; GET `/chat/rooms/{id}/messages?before&limit`; POST messages `{content,imageUrl,replyToMessageId}`; POST reaction `{emoji}`; POST read; POST images multipart trả mediaId. UI redesign không sửa chúng.

MessageDto: `messageId`, `chatRoomId`, `senderId`, `content`, `imageUrl/imageMediaId`, `replyToMessageId/replyToContent/replyToImageUrl/replyToImageMediaId`, `reactions[]`, `sentAt`, `isRead`, `readAt`. Không có receiverId, createdAt riêng, updatedAt, deletedAt hoặc send-status enum. Receiver suy từ hai participant trong room. Timestamp tạo tin là sentAt; backend gán DateTime.UtcNow. Timestamp có offset/Z được tôn trọng; chuỗi ISO thiếu offset được hiểu UTC theo nguồn backend. Không thêm createdAt để phục vụ UI.

Phân trang 50 tin qua before=sentAt, backend lọc nhỏ hơn timestamp rồi trả theo thời gian tăng dần. Realtime qua `services/signalRService.ts`: ReceiveMessage, MessageUpdated, MessagesRead, TypingChanged; join/leave và automatic reconnect. Chưa có presence online. Chat dùng React state, không có Zustand chat hoặc TanStack Query chat. Auth/token vẫn qua service/store hiện có.

Gửi text/ảnh qua REST, SignalR cập nhật cùng ID; map theo messageId chống trùng. Upload ảnh qua expo-image-picker rồi media upload; PrivateMediaImage cấp lại URL riêng tư. Reaction API đã có; xóa/thu hồi và mute chưa có. Report message/user và block qua moderationService; đang render SafetyButton dưới mỗi tin. Quick actions theo participant customer: mua-detail Dịch vụ/Portfolio. Header chưa có search; divider Hôm nay hardcode, avatar/timestamp/heart lặp từng tin.

Sửa: màn chi tiết, thêm component bubble/media/composer và utility grouping/search; chỉnh danh sách chỉ nếu cần timestamp đồng nhất. Không sửa service DTO/endpoints, SignalR transport, auth/store, routes, backend/DB, app config/EAS/native/permissions/package/credentials. Không thêm dependency; dùng RN core, expo-image/clipboard/image-picker có sẵn, ActionSheet/AppModal/ReportSheet chung.

Rủi ro: thứ tự tải initial/realtime, listener sau unmount, reply/reaction/upload hồi quy, prepend làm nhảy vị trí, search chỉ history đã tải, UTC/local gần nửa đêm, bàn phím và safe area Android. Cursor chỉ timestamp có giới hạn backend sẵn có: nếu hơn 50 tin cùng chính xác timestamp thì có thể bỏ sót ở biên trang; không thay contract trong redesign. Các phép kiểm tra tự động không thay thế chạy trên Expo Go/thiết bị thật.
