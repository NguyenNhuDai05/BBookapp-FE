import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { followService, FollowStatus } from '../services/followService';
import { useAuthStore } from '../store/useAuthStore';
import { AppAlert } from '../components/ui/dialogStore';
const inFlight = new Set<string>();
export function useFollow(muaId?: string) {
  const userId = useAuthStore(s => s.user?.id);
  const client = useQueryClient();
  const router = useRouter();
  const key = ['follow', userId ?? 'guest', muaId];
  const mutationKey = ['follow-change', userId, muaId];
  const self = !!userId && userId === muaId;
  const query = useQuery({ queryKey: key, queryFn: () => followService.status(muaId!), enabled: !!muaId, staleTime: 60000 });
  const busy = useIsMutating({ mutationKey }) > 0;
  const mutation = useMutation({
    mutationKey,
    mutationFn: (following: boolean) => followService.set(muaId!, following),
    onMutate: async following => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<FollowStatus>(key);
      if (previous) client.setQueryData(key, { ...previous, isFollowing: following,
        followersCount: Math.max(0, previous.followersCount + (following === previous.isFollowing ? 0 : following ? 1 : -1)) });
      return { previous };
    },
    onSuccess: status => { client.setQueryData(key, status); },
    onError: (_error, _following, context) => { if (context?.previous) client.setQueryData(key, context.previous); },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: key });
      void client.invalidateQueries({ queryKey: ['following-list', userId] });
      void client.invalidateQueries({ queryKey: ['feed', userId] });
    },
  });
  const change = async (following: boolean) => {
    if (!userId) {
      AppAlert.alert('Đăng nhập để theo dõi', 'Bạn cần đăng nhập để theo dõi chuyên gia.', [
        { text: 'Để sau', style: 'cancel' }, { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    if (!muaId || self || !query.data || busy) return;
    const lock = userId + ':' + muaId;
    if (inFlight.has(lock)) return;
    inFlight.add(lock);
    try { await mutation.mutateAsync(following); }
    catch { AppAlert.alert('Không thể cập nhật theo dõi', 'Vui lòng kiểm tra kết nối và thử lại.'); }
    finally { inFlight.delete(lock); }
  };
  const toggle = async () => {
    if (busy || inFlight.has(userId + ':' + muaId)) return;
    if (query.data?.isFollowing && userId) {
      AppAlert.alert('Bỏ theo dõi?', 'Bạn sẽ bỏ theo dõi chuyên gia này. Bài viết của họ vẫn có thể xuất hiện trên Trang chủ.', [
        { text: 'Hủy', style: 'cancel' }, { text: 'Bỏ theo dõi', style: 'destructive', onPress: () => change(false) },
      ]);
    } else await change(true);
  };
  return { status: query.data, toggle, busy, self, loading: query.isLoading, error: query.isError, refetch: query.refetch };
}
