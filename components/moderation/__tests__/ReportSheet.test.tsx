import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ReportSheet } from '../ReportSheet';
const mockReport = jest.fn(); const mockAlert = jest.fn();
jest.mock('../../../services/moderationService', () => ({ moderationService: { report: (...args: unknown[]) => mockReport(...args) } }));
jest.mock('../../../services/api', () => ({ getApiError: () => ({ message: 'Không thể gửi' }) }));
jest.mock('../../../store/useAuthStore', () => ({ useAuthStore: (select: (state: unknown) => unknown) => select({ user: { isDemoAccount: false } }) }));
jest.mock('../../ui/dialogStore', () => ({ AppAlert: { alert: (...args: unknown[]) => mockAlert(...args) } }));
jest.mock('../../ui/AppBottomSheet', () => {
  const React = require('react'); const { View } = require('react-native');
  return { AppBottomSheet: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children) };
});
describe('ReportSheet submission', () => {
  beforeEach(() => { mockReport.mockReset(); mockAlert.mockReset(); });
  it('keeps the form open on failure and allows retry without losing the description', async () => {
    const close = jest.fn(); mockReport.mockRejectedValueOnce(new Error('failure')).mockResolvedValueOnce({ id: 'report' });
    await render(<ReportSheet target={{ type: 'Message', id: 'message' }} onClose={close} />);
    await fireEvent.changeText(screen.getByLabelText('Mô tả báo cáo'), 'Please review');
    await fireEvent.press(screen.getByText('Gửi báo cáo'));
    await waitFor(() => expect(mockAlert).toHaveBeenCalledWith('Không thể gửi báo cáo', 'Không thể gửi'));
    expect(close).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText('Gửi báo cáo'));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(mockReport).toHaveBeenLastCalledWith({ type: 'Message', id: 'message' }, 'Inappropriate', 'Please review');
  });
  it('submits only once while the previous request is pending', async () => {
    let finish!: (value: unknown) => void; mockReport.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const close = jest.fn(); await render(<ReportSheet target={{ type: 'Portfolio', id: 'post' }} onClose={close} />);
    const button = screen.getByRole('button'); await fireEvent.press(button); await fireEvent.press(button);
    expect(mockReport).toHaveBeenCalledTimes(1); expect(close).not.toHaveBeenCalled();
    await act(async () => { finish({ id: 'report' }); }); await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  });
});
