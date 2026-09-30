import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CalendarDays, CheckCheck, FileText, ImageIcon, MoreVertical, Plus, Send, Smile, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { AppAlert as appDialog } from '../../components/ui/dialogStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Radius, Shadows, Typography } from '../../constants/theme';
import { getApiError } from '../../services/api';
import { authService } from '../../services/authService';
import { ChatRoomDto, chatService, MessageDto } from '../../services/chatService';
import { getChatPeer } from '../../utils/chatPeer';
import { signalRService } from '../../services/signalRService';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 760);
  const bubbleMaxWidth = Math.max(220, contentWidth * 0.76);
  const imageSize = Math.min(250, contentWidth * 0.58);

  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<ChatRoomDto | null>(null);
  const [replyTo, setReplyTo] = useState<MessageDto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const flatListRef = useRef<FlatList<MessageDto>>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizeMessage = useCallback((message: MessageDto): MessageDto => ({
    ...message,
    reactions: (message.reactions || []).map(reaction => ({
      ...reaction,
      reactedByMe: Boolean(currentUserIdRef.current && reaction.userIds?.some(userId => userId.toLowerCase() === currentUserIdRef.current!.toLowerCase())),
    })),
  }), []);

  const mergeMessages = useCallback((previous: MessageDto[], incoming: MessageDto[]) => {
    const map = new Map(previous.map(message => [message.messageId, message]));
    incoming.forEach(message => map.set(message.messageId, normalizeMessage(message)));
    return [...map.values()].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  }, [normalizeMessage]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [user, rooms, history] = await Promise.all([authService.getMe(), chatService.getRooms(), chatService.getMessages(id)]);
        setCurrentUserId(user.id); currentUserIdRef.current = user.id; setUserRole(user.role);
        setRoomInfo(rooms.find(room => room.chatRoomId.toLowerCase() === id.toLowerCase()) || null);
        setMessages(history); setHasMore(history.length === 50);
        await chatService.markRead(id);
        requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: false }));
      } catch (error) { appDialog.alert('Không thể mở cuộc trò chuyện', getApiError(error).message); }
      finally { setLoading(false); }
    };
    const offMessage = signalRService.onMessageReceived((message: MessageDto) => {
      if (message.chatRoomId.toLowerCase() !== id.toLowerCase()) return;
      setMessages(previous => mergeMessages(previous, [message]));
      if (message.senderId.toLowerCase() !== currentUserIdRef.current?.toLowerCase()) void chatService.markRead(id);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    });
    const offUpdate = signalRService.onMessageUpdated((message: MessageDto) => {
      if (message.chatRoomId.toLowerCase() === id.toLowerCase()) setMessages(previous => mergeMessages(previous, [message]));
    });
    const offRead = signalRService.onMessagesRead((event: { roomId: string; readerId: string; readAt: string }) => {
      if (event.roomId.toLowerCase() !== id.toLowerCase()) return;
      setMessages(previous => previous.map(message => message.senderId.toLowerCase() !== event.readerId.toLowerCase() ? { ...message, isRead: true, readAt: event.readAt } : message));
    });
    const offTyping = signalRService.onTypingChanged((event: { roomId: string; userId: string; isTyping: boolean }) => {
      if (event.roomId.toLowerCase() === id.toLowerCase() && event.userId.toLowerCase() !== currentUserIdRef.current?.toLowerCase()) setOtherTyping(Boolean(event.isTyping));
    });
    void load();
    void signalRService.joinRoom(id).catch(error => console.error('SignalR connection failed', error));
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      offMessage(); offUpdate(); offRead(); offTyping();
      void signalRService.leaveRoom(id);
    };
  }, [id, mergeMessages]);

  const isCustomer = Boolean(roomInfo && currentUserId && roomInfo.customerId.toLowerCase() === currentUserId.toLowerCase());
  const peer = roomInfo ? getChatPeer(roomInfo, currentUserId) : null;
  const otherName = peer?.name || 'Đang tải...';
  const otherAvatar = peer?.avatar;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(userRole === 'MUA' ? '/(mua)/chat' : '/(tabs)/chat');
  };

  const loadOlder = async () => {
    if (!id || loadingOlder || !hasMore || !messages[0]) return;
    setLoadingOlder(true);
    try {
      const older = await chatService.getMessages(id, messages[0].sentAt);
      setMessages(previous => mergeMessages(older, previous));
      setHasMore(older.length === 50);
    } catch (error) { appDialog.alert('Không thể tải lịch sử', getApiError(error).message); }
    finally { setLoadingOlder(false); }
  };

  const reconcileAfterFailedRequest = async (content?: string, imageUrl?: string) => {
    if (!id || !currentUserIdRef.current) return null;
    try {
      const latest = await chatService.getMessages(id, undefined, 20);
      const normalizedContent = content?.trim() || '';
      const recovered = [...latest].reverse().find(message =>
        message.senderId.toLowerCase() === currentUserIdRef.current!.toLowerCase()
        && (!normalizedContent || message.content?.trim() === normalizedContent)
        && (!imageUrl || message.imageUrl === imageUrl)
        && Date.now() - new Date(message.sentAt).getTime() < 120_000);
      if (recovered) setMessages(previous => mergeMessages(previous, [recovered]));
      return recovered || null;
    } catch { return null; }
  };

  const sendMessage = async () => {
    const content = inputText.trim();
    if (!content || !id || sending) return;
    setSending(true);
    try {
      const sent = await chatService.sendMessage(id, content, undefined, replyTo?.messageId);
      setMessages(previous => mergeMessages(previous, [sent]));
      setInputText(''); setReplyTo(null); setShowEmoji(false);
      requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
    } catch (error) {
      const recovered = await reconcileAfterFailedRequest(content);
      if (recovered) {
        setInputText(''); setReplyTo(null); setShowEmoji(false);
        requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
      } else appDialog.alert('Gửi tin nhắn thất bại', getApiError(error).message);
    }
    finally { setSending(false); }
  };

  const pickAndSendImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.82 });
    if (result.canceled || !result.assets[0] || !id) return;
    setUploading(true);
    let uploadedImageUrl: string | undefined;
    try {
      uploadedImageUrl = await chatService.uploadImage(result.assets[0].uri);
      const sent = await chatService.sendMessage(id, inputText.trim() || undefined, uploadedImageUrl, replyTo?.messageId);
      setMessages(previous => mergeMessages(previous, [sent]));
      setInputText(''); setReplyTo(null);
    } catch (error) {
      const recovered = await reconcileAfterFailedRequest(inputText, uploadedImageUrl);
      if (recovered) { setInputText(''); setReplyTo(null); }
      else appDialog.alert('Gửi ảnh thất bại', getApiError(error).message);
    }
    finally { setUploading(false); }
  };

  const react = async (message: MessageDto, emoji: string) => {
    try {
      const updated = await chatService.reactToMessage(id, message.messageId, emoji);
      setMessages(previous => mergeMessages(previous, [updated]));
    } catch (error) { appDialog.alert('Không thể thả cảm xúc', getApiError(error).message); }
  };

  const openMua = (tab?: string) => {
    if (!roomInfo?.muaId) return;
    router.push({ pathname: '/mua-detail', params: { id: roomInfo.muaId, ...(tab ? { tab } : {}) } } as never);
  };

  const renderMessage = ({ item }: { item: MessageDto }) => {
    const own = item.senderId.toLowerCase() === currentUserId?.toLowerCase();
    return <View style={[styles.messageLine, own && styles.ownLine]}>
      {!own ? <View style={styles.smallAvatar}>{otherAvatar ? <Image source={{ uri: otherAvatar }} style={styles.smallAvatarImage} contentFit="cover"/> : <Text style={styles.avatarLetter}>{otherName.charAt(0).toUpperCase()}</Text>}</View> : null}
      <View style={[styles.messageBlock, { maxWidth: bubbleMaxWidth }, own && styles.ownBlock]}>
        <TouchableOpacity activeOpacity={0.9} onLongPress={() => setReplyTo(item)}>
          {own ? <LinearGradient colors={['#FF6B9A', '#F43F75']} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.bubble, styles.ownBubble]}>
            {item.replyToMessageId ? <ReplyPreview item={item} own/> : null}
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={[styles.messageImage,{width:imageSize,height:imageSize}]} contentFit="cover"/> : null}
            {item.content ? <Text style={[styles.messageText, styles.ownText]}>{item.content}</Text> : null}
          </LinearGradient> : <View style={[styles.bubble, styles.otherBubble]}>
            {item.replyToMessageId ? <ReplyPreview item={item}/> : null}
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={[styles.messageImage,{width:imageSize,height:imageSize}]} contentFit="cover"/> : null}
            {item.content ? <Text style={styles.messageText}>{item.content}</Text> : null}
          </View>}
        </TouchableOpacity>
        <View style={[styles.messageMeta, own && styles.ownMeta]}>
          <Text style={styles.messageTime}>{new Date(item.sentAt).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</Text>
          {own && item.isRead ? <CheckCheck size={15} color={BrandColors.accentPink}/> : null}
        </View>
        <View style={[styles.reactions, own && styles.ownMeta]}>
          {(item.reactions || []).map(reaction => <TouchableOpacity key={reaction.emoji} onPress={() => void react(item,reaction.emoji)} style={[styles.reaction, reaction.reactedByMe && styles.activeReaction]}><Text>{reaction.emoji} {reaction.count}</Text></TouchableOpacity>)}
          <TouchableOpacity onPress={() => void react(item,'❤️')}><Text style={styles.heart}>♡</Text></TouchableOpacity>
        </View>
      </View>
    </View>;
  };

  return <SafeAreaView style={styles.safe} edges={['top','bottom','left','right']}>
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.page}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={goBack} accessibilityLabel="Quay lại"><ArrowLeft size={25} color={BrandColors.accentRose}/></TouchableOpacity>
          <View style={styles.headerAvatarWrap}>{otherAvatar ? <Image source={{uri:otherAvatar}} style={styles.headerAvatar} contentFit="cover"/> : <View style={styles.headerAvatarFallback}><Text style={styles.headerAvatarLetter}>{otherName.charAt(0).toUpperCase()}</Text></View>}</View>
          <View style={styles.headerCopy}><Text style={styles.headerName} numberOfLines={1}>{otherName}</Text><Text style={styles.statusText}>{otherTyping ? 'Đang nhập...' : 'Tin nhắn riêng'}</Text></View>
          <TouchableOpacity style={styles.headerButton} accessibilityLabel="Tùy chọn"><MoreVertical size={24} color={BrandColors.accentRose}/></TouchableOpacity>
        </View>

        {loading ? <View style={styles.loading}><ActivityIndicator size="large" color={BrandColors.accentPink}/></View> : <FlatList ref={flatListRef} data={messages} keyExtractor={item=>item.messageId} renderItem={renderMessage} showsVerticalScrollIndicator={false} contentContainerStyle={styles.messages} onScroll={({nativeEvent})=>{if(nativeEvent.contentOffset.y<24) void loadOlder();}} scrollEventThrottle={160} ListHeaderComponent={<View>{loadingOlder ? <ActivityIndicator color={BrandColors.accentPink}/> : null}<View style={styles.dayChip}><Text style={styles.dayText}>Hôm nay</Text></View></View>} ListEmptyComponent={<View style={styles.emptyConversation}><MessageCircleEmpty/><Text style={styles.emptyConversationTitle}>Hãy bắt đầu trò chuyện</Text><Text style={styles.emptyConversationText}>Gửi lời chào hoặc câu hỏi để bắt đầu tư vấn.</Text></View>}/>}

        {isCustomer ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => openMua('Dịch vụ')}><CalendarDays size={19} color={BrandColors.accentPink}/><Text style={styles.quickActionPink}>Đặt lịch</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => openMua('Dịch vụ')}><FileText size={19} color={BrandColors.accentPink}/><Text style={styles.quickActionText}>Xem dịch vụ</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => openMua('Portfolio')}><ImageIcon size={19} color={BrandColors.accentPink}/><Text style={styles.quickActionText}>Xem portfolio</Text></TouchableOpacity>
        </ScrollView> : null}
        {replyTo ? <View style={styles.replyBar}><View style={styles.replyCopy}><Text style={styles.replyTitle}>Đang trả lời</Text><Text numberOfLines={1} style={styles.replyBody}>{replyTo.content || '📷 Hình ảnh'}</Text></View><TouchableOpacity onPress={()=>setReplyTo(null)}><X size={20} color={BrandColors.textMuted}/></TouchableOpacity></View> : null}
        {showEmoji ? <View style={styles.emojiBar}>{['😀','😂','😍','❤️','🔥','👏','😢','👍'].map(emoji=><TouchableOpacity key={emoji} onPress={()=>setInputText(value=>value+emoji)}><Text style={styles.emoji}>{emoji}</Text></TouchableOpacity>)}</View> : null}
        <View style={styles.composer}>
          <TouchableOpacity style={styles.plusButton} onPress={pickAndSendImage} disabled={uploading} accessibilityLabel="Gửi ảnh">{uploading?<ActivityIndicator color="#FFF"/>:<Plus size={25} color="#FFF"/>}</TouchableOpacity>
          <View style={styles.inputWrap}>
            <TextInput value={inputText} onChangeText={value=>{setInputText(value);void signalRService.setTyping(id,true);if(typingTimerRef.current)clearTimeout(typingTimerRef.current);typingTimerRef.current=setTimeout(()=>void signalRService.setTyping(id,false),1200);}} style={styles.input} placeholder="Nhập tin nhắn..." placeholderTextColor={BrandColors.textMuted} multiline maxLength={2000} onSubmitEditing={()=>void sendMessage()}/>
            <TouchableOpacity style={styles.inputIcon} onPress={()=>setShowEmoji(value=>!value)} accessibilityLabel="Biểu tượng cảm xúc"><Smile size={22} color={BrandColors.textMuted}/></TouchableOpacity>
            <TouchableOpacity style={styles.inputIcon} onPress={pickAndSendImage} accessibilityLabel="Chọn ảnh"><ImageIcon size={22} color={BrandColors.textMuted}/></TouchableOpacity>
          </View>
          <TouchableOpacity disabled={!inputText.trim()||sending} onPress={()=>void sendMessage()} accessibilityLabel="Gửi tin nhắn">
            <LinearGradient colors={!inputText.trim()?['#E7DDE1','#D8CED3']:['#FF6B9A','#F43F75']} style={styles.sendButton}><Send size={22} color="#FFF"/></LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function ReplyPreview({item,own=false}:{item:MessageDto;own?:boolean}){return <View style={[styles.replyPreview,own&&styles.ownReply]}><Text numberOfLines={1} style={[styles.replyPreviewText,own&&styles.ownReplyText]}>{item.replyToContent||(item.replyToImageUrl?'📷 Hình ảnh':'Tin nhắn')}</Text></View>;}
