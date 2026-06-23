import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, View, Text, TouchableOpacity, Dimensions, Image, Modal, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2, ChevronDown, Bell, MoreHorizontal } from 'lucide-react-native';
import { ErrorView } from '../components/ui/ErrorView';
import { useMuaDetail } from '../hooks/useMuaDetail';
import { BrandColors } from '../constants/theme';
import { useBookingStore } from '../store/useBookingStore';
import type { ServiceDto } from '../types/ServiceDto';
import BookingCartFloatingBar from '../components/BookingCartFloatingBar';
import BookingCartBottomSheet from '../components/BookingCartBottomSheet';
import ServiceDetailModal from '../components/ServiceDetailModal';
import ReviewTabContent from '../components/mua/ReviewTabContent';
import { chatService } from '../services/chatService';

const { width } = Dimensions.get('window');

export default function MuaDetailScreen() {
  const router = useRouter();
  const { id, tab } = useLocalSearchParams<{ id: string, tab?: string }>();
  const {
    muaInfo,
    portfolio,
    services,
    reviews,
    loading,
    error,
    refetch,
  } = useMuaDetail(id);

  const [activeTab, setActiveTab] = useState(tab || 'Portfolio');
  const [isLiked, setIsLiked] = useState(false);
  const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [selectedServiceForDetail, setSelectedServiceForDetail] = useState<ServiceDto | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const onRefresh = async () => {
    setRefreshing(true);
    refetch(); // Trigger refetch
    // Artificial delay for UX
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  
  const { draft, resetDraft, setMua, addService, lastViewedPortfolioId } = useBookingStore();

  const handleBookService = (service: ServiceDto) => {
    if (!muaInfo) return;
    
    // If the cart already has services from a different MUA, reset it
    if (draft.mua && draft.mua.id !== muaInfo.id) {
      resetDraft();
    }
    
    if (!draft.mua || draft.mua.id !== muaInfo.id) {
      setMua({
        id: muaInfo.id,
        name: muaInfo.name,
        avatarUrl: muaInfo.avatar || '',
        rating: muaInfo.rating,
        reviewCount: muaInfo.reviewCount || 0,
        location: muaInfo.city,
        yearsOfExp: muaInfo.yearsExperience || 1,
      });
    }
    
    const firstPortfolioImage = portfolio?.[0]?.imageUrl || portfolio?.[0]?.image || 'https://images.unsplash.com/photo-1512496015851-a1c8ce9015c3?w=200&q=80';
    
    addService({
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price || 0,
      participantsCount: 1,
      imageUrl: service.imageUrl || firstPortfolioImage,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.accentPink} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !muaInfo) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error || 'Không tìm thấy chuyên gia'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const displayAvatar = muaInfo.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop';
  const displayName = muaInfo.name || 'Chuyên gia';
  const displayBio = muaInfo.bio || 'Chưa có thông tin giới thiệu';

  const numColumns = 3;
  const gridGap = 2;
  const itemSize = Math.floor((width - (numColumns - 1) * gridGap) / numColumns);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10, bottom:10, left:10, right:10}}>
          <ArrowLeft size={24} color={BrandColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{displayName}</Text>
        <TouchableOpacity hitSlop={{top:10, bottom:10, left:10, right:10}}>
          <MoreHorizontal size={24} color={BrandColors.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[BrandColors.accentPink]} 
            tintColor={BrandColors.accentPink}
          />
        }
      >
        {/* Instagram-like Profile Header */}
        <View style={styles.igHeaderContainer}>
          <View style={styles.igProfileRow}>
            <View style={styles.igAvatarContainer}>
              <View style={styles.igAvatarRing}>
                <Image source={{ uri: displayAvatar }} style={styles.igAvatar} />
              </View>
            </View>
            <View style={styles.igStatsContainer}>
              <View style={styles.igStatItem}>
                <Text style={styles.igStatValue}>{portfolio?.length || 0}</Text>
                <Text style={styles.igStatLabel}>tác phẩm</Text>
              </View>
              <View style={styles.igStatItem}>
                <Text style={styles.igStatValue}>{muaInfo.reviewCount || 0}</Text>
                <Text style={styles.igStatLabel}>bookings</Text>
              </View>
              <View style={styles.igStatItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.igStatValue}>{muaInfo.rating?.toFixed(1) || '0.0'}</Text>
                  <Text style={{ fontSize: 12, color: '#777', marginLeft: 2 }}>({reviews?.length || 0})</Text>
                </View>
                <Text style={styles.igStatLabel}>đánh giá</Text>
              </View>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.igBioContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Text style={[styles.igName, { marginBottom: 0 }]}>{displayName}</Text>
              <CheckCircle2 size={14} color="#1DA1F2" style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.igBioCategory}>Nghệ sĩ trang điểm</Text>
            <Text style={styles.igBioText}>{displayBio}</Text>
          </View>

          {/* Action Buttons for Customer */}
          <View style={styles.igActionRow}>
            <TouchableOpacity 
              style={styles.igPrimaryBtn}
              onPress={() => setActiveTab('Dịch vụ')}
            >
              <Text style={styles.igPrimaryBtnText}>Đặt lịch ngay</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.igSecondaryBtn} 
              onPress={async () => {
                if (!muaInfo) return;
                try {
                  const room = await chatService.getOrCreateRoomWithMua(muaInfo.id);
                  router.push(`/chat/${room.chatRoomId}`);
                } catch (error) {
                  console.error("Error creating chat room", error);
                }
              }}
            >
              <Text style={styles.igSecondaryBtnText}>Nhắn tin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContainer}
        >
          {['Portfolio', 'Dịch vụ', 'Đánh giá', 'Thông tin'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Conditional Sections based on Tab */}
        {activeTab === 'Portfolio' && (
          <View style={styles.section}>
            {(!portfolio || portfolio.length === 0) ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có tác phẩm nào.</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -20 }}>
                {portfolio.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.9}
                    onPress={() => {
                      router.push({
                        pathname: '/portfolio-feed',
                        params: { initialIndex: index, muaId: muaInfo?.id }
                      });
                    }}
                    style={{
                      width: itemSize,
                      height: itemSize,
                      marginBottom: gridGap,
                      marginRight: (index + 1) % numColumns === 0 ? 0 : gridGap,
                      backgroundColor: BrandColors.borderLight,
                      position: 'relative',
                    }}
                  >
                    <Image source={{ uri: (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : (item.imageUrl || item.url) }} style={{ width: '100%', height: '100%' }} />
                    {(item.imageUrls && item.imageUrls.length > 1) && (
                      <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>1/{item.imageUrls.length}</Text>
                      </View>
                    )}
                    {lastViewedPortfolioId === item.id && (
                      <View style={{
                        ...StyleSheet.absoluteFillObject,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Vừa xem</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'Dịch vụ' && (
          <View style={styles.section}>
            {(!services || services.length === 0) ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có dịch vụ nào.</Text>
              </View>
            ) : (
              services.map((svc) => (
                <View 
                  key={svc.id || svc.serviceId} 
                  style={styles.serviceCard}
                >
                  <TouchableOpacity 
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} 
                    onPress={() => setSelectedServiceForDetail(svc)}
                  >
                    <View style={styles.serviceImageContainer}>
                      {svc.imageUrl ? (
                        <Image source={{ uri: svc.imageUrl }} style={styles.serviceImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.serviceImagePlaceholder}>
                          <CheckCircle2 size={24} color="#CCC" />
                        </View>
                      )}
                    </View>

                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{svc.name || svc.serviceName}</Text>
                      {svc.description ? <Text style={styles.serviceDesc} numberOfLines={2}>{svc.description}</Text> : null}
                      <Text style={styles.serviceDuration}>{"\u23F3"} {svc.durationMinutes} {"phút"}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.serviceAction}>
                    <TouchableOpacity
                      onPress={() => handleBookService(svc)}
                      style={{ backgroundColor: BrandColors.accentPink, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 }}
                    >
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>Chọn</Text>
                    </TouchableOpacity>
                    <Text style={styles.servicePrice}>{(svc.price || 0).toLocaleString('vi-VN')}đ</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'Đánh giá' && (
          <View>
            <ReviewTabContent reviews={reviews} isLoading={loading} />
          </View>
        )}

        {activeTab === 'Thông tin' && (
          <View style={styles.section}>
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Địa chỉ: {muaInfo.city || 'Chưa cập nhật'}</Text>
              <Text style={styles.emptyText}>Kinh nghiệm: {muaInfo.yearsExperience || 0} năm</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Cart Integration */}
      <BookingCartFloatingBar 
        onPressCart={() => setBottomSheetVisible(true)} 
        onPressCheckout={() => router.push('/checkout')}
      />

      {/* Booking Cart Bottom Sheet */}
      <Modal
        visible={isBottomSheetVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBottomSheetVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => setBottomSheetVisible(false)}
          />
          <BookingCartBottomSheet onClose={() => setBottomSheetVisible(false)} />
        </View>
      </Modal>

      {/* Service Detail Modal */}
      <ServiceDetailModal 
        visible={!!selectedServiceForDetail} 
        onClose={() => setSelectedServiceForDetail(null)} 
        service={selectedServiceForDetail} 
        mua={muaInfo as any} 
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FAFAFA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.textDark,
  },
  igHeaderContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  igProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  igAvatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  igAvatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: BrandColors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  igAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  igStatsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  igStatItem: {
    alignItems: 'center',
  },
  igStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.textDark,
  },
  igStatLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  igBioContainer: {
    marginBottom: 16,
  },
  igName: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.textDark,
  },
  igBioCategory: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  igBioText: {
    fontSize: 14,
    color: BrandColors.textDark,
    lineHeight: 20,
  },
  igBioLink: {
    fontSize: 14,
    color: '#00376B',
    fontWeight: '500',
    marginTop: 2,
  },
  igActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  igPrimaryBtn: {
    flex: 1,
    backgroundColor: BrandColors.accentPink,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  igPrimaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  igSecondaryBtn: {
    flex: 1,
    backgroundColor: '#EFEFEF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  igSecondaryBtnText: {
    color: BrandColors.textDark,
    fontSize: 14,
    fontWeight: '600',
  },
  tabsScroll: {
    marginBottom: 24,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  tabItem: {
    paddingBottom: 8,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#C42A64',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#C42A64',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.textDark,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    marginTop: 12,
  },
  serviceCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    marginRight: 12,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceAction: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 16,
  },
  serviceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.textDark,
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  serviceDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.accentPink,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
});

