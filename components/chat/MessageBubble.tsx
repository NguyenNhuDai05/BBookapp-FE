import React, { memo, useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { PrivateMediaImage } from '../PrivateMediaImage';
import { BrandColors, Radius, Typography } from '../../constants/theme';
import type { MessageDto } from '../../services/chatService';
import { type ChatRow, getChatTime, splitChatHighlight } from '../../utils/chatPresentation';

function ChatMedia({ message, width }: { message: MessageDto; width: number }) {
  const [ratio, setRatio] = useState(1);
  const [loading, setLoading] = useState(true);
  const failed = useCallback(() => setLoading(false), []);
  const started = useCallback(() => setLoading(true), []);
  const loaded = useCallback((event: { source: { width: number; height: number } }) => {
    if (event.source.width > 0 && event.source.height > 0) setRatio(event.source.width / event.source.height);
    setLoading(false);
  }, []);
  return <View style={{ width, marginBottom: message.content ? 6 : 0 }}>
    <PrivateMediaImage uri={message.imageUrl} mediaId={message.imageMediaId} onLoadStart={started} onLoad={loaded} onError={failed} contentFit="contain" style={{ width, height: Math.min(360, width / ratio), borderRadius: Radius.base }} />
    {loading && <View pointerEvents="none" style={styles.mediaLoading}><ActivityIndicator color={BrandColors.primaryPink} /></View>}
  </View>;
}

export const MessageBubble = memo(function MessageBubble({ row, name, avatar, maxWidth, searchQuery, selected, onLongPress, onReact }: {
  row: ChatRow; name: string; avatar?: string; maxWidth: number; searchQuery: string; selected: boolean;
  onLongPress: (message: MessageDto) => void; onReact: (message: MessageDto, emoji: string) => void;
}) {
  const { message, own, groupStart, groupEnd } = row;
  const [showTime, setShowTime] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const reactions = (message.reactions || []).filter(reaction => reaction.count > 0);
  return <View>
    {row.dateLabel && <View style={styles.dateDivider}><View style={styles.rule} /><Text style={styles.dateLabel}>{row.dateLabel}</Text><View style={styles.rule} /></View>}
    <View style={[styles.line, own && styles.ownLine, { marginTop: groupStart ? 12 : 3 }]}>
      {!own && <View style={styles.avatarSlot}>{groupEnd && (avatar && !avatarFailed ? <Image source={{ uri: avatar }} contentFit="cover" style={styles.avatar} onError={() => setAvatarFailed(true)} /> : <View style={styles.avatar}><Text style={styles.initial}>{Array.from(name)[0]?.toUpperCase()}</Text></View>)}</View>}
      <View testID={`message-block-${message.messageId}`} style={[styles.block, { maxWidth }, own && styles.ownBlock]}>
        <TouchableOpacity accessibilityLabel={message.content || 'Tin nhắn hình ảnh'} accessibilityHint="Chạm để xem giờ, nhấn giữ để mở tùy chọn" activeOpacity={0.85} onPress={() => setShowTime(value => !value)} onLongPress={() => onLongPress(message)} delayLongPress={350} style={[styles.bubble, own ? styles.outgoing : styles.incoming, !groupStart && (own ? styles.outgoingJoined : styles.incomingJoined), selected && styles.selected]}>
          {message.replyToMessageId && <View style={[styles.reply, own && styles.ownReply]}><Text numberOfLines={2} style={[styles.replyText, own && styles.ownText]}>{message.replyToContent || (message.replyToImageUrl || message.replyToImageMediaId ? '📷 Hình ảnh' : 'Tin nhắn được trả lời')}</Text></View>}
          {(message.imageUrl || message.imageMediaId) && <ChatMedia message={message} width={Math.min(240, maxWidth - 28)} />}
          {!!message.content && <Text style={[styles.text, own && styles.ownText]}>{splitChatHighlight(message.content, searchQuery).map((part, index) => <Text key={index} style={part.match ? styles.highlight : undefined}>{part.text}</Text>)}</Text>}
          {!message.content && !message.imageUrl && !message.imageMediaId && <Text style={[styles.replyText, own && styles.ownText]}>Nội dung không khả dụng</Text>}
        </TouchableOpacity>
        {reactions.length > 0 && <View style={styles.reactions}>{reactions.map(reaction => <TouchableOpacity accessibilityLabel={`${reaction.emoji}: ${reaction.count} cảm xúc`} key={reaction.emoji} onPress={() => onReact(message, reaction.emoji)} style={[styles.reaction, reaction.reactedByMe && styles.activeReaction]}><Text>{reaction.emoji}{reaction.count > 1 ? ` ${reaction.count}` : ''}</Text></TouchableOpacity>)}</View>}
        {showTime && <Text style={styles.metadata}>{getChatTime(message.sentAt)}</Text>}
        {row.showReadReceipt && <Text style={styles.metadata}>{message.isRead ? 'Đã xem' : 'Đã gửi'}</Text>}
      </View>
    </View>
  </View>;
});

const styles = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'flex-end' }, ownLine: { justifyContent: 'flex-end' },
  avatarSlot: { width: 38, marginRight: 5 }, avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: BrandColors.bgPink, alignItems: 'center', justifyContent: 'center' }, initial: { fontFamily: Typography.bold, color: BrandColors.accentRose },
  block: { alignItems: 'flex-start' }, ownBlock: { alignItems: 'flex-end' }, bubble: { borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 10 }, incoming: { backgroundColor: BrandColors.bgCard }, outgoing: { backgroundColor: BrandColors.primaryPink }, incomingJoined: { borderTopLeftRadius: 6 }, outgoingJoined: { borderTopRightRadius: 6 }, selected: { borderWidth: 2, borderColor: BrandColors.accentGold }, text: { fontFamily: Typography.regular, fontSize: 15, lineHeight: 22, color: BrandColors.textDark }, ownText: { color: BrandColors.textWhite }, metadata: { fontFamily: Typography.regular, color: BrandColors.textSecondary, fontSize: 11, marginTop: 4, marginHorizontal: 4 },
  dateDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 }, rule: { flex: 1, height: 1, backgroundColor: BrandColors.borderLight }, dateLabel: { fontFamily: Typography.medium, fontSize: 12, color: BrandColors.textSecondary },
  reply: { borderLeftWidth: 3, borderLeftColor: BrandColors.primaryPink, padding: 7, marginBottom: 7, backgroundColor: BrandColors.bgPink, borderRadius: 6 }, ownReply: { borderLeftColor: BrandColors.textWhite, backgroundColor: 'rgba(255,255,255,0.18)' }, replyText: { fontFamily: Typography.regular, fontSize: 12, color: BrandColors.textBody },
  reactions: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 }, reaction: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full, backgroundColor: BrandColors.bgCard, borderWidth: 1, borderColor: BrandColors.borderLight }, activeReaction: { borderColor: BrandColors.primaryPink }, highlight: { backgroundColor: BrandColors.accentGold, color: BrandColors.textDark }, mediaLoading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
});
