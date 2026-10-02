import React from 'react';
import * as picker from 'expo-image-picker';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SetupScreen from '../mua-onboarding/setup';
import IdentityScreen from '../(mua)/identity-verification';

const mockPush = jest.fn();
const mockSave = jest.fn(async () => ({}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }) }));
jest.mock('expo-image-picker', () => ({
  CameraType: { front: 'front', back: 'back' },
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchCameraAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: 'file:///new-camera.jpg' }] })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: 'file:///new-library.jpg' }] })),
}));
jest.mock('../../services/verificationMediaService', () => ({ uploadVerificationImage: jest.fn(async (_uri: string, purpose: string) => `new-${purpose}-id`) }));
jest.mock('../../services/api', () => ({ getApiError: () => ({ message: 'Lỗi' }) }));
jest.mock('../../components/ui/dialogStore', () => ({ AppAlert: { alert: jest.fn() } }));
jest.mock('../../hooks/useMuaEligibility', () => ({
  useMuaEligibility: () => ({ data: { completionPercentage: 100, verificationStatus: 'Draft', missingRequirements: [], requirements: [
    { key: 'identityVerification', label: 'Danh tính', isMet: true },
    { key: 'activeService', label: 'Dịch vụ', isMet: true },
    { key: 'bankAccount', label: 'Ngân hàng', isMet: true },
  ] }, refetch: jest.fn() }),
  useSubmitMuaForReview: () => ({ mutate: jest.fn() }),
  useMuaIdentity: () => ({ data: { identityFrontMediaId: 'front-id', identityBackMediaId: 'back-id', portraitMediaId: 'portrait-id', certificateMediaIds: ['certificate-id'], identityFrontUrl: 'https://example.com/front.jpg', identityBackUrl: 'https://example.com/back.jpg', portraitUrl: 'https://example.com/portrait.jpg', certificateUrls: ['https://example.com/certificate.jpg'] } }),
  useSaveMuaIdentity: () => ({ mutateAsync: mockSave, isPending: false }),
}));

it('allows completed checklist items to be opened for editing', async () => {
  await render(<SetupScreen />);
  await fireEvent.press(screen.getByText('Danh tính'));
  expect(mockPush).toHaveBeenLastCalledWith('/(mua)/identity-verification');
  await fireEvent.press(screen.getByText('Dịch vụ'));
  expect(mockPush).toHaveBeenLastCalledWith('/(mua)/services');
  await fireEvent.press(screen.getByText('Ngân hàng'));
  expect(mockPush).toHaveBeenLastCalledWith('/(mua)/bank-accounts');
});

it('loads existing identity photos and preserves certificates when saving again', async () => {
  await render(<IdentityScreen />);
  expect(screen.getAllByText('Thay ảnh')).toHaveLength(2);
  await fireEvent.press(screen.getByLabelText('Tiếp theo'));
  expect(screen.getByText('Chụp lại khuôn mặt')).toBeTruthy();
  await fireEvent.press(screen.getByText('Lưu xác minh'));
  await fireEvent.press(screen.getByText('Lưu xác minh'));
  expect(mockSave).toHaveBeenCalledTimes(2);
  expect(mockSave).toHaveBeenLastCalledWith({ identityFrontMediaId: 'front-id', identityBackMediaId: 'back-id', portraitMediaId: 'portrait-id', certificateMediaIds: ['certificate-id'] });
});


it('requests camera only on demand and uses the front camera for face capture', async () => {
  jest.mocked(picker.requestCameraPermissionsAsync).mockClear();
  await render(<IdentityScreen />);
  expect(picker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
  expect(screen.queryByText('Ngân hàng')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Thay ảnh Mặt trước'));
  await fireEvent.press(screen.getByText('Chụp ảnh'));
  expect(picker.launchCameraAsync).toHaveBeenLastCalledWith(expect.objectContaining({ cameraType: 'back' }));
  await fireEvent.press(screen.getByLabelText('Tiếp theo'));
  await fireEvent.press(screen.getByText('Chụp lại khuôn mặt'));
  expect(picker.launchCameraAsync).toHaveBeenLastCalledWith(expect.objectContaining({ cameraType: 'front' }));
});

it('allows selecting a document from the device and preserves the other photos', async () => {
  await render(<IdentityScreen />);
  await fireEvent.press(screen.getByLabelText('Thay ảnh Mặt trước'));
  await fireEvent.press(screen.getByText('Chọn từ máy'));
  await fireEvent.press(screen.getByLabelText('Tiếp theo'));
  await fireEvent.press(screen.getByLabelText('Lưu xác minh'));
  expect(mockSave).toHaveBeenLastCalledWith({ identityFrontMediaId: 'new-identity-front-id', identityBackMediaId: 'back-id', portraitMediaId: 'portrait-id', certificateMediaIds: ['certificate-id'] });
});
