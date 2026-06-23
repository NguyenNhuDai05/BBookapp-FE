import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '../services/reviewService';

export const useReviews = (muaId: string) => {
  return useQuery({
    queryKey: ['reviews', muaId],
    queryFn: () => reviewService.getByMua(muaId),
    enabled: !!muaId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
  });
};

export const useReplyReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reviewId, replyContent }: { reviewId: string; replyContent: string }) => 
      reviewService.replyToReview(reviewId, replyContent),
    onSuccess: (_, variables) => {
      // Instant UI update
      queryClient.setQueriesData({ queryKey: ['reviews'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((review: any) => {
          if (review.reviewId === variables.reviewId) {
            return {
              ...review,
              muaReply: variables.replyContent,
              muaReplyAt: new Date().toISOString()
            };
          }
          return review;
        });
      });
      
      // Also invalidate to sync with server
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};
