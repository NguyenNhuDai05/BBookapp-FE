import { AppBottomSheet } from '../../components/ui/AppBottomSheet';
import { ActionSheet } from '../../components/ui/ActionSheet';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, useWindowDimensions, RefreshControl, Linking } from 'react-native';
import { AppAlert as appDialog } from '../../components/ui/dialogStore';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {Menu, CheckCircle2, Image as ImageIcon, MoreVertical, Edit2, Trash2, X, User, Plus} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { useMuaProfile } from '../../hooks/useMuaProfile';
import { useMuaPortfolio } from '../../hooks/useMuaPortfolio';
import { useMuaServices, useCreateService, useDeleteService, useUpdateService } from '../../hooks/useMuaServices';
import { useReviews } from '../../hooks/useReviews';
import { ServiceFormModal } from '../../components/mua/services/ServiceFormModal';
import { PortfolioFormModal } from '../../components/mua/portfolio/PortfolioFormModal';
import ReviewTabContent from '../../components/mua/ReviewTabContent';
import { ReviewNotice } from '../../components/ReviewNotice';
import { BrandColors } from '../../constants/theme';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { getApiError } from '../../services/api';
import { normalizeSocialUrl } from '../../utils/socialUrl';

export default function MuaProfilePremiumScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const review=user?.isDemoAccount===true;
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const numColumns = isDesktop ? 6 : 3;
  const gridGap = 2;
  const itemSize = Math.floor((width - (numColumns - 1) * gridGap) / numColumns); // 32 is horizontal padding (Spacing.lg * 2 if padding is applied to container)

  // Real API calls
  const { data: profile, refetch: refetchProfile } = useMuaProfile('me');
  const { data: portfolio, refetch: refetchPortfolio, createItem: createPortfolioItem, updateItem: updatePortfolioItem, deleteItem: deletePortfolioItem, isDeleting: isDeletingPortfolio } = useMuaPortfolio('me');
  const { data: services, refetch: refetchServices } = useMuaServices('me');
  const { data: reviews, isLoading: isReviewsLoading, refetch: refetchReviews } = useReviews(profile?.id || '');
  const createService = useCreateService('me');
  const updateService = useUpdateService('me');
  const deleteService = useDeleteService('me');

  const [isServiceModalVisible, setIsServiceModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isServiceOptionsVisible, setIsServiceOptionsVisible] = useState(false);
  const [isPortfolioOptionsVisible, setIsPortfolioOptionsVisible] = useState(false);
  const [deleteServiceVisible, setDeleteServiceVisible] = useState(false);
  const [deletePortfolioVisible, setDeletePortfolioVisible] = useState(false);

  const [isPortfolioModalVisible, setIsPortfolioModalVisible] = useState(false);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<any>(null);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<any>(null);

  const handleServiceOptions = (svc: any) => {
    if(review)return;
    setSelectedService(svc);
    setIsServiceOptionsVisible(true);
  };

  const handlePortfolioOptions = (item: any) => {
    if(review)return;
    setSelectedPortfolioItem(item);
    setIsPortfolioOptionsVisible(true);
  };

  const confirmDeleteService = async () => {
    const id = selectedService?.serviceId || selectedService?.id;
    if (!id || deleteService.isPending) return;
    try {
      await deleteService.mutateAsync(id);
      setDeleteServiceVisible(false);
      setSelectedService(null);
      appDialog.alert('Thành công', 'Đã xóa dịch vụ.');
    } catch (error) {
      appDialog.alert('Không thể xóa', getApiError(error).message || 'Dịch vụ có thể đã được sử dụng trong booking.');
    }
  };

  const confirmDeletePortfolio = async () => {
    const id = selectedPortfolioItem?.portfolioId || selectedPortfolioItem?.id;
    if (!id || isDeletingPortfolio) return;
    try {
      await deletePortfolioItem(id);
      setDeletePortfolioVisible(false);
      setSelectedPortfolioItem(null);
      appDialog.alert('Thành công', 'Đã xóa tác phẩm.');
    } catch (error) {
      appDialog.alert('Không thể xóa', getApiError(error).message);
    }
  };


  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState(params.tab ? String(params.tab) : 'Portfolio');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    refetchProfile();
    refetchPortfolio();
    refetchServices();
    refetchReviews();
    // Simulate delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  React.useEffect(() => {
    if (!params.tab) return;
    const timeoutId = setTimeout(() => setActiveTab(String(params.tab)), 0);
    return () => clearTimeout(timeoutId);
  }, [params.tab]);

  const displayAvatar = profile?.avatarUrl || '';
  const displayName = profile?.brandName || user?.name || 'Nguyễn Lan Anh';
  const displayBio = profile?.bio || 'MAKEUP ARTIST • MASTER EDUCATOR';
  const instagramUrl = profile?.instagramUrl;
  const facebookUrl = profile?.facebookUrl;

  // Use real portfolio. If empty, it's an empty array.
  const displayPortfolio = portfolio || [];

  const handleOpenSettings = () => {
    router.push('/(mua)/settings' as any);
  };

  const openSocialLink = async (value: string, platform: 'instagram' | 'facebook') => {
    const url = normalizeSocialUrl(value, platform);
    if (!url) return;
    try { await Linking.openURL(url); } catch { appDialog.alert('Không thể mở liên kết', 'Vui lòng thử lại sau.'); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#FFF5F7', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {review?<ReviewNotice/>:null}
      {/* Top Header */}
      <View style={styles.header}>
        {/* Placeholder for back arrow if needed */}
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Hồ sơ chuyên gia</Text>
        <TouchableOpacity onPress={handleOpenSettings} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Menu size={24} color="#C42A64" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BrandColors.accentPink]}
            tintColor={BrandColors.accentPink}
          />
        }
      >

        {/* Instagram-inspired Header */}
        <View style={styles.igHeaderContainer}>
          <View style={styles.igTopRow}>
            {/* Avatar on the left */}
            <View style={styles.igAvatarWrapper}>
              {displayAvatar ? (
                <Image source={{ uri: displayAvatar }} style={styles.igAvatar} />
              ) : (
                <View style={[styles.igAvatar, { backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' }]}>
                  <User size={40} color="#A855F7" />
                </View>
              )}
              {/* Optional verification or story ring can go here */}
            </View>

            {/* Stats on the right */}
            <View style={styles.igStatsContainer}>
              <View style={styles.igStatItem}>
                <Text style={styles.igStatValue}>{displayPortfolio.length}</Text>
                <Text style={styles.igStatLabel}>tác phẩm</Text>
              </View>
              <View style={styles.igStatItem}>
                <Text style={styles.igStatValue}>{profile?.reviewCount || 0}</Text>
                <Text style={styles.igStatLabel}>Bookings</Text>
              </View>
              <View style={styles.igStatItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.igStatValue}>{profile?.rating?.toFixed(1) || '0.0'}</Text>
                  <Text style={{ fontSize: 12, color: '#777', marginLeft: 2 }}>({reviews?.length || 0})</Text>
                </View>
                <Text style={styles.igStatLabel}>đánh giá</Text>
              </View>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.igBioContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Text style={[styles.igName, { marginBottom: 0 }]}>
                {displayName}
              </Text>
              {!review && <CheckCircle2 size={14} color="#1DA1F2" style={{ marginLeft: 4 }} />}
            </View>
            <Text style={styles.igBioCategory}>Nghệ sĩ trang điểm</Text>
            <Text style={styles.igBioText}>{displayBio}</Text>
            {(instagramUrl || facebookUrl) ? <View style={styles.socialRow}>
              {instagramUrl ? <TouchableOpacity style={styles.socialButton} onPress={() => openSocialLink(instagramUrl, 'instagram')}><Text style={styles.socialText}>Instagram</Text></TouchableOpacity> : null}
              {facebookUrl ? <TouchableOpacity style={styles.socialButton} onPress={() => openSocialLink(facebookUrl, 'facebook')}><Text style={[styles.socialText, { color: '#1877F2' }]}>Facebook</Text></TouchableOpacity> : null}
            </View> : null}
          </View>

          {/* Action Buttons */}
          <View style={styles.igActionRow}>
            <TouchableOpacity
              style={styles.igPrimaryBtn}
              disabled={review} onPress={() => router.push('/(mua)/edit-profile' as any)}
            >
              <Text style={styles.igPrimaryBtnText}>Chỉnh sửa trang</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.igSecondaryBtn}>
              <Text style={styles.igSecondaryBtnText}>Chia sẻ hồ sơ</Text>
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
          <>
        {/* Portfolio Section */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Tác phẩm của bạn</Text>
            <TouchableOpacity disabled={review} onPress={() => setIsPortfolioModalVisible(true)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
              <Plus size={24} color={BrandColors.textDark} />
            </TouchableOpacity>
          </View>

          {(!displayPortfolio || displayPortfolio.length === 0) ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có tác phẩm nào.</Text>
            </View>
          ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -20 }}>
              {displayPortfolio.map((item: any, index: number) => (
                <TouchableOpacity
                  key={item.id || item.portfolioId || index.toString()}
                  activeOpacity={0.9}
                  onPress={() => {
                    router.push({
                      pathname: '/(mua)/manage-portfolio',
                      params: { initialIndex: index }
                    });
                  }}
                  style={{
                    width: itemSize,
                    height: itemSize,
                    marginBottom: gridGap,
                    marginRight: (index + 1) % numColumns === 0 ? 0 : gridGap,
                    backgroundColor: BrandColors.borderLight,
                  }}
                >
                  <Image source={{ uri: (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : (item.imageUrl || '') }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  {(item.imageUrls && item.imageUrls.length > 1) && (
                    <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>1/{item.imageUrls.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              </View>
          )}
        </View>
          </>
        )}

        {activeTab === 'Dịch vụ' && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Các dịch vụ cung cấp</Text>
              {(services && services.length > 0) ? (
                <TouchableOpacity disabled={review} onPress={() => setIsServiceModalVisible(true)}>
                  <Plus size={24} color={BrandColors.textDark} />
                </TouchableOpacity>
              ) : null}
            </View>
            {(!services || services.length === 0) ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có dịch vụ nào.</Text>
                <TouchableOpacity
                  style={[styles.serviceBookBtn, { marginTop: 16 }]}
                  onPress={() => setIsServiceModalVisible(true)}
                >
                  <Text style={styles.serviceBookBtnText}>+ Thêm Dịch Vụ</Text>
                </TouchableOpacity>
              </View>
            ) : (
              services.map((svc) => (
                <View
                  key={svc.id || svc.serviceId}
                  style={styles.serviceCard}
                >
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => setSelectedService(svc)}
                  >
                    {/* Service Image at the left */}
                    <View style={styles.serviceImageContainer}>
                      {svc.imageUrl ? (
                        <Image source={{ uri: svc.imageUrl }} style={styles.serviceImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.serviceImagePlaceholder}>
                          <ImageIcon size={24} color="#CCC" />
                        </View>
                      )}
                    </View>

                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{svc.name || svc.serviceName}</Text>
                      {svc.description ? <Text style={styles.serviceDesc} numberOfLines={2}>{svc.description}</Text> : null}
                      <Text style={styles.serviceDuration}>{"\u23F3"} {svc.durationMinutes} {"ph\u00FAt"}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.serviceAction}>
                    <TouchableOpacity disabled={review} onPress={() => handleServiceOptions(svc)} hitSlop={{top:15, bottom:15, left:15, right:15}}>
                      <MoreVertical size={20} color="#666" />
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
            <ReviewTabContent reviews={reviews} isLoading={isReviewsLoading} isOwner={true} />
          </View>
        )}

        {activeTab === 'Thông tin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin giới thiệu</Text>
            <Text style={styles.bioText}>{profile?.bio || 'Chưa có thông tin.'}</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Service Detail Modal */}
      <AppBottomSheet visible={!!selectedService} onClose={()=>setSelectedService(null)} contentStyle={{height:'85%',paddingHorizontal:0}}>{selectedService ? <>
<View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chi tiết dịch vụ</Text>
                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => handleServiceOptions(selectedService)}>
                    <MoreVertical size={24} color={BrandColors.textDark} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedService(null)}>
                    <X size={24} color={BrandColors.textDark} />
                  </TouchableOpacity>
                </View>
              </View>

<ScrollView showsVerticalScrollIndicator={false}>
                {selectedService.imageUrl ? (
                  <Image source={{ uri: selectedService.imageUrl }} style={{ width: '100%', height: 250 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: '100%', height: 200, backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={40} color="#CCC" />
                  </View>
                )}
                <View style={{ padding: 20 }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: '#22152B', marginBottom: 8 }}>{selectedService.name || selectedService.serviceName}</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#C42A64', marginBottom: 16 }}>{(selectedService.price || 0).toLocaleString('vi-VN')}đ</Text>
                  <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>{"\u23F3"} Thời gian: {selectedService.durationMinutes} phút</Text>

                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#22152B', marginTop: 16, marginBottom: 8 }}>Mô tả</Text>
                  <Text style={{ fontSize: 14, color: '#444', lineHeight: 22 }}>{selectedService.description || 'Không có mô tả.'}</Text>
                </View>
              </ScrollView>
</> : null}</AppBottomSheet>

      {/* Portfolio Detail Modal */}
      <AppBottomSheet visible={!!selectedPortfolioItem} onClose={()=>setSelectedPortfolioItem(null)} contentStyle={{height:'85%',paddingHorizontal:0}}>{selectedPortfolioItem ? <>
<View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chi tiết tác phẩm</Text>
                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                  <TouchableOpacity disabled={review} onPress={() => handlePortfolioOptions(selectedPortfolioItem)}>
                    <MoreVertical size={24} color={BrandColors.textDark} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedPortfolioItem(null)}>
                    <X size={24} color={BrandColors.textDark} />
                  </TouchableOpacity>
                </View>
              </View>

<ScrollView showsVerticalScrollIndicator={false}>
                {((selectedPortfolioItem.imageUrls && selectedPortfolioItem.imageUrls.length > 0) || selectedPortfolioItem.imageUrl) ? (
                  <Image source={{ uri: (selectedPortfolioItem.imageUrls && selectedPortfolioItem.imageUrls.length > 0) ? selectedPortfolioItem.imageUrls[0] : (selectedPortfolioItem.imageUrl || '') }} style={{ width: '100%', height: 350 }} resizeMode="contain" />
                ) : (
                  <View style={{ width: '100%', height: 200, backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={40} color="#CCC" />
                  </View>
                )}
                <View style={{ padding: 20 }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: '#22152B', marginBottom: 8 }}>{selectedPortfolioItem.title || 'Không có tiêu đề'}</Text>
                  {selectedPortfolioItem.category || (selectedPortfolioItem.tags && selectedPortfolioItem.tags.length > 0) ? (
                    <Text style={{ fontSize: 14, color: '#C42A64', marginBottom: 16, fontWeight: '600' }}>
                      {selectedPortfolioItem.category || selectedPortfolioItem.tags.join(', ')}
                    </Text>
                  ) : null}
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#22152B', marginBottom: 8 }}>Mô tả</Text>
                  <Text style={{ fontSize: 14, color: '#444', lineHeight: 22 }}>{selectedPortfolioItem.description || 'Không có mô tả.'}</Text>
                </View>
              </ScrollView>
</> : null}</AppBottomSheet>

      <ServiceFormModal
        visible={!review && isServiceModalVisible}
        onClose={() => { setIsServiceModalVisible(false); setEditingService(null); }}
        onSubmit={async (data) => {
          if (editingService) {
            await updateService.mutateAsync({ serviceId: editingService.id || editingService.serviceId, updates: data });
          } else {
            await createService.mutateAsync(data);
          }
        }}
        initialData={editingService}
        availableTags={[...new Set((services || []).flatMap(service => service.tags || []))]}
      />

      <PortfolioFormModal
        visible={!review && isPortfolioModalVisible}
        onClose={() => { setIsPortfolioModalVisible(false); setEditingPortfolioItem(null); }}
        onSubmit={async (data) => {
          if (editingPortfolioItem) {
            await updatePortfolioItem({ id: editingPortfolioItem.id || editingPortfolioItem.portfolioId, updates: data });
          } else {
            await createPortfolioItem(data);
          }
        }}
        initialData={editingPortfolioItem}
      />

        <ActionSheet visible={!review && isServiceOptionsVisible} title="Tùy chọn dịch vụ" onClose={()=>setIsServiceOptionsVisible(false)} actions={[
          {id:'edit',label:'Chỉnh sửa dịch vụ',icon:Edit2,onPress:()=>{setIsServiceOptionsVisible(false);setSelectedService(null);setEditingService(selectedService);setIsServiceModalVisible(true);}},
          {id:'delete',label:'Xóa dịch vụ',icon:Trash2,destructive:true,onPress:()=>{setIsServiceOptionsVisible(false);setDeleteServiceVisible(true);}},
        ]} />

        <ActionSheet visible={!review && isPortfolioOptionsVisible} title="Tùy chọn bài viết" onClose={()=>setIsPortfolioOptionsVisible(false)} actions={[
          {id:'edit',label:'Chỉnh sửa tác phẩm',icon:Edit2,onPress:()=>{setIsPortfolioOptionsVisible(false);setEditingPortfolioItem(selectedPortfolioItem);setIsPortfolioModalVisible(true);}},
          {id:'delete',label:'Xóa tác phẩm',icon:Trash2,destructive:true,onPress:()=>{setIsPortfolioOptionsVisible(false);setDeletePortfolioVisible(true);}},
        ]} />

        <ConfirmDialog visible={!review && deleteServiceVisible} title="Xóa dịch vụ" message="Bạn có chắc chắn muốn xóa dịch vụ này?" confirmLabel="Xóa" destructive loading={deleteService.isPending} onCancel={() => { setDeleteServiceVisible(false); setSelectedService(null); }} onConfirm={confirmDeleteService}/>
        <ConfirmDialog visible={!review && deletePortfolioVisible} title="Xóa tác phẩm" message="Bạn có chắc chắn muốn xóa tác phẩm này khỏi Portfolio?" confirmLabel="Xóa" destructive loading={isDeletingPortfolio} onCancel={() => { setDeletePortfolioVisible(false); setSelectedPortfolioItem(null); }} onConfirm={confirmDeletePortfolio}/>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22152B',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
igHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFF',
  },
igTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
igAvatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#C42A64',
    padding: 3,
  },
igAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
igStatsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 20,
  },
igStatItem: {
    alignItems: 'center',
  },
igStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22152B',
  },
igStatLabel: {
    fontSize: 13,
    color: '#22152B',
    marginTop: 2,
  },
igBioContainer: {
    marginBottom: 16,
  },
igName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22152B',
    marginBottom: 2,
  },
igBioCategory: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
igBioText: {
    fontSize: 13,
    color: '#22152B',
    lineHeight: 18,
    marginBottom: 2,
  },
socialRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:10},
socialButton:{minHeight:38,paddingHorizontal:12,borderRadius:18,borderWidth:1,borderColor:'#EEE',flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'#FFF'},
socialText:{fontSize:13,fontWeight:'600',color:'#2B1B2A'},
igActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
igPrimaryBtn: {
    flex: 1,
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
igPrimaryBtnText: {
    color: '#22152B',
    fontSize: 14,
    fontWeight: '600',
  },
igSecondaryBtn: {
    flex: 1,
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
igSecondaryBtnText: {
    color: '#22152B',
    fontSize: 14,
    fontWeight: '600',
  },
scrollContent: {
    paddingBottom: 40,
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
    marginBottom: 32,
  },
sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22152B',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 16,
  },
emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
serviceBookBtn: { backgroundColor: "#FFF0F5", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: "center", justifyContent: "center" },
serviceBookBtnText: { color: "#C42A64", fontWeight: "600", fontSize: 14 },
emptyText: {
    fontSize: 14,
    color: '#999',
  },
serviceCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
serviceInfo: {
    flex: 1,
    paddingRight: 12,
  },
serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22152B',
    marginBottom: 4,
  },
serviceDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
serviceDuration: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
serviceAction: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
  },
servicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C42A64',
  },
bioText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22152B',
  }
});


