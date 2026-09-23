import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Send, X } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { BrandColors } from '../../constants/theme';
import { portfolioService } from '../../services/portfolioService';
import type { PortfolioCommentDto, PortfolioItemDto } from '../../types/portfolio';

type Props = {
  item: PortfolioItemDto | null;
  onClose: () => void;
};

const getPostId = (item: PortfolioItemDto) => String(item.id || item.portfolioId || '');

export function PortfolioCommentsSheet({ item, onClose }: Props) {
  const queryClient = useQueryClient();
  const [comments, setComments] = useState<PortfolioCommentDto[]>([]);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<PortfolioCommentDto | null>(null);
  const [loadedPostId, setLoadedPostId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!item) return;
    const currentPostId = getPostId(item);
    portfolioService.getComments(currentPostId)
      .then(data => {
        if (mounted) {
          setComments(data);
          setLoadedPostId(currentPostId);
        }
      })
      .catch(() => {
        if (mounted) {
          setComments([]);
          setLoadedPostId(currentPostId);
          Alert.alert('Không thể tải bình luận', 'Vui lòng kiểm tra kết nối và thử lại.');
        }
      });
    return () => {
      mounted = false;
    };
  }, [item]);

  const loading = Boolean(item) && loadedPostId !== getPostId(item!);

  const close = () => {
    setText('');
    setReplyingTo(null);
    onClose();
  };

  const sendComment = async () => {
    if (!item || !text.trim() || sending) return;
    setSending(true);
    try {
      if (replyingTo) {
        const reply = await portfolioService.replyToComment(getPostId(item), replyingTo.id, text.trim());
        setComments(current => current.map(comment => comment.id === replyingTo.id
          ? { ...comment, replies: [...(comment.replies || []), reply] }
          : comment));
      } else {
        const comment = await portfolioService.addComment(getPostId(item), text.trim());
        setComments(current => [comment, ...current]);
      }
      setText('');
      setReplyingTo(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({ queryKey: ['mua-portfolio'] }),
      ]);
    } catch {
      Alert.alert('Không thể gửi bình luận', 'Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={Boolean(item)} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Bình luận</Text>
            <TouchableOpacity onPress={close} hitSlop={10}><X size={24} color={BrandColors.textDark} /></TouchableOpacity>
          </View>
          {loading ? <ActivityIndicator style={styles.loader} color={BrandColors.accentPink} /> : (
            <FlatList
              data={comments}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(comment, index) => String(comment.id || index)}
              renderItem={({ item: comment }) => (
                <View style={styles.row}>
                  <View style={styles.avatar}><Text>{(comment.userName || 'U')[0]}</Text></View>
                  <View style={styles.bubble}>
                    <Text style={styles.user}>{comment.userName || 'Người dùng'}</Text>
                    <Text style={styles.content}>{comment.content}</Text>
                    <TouchableOpacity onPress={() => setReplyingTo(comment)}><Text style={styles.replyAction}>Trả lời</Text></TouchableOpacity>
                    {(comment.replies || []).map(reply => (
                      <View key={reply.id} style={styles.reply}>
                        <Text style={styles.user}>{reply.userName || 'Người dùng'}</Text>
                        <Text style={styles.content}>{reply.content}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.empty}>Chưa có bình luận.</Text>}
            />
          )}
          {replyingTo ? (
            <View style={styles.replyingBanner}>
              <Text style={styles.replyingText}>Đang trả lời {replyingTo.userName || 'người dùng'}</Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}><X size={16} /></TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Viết bình luận..."
              multiline
              maxLength={1000}
              style={styles.input}
            />
            <TouchableOpacity onPress={sendComment} disabled={sending || !text.trim()} style={styles.sendButton}>
              {sending ? <ActivityIndicator color={BrandColors.accentPink} /> : <Send size={22} color={text.trim() ? BrandColors.accentPink : BrandColors.textLight} />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  dismissArea: { flex: 1 },
  sheet: { height: '72%', backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  title: { fontSize: 18, fontWeight: '800', color: BrandColors.textDark },
  loader: { marginTop: 40 },
  row: { flexDirection: 'row', marginTop: 14, gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFE5ED', alignItems: 'center', justifyContent: 'center' },
  bubble: { flex: 1, backgroundColor: '#F7F7F8', borderRadius: 14, padding: 10 },
  user: { fontWeight: '700', color: BrandColors.textDark, marginBottom: 2 },
  content: { color: BrandColors.textDark, lineHeight: 20 },
  replyAction: { color: BrandColors.accentPink, fontWeight: '700', fontSize: 12, marginTop: 6 },
  reply: { marginTop: 8, marginLeft: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#FFD4E1' },
  empty: { textAlign: 'center', color: BrandColors.textMuted, marginTop: 36 },
  replyingBanner: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF2F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginTop: 8 },
  replyingText: { color: '#6C5360', fontSize: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EEE', borderRadius: 22, paddingHorizontal: 14, marginTop: 10 },
  input: { flex: 1, minHeight: 44, maxHeight: 96, paddingVertical: 10 },
  sendButton: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
});
