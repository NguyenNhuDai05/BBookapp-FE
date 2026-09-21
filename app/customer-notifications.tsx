import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Bell, CalendarDays, CheckCheck, ChevronLeft, CircleDollarSign, MessageCircle, Sparkles } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Radius, Shadows, Spacing } from '../constants/theme';
import { InboxNotification, NotificationService } from '../services/NotificationService';

const notificationIcon = (type: string) => {
  const props = { size: 22, color: BrandColors.accentPink };
  if (type.includes('REMINDER') || type.includes('BOOKING')) return <CalendarDays {...props} />;
  if (type.includes('CHAT')) return <MessageCircle {...props} />;
  if (type.includes('PAYMENT') || type.includes('REFUND')) return <CircleDollarSign {...props} />;
  return <Sparkles {...props} />;
};

const relativeTime = (value: string) => {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
};

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const inbox = useQuery({
    queryKey: ['notifications', 'inbox'],
    queryFn: () => NotificationService.getInbox(50),
  });
  const markRead = useMutation({
    mutationFn: NotificationService.markRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
  const markAllRead = useMutation({
    mutationFn: NotificationService.markAllRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const openNotification = async (item: InboxNotification) => {
    if (!item.readAt) await markRead.mutateAsync(item.id);
    if (item.url?.startsWith('/')) router.push(item.url as never);
  };

  const hasUnread = inbox.data?.some(item => !item.readAt) ?? false;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Quay lại">
            <ChevronLeft size={25} color={BrandColors.textDark} />
          </TouchableOpacity>
          <View style={styles.headingWrap}>
            <Text style={styles.title}>Thông báo</Text>
            <Text style={styles.subtitle}>Cập nhật mới nhất dành cho bạn</Text>
          </View>
          <TouchableOpacity
            style={[styles.readAllButton, !hasUnread && styles.readAllDisabled]}
            onPress={() => markAllRead.mutate()}
            disabled={!hasUnread || markAllRead.isPending}
            accessibilityLabel="Đánh dấu tất cả đã đọc"
          >
            <CheckCheck size={21} color={hasUnread ? BrandColors.accentPink : BrandColors.textLight} />
          </TouchableOpacity>
        </View>

        {inbox.isLoading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={BrandColors.accentPink} /></View>
        ) : inbox.isError ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Không thể tải thông báo</Text>
            <TouchableOpacity onPress={() => inbox.refetch()}><Text style={styles.retry}>Thử lại</Text></TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={inbox.data ?? []}
            keyExtractor={item => item.id}
            refreshControl={<RefreshControl refreshing={inbox.isRefetching} onRefresh={inbox.refetch} tintColor={BrandColors.accentPink} />}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, !item.readAt && styles.unreadCard]}
                onPress={() => void openNotification(item)}
                activeOpacity={0.75}
              >
                <View style={[styles.iconCircle, !item.readAt && styles.unreadIcon]}>{notificationIcon(item.type)}</View>
                <View style={styles.cardContent}>
                  <View style={styles.cardTitleRow}>
                    <Text style={[styles.cardTitle, !item.readAt && styles.unreadTitle]} numberOfLines={2}>{item.title}</Text>
                    {!item.readAt ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <Text style={styles.body} numberOfLines={3}>{item.body}</Text>
                  <Text style={styles.time}>{relativeTime(item.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={(
              <View style={styles.empty}>
                <View style={styles.emptyBell}><Bell size={34} color={BrandColors.accentPink} /></View>
                <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
                <Text style={styles.emptyBody}>Các cập nhật về booking, tin nhắn và thanh toán sẽ xuất hiện tại đây.</Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BrandColors.bgPrimary },
  screen: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: BrandColors.borderDivider },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.bgPink },
  headingWrap: { flex: 1, marginHorizontal: 12 },
  title: { fontSize: 23, fontWeight: '900', color: BrandColors.textDark },
  subtitle: { marginTop: 2, color: BrandColors.textMuted, fontSize: 12 },
  readAllButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.bgPink },
  readAllDisabled: { backgroundColor: '#F7F3F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  list: { padding: Spacing.base, paddingBottom: 36, flexGrow: 1 },
  card: { flexDirection: 'row', padding: 14, marginBottom: 10, borderRadius: Radius.lg, backgroundColor: '#FFF', borderWidth: 1, borderColor: BrandColors.borderLight, ...Shadows.sm },
  unreadCard: { backgroundColor: '#FFF7FA', borderColor: '#F7B7CB' },
  iconCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F3F5', marginRight: 12 },
  unreadIcon: { backgroundColor: '#FFE3EC' },
  cardContent: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTitle: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '700', color: BrandColors.textDark },
  unreadTitle: { fontWeight: '900' },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: BrandColors.accentPink, marginLeft: 8, marginTop: 5 },
  body: { color: BrandColors.textBody, fontSize: 13, lineHeight: 19, marginTop: 4 },
  time: { color: BrandColors.accentPink, fontSize: 11, fontWeight: '700', marginTop: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, paddingBottom: 60 },
  emptyBell: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.bgPink, marginBottom: 18 },
  emptyTitle: { color: BrandColors.textDark, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: BrandColors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 7 },
  retry: { color: BrandColors.accentPink, fontWeight: '800', marginTop: 12 },
});
