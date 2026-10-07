import { api } from './api';

export interface ChatRoomDto {
    chatRoomId: string;
    customerId: string;
    customerName?: string;
    customerAvatar?: string;
    muaId: string;
    muaName?: string;
    muaAvatar?: string;
    otherUserId?: string;
    otherUserName?: string;
    otherUserAvatar?: string;
    createdAt: string;
    lastMessage?: MessageDto;
    unreadCount: number;
}

export interface MessageDto {
    messageId: string;
    chatRoomId: string;
    senderId: string;
    content?: string;
    imageUrl?: string;
    imageMediaId?: string;
    replyToMessageId?: string;
    replyToContent?: string;
    replyToImageUrl?: string;
    replyToImageMediaId?: string;
    reactions: { emoji: string; count: number; reactedByMe: boolean; userIds?: string[] }[];
    sentAt: string;
    isRead: boolean;
    readAt?: string;
}

export const chatService = {
    getOrCreateRoomForBooking: async (bookingId: string) => {
        const response = await api.post<ChatRoomDto>(`/chat/booking/${bookingId}`);
        return response.data;
    },
    getRooms: async () => {
        const response = await api.get<ChatRoomDto[]>('/chat/rooms');
        return response.data;
    },
    
    getOrCreateRoomWithMua: async (muaId: string) => {
        const response = await api.post<ChatRoomDto>(`/chat/mua/${muaId}`);
        return response.data;
    },

    getMessages: async (roomId: string, before?: string, limit = 50) => {
        const response = await api.get<MessageDto[]>(`/chat/rooms/${roomId}/messages`, { params: { before, limit } });
        return response.data;
    },

    sendMessage: async (roomId: string, content?: string, imageUrl?: string, replyToMessageId?: string) => {
        const response = await api.post<MessageDto>(`/chat/rooms/${roomId}/messages`, { content, imageUrl, replyToMessageId });
        return response.data;
    },

    reactToMessage: async (roomId: string, messageId: string, emoji: string) => {
        const response = await api.post<MessageDto>(`/chat/rooms/${roomId}/messages/${messageId}/reaction`, { emoji });
        return response.data;
    },

    markRead: async (roomId: string) => {
        await api.post(`/chat/rooms/${roomId}/read`);
    },

    uploadImage: async (uri: string, roomId: string) => {
        const form = new FormData();
        form.append('file', { uri, name: `chat-${Date.now()}.jpg`, type: 'image/jpeg' } as any);
        const response = await api.post<{ mediaId: string }>(`/chat/rooms/${roomId}/images`, form);
        return `media:${response.data.mediaId}`;
    }
};
