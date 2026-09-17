import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFeed } from '../services/feedService';
import { muaService } from '../services/muaService';

export type ExploreFeedItem = {
  id: string;
  muaId: string;
  title: string;
  imageUrl: string;
  imageUrls: string[];
  authorName: string;
  likesCount: number;
  tags: string[];
};

export const useExplore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const query = useQuery({
    queryKey: ['customer-explore'],
    queryFn: async () => {
      const [artistsResult, feedResult] = await Promise.allSettled([
        muaService.getArtists(),
        getFeed(1, 20),
      ]);
      const artists = artistsResult.status === 'fulfilled' ? artistsResult.value : [];
      const rawFeed = feedResult.status === 'fulfilled' ? feedResult.value : [];
      if (artistsResult.status === 'rejected' && feedResult.status === 'rejected') {
        throw new Error('Không thể tải dữ liệu khám phá');
      }
      const feed: ExploreFeedItem[] = (Array.isArray(rawFeed) ? rawFeed : []).map((item: any) => ({
        id: item.portfolioId,
        muaId: item.muaId,
        title: item.title || item.tags?.[0] || 'Phong cách nổi bật',
        imageUrl: item.imageUrls?.[0] || '',
        imageUrls: item.imageUrls || [],
        authorName: item.authorName || 'Makeup Artist',
        likesCount: item.likesCount || 0,
        tags: item.tags || [],
      }));
      return { artists, feed };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const artists = useMemo(() => {
    const keyword = searchQuery.trim().toLocaleLowerCase('vi');
    if (!keyword) return query.data?.artists || [];
    return (query.data?.artists || []).filter((artist) =>
      [artist.name, artist.city, ...artist.specialties].some((value) =>
        value?.toLocaleLowerCase('vi').includes(keyword),
      ),
    );
  }, [query.data?.artists, searchQuery]);

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    searchQuery,
    setSearchQuery,
    artists,
    feed: query.data?.feed || [],
  };
};
