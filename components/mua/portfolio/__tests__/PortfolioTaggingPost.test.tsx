import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PortfolioPost } from '../PortfolioPost';
import { portfolioFixture } from '../../../../test-utils/portfolioFixture';
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
it('shows three resolved labels, expands the rest and does not show the legacy title', async () => {
  const item = portfolioFixture();
  await render(<PortfolioPost item={item} />);
  expect(screen.queryByText(item.title!)).toBeNull();
  expect(screen.getByText(item.tagging!.primaryStyle!.name!)).toBeTruthy();
  expect(screen.queryByText(item.tagging!.effects[0].label!)).toBeNull();
  await fireEvent.press(screen.getByText(/Xem thêm .* tag/));
  expect(screen.getByText(item.tagging!.effects[0].label!)).toBeTruthy();
  await fireEvent.press(screen.getByText('Thu gọn tag'));
  expect(screen.queryByText(item.tagging!.effects[0].label!)).toBeNull();
});
