import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafetyButton } from '../SafetyButton';

jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: jest.fn() }) }));
jest.mock('../../../store/useAuthStore', () => ({ useAuthStore: (selector: any) => selector({ user: { id: 'viewer' } }) }));
jest.mock('../../../services/moderationService', () => ({ moderationService: { block: jest.fn() } }));
jest.mock('../../../services/api', () => ({ getApiError: () => ({ message: 'Error' }) }));
jest.mock('../../ui/dialogStore', () => ({ AppAlert: { alert: jest.fn() } }));
jest.mock('../../ui/ActionSheet', () => ({ ActionSheet: ({ visible, actions }: any) => {
  const { Text, TouchableOpacity } = jest.requireActual('react-native');
  return visible ? actions.map((action: any) => <TouchableOpacity key={action.id} onPress={action.onPress}><Text>{action.label}</Text></TouchableOpacity>) : null;
} }));
jest.mock('../ReportSheet', () => ({ ReportSheet: ({ target }: any) => {
  const { Text } = jest.requireActual('react-native');
  return target ? <Text>{`Report:${target.type}:${target.id}`}</Text> : null;
} }));

it('allows reporting retained review content without user report or block actions', async () => {
  await render(<SafetyButton target={{ type: 'Review', id: 'review' }} ownerId="deleted" ownerDeleted />);
  await fireEvent.press(screen.getByRole('button', { name: 'Báo cáo nội dung' }));
  expect(screen.queryByText('Báo cáo người dùng')).toBeNull();
  expect(screen.queryByText('Chặn người dùng')).toBeNull();
  await fireEvent.press(screen.getByText('Báo cáo nội dung'));
  expect(screen.getByText('Report:Review:review')).toBeTruthy();
});

it('preserves all safety actions for active accounts', async () => {
  await render(<SafetyButton target={{ type: 'Comment', id: 'comment' }} ownerId="active" />);
  await fireEvent.press(screen.getByRole('button', { name: 'Báo cáo hoặc chặn người dùng' }));
  expect(screen.getByText('Báo cáo nội dung')).toBeTruthy();
  expect(screen.getByText('Báo cáo người dùng')).toBeTruthy();
  expect(screen.getByText('Chặn người dùng')).toBeTruthy();
});
