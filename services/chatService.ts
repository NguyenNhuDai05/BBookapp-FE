import { api } from './api';

export interface ChatRoomDto {
    chatRoomId: string;
    customerId: string;
    customerName?: string;
    customerAvatar?: string;
    muaId: string;
    muaName?: string;
    muaAvatar?: string;
    createdAt: string;
    lastMessage?: MessageDto;
}

export interface MessageDto {
    messageId: string;
    chatRoomId: string;
    senderId: string;
    content?: string;
    imageUrl?: string;
    replyToMessageId?: string;
    replyToContent?: string;
    replyToImageUrl?: string;
    reactions: { emoji: string; count: number; reactedByMe: boolean }[];
    sentAt: string;
    isRead: boolean;
}

export const chatService = {
    getRooms: async () => {
        const response = await api.get<ChatRoomDto[]>('/chat/rooms');
        return response.data;
    },
    
    getOrCreateRoomWithMua: async (muaId: string) => {
        const response = await api.post<ChatRoomDto>(`/chat/mua/${muaId}`);
        return response.data;
    },

    getMessages: async (roomId: string) => {
        const response = await api.get<MessageDto[]>(`/chat/rooms/${roomId}/messages`);
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

    uploadImage: async (uri: string) => {
        const form = new FormData();
        form.append('file', { uri, name: `chat-${Date.now()}.jpg`, type: 'image/jpeg' } as any);
        const response = await api.post<{ url: string }>('/Upload/image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        return response.data.url;
    },
    
    joinRoomGroup: async (roomId: string, connectionId: string) => {
        await api.post(`/chat/rooms/${roomId}/join?connectionId=${connectionId}`);
    },

    leaveRoomGroup: async (roomId: string, connectionId: string) => {
        await api.post(`/chat/rooms/${roomId}/leave?connectionId=${connectionId}`);
    }
};
