import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { SvgXml } from 'react-native-svg';
import { Copy, QrCode, Share2 } from 'lucide-react-native';
import { AppBottomSheet } from '../ui/AppBottomSheet';
import { BrandColors } from '../../constants/theme';
import { profileSharingService } from '../../services/profileSharingService';
import { getApiError } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

export function ProfileShareSheet({ visible, muaId, postId, onClose }: { visible: boolean; muaId?: string; postId?: string; onClose: () => void }) {
  const post = !!postId;
  const id = postId || muaId;
  const label = post ? 'bài viết' : 'hồ sơ';
  const viewer = useAuthStore(s => s.user?.id);
  const query = useQuery({ queryKey: [post ? 'post-share' : 'profile-share', viewer ?? 'guest', id], queryFn: ({ signal }) => post ? profileSharingService.getPost(id!, signal) : profileSharingService.get(id!, signal),
    enabled: visible && !!id, staleTime: 0, retry: false });
  const [showQr, setShowQr] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const data = query.data;
  const ready = !!data && !query.isFetching && !query.isError;
  const run = async (operation: 'share' | 'copy') => {
    if (!ready || lock.current) return;
    lock.current = true; setBusy(true); setNotice('');
    try {
      if (operation === 'copy') { if (!await Clipboard.setStringAsync(data.url)) throw new Error('Chưa thể sao chép liên kết.'); setNotice('Đã sao chép liên kết'); }
      else await Share.share({ message: `Xem ${post ? 'bài viết' : 'hồ sơ makeup'} của ${data.name} trên BBook: ${data.url}` }, { dialogTitle: `Chia sẻ ${label}` });
    } catch { setNotice(operation === 'copy' ? 'Chưa thể sao chép. Vui lòng thử lại.' : 'Chưa thể mở chia sẻ. Bạn có thể sao chép liên kết.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const errorStatus = query.error ? getApiError(query.error).status : undefined;
  return <AppBottomSheet visible={visible} title={`Chia sẻ ${label}`} onClose={onClose} loading={busy} onShow={() => { setNotice(''); setShowQr(false); }}>
    <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
    {query.isFetching ? <View style={styles.loading}><ActivityIndicator color={BrandColors.accentPink} /><Text>Đang chuẩn bị {label}…</Text></View> : query.isError || !data ? <View style={styles.loading}><Text style={styles.hint}>{errorStatus === 404 ? `${post ? 'Bài viết' : 'Hồ sơ'} chưa công khai hoặc chưa sẵn sàng để chia sẻ.` : 'Chưa tải được liên kết chia sẻ. Vui lòng thử lại.'}</Text><TouchableOpacity accessibilityRole="button" onPress={() => { void query.refetch(); }} style={styles.action}><Text>Thử lại</Text></TouchableOpacity></View> : <>
      <View style={styles.preview}>{data.avatarUrl ? <Image source={{ uri: data.avatarUrl }} style={styles.avatar} /> : <View style={[styles.avatar, styles.placeholder]}><Text>B</Text></View>}<View style={{ flex: 1 }}><Text style={styles.name}>{data.name}</Text><Text style={styles.hint}>{data.city || 'Nghệ sĩ trang điểm'} · BBook</Text></View></View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Chia sẻ liên kết ${label}`} disabled={!ready || busy} onPress={() => { void run('share'); }} style={styles.action}><Share2 size={21} color={BrandColors.accentPink} /><Text>Chia sẻ…</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" disabled={!ready || busy} onPress={() => { void run('copy'); }} style={styles.action}><Copy size={21} color={BrandColors.accentPink} /><Text>Sao chép liên kết</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" disabled={!ready || busy} onPress={() => setShowQr(!showQr)} style={styles.action}><QrCode size={21} color={BrandColors.accentPink} /><Text>{showQr ? 'Thu gọn mã QR' : `Mã QR ${label}`}</Text></TouchableOpacity>
      {showQr && <View style={styles.qr} accessibilityLabel={`Mã QR mở ${label} BBook`}><SvgXml xml={data.qrSvg} width={220} height={220} /><Text style={styles.hint}>Quét mã để xem {label}</Text></View>}
      {notice ? <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text> : null}
    </>}
    </ScrollView>
  </AppBottomSheet>;
}
export function PostShareSheet(props: { visible: boolean; postId?: string; onClose: () => void }) {
  return <ProfileShareSheet {...props} />;
}
const styles = StyleSheet.create({
  loading: { padding: 24, alignItems: 'center', gap: 12 }, preview: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 18 },
  avatar: { width: 60, height: 60, borderRadius: 30 }, placeholder: { backgroundColor: '#FFE4EE', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '700', color: BrandColors.textDark }, hint: { fontSize: 13, color: BrandColors.textMuted, lineHeight: 20 },
  action: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F0DCE5', borderRadius: 14 },
  notice: { color: BrandColors.accentRose, padding: 12, textAlign: 'center' }, qr: { alignItems: 'center', padding: 12, backgroundColor: '#FFF', borderRadius: 16 },
});
