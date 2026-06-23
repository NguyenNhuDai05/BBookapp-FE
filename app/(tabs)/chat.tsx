import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import { BrandColors, Spacing, Radius } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { chatService, ChatRoomDto } from '../../services/chatService';
import { useRouter } from 'expo-router';

export default function ChatScreen() {
  const [rooms, setRooms] = useState<ChatRoomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchRooms = async () => {
    try {
      const data = await chatService.getRooms();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching chat rooms', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const renderItem = ({ item }: { item: ChatRoomDto }) => {
    // Determine the name to show (usually the other person). We assume Customer is viewing MUAs or vice versa.
    // For simplicity, we just show MUAName or CustomerName if available.
    const displayName = item.muaName || item.customerName || 'Người dùng';
    const lastMsg = item.lastMessage?.content || 'Chưa có tin nhắn nào';

    return (
      <TouchableOpacity 
        style={styles.roomItem}
        onPress={() => router.push(`/chat/${item.chatRoomId}`)}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{displayName}</Text>
          <Text style={styles.roomLastMsg} numberOfLines={1}>{lastMsg}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{Strings.chatTitle}</Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={BrandColors.accentPink} style={{ marginTop: 50 }} />
      ) : rooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <MessageCircle size={36} color={BrandColors.accentPink} />
          </View>
          <Text style={styles.emptyTitle}>{Strings.chatEmpty}</Text>
          <Text style={styles.emptyDesc}>{Strings.chatEmptyDesc}</Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.chatRoomId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColors.bgPrimary,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: BrandColors.textDark,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BrandColors.bgPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.textDark,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  listContainer: {
    paddingHorizontal: Spacing.md,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: BrandColors.accentPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.textDark,
    marginBottom: 4,
  },
  roomLastMsg: {
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
});
