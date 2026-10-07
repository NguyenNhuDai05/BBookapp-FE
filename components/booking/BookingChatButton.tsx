import React, { useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { chatService } from '../../services/chatService';
import { getApiError } from '../../services/api';
import { AppAlert } from '../ui/dialogStore';
import { BrandColors } from '../../constants/theme';

export function BookingChatButton({ bookingId, muaId, viewAs }: { bookingId: string; muaId: string; viewAs: 'customer' | 'mua' }) {
  const [busy, setBusy] = useState(false);
  const opening = useRef(false);
  const open = async () => {
    if (opening.current) return;
    opening.current = true;
    setBusy(true);
    try {
      const room = viewAs === 'customer'
        ? await chatService.getOrCreateRoomWithMua(muaId)
        : await chatService.getOrCreateRoomForBooking(bookingId);
      router.push(`/chat/${room.chatRoomId}`);
    } catch (error) {
      AppAlert.alert('Không thể mở trò chuyện', getApiError(error).message);
    } finally {
      opening.current = false;
      setBusy(false);
    }
  };
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel="Nhắn tin về booking" disabled={busy} onPress={open} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 12, backgroundColor: BrandColors.bgPrimary }}>
    {busy ? <ActivityIndicator color={BrandColors.accentRose} /> : <MessageCircle size={18} color={BrandColors.accentRose} />}
    <Text style={{ color: BrandColors.accentRose }}>Nhắn tin</Text>
  </TouchableOpacity>;
}
