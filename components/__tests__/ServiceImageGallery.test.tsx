import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ServiceImageGallery } from '../ServiceImageGallery';

const images = ['https://example.test/portrait.jpg', 'https://example.test/landscape.jpg', 'https://example.test/third.jpg'];

it('shows all uploaded service photos without cropping and allows selecting another photo', async () => {
  await render(<ServiceImageGallery imageUrls={images} imageUrl={images[0]} />);
  for (let i = 0; i < images.length; i++) {
    const photo = screen.getByLabelText(`Ảnh dịch vụ ${i + 1}/3`);
    expect(photo.props.source.uri).toBe(images[i]);
    expect(photo.props.resizeMode).toBe('contain');
  }
  expect(screen.getByText('1/3')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Xem ảnh dịch vụ 3'));
  expect(screen.getByText('3/3')).toBeTruthy();
  expect(screen.getByLabelText('Xem ảnh dịch vụ 3').props.accessibilityState.selected).toBe(true);
});

it('tracks the photo index after swiping inside a sheet narrower than the screen', async () => {
  await render(<ServiceImageGallery imageUrls={images} />);
  await fireEvent(screen.getByTestId('service-image-gallery'), 'layout', { nativeEvent: { layout: { width: 240 } } });
  const pager = screen.getByTestId('service-image-pager');
  const width = screen.getByLabelText('Ảnh dịch vụ 1/3').props.style.width;
  expect(width).toBe(240);
  await fireEvent(pager, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: width } } });
  expect(screen.getByText('2/3')).toBeTruthy();
});

it('resets to the first photo when opening another service', async () => {
  const view = await render(<ServiceImageGallery imageUrls={images} />);
  await fireEvent.press(screen.getByLabelText('Xem ảnh dịch vụ 3'));
  await view.rerender(<ServiceImageGallery imageUrls={images.slice(0, 2)} />);
  expect(screen.getByText('1/2')).toBeTruthy();
});

it('supports older services saved with a single imageUrl', async () => {
  await render(<ServiceImageGallery imageUrl={images[0]} />);
  expect(screen.getByLabelText('Ảnh dịch vụ 1/1').props.source.uri).toBe(images[0]);
  expect(screen.queryByText('Vuốt để xem tất cả ảnh')).toBeNull();
});

it('does not append a stale cover image when the gallery already has the selected photos', async () => {
  await render(<ServiceImageGallery imageUrls={images.slice(1)} imageUrl={images[0]} />);
  expect(screen.getByLabelText('Ảnh dịch vụ 1/2').props.source.uri).toBe(images[1]);
  expect(screen.queryByLabelText('Ảnh dịch vụ 3/3')).toBeNull();
});

it('shows the placeholder when a service has no images', async () => {
  await render(<ServiceImageGallery imageUrls={[]} />);
  expect(screen.getByLabelText('Dịch vụ chưa có ảnh')).toBeTruthy();
  expect(screen.queryByTestId('service-image-pager')).toBeNull();
});
