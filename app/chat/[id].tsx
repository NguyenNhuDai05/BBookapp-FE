import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowDown, ArrowLeft, ArrowUp, CalendarDays, FileText, ImageIcon, MoreVertical, X } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { BrandColors, Radius, Typography } from '../../constants/theme';
import { AppAlert } from '../../components/ui/dialogStore';
import { AppModal } from '../../components/ui/AppModal';
import { ReportSheet } from '../../components/moderation/ReportSheet';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageComposer } from '../../components/chat/MessageComposer';
import { ConversationMenu, MessageActionMenu } from '../../components/chat/ChatActionMenus';
import { getApiError } from '../../services/api';
import { authService } from '../../services/authService';
import { chatService, type ChatRoomDto, type MessageDto } from '../../services/chatService';
import { moderationService, type ReportTarget } from '../../services/moderationService';
import { signalRService } from '../../services/signalRService';
import { getChatPeer } from '../../utils/chatPeer';
import { buildChatRows, findChatMatches, mergeChatMessages, normalizeChatReactions, parseChatDate, type ChatRow } from '../../utils/chatPresentation';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter(); const focused = useIsFocused(); const cache = useQueryClient();
  const { width } = useWindowDimensions();
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState('');
  const [retryLoad, setRetryLoad] = useState(0);
  const [busy, setBusy] = useState(false); const sendLock = useRef(false);
  const [sendError, setSendError] = useState('');
  const [retryImage, setRetryImage] = useState<{ uri: string; uploaded?: string; content?: string; replyId?: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<ChatRoomDto | null>(null);
  const [replyTo, setReplyTo] = useState<MessageDto | null>(null);
  const [hasMore, setHasMore] = useState(true); const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState(false); const olderLock = useRef(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); const [actionMessage, setActionMessage] = useState<MessageDto | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [confirmBlock, setConfirmBlock] = useState(false); const [blocking, setBlocking] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false); const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(''); const [matchIndex, setMatchIndex] = useState(0);
  const [now, setNow] = useState(() => new Date()); const [newMessages, setNewMessages] = useState(false);
  const list = useRef<FlatList<ChatRow>>(null); const userRef = useRef<string | null>(null);
  const mounted = useRef(true); const roomRef = useRef(id);
  const atBottom = useRef(true); const active = useRef(focused);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIndexRef = useRef(0);
  const bottom = useCallback((animated = true) => { list.current?.scrollToOffset({ offset: 0, animated }); atBottom.current = true; setNewMessages(false); }, []);
  const readRoom = useCallback(() => { if (id && active.current && AppState.currentState === 'active') void chatService.markRead(id).catch(() => {}); }, [id]);
  const merge = useCallback((incoming: MessageDto[]) => setMessages(previous => mergeChatMessages(previous, incoming.map(message => normalizeChatReactions(message, userRef.current)))), []);
  useLayoutEffect(() => { roomRef.current = id; active.current = focused; }, [id, focused]);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; if (searchScrollTimer.current) clearTimeout(searchScrollTimer.current); }; }, []);
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(query.trim()); setMatchIndex(0); }, 250);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(timer); }, []);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    const load = async () => {
      await Promise.resolve();
      if (!alive) return;
      setLoading(true); setLoadError(''); setMessages([]); setRoomInfo(null); setHasMore(true); setCurrentUserId(null); userRef.current = null;
      setReplyTo(null); setSendError(''); setRetryImage(null); setInputText(''); setOtherTyping(false);
      try {
        const [user, rooms, history] = await Promise.all([authService.getMe(), chatService.getRooms(), chatService.getMessages(id)]);
        if (!alive) return;
        userRef.current = user.id; setCurrentUserId(user.id); setUserRole(user.role);
        setRoomInfo(rooms.find(room => room.chatRoomId.toLowerCase() === id.toLowerCase()) || null);
        setMessages(previous => mergeChatMessages(history, previous).map(message => normalizeChatReactions(message, user.id))); setHasMore(history.length === 50);
        readRoom();
      } catch (error) { if (alive) setLoadError(getApiError(error).message); }
      finally { if (alive) setLoading(false); }
    };
    const offMessage = signalRService.onMessageReceived((message: MessageDto) => {
      if (!alive || message.chatRoomId.toLowerCase() !== id.toLowerCase()) return;
      merge([message]); readRoom();
      if (atBottom.current) requestAnimationFrame(() => { if (alive) bottom(); }); else setNewMessages(true);
    });
    const offUpdate = signalRService.onMessageUpdated((message: MessageDto) => { if (alive && message.chatRoomId.toLowerCase() === id.toLowerCase()) merge([message]); });
    const offRead = signalRService.onMessagesRead((event: { roomId: string; readerId: string; readAt: string }) => {
      if (alive && event.roomId.toLowerCase() === id.toLowerCase()) setMessages(previous => previous.map(message => message.senderId.toLowerCase() !== event.readerId.toLowerCase() ? { ...message, isRead: true, readAt: event.readAt } : message));
    });
    const offTyping = signalRService.onTypingChanged((event: { roomId: string; userId: string; isTyping: boolean }) => { if (alive && event.roomId.toLowerCase() === id.toLowerCase() && event.userId.toLowerCase() !== userRef.current?.toLowerCase()) setOtherTyping(Boolean(event.isTyping)); });
    void load(); void signalRService.joinRoom(id).catch(() => {});
    return () => {
      alive = false; if (typingTimer.current) clearTimeout(typingTimer.current);
      offMessage(); offUpdate(); offRead(); offTyping();
      void signalRService.setTyping(id, false).catch(() => {}); void signalRService.leaveRoom(id).catch(() => {});
    };
  }, [id, retryLoad, merge, readRoom, bottom]);

  useEffect(() => {
    if (!focused || loading || loadError || !id) return;
    let alive = true; let refreshing = false;
    const refresh = async () => {
      if (refreshing || AppState.currentState !== 'active') return;
      refreshing = true;
      try { const latest = await chatService.getMessages(id); if (alive) { merge(latest); readRoom(); } } catch { /* Keep loaded history on transient connection failures. */ }
      finally { refreshing = false; }
    };
    readRoom(); const timer = setInterval(() => { void refresh(); }, 20_000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { alive = false; clearInterval(timer); listener.remove(); };
  }, [focused, id, loading, loadError, merge, readRoom]);

  const peer = roomInfo ? getChatPeer(roomInfo, currentUserId) : null;
  const isCustomer = !!roomInfo && roomInfo.customerId.toLowerCase() === currentUserId?.toLowerCase();
  const otherName = peer?.name || 'Cuộc trò chuyện';
  const rows = useMemo(() => buildChatRows(messages, currentUserId, now), [messages, currentUserId, now]);
  const matches = useMemo(() => findChatMatches(messages, debouncedQuery), [messages, debouncedQuery]);
  const selectedMatch = matches.length ? matches[Math.min(matchIndex, matches.length - 1)] : undefined;
  useEffect(() => {
    if (!searchOpen || !selectedMatch) return;
    const index = rows.findIndex(row => row.message.messageId === selectedMatch);
    if (index >= 0) { searchIndexRef.current = index; list.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 }); }
  }, [searchOpen, selectedMatch, rows]);

  const loadOlder = useCallback(async () => {
    if (!id || olderLock.current || !hasMore || !messages[0] || loading || loadError) return;
    olderLock.current = true; setLoadingOlder(true); setOlderError(false);
    const roomId = id;
    try {
      const older = await chatService.getMessages(id, messages[0].sentAt);
      if (mounted.current && roomRef.current === roomId) { merge(older); setHasMore(older.length === 50); }
    } catch { if (mounted.current && roomRef.current === roomId) setOlderError(true); }
    finally { olderLock.current = false; if (mounted.current) setLoadingOlder(false); }
  }, [hasMore, id, messages, loading, loadError, merge]);

  const reconcile = async (content?: string, imageUrl?: string, replyId?: string, startedAt = Date.now()) => {
    try {
      const latest = await chatService.getMessages(id, undefined, 20);
      const recovered = latest.find(message => message.senderId.toLowerCase() === userRef.current?.toLowerCase()
        && (message.content?.trim() || '') === (content?.trim() || '') && (message.replyToMessageId || '') === (replyId || '')
        && (!imageUrl || message.imageUrl === imageUrl || (imageUrl.startsWith('media:') && message.imageMediaId === imageUrl.slice(6)))
        && (parseChatDate(message.sentAt)?.getTime() ?? 0) >= startedAt - 5000);
      if (recovered && mounted.current && roomRef.current === id) merge([recovered]); return !!recovered;
    } catch { return false; }
  };
  const sendText = async () => {
    const content = inputText.trim(); if (!content || sendLock.current || !id || loading || loadError || retryImage) return;
    sendLock.current = true; setBusy(true); setSendError(''); const startedAt = Date.now(); const roomId = id;
    try {
      const sent = await chatService.sendMessage(id, content, undefined, replyTo?.messageId);
      if (mounted.current && roomRef.current === roomId) { merge([sent]); setInputText(''); setReplyTo(null); bottom(); }
    } catch (error) {
      const recovered = await reconcile(content, undefined, replyTo?.messageId, startedAt);
      if (mounted.current && roomRef.current === roomId) { if (recovered) { setInputText(''); setReplyTo(null); bottom(); } else setSendError(getApiError(error).message); }
    } finally { sendLock.current = false; if (mounted.current) setBusy(false); }
  };
  const sendImage = async (attachment: NonNullable<typeof retryImage>) => {
    if (sendLock.current || !id) return;
    sendLock.current = true; setBusy(true); setSendError(''); const roomId = id; const startedAt = Date.now();
    let uploaded = attachment.uploaded;
    try {
      uploaded = uploaded || await chatService.uploadImage(attachment.uri, id);
      const sent = await chatService.sendMessage(id, attachment.content, uploaded, attachment.replyId);
      if (mounted.current && roomRef.current === roomId) { merge([sent]); setInputText(''); setReplyTo(null); setRetryImage(null); bottom(); }
    } catch (error) {
      const recovered = uploaded ? await reconcile(attachment.content, uploaded, attachment.replyId, startedAt) : false;
      if (mounted.current && roomRef.current === roomId) { if (recovered) { setInputText(''); setReplyTo(null); setRetryImage(null); bottom(); } else { setRetryImage({ ...attachment, uploaded }); setSendError(getApiError(error).message); } }
    } finally { sendLock.current = false; if (mounted.current) setBusy(false); }
  };
  const pickImage = async () => {
    if (sendLock.current || loading || loadError) return;
    const roomId = id;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.82 });
      if (!result.canceled && result.assets[0] && mounted.current && roomRef.current === roomId) await sendImage({ uri: result.assets[0].uri, content: inputText.trim() || undefined, replyId: replyTo?.messageId });
    } catch (error) { AppAlert.alert('Không thể chọn ảnh', getApiError(error).message); }
  };
  const react = useCallback(async (message: MessageDto, emoji: string) => {
    try { const updated = await chatService.reactToMessage(id, message.messageId, emoji); if (mounted.current && roomRef.current === id) merge([updated]); }
    catch (error) { AppAlert.alert('Không thể thả cảm xúc', getApiError(error).message); }
  }, [id, merge]);
  const openMua = (tab?: string) => { if (roomInfo?.muaId) router.push({ pathname: '/mua-detail', params: { id: roomInfo.muaId, ...(tab ? { tab } : {}) } }); };
  const goBack = () => { if (router.canGoBack()) router.back(); else router.replace(userRole === 'MUA' ? '/(mua)/chat' : '/(tabs)/chat'); };
  const block = async () => {
    if (!peer?.id || blocking) return; setBlocking(true);
    try { await moderationService.block(peer.id); setConfirmBlock(false); await cache.invalidateQueries(); goBack(); }
    catch (error) { AppAlert.alert('Không thể chặn', getApiError(error).message); }
    finally { if (mounted.current) setBlocking(false); }
  };
  const changeText = (value: string) => {
    setInputText(value); setSendError(''); void signalRService.setTyping(id, !!value.trim()).catch(() => {});
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { void signalRService.setTyping(id, false).catch(() => {}); }, 1200);
  };
  const bubbleWidth = (Math.min(width, 760) - 24) * 0.76;
  const renderMessage = useCallback(({ item }: { item: ChatRow }) => <MessageBubble row={item} name={otherName} avatar={peer?.avatar} maxWidth={bubbleWidth} searchQuery={searchOpen ? debouncedQuery : ''} selected={item.message.messageId === selectedMatch && searchOpen} onLongPress={setActionMessage} onReact={react} />, [otherName, peer?.avatar, bubbleWidth, searchOpen, debouncedQuery, selectedMatch, react]);

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.page}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityLabel={searchOpen ? 'Đóng tìm kiếm' : 'Quay lại'} style={styles.icon} onPress={() => { if (searchOpen) { setSearchOpen(false); setQuery(''); } else goBack(); }}><ArrowLeft size={24} color={BrandColors.textDark} /></TouchableOpacity>
          {searchOpen ? <><TextInput autoFocus accessibilityLabel="Tìm trong cuộc trò chuyện" value={query} onChangeText={setQuery} placeholder="Tìm tin nhắn..." style={styles.searchInput} /><TouchableOpacity style={styles.icon} accessibilityLabel="Xóa tìm kiếm" onPress={() => setQuery('')}><X size={20} color={BrandColors.textSecondary} /></TouchableOpacity></> : <>
            <View style={styles.headerAvatar}>{peer?.avatar ? <Image source={{ uri: peer.avatar }} style={styles.avatarImage} contentFit="cover" /> : <Text style={styles.avatarLetter}>{Array.from(otherName)[0]?.toUpperCase()}</Text>}</View>
            <View style={styles.headerCopy}><Text numberOfLines={1} style={styles.name}>{otherName}</Text><Text style={styles.subtitle}>{otherTyping ? 'Đang nhập…' : 'Tin nhắn riêng'}</Text></View>
            <TouchableOpacity style={styles.icon} accessibilityLabel="Tùy chọn cuộc trò chuyện" disabled={!roomInfo || loading} onPress={() => setMenuOpen(true)}><MoreVertical size={23} color={BrandColors.textDark} /></TouchableOpacity>
          </>}
        </View>
        {searchOpen && <View style={styles.searchInfo}><View style={styles.flex}><Text style={styles.subtitle}>{debouncedQuery ? matches.length ? `${Math.min(matchIndex + 1, matches.length)}/${matches.length}` : 'Không có kết quả' : 'Nhập từ khóa để tìm'}</Text><Text style={styles.searchLimit}>Chỉ tìm trong tin nhắn đã tải{hasMore ? ' · Tải thêm lịch sử để tìm tiếp' : ''}</Text></View><TouchableOpacity style={styles.icon} accessibilityLabel="Kết quả trước" disabled={!matches.length} onPress={() => setMatchIndex(value => (value - 1 + matches.length) % matches.length)}><ArrowUp size={20} color={BrandColors.textSecondary} /></TouchableOpacity><TouchableOpacity style={styles.icon} accessibilityLabel="Kết quả tiếp" disabled={!matches.length} onPress={() => setMatchIndex(value => (value + 1) % matches.length)}><ArrowDown size={20} color={BrandColors.textSecondary} /></TouchableOpacity></View>}
        <View style={styles.flex}>
          {loading ? <View style={styles.state}><ActivityIndicator color={BrandColors.primaryPink} /><Text style={styles.subtitle}>Đang tải cuộc trò chuyện…</Text></View> : loadError ? <View style={styles.state}><Text style={styles.stateTitle}>Không thể tải cuộc trò chuyện</Text><Text style={styles.stateText}>{loadError}</Text><TouchableOpacity style={styles.retry} onPress={() => setRetryLoad(value => value + 1)}><Text style={styles.retryText}>Thử lại</Text></TouchableOpacity></View> : <FlatList testID="chat-message-list" ref={list} inverted data={rows} renderItem={renderMessage} keyExtractor={item => item.message.messageId} style={styles.flex} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" maintainVisibleContentPosition={{ minIndexForVisible: 0 }} initialNumToRender={20} maxToRenderPerBatch={12} windowSize={9} onScroll={({ nativeEvent }) => { atBottom.current = nativeEvent.contentOffset.y < 80; if (atBottom.current) setNewMessages(false); }} scrollEventThrottle={100} onEndReached={() => { if (!olderError) void loadOlder(); }} onEndReachedThreshold={0.15} onScrollToIndexFailed={info => {
            list.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
            if (searchScrollTimer.current) clearTimeout(searchScrollTimer.current);
            searchScrollTimer.current = setTimeout(() => { if (mounted.current) list.current?.scrollToIndex({ index: searchIndexRef.current, animated: true, viewPosition: 0.5 }); }, 150);
          }} ListFooterComponent={loadingOlder ? <ActivityIndicator style={styles.history} color={BrandColors.primaryPink} /> : hasMore && rows.length > 0 ? <TouchableOpacity style={styles.history} onPress={() => { void loadOlder(); }}><Text style={styles.subtitle}>{olderError ? 'Tải lịch sử thất bại · Thử lại' : 'Tải tin nhắn trước'}</Text></TouchableOpacity> : null} ListEmptyComponent={<View style={styles.state}><Text style={styles.stateTitle}>Hãy bắt đầu trò chuyện</Text><Text style={styles.stateText}>Gửi lời chào hoặc câu hỏi để bắt đầu tư vấn.</Text></View>} />}
          {newMessages && <TouchableOpacity style={styles.newMessage} onPress={() => bottom()}><Text style={styles.retryText}>Tin nhắn mới ↓</Text></TouchableOpacity>}
        </View>
        {isCustomer && <View style={styles.quickBar}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}><TouchableOpacity style={styles.quickAction} onPress={() => openMua('Dịch vụ')}><CalendarDays size={16} color={BrandColors.accentRose} /><Text style={styles.quickText}>Đặt lịch</Text></TouchableOpacity><TouchableOpacity style={styles.quickAction} onPress={() => openMua('Dịch vụ')}><FileText size={16} color={BrandColors.accentRose} /><Text style={styles.quickText}>Dịch vụ</Text></TouchableOpacity><TouchableOpacity style={styles.quickAction} onPress={() => openMua('Portfolio')}><ImageIcon size={16} color={BrandColors.accentRose} /><Text style={styles.quickText}>Portfolio</Text></TouchableOpacity></ScrollView></View>}
        {!!sendError && <View style={styles.errorBar}><Text style={[styles.subtitle, styles.flex]}>{sendError}</Text><TouchableOpacity disabled={busy} style={styles.retrySmall} onPress={() => { if (retryImage) void sendImage(retryImage); else void sendText(); }}><Text style={styles.quickText}>Thử lại</Text></TouchableOpacity>{retryImage && <TouchableOpacity accessibilityLabel="Bỏ ảnh gửi lỗi" style={styles.icon} onPress={() => { setRetryImage(null); setSendError(''); }}><X size={18} color={BrandColors.textSecondary} /></TouchableOpacity>}</View>}
        <MessageComposer text={inputText} onChange={changeText} onSend={() => { void sendText(); }} onImage={() => { void pickImage(); }} busy={busy} reply={replyTo} onCancelReply={() => setReplyTo(null)} disabled={loading || !!loadError || !!retryImage} />
      </View>
    </KeyboardAvoidingView>
    <ConversationMenu visible={menuOpen} canViewProfile={isCustomer} onClose={() => setMenuOpen(false)} onProfile={() => openMua()} onSearch={() => setSearchOpen(true)} onReport={() => { if (peer?.id) setReportTarget({ type: 'User', id: peer.id }); }} onBlock={() => setConfirmBlock(true)} />
    <MessageActionMenu message={actionMessage} own={actionMessage?.senderId.toLowerCase() === currentUserId?.toLowerCase()} onClose={() => setActionMessage(null)} onReply={setReplyTo} onReport={messageId => setReportTarget({ type: 'Message', id: messageId })} onReact={(message, emoji) => { void react(message, emoji); }} />
    <ReportSheet target={reportTarget} onClose={() => setReportTarget(null)} />
    <AppModal visible={confirmBlock} variant="destructive" title={`Chặn ${otherName}?`} description="Ngừng tương tác mới với người dùng này. Booking và nghĩa vụ thanh toán vẫn giữ nguyên." loading={blocking} onClose={() => { if (!blocking) setConfirmBlock(false); }} primaryAction={{ label: blocking ? 'Đang chặn…' : 'Chặn', onPress: block }} secondaryAction={{ label: 'Hủy', onPress: () => setConfirmBlock(false) }} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.bgPrimary }, flex: { flex: 1 }, page: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' }, header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, backgroundColor: BrandColors.bgCard, borderBottomWidth: 1, borderBottomColor: BrandColors.borderLight }, icon: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }, headerAvatar: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', backgroundColor: BrandColors.bgPink, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 }, avatarImage: { width: 42, height: 42 }, avatarLetter: { fontFamily: Typography.bold, color: BrandColors.accentRose }, headerCopy: { flex: 1, minWidth: 0 }, name: { fontFamily: Typography.bold, fontSize: 16, color: BrandColors.textDark }, subtitle: { fontFamily: Typography.regular, fontSize: 12, color: BrandColors.textSecondary, marginTop: 2 }, searchInput: { flex: 1, minWidth: 0, fontFamily: Typography.regular, fontSize: 16, color: BrandColors.textDark, paddingVertical: 10 }, searchInfo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, backgroundColor: BrandColors.bgCard }, searchLimit: { fontFamily: Typography.regular, fontSize: 10, color: BrandColors.textSecondary }, messages: { paddingHorizontal: 12, paddingVertical: 12, flexGrow: 1 }, state: { flex: 1, minHeight: 180, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 }, stateTitle: { fontFamily: Typography.bold, fontSize: 18, color: BrandColors.textDark, textAlign: 'center' }, stateText: { fontFamily: Typography.regular, fontSize: 14, color: BrandColors.textSecondary, textAlign: 'center' }, retry: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: BrandColors.primaryPink, borderRadius: Radius.full }, retryText: { color: BrandColors.textWhite, fontFamily: Typography.bold }, history: { paddingVertical: 14, alignItems: 'center' }, quickBar: { backgroundColor: BrandColors.bgCard, borderTopWidth: 1, borderTopColor: BrandColors.borderLight, maxHeight: 48 }, quickActions: { paddingHorizontal: 12, paddingVertical: 6, gap: 8 }, quickAction: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 34, backgroundColor: BrandColors.bgPink, borderRadius: Radius.full }, quickText: { fontFamily: Typography.semiBold, fontSize: 12, color: BrandColors.accentRose }, errorBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: BrandColors.statusCancelledBg }, retrySmall: { padding: 10 }, newMessage: { position: 'absolute', bottom: 12, alignSelf: 'center', backgroundColor: BrandColors.primaryPink, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8 },
});
