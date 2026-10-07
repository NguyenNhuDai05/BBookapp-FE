import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { AppBottomSheet } from '../ui/AppBottomSheet';
import { ActionSheet } from '../ui/ActionSheet';
import { BrandColors, Typography } from '../../constants/theme';
import type { MessageDto } from '../../services/chatService';
import { AppAlert } from '../ui/dialogStore';

export function MessageActionMenu({ message, own, onClose, onReply, onReport, onReact }: {
  message: MessageDto | null; own: boolean; onClose: () => void; onReply: (message: MessageDto) => void;
  onReport: (id: string) => void; onReact: (message: MessageDto, emoji: string) => void;
}) {
  return <AppBottomSheet visible={!!message} title="Tùy chọn tin nhắn" onClose={onClose}>
    <View style={styles.reactions}>{['❤️', '👍', '😂', '😍', '😢', '👏'].map(emoji => <TouchableOpacity key={emoji} accessibilityLabel={`Thả cảm xúc ${emoji}`} style={styles.emoji} onPress={() => { if (message) onReact(message, emoji); onClose(); }}><Text style={{ fontSize: 26 }}>{emoji}</Text></TouchableOpacity>)}</View>
    <TouchableOpacity style={styles.action} accessibilityRole="button" onPress={() => { if (message) onReply(message); onClose(); }}><Text style={styles.text}>Trả lời</Text></TouchableOpacity>
    {!!message?.content && <TouchableOpacity style={styles.action} accessibilityRole="button" onPress={() => { if (message.content) void Clipboard.setStringAsync(message.content).then(() => { onClose(); }).catch(() => AppAlert.alert('Không thể sao chép', 'Vui lòng thử lại.')); }}><Text style={styles.text}>Sao chép</Text></TouchableOpacity>}
    {!own && <TouchableOpacity style={styles.action} accessibilityRole="button" onPress={() => { if (message) onReport(message.messageId); onClose(); }}><Text style={styles.text}>Báo cáo tin nhắn</Text></TouchableOpacity>}
  </AppBottomSheet>;
}
export function ConversationMenu({ visible, canViewProfile, onClose, onProfile, onSearch, onReport, onBlock }: {
  visible: boolean; canViewProfile: boolean; onClose: () => void; onProfile: () => void; onSearch: () => void; onReport: () => void; onBlock: () => void;
}) {
  const action = (callback: () => void) => () => { onClose(); callback(); };
  return <ActionSheet visible={visible} title="Cuộc trò chuyện" onClose={onClose} actions={[
    ...(canViewProfile ? [{ id: 'profile', label: 'Xem hồ sơ', onPress: action(onProfile) }] : []),
    { id: 'search', label: 'Tìm trong cuộc trò chuyện', onPress: action(onSearch) },
    { id: 'report', label: 'Báo cáo người dùng', onPress: action(onReport) },
    { id: 'block', label: 'Chặn người dùng', destructive: true, onPress: action(onBlock) },
  ]} />;
}
const styles = StyleSheet.create({ reactions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }, emoji: { minWidth: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, action: { paddingVertical: 16, borderTopWidth: 1, borderTopColor: BrandColors.borderLight }, text: { fontFamily: Typography.semiBold, color: BrandColors.textDark, fontSize: 15 } });
