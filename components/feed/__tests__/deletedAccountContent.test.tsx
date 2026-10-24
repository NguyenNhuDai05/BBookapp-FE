import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PortfolioCommentsSheet } from '../PortfolioCommentsSheet';
import ReviewTabContent from '../../mua/ReviewTabContent';
import { ReviewsTab } from '../../mua/ReviewsTab';
import { portfolioService } from '../../../services/portfolioService';
import type { PortfolioCommentDto, PortfolioItemDto } from '../../../types/portfolio';
import type { ReviewDto } from '../../../types/ReviewDto';

jest.setTimeout(20000);

const mockInvalidate = jest.fn(async () => {});
const mockReplyReview = jest.fn();
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mockInvalidate }) }));
jest.mock('../../../services/portfolioService', () => ({ portfolioService: { getComments: jest.fn(), addComment: jest.fn(), replyToComment: jest.fn() } }));
jest.mock('../../../hooks/useReviews', () => ({ useReplyReview: () => ({ mutate: mockReplyReview, isPending: false }) }));
jest.mock('../../ui/AppBottomSheet', () => ({ AppBottomSheet: ({ visible, children }: any) => visible ? children : null }));
jest.mock('../../ui/OverlayProvider', () => ({ AppOverlay: ({ visible, children }: any) => visible ? children : null }));
jest.mock('../../ui/dialogStore', () => ({ AppAlert: { alert: jest.fn() } }));
jest.mock('../../moderation/SafetyButton', () => ({ SafetyButton: ({ ownerId, ownerDeleted }: any) => {
  const { Text } = jest.requireActual('react-native');
  return <Text>{`Safety:${ownerId}:${Boolean(ownerDeleted)}`}</Text>;
} }));

const post = { id: 'post', imageUrl: '', category: '', isCover: false, order: 0, createdAt: '', updatedAt: '' } satisfies PortfolioItemDto;
const comment = (id: string, deleted = false, replies: PortfolioCommentDto[] = []): PortfolioCommentDto => ({
  id, portfolioId: post.id, userId: id, userName: `Tên ${id}`, content: `Nội dung ${id}`, createdAt: '', isAuthorDeleted: deleted, replies,
});
const review = (deleted: boolean): ReviewDto => ({ reviewId: 'review', bookingId: 'booking', customerId: 'customer', customerName: 'Tên riêng', muaId: 'mua', rating: 3, comment: 'Nội dung riêng', imageUrl: 'https://example.test/private.jpg', createdAt: '2026-10-24T00:00:00Z', isAuthorDeleted: deleted });

beforeEach(() => jest.clearAllMocks());

it('shows anonymous tombstones and all surviving replies without actions on deleted authors', async () => {
  jest.mocked(portfolioService.getComments).mockResolvedValue([comment('root', true, [comment('middle', true, [comment('live')])])]);
  await render(<PortfolioCommentsSheet item={post} onClose={jest.fn()} />);
  await screen.findByText('Nội dung live');
  expect(screen.getAllByText('Người dùng đã xóa')).toHaveLength(2);
  expect(screen.getAllByText('Bình luận đã được xóa')).toHaveLength(2);
  expect(screen.queryByText('Tên root')).toBeNull();
  expect(screen.queryByText('Nội dung root')).toBeNull();
  expect(screen.queryByText('Safety:root:false')).toBeNull();
  expect(screen.queryByText('Safety:middle:false')).toBeNull();
  expect(screen.getByText('Safety:live:false')).toBeTruthy();
  expect(screen.queryByText('Trả lời')).toBeNull();
});

it('preserves reply submission and counter refresh for an active author', async () => {
  jest.mocked(portfolioService.getComments).mockResolvedValue([comment('active')]);
  jest.mocked(portfolioService.replyToComment).mockResolvedValue(comment('new-reply'));
  await render(<PortfolioCommentsSheet item={post} onClose={jest.fn()} />);
  await screen.findByText('Nội dung active');
  await fireEvent.press(screen.getByRole('button', { name: 'Trả lời Tên active' }));
  await fireEvent.changeText(screen.getByPlaceholderText('Viết bình luận...'), 'Trả lời mới');
  await fireEvent.press(screen.getByRole('button', { name: 'Gửi bình luận' }));
  await screen.findByText('Nội dung new-reply');
  expect(portfolioService.replyToComment).toHaveBeenCalledWith('post', 'active', 'Trả lời mới');
  expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['feed'] });
  expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['mua-portfolio'] });
});

it('keeps deleted-author stars while hiding private text, photos and new review replies', async () => {
  await render(<ReviewTabContent reviews={[review(true)]} isLoading={false} isOwner />);
  expect(screen.getByText('3.0')).toBeTruthy();
  expect(screen.getByText('Người dùng đã xóa')).toBeTruthy();
  expect(screen.getByText('Nội dung đánh giá đã được xóa.')).toBeTruthy();
  expect(screen.queryByText('Tên riêng')).toBeNull();
  expect(screen.queryByText('Nội dung riêng')).toBeNull();
  expect(screen.queryByText('Phản hồi')).toBeNull();
  expect(screen.getByText('Safety:customer:true')).toBeTruthy();
  expect(JSON.stringify(screen.toJSON())).not.toContain('https://example.test/private.jpg');
  await fireEvent.press(screen.getByText('Có ảnh'));
  expect(screen.getByText('Không có đánh giá nào phù hợp bộ lọc.')).toBeTruthy();
});

it('preserves active reviews, MUA replies and rating averages', async () => {
  await render(<ReviewTabContent reviews={[review(false), { ...review(true), reviewId: 'deleted', rating: 5, muaReply: 'Phản hồi cũ của MUA' }]} isLoading={false} isOwner />);
  expect(screen.getByText('4.0')).toBeTruthy();
  expect(screen.getByText('Nội dung riêng')).toBeTruthy();
  expect(screen.getByText('Phản hồi cũ của MUA')).toBeTruthy();
  await fireEvent.press(screen.getByText('Phản hồi'));
  await fireEvent.changeText(screen.getByPlaceholderText('Nhập nội dung phản hồi của bạn...'), 'Phản hồi mới');
  await fireEvent.press(screen.getByText('Gửi phản hồi'));
  expect(mockReplyReview).toHaveBeenCalledWith({ reviewId: 'review', replyContent: 'Phản hồi mới' }, expect.any(Object));
});

it('also anonymizes the alternate review tab', async () => {
  await render(<ReviewsTab reviews={[review(true)]} averageRating={3} totalReviews={1} />);
  expect(screen.getByText('Người dùng đã xóa')).toBeTruthy();
  expect(screen.queryByText('Tên riêng')).toBeNull();
  expect(screen.queryByText('Nội dung riêng')).toBeNull();
  expect(screen.getByText('1 đánh giá')).toBeTruthy();
  expect(screen.getByText('Safety:customer:true')).toBeTruthy();
});

it('closes an already open image or reply when refreshed data marks the author deleted', async () => {
  const view = await render(<ReviewTabContent reviews={[review(false)]} isLoading={false} isOwner />);
  await fireEvent.press(screen.getByRole('button', { name: 'Xem ảnh đánh giá' }));
  await fireEvent.press(screen.getByText('Phản hồi'));
  expect(screen.getByPlaceholderText('Nhập nội dung phản hồi của bạn...')).toBeTruthy();
  await view.rerender(<ReviewTabContent reviews={[review(true)]} isLoading={false} isOwner />);
  expect(screen.queryByPlaceholderText('Nhập nội dung phản hồi của bạn...')).toBeNull();
  expect(JSON.stringify(screen.toJSON())).not.toContain('https://example.test/private.jpg');
});
