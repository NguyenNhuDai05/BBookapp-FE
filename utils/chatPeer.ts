import type { ChatRoomDto } from '../services/chatService';
/** Choose the other participant by identity, including MUA accounts booking another MUA. */
export function getChatPeer(room: ChatRoomDto, currentUserId?: string | null) {
  const userId = currentUserId?.toLowerCase();
  const isCustomer = !!userId && room.customerId.toLowerCase() === userId;
  const isMua = !!userId && room.muaId.toLowerCase() === userId;
  const name = room.otherUserName?.trim() || (isCustomer ? room.muaName : isMua ? room.customerName : undefined)?.trim();
  return {
    id: room.otherUserId || (isCustomer ? room.muaId : isMua ? room.customerId : undefined),
    name: name || 'Người dùng B-Book',
    avatar: room.otherUserAvatar?.trim() || (isCustomer ? room.muaAvatar : isMua ? room.customerAvatar : undefined)?.trim(),
  };
}
