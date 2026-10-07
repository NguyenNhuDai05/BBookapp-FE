import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ImageIcon, Send, Smile, X } from 'lucide-react-native';
import { BrandColors, Radius, Typography } from '../../constants/theme';
import type { MessageDto } from '../../services/chatService';

export function MessageComposer({ text, onChange, onSend, onImage, busy, reply, onCancelReply, disabled }: {
  text: string; onChange: (value: string) => void; onSend: () => void; onImage: () => void;
  busy: boolean; reply: MessageDto | null; onCancelReply: () => void; disabled: boolean;
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  return <View style={styles.root}>
    {reply && <View style={styles.reply}><View style={{ flex: 1 }}><Text style={styles.replyTitle}>Đang trả lời</Text><Text style={styles.replyText} numberOfLines={1}>{reply.content || '📷 Hình ảnh'}</Text></View><TouchableOpacity accessibilityLabel="Hủy trả lời" style={styles.icon} onPress={onCancelReply}><X size={20} color={BrandColors.textSecondary} /></TouchableOpacity></View>}
    {emojiOpen && <View style={styles.emojiRow}>{['😀', '😂', '😍', '❤️', '👏', '👍'].map(emoji => <TouchableOpacity key={emoji} disabled={disabled || busy} accessibilityLabel={`Thêm ${emoji}`} onPress={() => onChange(text + emoji)} style={styles.icon}><Text style={{ fontSize: 24 }}>{emoji}</Text></TouchableOpacity>)}</View>}
    <View style={styles.composer}>
      <TouchableOpacity accessibilityLabel="Chọn ảnh" disabled={disabled || busy} style={styles.icon} onPress={onImage}><ImageIcon size={23} color={BrandColors.primaryPink} /></TouchableOpacity>
      <View style={styles.inputWrap}><TextInput accessibilityLabel="Nhập tin nhắn" placeholder="Nhập tin nhắn..." placeholderTextColor={BrandColors.textMuted} style={styles.input} value={text} onChangeText={onChange} editable={!disabled && !busy} multiline maxLength={2000} submitBehavior="submit" onSubmitEditing={onSend} />
        <TouchableOpacity accessibilityLabel="Biểu tượng cảm xúc" style={styles.icon} disabled={disabled || busy} onPress={() => setEmojiOpen(value => !value)}><Smile size={21} color={BrandColors.textSecondary} /></TouchableOpacity>
      </View>
      <TouchableOpacity accessibilityLabel="Gửi tin nhắn" accessibilityState={{ disabled: disabled || busy || !text.trim(), busy }} disabled={disabled || busy || !text.trim()} onPress={onSend} style={[styles.send, (disabled || !text.trim()) && styles.inactive]}>{busy ? <ActivityIndicator color={BrandColors.textWhite} /> : <Send size={21} color={BrandColors.textWhite} />}</TouchableOpacity>
    </View>
    {busy && <Text accessibilityLiveRegion="polite" style={styles.status}>Đang gửi…</Text>}
  </View>;
}
const styles = StyleSheet.create({ root: { backgroundColor: BrandColors.bgCard, borderTopWidth: 1, borderTopColor: BrandColors.borderLight }, composer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, paddingVertical: 8, gap: 4 }, icon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }, inputWrap: { flex: 1, minWidth: 0, borderRadius: Radius.xl, backgroundColor: BrandColors.bgPrimary, flexDirection: 'row', alignItems: 'flex-end' }, input: { flex: 1, minWidth: 0, minHeight: 42, maxHeight: 112, paddingLeft: 12, paddingVertical: 10, fontFamily: Typography.regular, fontSize: 15, color: BrandColors.textDark, textAlignVertical: 'top' }, send: { width: 40, height: 40, borderRadius: 20, backgroundColor: BrandColors.primaryPink, alignItems: 'center', justifyContent: 'center' }, inactive: { backgroundColor: BrandColors.borderPink }, reply: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingVertical: 5 }, replyTitle: { fontFamily: Typography.bold, fontSize: 12, color: BrandColors.accentRose }, replyText: { fontFamily: Typography.regular, fontSize: 12, color: BrandColors.textBody }, emojiRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 4 }, status: { fontFamily: Typography.regular, fontSize: 11, color: BrandColors.textSecondary, textAlign: 'right', paddingRight: 14, paddingBottom: 4 } });
