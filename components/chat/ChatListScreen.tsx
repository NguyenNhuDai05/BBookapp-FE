import { ActionSheet } from '../ui/ActionSheet';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { CheckCheck, ChevronRight, Mail, MoreVertical, Search, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import { AppAlert as appDialog } from '../ui/dialogStore';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Radius, Shadows, Spacing, Typography } from '../../constants/theme';
import { ChatRoomDto, chatService } from '../../services/chatService';
import { signalRService } from '../../services/signalRService';
import { getChatPeer } from '../../utils/chatPeer';
import { authService } from '../../services/authService';

type Props = { viewer: 'customer' | 'mua' };

const relativeTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const diff = Math.max(0, Date.now() - date.getTime());
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
  const [query, setQuery] = useState('');
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

  const visibleRooms = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi-VN');
    return rooms.filter(room => {
      if (unreadOnly && room.unreadCount <= 0) return false;
      const { name } = getChatPeer(room, currentUserId);
      return !normalized || (name || '').toLocaleLowerCase('vi-VN').includes(normalized)
        || (room.lastMessage?.content || '').toLocaleLowerCase('vi-VN').includes(normalized);
    });
  }, [currentUserId, query, rooms, unreadOnly]);

  const totalUnread = rooms.reduce((total, room) => total + room.unreadCount, 0);
  const renderRoom = ({ item, index }: { item: ChatRoomDto; index: number }) => {
    const { name, avatar } = getChatPeer(item, currentUserId);
    const rawMessage = item.lastMessage?.content || (item.lastMessage?.imageUrl ? '📷 Đã gửi một hình ảnh' : 'Bắt đầu cuộc trò chuyện');
    const message = item.lastMessage && currentUserId && item.lastMessage.senderId.toLowerCase() === currentUserId.toLowerCase() ? `Bạn: ${rawMessage}` : rawMessage;
    return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Mở cuộc trò chuyện với ${name}`} activeOpacity={0.78} style={[styles.room, item.unreadCount > 0 && styles.unreadRoom, index === visibleRooms.length - 1 && styles.lastRoom]} onPress={() => router.push(`/chat/${item.chatRoomId}`)}>
      <ConversationAvatar name={name} uri={avatar} />
      <View style={styles.roomCopy}>
        <View style={styles.roomTopLine}>
          <Text style={[styles.roomName, item.unreadCount > 0 && styles.bold]} numberOfLines={1}>{name}</Text>
          <Text style={styles.time}>{relativeTime(item.lastMessage?.sentAt || item.createdAt)}</Text>
        </View>
        <View style={styles.roomBottomLine}>
          <Text style={[styles.preview, item.unreadCount > 0 && styles.unreadPreview]} numberOfLines={1}>{message}</Text>
          {item.unreadCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text></View> : null}
        </View>
      </View>
    </TouchableOpacity>;
  };

  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <View style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headingCopy}><Text style={styles.title}>Tin nhắn</Text><Text style={styles.subtitle}>{loading ? 'Đang tải cuộc trò chuyện...' : totalUnread ? totalUnread + ' tin nhắn chưa đọc' : 'Cuộc trò chuyện của bạn'}</Text></View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.circleButton} onPress={() => setMenuVisible(true)} accessibilityLabel="Tùy chọn"><MoreVertical size={24} color={BrandColors.accentRose} /></TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchBar}><Search size={19} color={BrandColors.textMuted}/><TextInput accessibilityLabel="Tìm cuộc trò chuyện" value={query} onChangeText={setQuery} placeholder="Tìm theo tên hoặc tin nhắn..." placeholderTextColor={BrandColors.textMuted} style={styles.searchInput}/>{query ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Xóa tìm kiếm" style={styles.clearSearch} onPress={() => setQuery('')}><X size={18} color={BrandColors.textMuted}/></TouchableOpacity> : null}</View>
      {unreadOnly ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Bỏ lọc chưa đọc" style={styles.unreadNotice} onPress={() => setUnreadOnly(false)}><Text style={styles.subtitle}>Chỉ hiện tin nhắn chưa đọc</Text><X size={16} color={BrandColors.textMuted} /></TouchableOpacity> : null}
      {loading ? <ConversationSkeleton/>
        : error ? <View style={styles.state}><Text style={styles.emptyTitle}>Không thể tải tin nhắn</Text><Text style={styles.emptyBody}>Vui lòng thử lại.</Text><TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); void fetchRooms(); }}><Text style={styles.retryText}>Thử lại</Text></TouchableOpacity></View>
        : visibleRooms.length ? <FlatList style={styles.conversationList} data={visibleRooms} keyExtractor={item => item.chatRoomId} renderItem={renderRoom} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void fetchRooms(true)} tintColor={BrandColors.accentPink}/>} contentContainerStyle={styles.list}/>
        : <View style={styles.empty}>
            <View style={styles.emptyArt}><View style={styles.backBubble}/><View style={styles.frontBubble}><View style={styles.dot}/><View style={styles.dot}/><View style={styles.dot}/></View></View>
            <Text style={styles.emptyTitle}>{query ? 'Không tìm thấy cuộc trò chuyện' : unreadOnly ? 'Không có tin nhắn chưa đọc' : 'Chưa có tin nhắn nào'}</Text>
            <Text style={styles.emptyBody}>{query ? `Không có kết quả cho “${query.trim()}”.` : viewer === 'customer' ? 'Hãy bắt đầu trò chuyện với Makeup Artist để được tư vấn và đặt lịch nhé!' : 'Các cuộc trò chuyện với khách hàng sẽ xuất hiện tại đây.'}</Text>
            {viewer === 'customer' && !query && !unreadOnly ? <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(tabs)/explore')}><Text style={styles.exploreText}>Khám phá MUA ngay</Text><ChevronRight size={20} color="#FFF"/></TouchableOpacity> : null}
          </View>}
      <ActionSheet visible={menuVisible} title="Tùy chọn tin nhắn" onClose={()=>setMenuVisible(false)} actions={[{id:'action-0',label:"Đánh dấu tất cả đã đọc",icon:CheckCheck,destructive:false,onPress:async()=>{setMenuVisible(false);try{await Promise.all(rooms.filter(room=>room.unreadCount>0).map(room=>chatService.markRead(room.chatRoomId)));void fetchRooms();}catch{appDialog.alert('Không thể cập nhật','Vui lòng thử lại.');}}},{id:'action-1',label:unreadOnly?'Hiển thị mọi cuộc trò chuyện':'Tin nhắn chưa đọc',icon:Mail,destructive:false,onPress:()=>{setUnreadOnly(value=>!value);setMenuVisible(false);}}]} />
    </View>
  </SafeAreaView>;
}

function ConversationAvatar({ name, uri }: { name: string; uri?: string }) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  return <View style={styles.avatarWrap}>
    {uri && uri !== failedUri ? <Image accessibilityLabel={'Ảnh đại diện của ' + name} source={{ uri }} style={styles.avatar} contentFit="cover" onError={() => setFailedUri(uri)} /> : <View style={styles.avatarFallback}><Text style={styles.avatarLetter}>{Array.from(name)[0]?.toUpperCase()}</Text></View>}
  </View>;
}

function ConversationSkeleton(){return <View style={styles.skeletonList}>{[0,1,2,3,4].map(index=><View key={index} style={styles.skeletonRow}><View style={styles.skeletonAvatar}/><View style={styles.skeletonCopy}><View style={[styles.skeletonLine,{width:index%2?'54%':'68%'}]}/><View style={[styles.skeletonLine,styles.skeletonMessage,{width:index%2?'78%':'62%'}]}/></View></View>)}</View>}

const styles = StyleSheet.create({
safe:{flex:1,backgroundColor:BrandColors.bgCard},
page:{flex:1,width:'100%',maxWidth:640,alignSelf:'center',backgroundColor:BrandColors.bgCard},
header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:Spacing.base,paddingTop:10,paddingBottom:10},
headingCopy:{flex:1,minWidth:0},
title:{fontFamily:Typography.bold,fontSize:26,lineHeight:34,color:BrandColors.textDark},
subtitle:{fontFamily:Typography.regular,fontSize:12,lineHeight:18,color:BrandColors.textMuted},
headerActions:{flexDirection:'row',gap:8},
circleButton:{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:'#FFF1F5'},
searchBar:{height:44,marginHorizontal:Spacing.base,marginBottom:8,paddingHorizontal:14,borderRadius:Radius.full,backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.borderLight,flexDirection:'row',alignItems:'center',gap:9},
searchInput:{flex:1,fontFamily:Typography.regular,fontSize:15,color:BrandColors.textDark,outlineStyle:'none' } as any,
conversationList:{flex:1},
clearSearch:{width:36,height:40,alignItems:'center',justifyContent:'center'},
unreadNotice:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,minHeight:36},
list:{paddingBottom:135},
room:{minHeight:76,paddingHorizontal:16,paddingVertical:12,flexDirection:'row',alignItems:'center',borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:BrandColors.borderDivider},
unreadRoom:{backgroundColor:'#FFF0F4'},
lastRoom:{marginBottom:8},
avatarWrap:{width:48,height:48,marginRight:12},
avatar:{width:48,height:48,borderRadius:24},
avatarFallback:{width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center',backgroundColor:'#F8BDD0'},
avatarLetter:{fontFamily:Typography.black,fontSize:21,color:BrandColors.accentRose},
roomCopy:{flex:1,minWidth:0},
roomTopLine:{flexDirection:'row',alignItems:'center',gap:8},
roomBottomLine:{flexDirection:'row',alignItems:'center',gap:8,marginTop:4},
roomName:{flex:1,minWidth:0,fontFamily:Typography.semiBold,fontSize:15,lineHeight:20,color:BrandColors.textDark},
bold:{fontFamily:Typography.extraBold},
preview:{flex:1,minWidth:0,fontFamily:Typography.regular,fontSize:13,lineHeight:19,color:BrandColors.textMuted},
unreadPreview:{fontFamily:Typography.semiBold,color:BrandColors.textBody},
time:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textMuted},
badge:{minWidth:20,height:20,borderRadius:10,paddingHorizontal:6,backgroundColor:BrandColors.accentPink,alignItems:'center',justifyContent:'center'},
badgeText:{fontFamily:Typography.bold,fontSize:11,color:'#FFF'},
empty:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:32,paddingBottom:120},
state:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:32,paddingBottom:100},
emptyArt:{width:142,height:116,alignItems:'center',justifyContent:'center',marginBottom:22},
backBubble:{position:'absolute',right:11,bottom:10,width:68,height:55,borderRadius:25,backgroundColor:'#FFE0E9'},
frontBubble:{width:91,height:69,borderRadius:34,backgroundColor:'#F889AD',flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center'},
dot:{width:11,height:11,borderRadius:6,backgroundColor:'#FFF'},
emptyTitle:{fontFamily:Typography.black,fontSize:22,color:BrandColors.textDark,textAlign:'center'},
emptyBody:{fontFamily:Typography.regular,fontSize:15,lineHeight:23,color:BrandColors.textMuted,textAlign:'center',maxWidth:380,marginTop:9},
exploreButton:{height:54,minWidth:255,paddingHorizontal:28,borderRadius:Radius.full,marginTop:26,backgroundColor:BrandColors.accentPink,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,...Shadows.soft},
exploreText:{fontFamily:Typography.bold,fontSize:16,color:'#FFF'},
retryButton:{height:44,paddingHorizontal:24,borderRadius:22,backgroundColor:BrandColors.accentPink,justifyContent:'center',marginTop:20},
retryText:{fontFamily:Typography.bold,color:'#FFF'},
skeletonList:{paddingHorizontal:24},
skeletonRow:{height:80,flexDirection:'row',alignItems:'center'},
skeletonAvatar:{width:48,height:48,borderRadius:24,backgroundColor:'#F4E7EC'},
skeletonCopy:{flex:1,marginLeft:14},
skeletonLine:{height:13,borderRadius:7,backgroundColor:'#F0E3E9'},
skeletonMessage:{height:11,marginTop:11,opacity:.7}
});
