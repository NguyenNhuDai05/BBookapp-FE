import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { PrivateMediaImage } from '../PrivateMediaImage';
import { api } from '../../services/api';
jest.mock('../../services/api', () => ({ api: { get: jest.fn() } }));
jest.mock('expo-image', () => ({ Image: (props: any) => require('react').createElement(require('react-native').Image, { ...props, testID: 'private-image' }) }));
beforeEach(() => jest.clearAllMocks());

it('renews an expired link using authenticated media access and disables disk cache', async () => {
  jest.mocked(api.get).mockResolvedValueOnce({ data: { url: 'https://example.test/renewed' } });
  await render(<PrivateMediaImage uri="https://example.test/expired" mediaId="owned-id" />);
  expect(screen.getByTestId('private-image').props.cachePolicy).toBe('none');
  await fireEvent(screen.getByTestId('private-image'), 'error');
  await waitFor(() => expect(screen.getByTestId('private-image').props.source.uri).toBe('https://example.test/renewed'));
  expect(api.get).toHaveBeenCalledWith('/verification-media/owned-id/access');
});

it('shows retry on denied access without falling back to a public URL', async () => {
  jest.mocked(api.get).mockRejectedValueOnce(new Error('denied'));
  await render(<PrivateMediaImage mediaId="other-user-id" />);
  await waitFor(() => expect(screen.getByLabelText('Tải lại ảnh riêng tư')).toBeTruthy());
  expect(screen.queryByTestId('private-image')).toBeNull();
  expect(api.get).toHaveBeenCalledTimes(1);
});
