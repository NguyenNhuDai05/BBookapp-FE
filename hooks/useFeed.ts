import { useInfiniteQuery } from '@tanstack/react-query';
import { FeedSessionExpiredError, getFeedPage } from '../services/feedService';
import { useAuthStore } from '../store/useAuthStore';
export const useFeed = () => {
  const userId = useAuthStore(s => s.user?.id);
  const query = useInfiniteQuery({
    queryKey: ['feed', userId],
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: (attempt, error) => !(error instanceof FeedSessionExpiredError) && attempt < 2,
    queryFn: ({ pageParam }) => getFeedPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
    // Keep the screens' existing array-of-pages contract.
    select: data => ({ ...data, pages: data.pages.map(page => page.items) }),
  });
  return { ...query, isSessionExpired: query.error instanceof FeedSessionExpiredError };
};
