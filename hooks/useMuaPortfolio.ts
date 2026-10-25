import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { portfolioService } from '../services/portfolioService';
import { CreatePortfolioItemRequest } from '../types/portfolio';
import { AppAlert as appDialog } from '../components/ui/dialogStore';
import { MUA_ELIGIBILITY_QUERY_KEY } from './useMuaEligibility';
import { PortfolioSavedRefreshError } from '../utils/portfolioWrite';

export const PORTFOLIO_QUERY_KEY = 'mua-portfolio';
const portfolioProjectionKeys = [[PORTFOLIO_QUERY_KEY], MUA_ELIGIBILITY_QUERY_KEY, ['feed'], ['customer-explore'], ['portfolio-favorites'], ['mua'], ['mua-profile'], ['shared-post'], ['post-share'], ['profile-share']];
export async function reloadOwnerPortfolio(client: QueryClient) {
  const queryKey = [PORTFOLIO_QUERY_KEY, 'me'];
  await client.cancelQueries({ queryKey, exact: true });
  await client.invalidateQueries({ queryKey, exact: true, refetchType: 'none' });
  return client.fetchQuery({ queryKey, queryFn: () => portfolioService.getPortfolio('me'), staleTime: 0, retry: false });
}

export function useMuaPortfolio(muaId: string) {
  const queryClient = useQueryClient();
  const afterWrite = async () => {
    const keys = portfolioProjectionKeys;
    await Promise.all(keys.map(queryKey => queryClient.invalidateQueries({ queryKey, refetchType: 'none' })));
    await reloadOwnerPortfolio(queryClient);
    void Promise.allSettled(keys.map(queryKey => queryClient.refetchQueries({ queryKey, type: 'active', predicate: q => !(q.queryKey[0] === PORTFOLIO_QUERY_KEY && q.queryKey[1] === 'me') })));
  };
  const acknowledgeAndRefresh = async (write: () => ReturnType<typeof portfolioService.createItem>) => {
    const ack = await write();
    try { await afterWrite(); }
    catch { throw new PortfolioSavedRefreshError(afterWrite); }
    return ack;
  };

  const query = useQuery({
    queryKey: [PORTFOLIO_QUERY_KEY, muaId],
    queryFn: () => portfolioService.getPortfolio(muaId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (item: CreatePortfolioItemRequest) => acknowledgeAndRefresh(() => portfolioService.createItem(muaId, item)),
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreatePortfolioItemRequest> }) =>
      acknowledgeAndRefresh(() => portfolioService.updateItem(id, updates)),
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => portfolioService.deleteItem(itemId),
    onSuccess: () => Promise.all(portfolioProjectionKeys.map(queryKey => queryClient.invalidateQueries({ queryKey }))),
    onError: () => {
      appDialog.alert('Lỗi', 'Không thể xóa ảnh khỏi portfolio.');
    }
  });

  const visibilityMutation = useMutation({
    mutationFn: ({ itemId, isHidden }: { itemId: string; isHidden: boolean }) => portfolioService.setVisibility(itemId, isHidden),
    retry: false,
    onSuccess: () => Promise.all(portfolioProjectionKeys.map(queryKey => queryClient.invalidateQueries({ queryKey }))),
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
