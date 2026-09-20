import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFeed, type FeedItem } from '../services/feedService';
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
  const artistsQuery = useQuery({
    queryKey: ['customer-explore', 'artists'],
    queryFn: () => muaService.getArtists(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const feedQuery = useQuery({
    queryKey: ['customer-explore', 'feed'],
    queryFn: () => getFeed(1, 20),
    select: (rawFeed): ExploreFeedItem[] => rawFeed.map((item: FeedItem) => ({
        id: item.portfolioId,
        muaId: item.muaId,
        title: item.title || item.tags?.[0] || 'Phong cách nổi bật',
        imageUrl: item.imageUrls?.[0] || '',
        imageUrls: item.imageUrls || [],
        authorName: item.authorName || 'Makeup Artist',
        likesCount: item.likesCount || 0,
        tags: item.tags || [],
      })),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const artists = useMemo(() => {
    const keyword = searchQuery.trim().toLocaleLowerCase('vi');
    if (!keyword) return artistsQuery.data || [];
    return (artistsQuery.data || []).filter((artist) =>
      [artist.name, artist.city, ...artist.specialties].some((value) =>
        value?.toLocaleLowerCase('vi').includes(keyword),
      ),
    );
  }, [artistsQuery.data, searchQuery]);

  const feed = useMemo(() => {
    const keyword = searchQuery.trim().toLocaleLowerCase('vi');
    if (!keyword) return feedQuery.data || [];
    return (feedQuery.data || []).filter((item) =>
      [item.title, item.authorName, ...item.tags].some((value) =>
        value?.toLocaleLowerCase('vi').includes(keyword),
      ),
    );
  }, [feedQuery.data, searchQuery]);

  const refetch = async () => {
    await Promise.allSettled([artistsQuery.refetch(), feedQuery.refetch()]);
  };

  return {
    isLoading: artistsQuery.isLoading && feedQuery.isLoading,
    isRefreshing: artistsQuery.isRefetching || feedQuery.isRefetching,
    artistsError: artistsQuery.error,
    feedError: feedQuery.error,
    isFullError: artistsQuery.isError && feedQuery.isError,
    refetch,
    searchQuery,
    setSearchQuery,
    artists,
    feed,
  };
};
