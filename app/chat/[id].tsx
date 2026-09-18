import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Send, ImagePlus, X } from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandColors, Spacing } from "../../constants/theme";
import { authService } from "../../services/authService";
import { chatService, MessageDto } from "../../services/chatService";
import { signalRService } from "../../services/signalRService";

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<any | null>(null);
  const [replyTo, setReplyTo] = useState<MessageDto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;

    const loadInitialData = async () => {
      try {
        // 1. Lấy thông tin user hiện tại
        const user = await authService.getMe();
        setCurrentUserId(user.id);
        setUserRole(user.role);

        // 2. Lấy danh sách phòng chat
        const rooms = await chatService.getRooms();

        // IN RA TERMINAL ĐỂ KIỂM TRA (Hãy mở terminal Expo xem đoạn này)
        console.log("=== DEBUG CHAT ROOM ===");
        console.log("ID từ URL tuyển vào:", id);
        console.log(
          "Danh sách phòng nhận được từ API:",
          JSON.stringify(rooms, null, 2),
        );

        // Tìm phòng với logic linh hoạt hơn (loại bỏ khoảng trắng, ép kiểu chuỗi)
        const currentRoom = rooms.find((r: any) => {
          const roomIdInRoom = r.chatRoomId || r.ChatRoomId || r.id || r.Id;
          return (
            String(roomIdInRoom).trim().toLowerCase() ===
            String(id).trim().toLowerCase()
          );
        });

        if (currentRoom) {
          console.log(
            "-> ĐÃ TÌM THẤY PHÒNG CHAT PHÙ HỢP:",
            JSON.stringify(currentRoom, null, 2),
          );
          setRoomInfo(currentRoom);
        } else {
          console.warn("-> KHÔNG tìm thấy phòng chat nào khớp với ID trên!");
        }

        // 3. Lấy tin nhắn
        const data = await chatService.getMessages(id);
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages", error);
      } finally {
        setLoading(false);
      }
    };

    const setupSignalR = async () => {
      await signalRService.connect();
      const connectionId = signalRService.getConnectionId();
      if (connectionId) {
        await chatService.joinRoomGroup(id, connectionId);
      }

      signalRService.onMessageReceived((msg: MessageDto) => {
        if (String(msg.chatRoomId).toLowerCase() === String(id).toLowerCase()) {
          setMessages((prev) => [...prev, msg]);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      });
      signalRService.onMessageUpdated((msg: MessageDto) => {
        setMessages(prev => prev.map(item => item.messageId === msg.messageId ? msg : item));
      });
    };

    loadInitialData();
    setupSignalR();

    return () => {
      const cleanup = async () => {
        const connId = signalRService.getConnectionId();
        if (connId) {
          await chatService.leaveRoomGroup(id, connId);
        }
      };
      cleanup();
    };
  }, [id]);

  // --- HÀM XỬ LÝ LẤY TÊN ĐỐI PHƯƠNG KHÔNG LO LỖI CHỮ HOA/THƯỜNG ---
  const getOtherPartyName = () => {
    if (!roomInfo || !currentUserId) return "";

    // Đọc trường từ API (Hỗ trợ cả trường hợp giữ nguyên PascalCase hoặc camelCase)
    const customerId = roomInfo.customerId || roomInfo.CustomerId;
    const customerName = roomInfo.customerName || roomInfo.CustomerName;
    const muaName = roomInfo.muaName || roomInfo.MUAName;

    // Hạ chữ thường 2 chuỗi GUID để so sánh chính xác tuyệt đối
    const isMeCustomer =
      String(customerId).toLowerCase() === String(currentUserId).toLowerCase();

    if (isMeCustomer) {
      // Nếu TÔI là Customer -> Đối phương nhắn tin với tôi là MUA
      return muaName || "Chuyên gia trang điểm";
    } else {
      // Nếu TÔI là MUA -> Đối phương nhắn tin với tôi là Customer
      return customerName || "Khách hàng";
    }
  };

  const getHeaderName = () => {
    return getOtherPartyName() || "Đang tải...";
  };

  const getHeaderAvatarText = () => {
    const name = getHeaderName();
    if (name === "Đang tải...") return "...";
    return name ? name.charAt(0).toUpperCase() : "C";
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !id) return;
    try {
      await chatService.sendMessage(id, inputText.trim(), undefined, replyTo?.messageId);
      setInputText("");
      setReplyTo(null);
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  const pickAndSendImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const url = await chatService.uploadImage(result.assets[0].uri);
      await chatService.sendMessage(id, inputText.trim() || undefined, url, replyTo?.messageId);
      setInputText(''); setReplyTo(null);
    } finally { setUploading(false); }
  };

  const react = async (message: MessageDto, emoji: string) => {
    const updated = await chatService.reactToMessage(id, message.messageId, emoji);
    setMessages(prev => prev.map(item => item.messageId === updated.messageId ? updated : item));
  };

  // --- RENDER GIAO DIỆN TIN NHẮN THEO YÊU CẦU ---
  const renderMessage = ({ item }: { item: MessageDto }) => {
    // Xác định tin nhắn là của mình hay của đối phương
    const isOwn =
      String(item.senderId).toLowerCase() ===
      String(currentUserId).toLowerCase();
    const otherPartyName = getOtherPartyName();
    const avatarLetter = otherPartyName
      ? otherPartyName.charAt(0).toUpperCase()
      : "U";

    return (
      <View
        style={[
          styles.messageRow,
          isOwn ? styles.messageRowOwn : styles.messageRowOther,
        ]}
      >
        {/* NẾU LÀ TIN NHẮN ĐỐI PHƯƠNG GỬI: Hiển thị avatar tròn ở bên trái */}
        {!isOwn && (
          <View style={styles.msgAvatarCircle}>
            <Text style={styles.msgAvatarText}>{avatarLetter}</Text>
          </View>
        )}

        <View
          style={[
            styles.messageContentWrapper,
            isOwn ? styles.alignEnd : styles.alignStart,
          ]}
        >
          {/* NẾU LÀ TIN NHẮN ĐỐI PHƯƠNG GỬI: Hiển thị tên nhỏ nằm phía trên bong bóng chat */}
          {!isOwn && (
            <Text style={styles.senderNameLabel}>{otherPartyName}</Text>
          )}

          <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={() => setReplyTo(item)}
            style={[
              styles.messageBubble,
              isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
            ]}
          >
            {item.replyToMessageId && <View style={styles.replyPreview}><Text style={styles.replyPreviewText} numberOfLines={1}>{item.replyToContent || (item.replyToImageUrl ? '📷 Hình ảnh' : 'Tin nhắn')}</Text></View>}
            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.messageImage} contentFit="cover" />}
            {!!item.content && <Text
              style={[
                styles.messageText,
                isOwn ? styles.messageTextOwn : styles.messageTextOther,
              ]}
            >
              {item.content}
            </Text>
            }
            <Text
              style={[
                styles.timestamp,
                isOwn ? styles.timestampOwn : styles.timestampOther,
              ]}
            >
              {new Date(item.sentAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>
          <View style={styles.reactionRow}>
            {(item.reactions || []).map(reaction => <TouchableOpacity key={reaction.emoji} style={[styles.reactionBadge, reaction.reactedByMe && styles.reactionBadgeActive]} onPress={() => react(item, reaction.emoji)}><Text>{reaction.emoji} {reaction.count}</Text></TouchableOpacity>)}
            <TouchableOpacity onPress={() => react(item, '❤️')}><Text style={styles.quickHeart}>♡</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* HEADER ROOM CHAT */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                if (userRole === "MUA") {
                  router.replace("/(mua)/chat");
                } else {
                  router.replace("/(tabs)/chat");
                }
              }
            }}
            style={styles.backBtn}
          >
            <ArrowLeft size={24} color={BrandColors.textDark} />
          </TouchableOpacity>
          <View style={styles.headerAvatarCircle}>
            <Text style={styles.headerAvatarText}>{getHeaderAvatarText()}</Text>
          </View>
          <Text style={styles.headerTitle}>{getHeaderName()}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BrandColors.accentPink} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.messageId}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Ô NHẬP TIN NHẮN */}
        {replyTo && <View style={styles.replyBar}><View style={{ flex: 1 }}><Text style={styles.replyLabel}>Đang trả lời</Text><Text numberOfLines={1}>{replyTo.content || '📷 Hình ảnh'}</Text></View><TouchableOpacity onPress={() => setReplyTo(null)}><X size={20} /></TouchableOpacity></View>}
        {showEmoji && <View style={styles.emojiPicker}>{['😀','😂','😍','❤️','🔥','👏','😢','👍'].map(emoji => <TouchableOpacity key={emoji} onPress={() => setInputText(v => v + emoji)}><Text style={styles.emojiItem}>{emoji}</Text></TouchableOpacity>)}</View>}
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={pickAndSendImage} disabled={uploading} style={styles.inputAction}><ImagePlus size={23} color={BrandColors.accentPink} /></TouchableOpacity>
          <TouchableOpacity onPress={() => setShowEmoji(v => !v)} style={styles.inputAction}><Text style={{ fontSize: 22 }}>😊</Text></TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Nhập tin nhắn..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              !inputText.trim() && styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backBtn: {
    marginRight: Spacing.sm,
  },
  headerAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.accentPink,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  headerAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: BrandColors.textDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageList: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    alignItems: "flex-end",
  },
  messageRowOwn: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
  msgAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BrandColors.accentPink, // Chuyển màu đồng bộ với app hoặc dùng tông xám nhẹ `#bbb`
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  msgAvatarText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  messageContentWrapper: {
    flexDirection: "column",
    maxWidth: "75%",
  },
  alignStart: {
    alignItems: "flex-start",
  },
  alignEnd: {
    alignItems: "flex-end",
  },
  senderNameLabel: {
    fontSize: 11,
    color: "#777",
    marginBottom: 3,
    marginLeft: 4,
    fontWeight: "600",
  },
  messageBubble: {
    padding: Spacing.md,
    borderRadius: 16,
  },
  messageImage: { width: 210, height: 210, borderRadius: 12, marginBottom: 6 },
  replyPreview: { borderLeftWidth: 3, borderLeftColor: '#E8436A', backgroundColor: 'rgba(255,255,255,0.22)', padding: 7, marginBottom: 6, borderRadius: 6 },
  replyPreviewText: { fontSize: 12, color: '#666' },
  reactionRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  reactionBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 12, backgroundColor: '#F3F3F3', borderWidth: 1, borderColor: '#EEE' },
  reactionBadgeActive: { borderColor: BrandColors.accentPink, backgroundColor: '#FFF0F5' },
  quickHeart: { fontSize: 19, color: BrandColors.accentPink, paddingHorizontal: 4 },
  messageBubbleOwn: {
    backgroundColor: "#0084FF",
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: "#f1f1f1",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: "#fff",
  },
  messageTextOther: {
    color: BrandColors.textDark,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  timestampOwn: {
    color: "rgba(255,255,255,0.7)",
    alignSelf: "flex-end",
  },
  timestampOther: {
    color: "#999",
    alignSelf: "flex-start",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  inputAction: { padding: 6 },
  replyBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F7F7F8', borderTopWidth: 1, borderTopColor: '#EEE' },
  replyLabel: { color: BrandColors.accentPink, fontSize: 12, fontWeight: '700' },
  emojiPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, padding: 12, borderTopWidth: 1, borderTopColor: '#EEE' },
  emojiItem: { fontSize: 26 },
  textInput: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
    minHeight: 40,
    marginRight: Spacing.sm,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BrandColors.accentPink,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#ccc",
  },
});
