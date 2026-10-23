import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PortfolioPost } from '../PortfolioPost';
import { portfolioFixture } from '../../../../test-utils/portfolioFixture';
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
it('shows saved portfolio tags without reintroducing removed makeup metadata', async () => {
  const item = { ...portfolioFixture(), tags: ['Kỷ yếu', 'Cô dâu', 'Korean', 'Thái'] };
  await render(<PortfolioPost item={item} />);
  expect(screen.queryByText(item.title!)).toBeNull();
  expect(screen.getByText('#Kỷ yếu')).toBeTruthy();
  expect(screen.queryByText('#Thái')).toBeNull();
  expect(screen.queryByText(item.tagging!.primaryStyle!.name!)).toBeNull();
  await fireEvent.press(screen.getByText(/Xem thêm .* tag/));
  expect(screen.getByText('#Thái')).toBeTruthy();
  expect(screen.queryByText(item.tagging!.effects[0].label!)).toBeNull();
  await fireEvent.press(screen.getByText('Thu gọn tag'));
  expect(screen.queryByText('#Thái')).toBeNull();
});
it('does not show structured defaults when all portfolio tags were removed', async () => {
  await render(<PortfolioPost item={{ ...portfolioFixture(), tags: [] }} />);
  expect(screen.queryByTestId('post-hashtags')).toBeNull();
});
