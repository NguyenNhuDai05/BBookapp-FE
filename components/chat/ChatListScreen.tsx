import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronRight, MoreVertical, Search, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Radius, Shadows, Spacing, Typography } from '../../constants/theme';
import { ChatRoomDto, chatService } from '../../services/chatService';
import { signalRService } from '../../services/signalRService';

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
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const fetchRooms = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try { setRooms(await chatService.getRooms()); }
    catch (error) { console.error('Error fetching chat rooms', error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => void fetchRooms(), 0);
    void signalRService.connect().catch(error => console.error('SignalR connection failed', error));
    const offMessage = signalRService.onMessageReceived(() => void fetchRooms());
    const offRead = signalRService.onMessagesRead(() => void fetchRooms());
    return () => { clearTimeout(timer); offMessage(); offRead(); };
  }, []);

  const visibleRooms = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi-VN');
    return rooms.filter(room => {
      if (filter === 'customer' && viewer !== 'mua') return false;
      if (filter === 'mua' && viewer !== 'customer') return false;
      if (filter === 'system') return false;
      const name = viewer === 'customer' ? room.muaName : room.customerName;
      return !normalized || (name || '').toLocaleLowerCase('vi-VN').includes(normalized)
        || (room.lastMessage?.content || '').toLocaleLowerCase('vi-VN').includes(normalized);
    });
  }, [filter, query, rooms, viewer]);

  const totalUnread = rooms.reduce((total, room) => total + room.unreadCount, 0);
  const filters: { key: Filter; label: string; count?: number }[] = [
    { key: 'all', label: 'Tất cả', count: totalUnread },
    { key: 'customer', label: 'Khách hàng' },
    { key: 'mua', label: 'MUA' },
    { key: 'system', label: 'Hệ thống' },
  ];

  const renderRoom = ({ item, index }: { item: ChatRoomDto; index: number }) => {
    const name = (viewer === 'customer' ? item.muaName : item.customerName) || (viewer === 'customer' ? 'Chuyên gia trang điểm' : 'Khách hàng');
    const avatar = viewer === 'customer' ? item.muaAvatar : item.customerAvatar;
    const message = item.lastMessage?.content || (item.lastMessage?.imageUrl ? '📷 Đã gửi một hình ảnh' : 'Bắt đầu cuộc trò chuyện');
    return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Mở cuộc trò chuyện với ${name}`} activeOpacity={0.78} style={[styles.room, item.unreadCount > 0 && styles.unreadRoom, index === visibleRooms.length - 1 && styles.lastRoom]} onPress={() => router.push(`/chat/${item.chatRoomId}`)}>
      <View style={styles.avatarWrap}>
        {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" /> : <View style={styles.avatarFallback}><Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text></View>}
        <View style={styles.onlineDot} />
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
          <TouchableOpacity style={styles.circleButton} accessibilityLabel="Tùy chọn"><MoreVertical size={24} color={BrandColors.accentRose} /></TouchableOpacity>
        </View>
      </View>
      {searching ? <View style={styles.searchBar}><Search size={19} color={BrandColors.textMuted}/><TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Tìm theo tên hoặc tin nhắn..." placeholderTextColor={BrandColors.textMuted} style={styles.searchInput}/>{query ? <TouchableOpacity onPress={() => setQuery('')}><X size={18} color={BrandColors.textMuted}/></TouchableOpacity> : null}</View> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{filters.map(item => <TouchableOpacity key={item.key} onPress={() => setFilter(item.key)} style={[styles.filter, filter === item.key && styles.filterActive]}><Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>{item.count ? <View style={[styles.filterCount, filter === item.key && styles.filterCountActive]}><Text style={[styles.filterCountText, filter === item.key && styles.filterCountTextActive]}>{item.count > 99 ? '99+' : item.count}</Text></View> : null}</TouchableOpacity>)}</ScrollView>
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color={BrandColors.accentPink}/></View>
        : visibleRooms.length ? <FlatList data={visibleRooms} keyExtractor={item => item.chatRoomId} renderItem={renderRoom} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void fetchRooms(true)} tintColor={BrandColors.accentPink}/>} contentContainerStyle={styles.list}/>
        : <View style={styles.empty}>
            <View style={styles.emptyArt}><View style={styles.backBubble}/><View style={styles.frontBubble}><View style={styles.dot}/><View style={styles.dot}/><View style={styles.dot}/></View></View>
            <Text style={styles.emptyTitle}>{query ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có tin nhắn nào'}</Text>
            <Text style={styles.emptyBody}>{viewer === 'customer' ? 'Hãy bắt đầu trò chuyện với Makeup Artist để được tư vấn và đặt lịch nhé!' : 'Các cuộc trò chuyện với khách hàng sẽ xuất hiện tại đây.'}</Text>
            {viewer === 'customer' && !query ? <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(tabs)/explore')}><Text style={styles.exploreText}>Khám phá MUA ngay</Text><ChevronRight size={20} color="#FFF"/></TouchableOpacity> : null}
          </View>}
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#FFF9FB'},page:{flex:1,width:'100%',maxWidth:760,alignSelf:'center',backgroundColor:'#FFF9FB'},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:Spacing.lg,paddingTop:14,paddingBottom:18},title:{fontFamily:Typography.black,fontSize:34,lineHeight:42,color:BrandColors.textDark},headerActions:{flexDirection:'row',gap:10},circleButton:{width:46,height:46,borderRadius:23,alignItems:'center',justifyContent:'center',backgroundColor:'#FFF1F5'},searchBar:{height:48,marginHorizontal:Spacing.lg,marginBottom:14,paddingHorizontal:14,borderRadius:Radius.full,backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.borderLight,flexDirection:'row',alignItems:'center',gap:9,...Shadows.sm},searchInput:{flex:1,fontFamily:Typography.regular,fontSize:15,color:BrandColors.textDark,outlineStyle:'none' } as any,filters:{flexDirection:'row',gap:10,paddingHorizontal:Spacing.lg,paddingBottom:16},filter:{minHeight:42,paddingHorizontal:20,borderRadius:Radius.full,backgroundColor:'#FFF2F6',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7},filterActive:{backgroundColor:BrandColors.accentPink},filterText:{fontFamily:Typography.semiBold,fontSize:14,color:BrandColors.textBody},filterTextActive:{color:'#FFF'},filterCount:{minWidth:21,height:21,paddingHorizontal:5,borderRadius:11,alignItems:'center',justifyContent:'center',backgroundColor:BrandColors.accentPink},filterCountActive:{backgroundColor:'#FFF'},filterCountText:{fontFamily:Typography.bold,fontSize:11,color:'#FFF'},filterCountTextActive:{color:BrandColors.accentPink},list:{paddingHorizontal:12,paddingBottom:135},room:{minHeight:86,paddingHorizontal:14,paddingVertical:12,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:BrandColors.borderDivider,borderRadius:18},unreadRoom:{backgroundColor:'#FFF0F4'},lastRoom:{marginBottom:8},avatarWrap:{width:58,height:58,marginRight:14},avatar:{width:58,height:58,borderRadius:29},avatarFallback:{width:58,height:58,borderRadius:29,alignItems:'center',justifyContent:'center',backgroundColor:'#F8BDD0'},avatarLetter:{fontFamily:Typography.black,fontSize:22,color:BrandColors.accentRose},onlineDot:{position:'absolute',right:1,bottom:2,width:14,height:14,borderRadius:7,backgroundColor:'#20C759',borderWidth:2,borderColor:'#FFF'},roomCopy:{flex:1,minWidth:0},roomName:{fontFamily:Typography.semiBold,fontSize:16,color:BrandColors.textDark},bold:{fontFamily:Typography.extraBold},preview:{fontFamily:Typography.regular,fontSize:14,color:BrandColors.textMuted,marginTop:5},unreadPreview:{fontFamily:Typography.semiBold,color:BrandColors.textBody},roomMeta:{alignItems:'flex-end',alignSelf:'stretch',justifyContent:'space-between',paddingVertical:4,marginLeft:8},time:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textMuted},badge:{minWidth:24,height:24,borderRadius:12,paddingHorizontal:6,backgroundColor:BrandColors.accentPink,alignItems:'center',justifyContent:'center'},badgeText:{fontFamily:Typography.bold,fontSize:11,color:'#FFF'},center:{flex:1,alignItems:'center',justifyContent:'center',paddingBottom:100},empty:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:32,paddingBottom:120},emptyArt:{width:142,height:116,alignItems:'center',justifyContent:'center',marginBottom:22},backBubble:{position:'absolute',right:11,bottom:10,width:68,height:55,borderRadius:25,backgroundColor:'#FFE0E9'},frontBubble:{width:91,height:69,borderRadius:34,backgroundColor:'#F889AD',flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center'},dot:{width:11,height:11,borderRadius:6,backgroundColor:'#FFF'},emptyTitle:{fontFamily:Typography.black,fontSize:22,color:BrandColors.textDark,textAlign:'center'},emptyBody:{fontFamily:Typography.regular,fontSize:15,lineHeight:23,color:BrandColors.textMuted,textAlign:'center',maxWidth:380,marginTop:9},exploreButton:{height:54,minWidth:255,paddingHorizontal:28,borderRadius:Radius.full,marginTop:26,backgroundColor:BrandColors.accentPink,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,...Shadows.soft},exploreText:{fontFamily:Typography.bold,fontSize:16,color:'#FFF'}
});
