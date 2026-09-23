import React, { useRef, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, Dimensions, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Edit2, Trash2 } from 'lucide-react-native';
import { PortfolioPost } from '../../components/mua/portfolio/PortfolioPost';
import { PortfolioFormModal } from '../../components/mua/portfolio/PortfolioFormModal';
import { useMuaPortfolio } from '../../hooks/useMuaPortfolio';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { getApiError } from '../../services/api';
import { PortfolioCommentsSheet } from '../../components/feed/PortfolioCommentsSheet';

export default function PortfolioFeedScreen() {
  const router = useRouter();
  const { initialIndex, portfolioId } = useLocalSearchParams();
  const { data: portfolio, deleteItem, updateItem, isDeleting, toggleLike, toggleSave } = useMuaPortfolio('me');
  const flatListRef = useRef<FlatList>(null);

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [commentItem, setCommentItem] = useState<any>(null);

  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if ((initialIndex !== undefined || portfolioId !== undefined) && portfolio && portfolio.length > 0 && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      const matchedIndex = portfolioId
        ? portfolio.findIndex(item => String(item.id || item.portfolioId) === String(portfolioId))
        : -1;
      const targetIndex = matchedIndex >= 0 ? matchedIndex : Number(initialIndex ?? 0);
      if (targetIndex >= 0 && targetIndex < portfolio.length) {
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({
              index: targetIndex,
              animated: false,
            });
          } catch (err) {
            console.log('Scroll error:', err);
          }
        }, 100);
      }
    }
  }, [initialIndex, portfolio, portfolioId]);

  const handleLike = async (item: any) => {
    try {
      await toggleLike(item.id || item.portfolioId);
    } catch (e) {
      console.log('Like failed', e);
    }
  };

  const handleSave = async (item: any) => {
    try {
      await toggleSave(item.id || item.portfolioId);
    } catch (e) {
      console.log('Save failed', e);
    }
  };

  const openOptions = (item: any) => {
    setSelectedPost(item);
    setOptionsVisible(true);
  };

  const handleEdit = () => {
    setOptionsVisible(false);
    setEditModalVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedPost || isDeleting) return;
    try {
      await deleteItem(selectedPost.id || selectedPost.portfolioId);
      setDeleteVisible(false);
      setSelectedPost(null);
    } catch (error) {
      Alert.alert('Không thể xóa', getApiError(error).message);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <PortfolioPost
      item={item}
      onLike={() => handleLike(item)}
      onSave={() => handleSave(item)}
      onComment={() => setCommentItem(item)}
      onOptions={() => openOptions(item)}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(mua)/profile')} style={styles.backButton}>
          <ChevronLeft size={28} color="#22152B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài viết</Text>
        <View style={{ width: 28 }} />
      </View>
      
      <FlatList
        ref={flatListRef}
        data={portfolio || []}
        keyExtractor={(item: any, index: number) => item.id || item.portfolioId || index.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        getItemLayout={(data, index) => (
          { length: Dimensions.get('window').width + 200, offset: (Dimensions.get('window').width + 200) * index, index }
        )}
      />

      <Modal visible={optionsVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOptionsVisible(false)}>
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionBtn} onPress={handleEdit}>
              <Edit2 size={24} color="#22152B" />
              <Text style={styles.optionText}>Chỉnh sửa bài viết</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.optionBtn, styles.deleteBtn]} onPress={() => { setOptionsVisible(false); setDeleteVisible(true); }}>
              <Trash2 size={24} color="#E8436A" />
              <Text style={[styles.optionText, { color: '#E8436A' }]}>Xóa bài viết</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <PortfolioFormModal 
        visible={editModalVisible}
        onClose={() => { setEditModalVisible(false); setSelectedPost(null); }}
        initialData={selectedPost}
        onSubmit={async data => {
          if (!selectedPost) return;
          await updateItem({ id: selectedPost.id || selectedPost.portfolioId, updates: data });
        }}
      />
      <ConfirmDialog
        visible={deleteVisible}
        title="Xóa bài viết"
        message="Bạn có chắc chắn muốn xóa bài viết này? Thao tác này không thể hoàn tác."
        confirmLabel="Xóa"
        destructive
        loading={isDeleting}
        onCancel={() => { setDeleteVisible(false); setSelectedPost(null); }}
        onConfirm={handleDelete}
      />
      <PortfolioCommentsSheet item={commentItem} onClose={() => setCommentItem(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22152B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  deleteBtn: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22152B',
    marginLeft: 15,
  },
});


