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
    content: string;
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

    sendMessage: async (roomId: string, content: string) => {
        const response = await api.post<MessageDto>(`/chat/rooms/${roomId}/messages`, { content });
        return response.data;
    },
    
    joinRoomGroup: async (roomId: string, connectionId: string) => {
        await api.post(`/chat/rooms/${roomId}/join?connectionId=${connectionId}`);
    },

    leaveRoomGroup: async (roomId: string, connectionId: string) => {
        await api.post(`/chat/rooms/${roomId}/leave?connectionId=${connectionId}`);
    }
};
