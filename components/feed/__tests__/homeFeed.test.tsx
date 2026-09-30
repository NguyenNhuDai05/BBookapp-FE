import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PortfolioPost } from '../../mua/portfolio/PortfolioPost';
import { PostCaption } from '../PostCaption';
import type { PortfolioItemDto } from '../../../types/portfolio';
import { Platform } from 'react-native';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
const item: PortfolioItemDto & { tags: string[] } = {
  id: 'post-1', imageUrl: 'https://example.com/image.jpg', category: '', isCover: false, order: 0,
  createdAt: '2026-09-30T10:00:00Z', updatedAt: '', authorName: 'Chuyên gia', title: 'Makeup tự nhiên', description: 'Mô tả bài viết',
  tags: ['Makeup tiệc'], likesCount: 1200,
};

it('expands by measured line count and collapses without changing the caption', async () => {
  await render(<PostCaption text="Nội dung đầy đủ của bài viết" />);
  expect(screen.queryByRole('button', { name: 'Xem thêm mô tả' })).toBeNull();
  await fireEvent(screen.getByTestId('caption-measure', { includeHiddenElements: true }), 'textLayout', { nativeEvent: { lines: [{}, {}, {}, {}] } });
  await fireEvent.press(screen.getByRole('button', { name: 'Xem thêm mô tả' }));
  expect(screen.getByTestId('caption-visible').props.numberOfLines).toBeUndefined();
  await fireEvent.press(screen.getByRole('button', { name: 'Thu gọn mô tả' }));
  expect(screen.getByTestId('caption-visible').props.numberOfLines).toBe(3);
});

it('places description before gallery, hashtags last and preserves action callbacks', async () => {
  const like = jest.fn(), save = jest.fn(), comment = jest.fn(), profile = jest.fn();
  await render(<PortfolioPost item={item} onLike={like} onSave={save} onComment={comment} onAuthorPress={profile} />);
  const json = JSON.stringify(screen.toJSON());
  expect(json.indexOf('post-caption')).toBeLessThan(json.indexOf('post-gallery'));
  expect(json.indexOf('post-gallery')).toBeLessThan(json.indexOf('post-hashtags'));
  expect(screen.queryByText('MUA chuyên nghiệp')).toBeNull();
  expect(screen.getByText('#Makeup tiệc')).toBeTruthy();
  expect(screen.getByText('1.2K')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Thích bài viết' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Lưu bài viết' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Bình luận' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Hồ sơ Chuyên gia' }));
  expect([like, save, comment, profile].map(callback => callback.mock.calls.length)).toEqual([1, 1, 1, 1]);
  expect(screen.getByRole('button', { name: 'Theo dõi' }).props.accessibilityState.disabled).toBe(true);
  expect(screen.queryByRole('button', { name: 'Chia sẻ bài viết' })).toBeNull();
});

it('locks a supported follow callback until its promise settles', async () => {
  let finish!: () => void;
  const follow = jest.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  await render(<PortfolioPost item={item} onFollow={follow} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Theo dõi' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Theo dõi' }));
  expect(follow).toHaveBeenCalledTimes(1);
  await act(async () => { finish(); });
});

it('uses measured full-text height for expansion on web', async () => {
  const replacement = jest.replaceProperty(Platform, 'OS', 'web');
  try {
    await render(<PostCaption text="Nội dung dài trên web" />);
    await fireEvent(screen.getByTestId('caption-measure', { includeHiddenElements: true }), 'layout', { nativeEvent: { layout: { height: 92, width: 320, x: 0, y: 0 } } });
    expect(screen.getByRole('button', { name: 'Xem thêm mô tả' })).toBeTruthy();
  } finally { replacement.restore(); }
});


it('preserves booking, options and image viewing in the compact shared feed', async () => {
  const booking = jest.fn(), options = jest.fn(), image = jest.fn();
  await render(<PortfolioPost item={{ ...item, service: { id: 'service-1', name: 'Makeup cô dâu', durationMinutes: 60, serviceId: 'service-1', serviceName: 'Makeup cô dâu', price: 300000, description: 'Trang điểm cô dâu' } }} onAddService={booking} onOptions={options} onImagePress={image} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Đặt dịch vụ' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Tùy chọn bài viết' }));
  await fireEvent(screen.getByTestId('post-gallery'), 'layout', { nativeEvent: { layout: { width: 320, height: 400, x: 0, y: 0 } } });
  await fireEvent.press(screen.getByRole('button', { name: 'Xem ảnh 1' }));
  expect(booking).toHaveBeenCalledTimes(1);
  expect(options).toHaveBeenCalledTimes(1);
  expect(image).toHaveBeenCalledWith(item.imageUrl);
});
