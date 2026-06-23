import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioService } from '../services/portfolioService';
import { CreatePortfolioItemRequest } from '../types/portfolio';
import { Alert } from 'react-native';

const PORTFOLIO_QUERY_KEY = 'mua-portfolio';

export function useMuaPortfolio(muaId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [PORTFOLIO_QUERY_KEY, muaId],
    queryFn: () => portfolioService.getPortfolio(muaId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (item: CreatePortfolioItemRequest) => portfolioService.createItem(muaId, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PORTFOLIO_QUERY_KEY, muaId] });
    },
    onError: () => {
      Alert.alert('Lỗi', 'Không thể thêm ảnh vào portfolio.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreatePortfolioItemRequest> }) => 
      portfolioService.updateItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PORTFOLIO_QUERY_KEY, muaId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => portfolioService.deleteItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PORTFOLIO_QUERY_KEY, muaId] });
    },
    onError: () => {
      Alert.alert('Lỗi', 'Không thể xóa ảnh khỏi portfolio.');
    }
  });

  const reorderMutation = useMutation({
    mutationFn: (itemIds: string[]) => portfolioService.reorderItems(muaId, itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PORTFOLIO_QUERY_KEY, muaId] });
    },
  });

  const setCoverMutation = useMutation({
    mutationFn: (itemId: string) => portfolioService.setCoverPhoto(muaId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PORTFOLIO_QUERY_KEY, muaId] });
    },
  });

  return {
    ...query,
    createItem: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    reorderItems: reorderMutation.mutateAsync,
    setCoverPhoto: setCoverMutation.mutateAsync,
    isSettingCover: setCoverMutation.isPending,
  };
}
