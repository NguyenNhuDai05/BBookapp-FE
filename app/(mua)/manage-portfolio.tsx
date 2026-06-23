import React, { useRef, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, Dimensions, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Edit2, Trash2, EyeOff, Eye, Pin } from 'lucide-react-native';
import { PortfolioPost } from '../../components/mua/portfolio/PortfolioPost';
import { PortfolioFormModal } from '../../components/mua/portfolio/PortfolioFormModal';
import { useMuaPortfolio } from '../../hooks/useMuaPortfolio';
import { api } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';

const { height } = Dimensions.get('window');

export default function PortfolioFeedScreen() {
  const router = useRouter();
  const { initialIndex } = useLocalSearchParams();
  const { data: portfolio } = useMuaPortfolio('me');
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (initialIndex !== undefined && portfolio && portfolio.length > 0 && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      const targetIndex = Number(initialIndex);
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
  }, [initialIndex, portfolio]);

  const handleLike = async (item: any) => {
    try {
      await api.post('/mua/portfolio/' + (item.id || item.portfolioId) + '/like');
      queryClient.invalidateQueries({ queryKey: ['mua-portfolio', 'me'] });
    } catch (e) {
      console.log('Like failed', e);
    }
  };

  const handleSave = async (item: any) => {
    try {
      await api.post('/mua/portfolio/' + (item.id || item.portfolioId) + '/save');
      queryClient.invalidateQueries({ queryKey: ['mua-portfolio', 'me'] });
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

  const handleDelete = () => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa bài viết này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            await api.delete('/mua/portfolio/' + (selectedPost.id || selectedPost.portfolioId));
            queryClient.invalidateQueries({ queryKey: ['mua-portfolio', 'me'] });
            setOptionsVisible(false);
          } catch (e) { console.log('Delete failed', e); }
      }}
    ]);
  };

  const handleToggleVisibility = async () => {
    try {
      await api.put('/mua/portfolio/' + (selectedPost.id || selectedPost.portfolioId) + '/visibility');
      queryClient.invalidateQueries({ queryKey: ['mua-portfolio', 'me'] });
      setOptionsVisible(false);
    } catch (e) { console.log('Visibility failed', e); }
  };

  const handleTogglePin = async () => {
    try {
      await api.put('/mua/portfolio/' + (selectedPost.id || selectedPost.portfolioId) + '/pin');
      queryClient.invalidateQueries({ queryKey: ['mua-portfolio', 'me'] });
      setOptionsVisible(false);
    } catch (e) { console.log('Pin failed', e); }
  };

  const renderItem = ({ item }: { item: any }) => (
    <PortfolioPost
      item={item}
      onLike={() => handleLike(item)}
      onSave={() => handleSave(item)}
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
            
            <TouchableOpacity style={styles.optionBtn} onPress={handleTogglePin}>
              <Pin size={24} color="#22152B" />
              <Text style={styles.optionText}>{selectedPost?.isPinned ? 'Bỏ ghim bài viết' : 'Ghim bài viết lên đầu'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionBtn} onPress={handleToggleVisibility}>
              {selectedPost?.isHidden ? <Eye size={24} color="#22152B" /> : <EyeOff size={24} color="#22152B" />}
              <Text style={styles.optionText}>{selectedPost?.isHidden ? 'Hiện bài viết' : 'Ẩn bài viết (Chỉ mình tôi)'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.optionBtn, styles.deleteBtn]} onPress={handleDelete}>
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
        onSubmit={() => { setEditModalVisible(false); setSelectedPost(null); queryClient.invalidateQueries({ queryKey: ['mua-portfolio', 'me'] }); }}
      />
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


