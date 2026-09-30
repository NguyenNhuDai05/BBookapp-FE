import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioService } from '../services/portfolioService';
import { CreatePortfolioItemRequest } from '../types/portfolio';
import { AppAlert as appDialog } from '../components/ui/dialogStore';
import { MUA_ELIGIBILITY_QUERY_KEY } from './useMuaEligibility';

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
      queryClient.invalidateQueries({ queryKey: MUA_ELIGIBILITY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['customer-explore'] });
    },
    onError: () => {
      appDialog.alert('Lỗi', 'Không thể thêm ảnh vào portfolio.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreatePortfolioItemRequest> }) =>
      portfolioService.updateItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PORTFOLIO_QUERY_KEY, muaId] });
      queryClient.invalidateQueries({ queryKey: MUA_ELIGIBILITY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['customer-explore'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => portfolioService.deleteItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PORTFOLIO_QUERY_KEY, muaId] });
      queryClient.invalidateQueries({ queryKey: MUA_ELIGIBILITY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['customer-explore'] });
    },
    onError: () => {
      appDialog.alert('Lỗi', 'Không thể xóa ảnh khỏi portfolio.');
    }
  });

  const visibilityMutation = useMutation({
    mutationFn: ({ itemId, isHidden }: { itemId: string; isHidden: boolean }) => portfolioService.setVisibility(itemId, isHidden),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PORTFOLIO_QUERY_KEY, muaId] });
      queryClient.invalidateQueries({ queryKey: MUA_ELIGIBILITY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['customer-explore'] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: (itemId: string) => portfolioService.toggleLike(itemId),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: [PORTFOLIO_QUERY_KEY] }),
      queryClient.invalidateQueries({ queryKey: ['customer-explore'] }),
    ]),
  });

  const saveMutation = useMutation({
    mutationFn: (itemId: string) => portfolioService.toggleSave(itemId),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: [PORTFOLIO_QUERY_KEY] }),
      queryClient.invalidateQueries({ queryKey: ['customer-explore'] }),
    ]),
  });

  return {
    ...query,
    createItem: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    setVisibility: visibilityMutation.mutateAsync,
    isChangingVisibility: visibilityMutation.isPending,
    toggleLike: likeMutation.mutateAsync,
    toggleSave: saveMutation.mutateAsync,
  };
}
