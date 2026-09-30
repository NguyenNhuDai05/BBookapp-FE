import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { CheckCheck, ChevronRight, Mail, MoreVertical, Search, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Radius, Shadows, Spacing, Typography } from '../../constants/theme';
import { ChatRoomDto, chatService } from '../../services/chatService';
import { signalRService } from '../../services/signalRService';
import { authService } from '../../services/authService';

type Props = { viewer: 'customer' | 'mua' };
type Filter = 'all' | 'customer' | 'mua' | 'system';

const relativeTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value); const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;
  if (minutes < 2880) return 'Hôm qua';
  if (minutes < 10080) return `${Math.floor(minutes / 1440)} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

export default function ChatListScreen({ viewer }: Props) {
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchRooms = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      setError(false);
      const [data, user] = await Promise.all([chatService.getRooms(), authService.getMe()]);
      setCurrentUserId(user.id);
      setRooms([...data].sort((a,b) => new Date(b.lastMessage?.sentAt || b.createdAt).getTime() - new Date(a.lastMessage?.sentAt || a.createdAt).getTime()));
    }
    catch (loadError) { console.error('Error fetching chat rooms', loadError); setError(true); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => void fetchRooms(), 0);
    void signalRService.connect().catch(error => console.error('SignalR connection failed', error));
    const offMessage = signalRService.onMessageReceived(() => void fetchRooms());
    const offRead = signalRService.onMessagesRead(() => void fetchRooms());
    return () => { clearTimeout(timer); offMessage(); offRead(); };
  }, []);

  useEffect(() => {
    if (!searching) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setSearching(false); setQuery(''); return true;
    });
    return () => subscription.remove();
  }, [searching]);

  const visibleRooms = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi-VN');
    return rooms.filter(room => {
      if (unreadOnly && room.unreadCount <= 0) return false;
      if (filter === 'customer' && viewer !== 'mua') return false;
      if (filter === 'mua' && viewer !== 'customer') return false;
      if (filter === 'system') return false;
      const name = viewer === 'customer' ? room.muaName : room.customerName;
      return !normalized || (name || '').toLocaleLowerCase('vi-VN').includes(normalized)
        || (room.lastMessage?.content || '').toLocaleLowerCase('vi-VN').includes(normalized);
    });
  }, [filter, query, rooms, unreadOnly, viewer]);

  const totalUnread = rooms.reduce((total, room) => total + room.unreadCount, 0);
  const filters: { key: Filter; label: string; count?: number }[] = [
    { key: 'all', label: 'Tất cả', count: totalUnread },
    { key: 'customer', label: 'Khách hàng' },
    { key: 'mua', label: 'MUA' },
    { key: 'system', label: 'Hệ thống' },
  ];

  const renderRoom = ({ item, index }: { item: ChatRoomDto; index: number }) => {
    const name = (viewer === 'customer' ? item.muaName : item.customerName)?.trim() || 'Người dùng B-Book';
    const avatar = viewer === 'customer' ? item.muaAvatar : item.customerAvatar;
    const rawMessage = item.lastMessage?.content || (item.lastMessage?.imageUrl ? '📷 Đã gửi một hình ảnh' : 'Bắt đầu cuộc trò chuyện');
    const message = item.lastMessage && currentUserId && item.lastMessage.senderId.toLowerCase() === currentUserId.toLowerCase() ? `Bạn: ${rawMessage}` : rawMessage;
    return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Mở cuộc trò chuyện với ${name}`} activeOpacity={0.78} style={[styles.room, item.unreadCount > 0 && styles.unreadRoom, index === visibleRooms.length - 1 && styles.lastRoom]} onPress={() => router.push(`/chat/${item.chatRoomId}`)}>
      <View style={styles.avatarWrap}>
        {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" /> : <View style={styles.avatarFallback}><Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text></View>}
      </View>
      <View style={styles.roomCopy}>
        <Text style={[styles.roomName, item.unreadCount > 0 && styles.bold]} numberOfLines={1}>{name}</Text>
        <Text style={[styles.preview, item.unreadCount > 0 && styles.unreadPreview]} numberOfLines={1}>{message}</Text>
      </View>
      <View style={styles.roomMeta}>
        <Text style={styles.time}>{relativeTime(item.lastMessage?.sentAt || item.createdAt)}</Text>
        {item.unreadCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text></View> : null}
      </View>
    </TouchableOpacity>;
  };

  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Tin nhắn</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.circleButton} onPress={() => setSearching(value => !value)} accessibilityLabel="Tìm kiếm"><Search size={26} color={BrandColors.textDark} /></TouchableOpacity>
          <TouchableOpacity style={styles.circleButton} onPress={() => setMenuVisible(true)} accessibilityLabel="Tùy chọn"><MoreVertical size={24} color={BrandColors.accentRose} /></TouchableOpacity>
        </View>
      </View>
      {searching ? <View style={styles.searchBar}><Search size={19} color={BrandColors.textMuted}/><TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Tìm theo tên hoặc tin nhắn..." placeholderTextColor={BrandColors.textMuted} style={styles.searchInput}/>{query ? <TouchableOpacity onPress={() => setQuery('')}><X size={18} color={BrandColors.textMuted}/></TouchableOpacity> : null}</View> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{filters.map(item => <TouchableOpacity key={item.key} onPress={() => setFilter(item.key)} style={[styles.filter, filter === item.key && styles.filterActive]}><Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>{item.count ? <View style={[styles.filterCount, filter === item.key && styles.filterCountActive]}><Text style={[styles.filterCountText, filter === item.key && styles.filterCountTextActive]}>{item.count > 99 ? '99+' : item.count}</Text></View> : null}</TouchableOpacity>)}</ScrollView>
      {loading ? <ConversationSkeleton/>
        : error ? <View style={styles.state}><Text style={styles.emptyTitle}>Không thể tải tin nhắn</Text><Text style={styles.emptyBody}>Vui lòng thử lại.</Text><TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); void fetchRooms(); }}><Text style={styles.retryText}>Thử lại</Text></TouchableOpacity></View>
        : visibleRooms.length ? <FlatList data={visibleRooms} keyExtractor={item => item.chatRoomId} renderItem={renderRoom} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void fetchRooms(true)} tintColor={BrandColors.accentPink}/>} contentContainerStyle={styles.list}/>
        : <View style={styles.empty}>
            <View style={styles.emptyArt}><View style={styles.backBubble}/><View style={styles.frontBubble}><View style={styles.dot}/><View style={styles.dot}/><View style={styles.dot}/></View></View>
            <Text style={styles.emptyTitle}>{query ? 'Không tìm thấy cuộc trò chuyện' : unreadOnly ? 'Không có tin nhắn chưa đọc' : 'Chưa có tin nhắn nào'}</Text>
            <Text style={styles.emptyBody}>{query ? `Không có kết quả cho “${query.trim()}”.` : viewer === 'customer' ? 'Hãy bắt đầu trò chuyện với Makeup Artist để được tư vấn và đặt lịch nhé!' : 'Các cuộc trò chuyện với khách hàng sẽ xuất hiện tại đây.'}</Text>
            {viewer === 'customer' && !query ? <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(tabs)/explore')}><Text style={styles.exploreText}>Khám phá MUA ngay</Text><ChevronRight size={20} color="#FFF"/></TouchableOpacity> : null}
          </View>}
      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.menu} onPress={event => event.stopPropagation()}>
            <View style={styles.menuHandle}/><Text style={styles.menuTitle}>Tùy chọn tin nhắn</Text>
            <TouchableOpacity style={styles.menuItem} onPress={async()=>{setMenuVisible(false);try{await Promise.all(rooms.filter(room=>room.unreadCount>0).map(room=>chatService.markRead(room.chatRoomId)));void fetchRooms();}catch{Alert.alert('Không thể cập nhật','Vui lòng thử lại.');}}}><CheckCheck size={21} color={BrandColors.accentPink}/><Text style={styles.menuText}>Đánh dấu tất cả đã đọc</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={()=>{setUnreadOnly(value=>!value);setMenuVisible(false);}}><Mail size={21} color={BrandColors.accentPink}/><Text style={styles.menuText}>{unreadOnly?'Hiển thị tất cả':'Tin nhắn chưa đọc'}</Text></TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  </SafeAreaView>;
}