function MessageCircleEmpty(){return <View style={styles.emptyIcon}><View style={styles.emptyIconBack}/><View style={styles.emptyIconFront}><View style={styles.whiteDot}/><View style={styles.whiteDot}/><View style={styles.whiteDot}/></View></View>;}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:'#FFF8FA'},keyboard:{flex:1},page:{flex:1,width:'100%',maxWidth:760,alignSelf:'center',backgroundColor:'#FFF8FA',borderLeftWidth:Platform.OS==='web'?1:0,borderRightWidth:Platform.OS==='web'?1:0,borderColor:BrandColors.borderDivider},header:{minHeight:76,paddingHorizontal:10,flexDirection:'row',alignItems:'center',backgroundColor:'#FFF',borderBottomWidth:1,borderBottomColor:BrandColors.borderDivider,...Shadows.sm},headerButton:{width:46,height:46,borderRadius:23,alignItems:'center',justifyContent:'center',backgroundColor:'#FFF1F5'},headerAvatarWrap:{width:52,height:52,marginLeft:9,marginRight:10},headerAvatar:{width:52,height:52,borderRadius:26,borderWidth:2,borderColor:BrandColors.accentPink},headerAvatarFallback:{width:52,height:52,borderRadius:26,backgroundColor:'#F8BDD0',borderWidth:2,borderColor:BrandColors.accentPink,alignItems:'center',justifyContent:'center'},headerAvatarLetter:{fontFamily:Typography.black,fontSize:20,color:BrandColors.accentRose},headerCopy:{flex:1,minWidth:0},headerName:{fontFamily:Typography.extraBold,fontSize:17,color:BrandColors.textDark},statusText:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textMuted,marginTop:2},loading:{flex:1,alignItems:'center',justifyContent:'center'},messages:{paddingHorizontal:14,paddingBottom:18,flexGrow:1},dayChip:{alignSelf:'center',backgroundColor:'#FFE8EF',paddingHorizontal:18,paddingVertical:7,borderRadius:Radius.full,marginVertical:18},dayText:{fontFamily:Typography.medium,fontSize:12,color:BrandColors.textSecondary},messageLine:{flexDirection:'row',alignItems:'flex-start',marginBottom:12},ownLine:{justifyContent:'flex-end'},smallAvatar:{width:39,height:39,borderRadius:20,backgroundColor:'#F8BDD0',alignItems:'center',justifyContent:'center',overflow:'hidden',marginRight:8},smallAvatarImage:{width:39,height:39},avatarLetter:{fontFamily:Typography.black,color:BrandColors.accentRose},messageBlock:{alignItems:'flex-start'},ownBlock:{alignItems:'flex-end'},bubble:{paddingHorizontal:15,paddingVertical:11,borderRadius:19},otherBubble:{backgroundColor:'#FFF0F4',borderTopLeftRadius:6},ownBubble:{borderTopRightRadius:6},messageText:{fontFamily:Typography.regular,fontSize:15,lineHeight:21,color:BrandColors.textDark},ownText:{color:'#FFF'},messageImage:{borderRadius:14,marginBottom:7},messageMeta:{flexDirection:'row',alignItems:'center',gap:4,marginTop:4,paddingHorizontal:4},ownMeta:{alignSelf:'flex-end'},messageTime:{fontFamily:Typography.regular,fontSize:11,color:BrandColors.textMuted},replyPreview:{borderLeftWidth:3,borderLeftColor:BrandColors.accentPink,backgroundColor:'#FFE4EC',padding:7,borderRadius:7,marginBottom:7},ownReply:{borderLeftColor:'#FFF',backgroundColor:'rgba(255,255,255,.18)'},replyPreviewText:{fontFamily:Typography.medium,fontSize:12,color:BrandColors.textBody},ownReplyText:{color:'#FFF'},reactions:{flexDirection:'row',alignItems:'center',gap:4,marginTop:3},reaction:{paddingHorizontal:7,paddingVertical:2,borderRadius:12,backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.borderLight},activeReaction:{borderColor:BrandColors.accentPink,backgroundColor:'#FFF0F4'},heart:{fontSize:19,color:BrandColors.accentPink,paddingHorizontal:4},quickActions:{paddingHorizontal:14,paddingVertical:10,gap:9,borderTopWidth:1,borderTopColor:BrandColors.borderDivider},quickAction:{height:40,paddingHorizontal:14,borderRadius:Radius.full,backgroundColor:'#FFF',flexDirection:'row',alignItems:'center',gap:7,...Shadows.sm},quickActionText:{fontFamily:Typography.semiBold,fontSize:13,color:BrandColors.textDark},quickActionPink:{fontFamily:Typography.semiBold,fontSize:13,color:BrandColors.accentPink},replyBar:{flexDirection:'row',alignItems:'center',paddingHorizontal:18,paddingVertical:8,backgroundColor:'#FFF',borderTopWidth:1,borderTopColor:BrandColors.borderDivider},replyCopy:{flex:1},replyTitle:{fontFamily:Typography.bold,fontSize:12,color:BrandColors.accentPink},replyBody:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textBody},emojiBar:{flexDirection:'row',justifyContent:'space-around',padding:10,backgroundColor:'#FFF',borderTopWidth:1,borderTopColor:BrandColors.borderDivider},emoji:{fontSize:25},composer:{minHeight:76,paddingHorizontal:12,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:9,backgroundColor:'#FFF',borderTopWidth:1,borderTopColor:BrandColors.borderDivider},plusButton:{width:46,height:46,borderRadius:23,backgroundColor:BrandColors.accentPink,alignItems:'center',justifyContent:'center'},inputWrap:{flex:1,minHeight:48,maxHeight:112,borderRadius:24,backgroundColor:'#F7F4F6',flexDirection:'row',alignItems:'center',paddingLeft:15,paddingRight:5},input:{flex:1,maxHeight:100,paddingVertical:10,fontFamily:Typography.regular,fontSize:15,color:BrandColors.textDark,outlineStyle:'none'} as any,inputIcon:{width:36,height:40,alignItems:'center',justifyContent:'center'},sendButton:{width:50,height:50,borderRadius:25,alignItems:'center',justifyContent:'center'},emptyConversation:{flex:1,minHeight:360,alignItems:'center',justifyContent:'center'},emptyIcon:{width:115,height:92,alignItems:'center',justifyContent:'center'},emptyIconBack:{position:'absolute',right:6,bottom:7,width:57,height:47,borderRadius:22,backgroundColor:'#FFE0E9'},emptyIconFront:{width:76,height:58,borderRadius:29,backgroundColor:'#F889AD',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},whiteDot:{width:9,height:9,borderRadius:5,backgroundColor:'#FFF'},emptyConversationTitle:{fontFamily:Typography.extraBold,fontSize:20,color:BrandColors.textDark},emptyConversationText:{fontFamily:Typography.regular,fontSize:14,color:BrandColors.textMuted,marginTop:7,textAlign:'center'}
});
