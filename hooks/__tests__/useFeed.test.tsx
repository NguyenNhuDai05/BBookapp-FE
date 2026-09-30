import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useFeed } from '../useFeed';
import { FeedSessionExpiredError, getFeedPage, type FeedItem } from '../../services/feedService';
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: { id: 'viewer' } }) }));
jest.mock('../../services/feedService', () => ({ getFeedPage: jest.fn(), FeedSessionExpiredError: class extends Error {} }));
const post = (id: string): FeedItem => ({ portfolioId: id, muaId: 'artist', title: '', imageUrls: [], authorName: '', likesCount: 0, tags: [] });
function Feed() {
  const query = useFeed();
  return <View><Text>{query.data?.pages.flat().map(item => item.portfolioId).join(',') || 'empty'}</Text>
    <Text>{query.isSessionExpired ? 'expired' : 'active'}</Text>
    <Text>{query.hasNextPage ? 'more' : 'end'}</Text>
    <TouchableOpacity accessibilityLabel="next" onPress={() => { void query.fetchNextPage(); }} />
    <TouchableOpacity accessibilityLabel="refresh" onPress={() => { void query.refetch(); }} />
  </View>;
}
it('uses server cursors and preserves the screens array-of-pages contract', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
  jest.mocked(getFeedPage).mockResolvedValueOnce({ items: [post('1'), post('2')], nextCursor: 'cursor-1' })
    .mockResolvedValueOnce({ items: [post('3')], nextCursor: null });
  await render(<QueryClientProvider client={client}><Feed /></QueryClientProvider>);
  await waitFor(() => expect(screen.getByText('1,2')).toBeTruthy());
  await fireEvent.press(screen.getByLabelText('next'));
  await waitFor(() => expect(screen.getByText('1,2,3')).toBeTruthy());
  expect(getFeedPage).toHaveBeenNthCalledWith(1, undefined);
  expect(getFeedPage).toHaveBeenNthCalledWith(2, 'cursor-1');
  expect(screen.getByText('end')).toBeTruthy();
  await cleanup(); client.clear();
});
it('expired cursor requires refresh and starts a fresh session without appending old items', async () => {
  jest.clearAllMocks();
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
  jest.mocked(getFeedPage).mockResolvedValueOnce({ items: [post('old')], nextCursor: 'expired-cursor' })
    .mockRejectedValueOnce(new FeedSessionExpiredError());
  await render(<QueryClientProvider client={client}><Feed /></QueryClientProvider>);
  await waitFor(() => expect(screen.getByText('old')).toBeTruthy());
  await fireEvent.press(screen.getByLabelText('next'));
  await waitFor(() => expect(screen.getByText('expired')).toBeTruthy());
  expect(getFeedPage).toHaveBeenCalledTimes(2);
  jest.mocked(getFeedPage).mockResolvedValueOnce({ items: [post('fresh')], nextCursor: null });
  await fireEvent.press(screen.getByLabelText('refresh'));
  await waitFor(() => expect(screen.getByText('fresh')).toBeTruthy());
  expect(getFeedPage).toHaveBeenLastCalledWith(undefined);
  expect(screen.queryByText('old')).toBeNull();
  await cleanup(); client.clear();
});