function ConversationSkeleton(){return <View style={styles.skeletonList}>{[0,1,2,3,4].map(index=><View key={index} style={styles.skeletonRow}><View style={styles.skeletonAvatar}/><View style={styles.skeletonCopy}><View style={[styles.skeletonLine,{width:index%2?'54%':'68%'}]}/><View style={[styles.skeletonLine,styles.skeletonMessage,{width:index%2?'78%':'62%'}]}/></View></View>)}</View>}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#FFF9FB'},page:{flex:1,width:'100%',maxWidth:760,alignSelf:'center',backgroundColor:'#FFF9FB'},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:Spacing.lg,paddingTop:10,paddingBottom:14},title:{fontFamily:Typography.black,fontSize:32,lineHeight:40,color:'#2B1B2A'},headerActions:{flexDirection:'row',gap:8},circleButton:{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:'#FFF1F5'},searchBar:{height:46,marginHorizontal:Spacing.lg,marginBottom:12,paddingHorizontal:14,borderRadius:Radius.full,backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.borderLight,flexDirection:'row',alignItems:'center',gap:9,...Shadows.sm},searchInput:{flex:1,fontFamily:Typography.regular,fontSize:15,color:BrandColors.textDark,outlineStyle:'none' } as any,filters:{flexDirection:'row',gap:9,paddingHorizontal:Spacing.lg,paddingBottom:14},filter:{height:38,paddingHorizontal:17,borderRadius:20,backgroundColor:'#FFF2F6',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7},filterActive:{backgroundColor:'#FF5C9A'},filterText:{fontFamily:Typography.semiBold,fontSize:14,color:BrandColors.textBody},filterTextActive:{color:'#FFF'},filterCount:{minWidth:21,height:21,paddingHorizontal:5,borderRadius:11,alignItems:'center',justifyContent:'center',backgroundColor:BrandColors.accentPink},filterCountActive:{backgroundColor:'#FFF'},filterCountText:{fontFamily:Typography.bold,fontSize:11,color:'#FFF'},filterCountTextActive:{color:BrandColors.accentPink},list:{paddingHorizontal:12,paddingBottom:135},room:{minHeight:80,paddingHorizontal:14,paddingVertical:11,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:BrandColors.borderDivider,borderRadius:18},unreadRoom:{backgroundColor:'#FFF0F4'},lastRoom:{marginBottom:8},avatarWrap:{width:54,height:54,marginRight:13},avatar:{width:54,height:54,borderRadius:27},avatarFallback:{width:54,height:54,borderRadius:27,alignItems:'center',justifyContent:'center',backgroundColor:'#F8BDD0'},avatarLetter:{fontFamily:Typography.black,fontSize:21,color:BrandColors.accentRose},roomCopy:{flex:1,minWidth:0},roomName:{fontFamily:Typography.semiBold,fontSize:16,color:BrandColors.textDark},bold:{fontFamily:Typography.extraBold},preview:{fontFamily:Typography.regular,fontSize:14,color:BrandColors.textMuted,marginTop:5},unreadPreview:{fontFamily:Typography.semiBold,color:BrandColors.textBody},roomMeta:{alignItems:'flex-end',alignSelf:'stretch',justifyContent:'space-between',paddingVertical:4,marginLeft:8},time:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textMuted},badge:{minWidth:24,height:24,borderRadius:12,paddingHorizontal:6,backgroundColor:BrandColors.accentPink,alignItems:'center',justifyContent:'center'},badgeText:{fontFamily:Typography.bold,fontSize:11,color:'#FFF'},empty:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:32,paddingBottom:120},state:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:32,paddingBottom:100},emptyArt:{width:142,height:116,alignItems:'center',justifyContent:'center',marginBottom:22},backBubble:{position:'absolute',right:11,bottom:10,width:68,height:55,borderRadius:25,backgroundColor:'#FFE0E9'},frontBubble:{width:91,height:69,borderRadius:34,backgroundColor:'#F889AD',flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center'},dot:{width:11,height:11,borderRadius:6,backgroundColor:'#FFF'},emptyTitle:{fontFamily:Typography.black,fontSize:22,color:BrandColors.textDark,textAlign:'center'},emptyBody:{fontFamily:Typography.regular,fontSize:15,lineHeight:23,color:BrandColors.textMuted,textAlign:'center',maxWidth:380,marginTop:9},exploreButton:{height:54,minWidth:255,paddingHorizontal:28,borderRadius:Radius.full,marginTop:26,backgroundColor:BrandColors.accentPink,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,...Shadows.soft},exploreText:{fontFamily:Typography.bold,fontSize:16,color:'#FFF'},retryButton:{height:44,paddingHorizontal:24,borderRadius:22,backgroundColor:BrandColors.accentPink,justifyContent:'center',marginTop:20},retryText:{fontFamily:Typography.bold,color:'#FFF'},skeletonList:{paddingHorizontal:24},skeletonRow:{height:80,flexDirection:'row',alignItems:'center'},skeletonAvatar:{width:54,height:54,borderRadius:27,backgroundColor:'#F4E7EC'},skeletonCopy:{flex:1,marginLeft:14},skeletonLine:{height:13,borderRadius:7,backgroundColor:'#F0E3E9'},skeletonMessage:{height:11,marginTop:11,opacity:.7},overlay:{flex:1,backgroundColor:'rgba(43,27,42,.24)',justifyContent:'flex-end'},menu:{width:'100%',maxWidth:760,alignSelf:'center',backgroundColor:'#FFF',borderTopLeftRadius:24,borderTopRightRadius:24,paddingHorizontal:20,paddingTop:10,paddingBottom:34,...Shadows.elevated},menuHandle:{width:42,height:4,borderRadius:2,backgroundColor:'#DED3D8',alignSelf:'center',marginBottom:15},menuTitle:{fontFamily:Typography.extraBold,fontSize:18,color:BrandColors.textDark,marginBottom:8},menuItem:{height:54,flexDirection:'row',alignItems:'center',gap:13,borderBottomWidth:1,borderBottomColor:BrandColors.borderDivider},menuText:{fontFamily:Typography.semiBold,fontSize:15,color:BrandColors.textDark}
});
