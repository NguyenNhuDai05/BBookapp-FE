import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Spacing, Typography, Radius } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useMuaServices, useDeleteService, useCreateService, useUpdateService } from '../../hooks/useMuaServices';
import { useMuaPortfolio } from '../../hooks/useMuaPortfolio';
import { ServiceList } from '../../components/mua/services/ServiceList';
import { PortfolioGrid } from '../../components/mua/portfolio/PortfolioGrid';
import { ServiceFormModal } from '../../components/mua/services/ServiceFormModal';
import { Plus } from 'lucide-react-native';

type TabType = 'SERVICES' | 'PORTFOLIO';

export default function MuaManagementScreen() {
  const { user } = useAuthStore();
  const muaId = "me";
  
  const [activeTab, setActiveTab] = useState<TabType>('SERVICES');
  const [isServiceModalVisible, setIsServiceModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  const { data: services = [], isLoading: isLoadingServices } = useMuaServices(muaId);
  const { data: portfolio = [], isLoading: isLoadingPortfolio, deleteItem, setCoverPhoto, reorderItems } = useMuaPortfolio(muaId);
  const deleteService = useDeleteService(muaId);
  const createService = useCreateService(muaId);
  const updateService = useUpdateService(muaId);

  const handleOpenAddService = () => {
    setEditingService(null);
    setIsServiceModalVisible(true);
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setIsServiceModalVisible(true);
  };

  const handleSaveService = (data: any) => {
    if (editingService) {
      updateService.mutate({ serviceId: editingService.id, updates: data });
    } else {
      createService.mutate(data);
    }
  };

  const handleArchiveService = (serviceId: string) => {
    // Archive Service (To be implemented)
  };

  const handleDeleteService = (serviceId: string) => {
    deleteService.mutate(serviceId);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...portfolio];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    reorderItems(newOrder.map(i => i.id));
  };

  const handleMoveDown = (index: number) => {
    if (index === portfolio.length - 1) return;
    const newOrder = [...portfolio];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    reorderItems(newOrder.map(i => i.id));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý dịch vụ</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'SERVICES' && styles.tabBtnActive]}
          onPress={() => setActiveTab('SERVICES')}
        >
          <Text style={[styles.tabText, activeTab === 'SERVICES' && styles.tabTextActive]}>Dịch vụ</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'PORTFOLIO' && styles.tabBtnActive]}
          onPress={() => setActiveTab('PORTFOLIO')}
        >
          <Text style={[styles.tabText, activeTab === 'PORTFOLIO' && styles.tabTextActive]}>Portfolio</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'SERVICES' ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Danh sách dịch vụ ({services.length})</Text>
              <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddService}>
                <Plus size={16} color="#FFF" />
                <Text style={styles.addBtnText}>Thêm mới</Text>
              </TouchableOpacity>
            </View>
            {isLoadingServices ? (
              <ActivityIndicator size="large" color={BrandColors.accentRose} style={{ marginTop: Spacing.xl }} />
            ) : (
              <ServiceList 
                services={services} 
                onEdit={handleEditService}
                onArchive={handleArchiveService}
                onDelete={handleDeleteService}
              />
            )}
          </>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hình ảnh Portfolio ({portfolio.length})</Text>
              <TouchableOpacity style={styles.addBtn}>
                <Plus size={16} color="#FFF" />
                <Text style={styles.addBtnText}>Tải ảnh lên</Text>
              </TouchableOpacity>
            </View>
            {isLoadingPortfolio ? (
              <ActivityIndicator size="large" color={BrandColors.accentRose} style={{ marginTop: Spacing.xl }} />
            ) : (
              <PortfolioGrid 
                items={portfolio}
                onSetCover={(id) => setCoverPhoto(id)}
                onDelete={(id) => deleteItem(id)}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            )}
          </>
        )}
      </ScrollView>

      <ServiceFormModal 
        visible={isServiceModalVisible}
        onClose={() => setIsServiceModalVisible(false)}
        onSubmit={handleSaveService}
        initialData={editingService}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: Spacing.md,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  headerTitle: {
    fontFamily: Typography.bold,
    fontSize: 20,
    color: BrandColors.textDark,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: BrandColors.accentRose,
  },
  tabText: {
    fontFamily: Typography.medium,
    fontSize: 15,
    color: BrandColors.textMuted,
  },
  tabTextActive: {
    color: BrandColors.accentRose,
    fontFamily: Typography.semiBold,
  },
  content: {
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.semiBold,
    fontSize: 18,
    color: BrandColors.textDark,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.accentRose,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    gap: 4,
  },
  addBtnText: {
    fontFamily: Typography.bold,
    fontSize: 13,
    color: '#FFF',
  }
});
