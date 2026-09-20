import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Spacing, Typography, Radius } from '../../constants/theme';
import { useMuaServices, useDeleteService, useCreateService, useUpdateService, useSetServiceActive } from '../../hooks/useMuaServices';
import { useMuaPortfolio } from '../../hooks/useMuaPortfolio';
import { ServiceList } from '../../components/mua/services/ServiceList';
import { PortfolioGrid } from '../../components/mua/portfolio/PortfolioGrid';
import { PortfolioFormModal } from '../../components/mua/portfolio/PortfolioFormModal';
import { ServiceFormModal } from '../../components/mua/services/ServiceFormModal';
import { Plus } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMuaEligibility } from '../../hooks/useMuaEligibility';

type TabType = 'SERVICES' | 'PORTFOLIO';

export default function MuaManagementScreen() {
  const muaId = "me";
  
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<TabType>(tab === 'PORTFOLIO' ? 'PORTFOLIO' : 'SERVICES');
  const [isServiceModalVisible, setIsServiceModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [isPortfolioModalVisible, setIsPortfolioModalVisible] = useState(false);

  const { data: services = [], isLoading: isLoadingServices } = useMuaServices(muaId);
  const { data: portfolio = [], isLoading: isLoadingPortfolio, deleteItem, createItem: createPortfolioItem, setVisibility } = useMuaPortfolio(muaId);
  const { data: eligibility } = useMuaEligibility();
  const portfolioRequirement = eligibility?.requirements.find(item => item.key === 'publicPortfolioImages');
  const deleteService = useDeleteService(muaId);
  const createService = useCreateService(muaId);
  const updateService = useUpdateService(muaId);
  const setServiceActive = useSetServiceActive(muaId);

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
    const service = services.find(item => (item.id || item.serviceId) === serviceId);
    setServiceActive.mutate({ serviceId, isActive: service?.status !== 'ACTIVE' });
  };

  const handleDeleteService = (serviceId: string) => {
    deleteService.mutate(serviceId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{activeTab === 'SERVICES' ? 'Quản lý dịch vụ' : 'Portfolio của tôi'}</Text>
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
              <View><Text style={styles.sectionTitle}>Hình ảnh Portfolio ({portfolio.length})</Text>{portfolioRequirement?.required != null ? <Text style={styles.requirementHint}>{portfolioRequirement.current || 0}/{portfolioRequirement.required} ảnh công khai</Text> : null}</View>
              <TouchableOpacity style={styles.addBtn} onPress={() => setIsPortfolioModalVisible(true)}>
                <Plus size={16} color="#FFF" />
                <Text style={styles.addBtnText}>Tải ảnh lên</Text>
              </TouchableOpacity>
            </View>
            {isLoadingPortfolio ? (
              <ActivityIndicator size="large" color={BrandColors.accentRose} style={{ marginTop: Spacing.xl }} />
            ) : (
              <PortfolioGrid 
                items={portfolio}
                onDelete={(id) => deleteItem(id)}
                onToggleVisibility={(id, isHidden) => setVisibility({ itemId: id, isHidden })}
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
      <PortfolioFormModal
        visible={isPortfolioModalVisible}
        onClose={() => setIsPortfolioModalVisible(false)}
        onSubmit={async data => { await createPortfolioItem(data); setIsPortfolioModalVisible(false); }}
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
  requirementHint: { fontFamily: Typography.regular, fontSize: 12, color: BrandColors.textMuted, marginTop: 2 },
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
