import React from 'react';
import { AppState } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AiMakeupCamera } from '../AiMakeupCamera';
import { deleteAiPhoto } from '../../../services/aiMakeupPhoto';
let mockPermission = { granted: true, canAskAgain: true }; let mockFocused = true;
const mockRequest = jest.fn(); const mockTake = jest.fn();
jest.mock('expo-router', () => ({ useIsFocused: () => mockFocused, useFocusEffect: jest.fn() }));
jest.mock('../../../services/aiMakeupPhoto', () => ({ deleteAiPhoto: jest.fn() }));
jest.mock('expo-camera', () => {
  const React = jest.requireActual<typeof import('react')>('react'); const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const CameraView = React.forwardRef(({ onCameraReady, facing }: { onCameraReady: () => void; facing: string }, ref) => {
    const readySent = React.useRef(false);
    React.useImperativeHandle(ref, () => ({ takePictureAsync: mockTake })); React.useEffect(() => { if (!readySent.current) { readySent.current = true; onCameraReady(); } }, [onCameraReady]);
    return <View testID="front-camera" accessibilityLabel={facing} />;
  });
  CameraView.displayName = 'MockCameraView';
  return { useCameraPermissions: () => [mockPermission, mockRequest], CameraView };
});
beforeEach(() => { jest.clearAllMocks(); mockRequest.mockResolvedValue({ granted: false }); mockPermission = { granted: true, canAskAgain: true }; mockFocused = true; Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' }); mockTake.mockResolvedValue({ uri: 'file:///cache/capture.jpg', width: 1000, height: 1000 }); });
it('renders only the front camera after granted permission and unmounts when unfocused', async () => { const view = await render(<AiMakeupCamera onClose={jest.fn()} onCaptured={jest.fn()} />); expect(screen.getByTestId('front-camera').props.accessibilityLabel).toBe('front'); mockFocused = false; await view.rerender(<AiMakeupCamera onClose={jest.fn()} onCaptured={jest.fn()} />); expect(screen.queryByTestId('front-camera')).toBeNull(); });
it('permission denial never opens camera or requests permission automatically', async () => { mockPermission = { granted: false, canAskAgain: false }; await render(<AiMakeupCamera onClose={jest.fn()} onCaptured={jest.fn()} />); expect(screen.queryByTestId('front-camera')).toBeNull(); expect(mockRequest).not.toHaveBeenCalled(); await fireEvent.press(screen.getByText('Cho phép dùng camera')); expect(mockRequest).toHaveBeenCalledTimes(1); });
it('takes a selfie only on explicit capture then closes', async () => { const captured = jest.fn().mockResolvedValue(undefined); const close = jest.fn(); await render(<AiMakeupCamera onClose={close} onCaptured={captured} />); expect(mockTake).not.toHaveBeenCalled(); await fireEvent.press(screen.getByLabelText('Chụp ảnh selfie')); expect(mockTake).toHaveBeenCalledWith(expect.objectContaining({ exif: false, base64: false })); expect(captured).toHaveBeenCalledWith(expect.objectContaining({ uri: 'file:///cache/capture.jpg' })); expect(close).toHaveBeenCalled(); });
it('late native capture after closing deletes cache and does not publish preview', async () => { let finish!: (photo: unknown) => void; mockTake.mockReturnValue(new Promise(resolve => { finish = resolve; })); const captured = jest.fn(); const view = await render(<AiMakeupCamera onClose={jest.fn()} onCaptured={captured} />); await fireEvent.press(screen.getByLabelText('Chụp ảnh selfie')); await view.unmount(); await act(async () => { finish({ uri: 'file:///cache/late.jpg' }); }); expect(captured).not.toHaveBeenCalled(); expect(deleteAiPhoto).toHaveBeenCalledWith('file:///cache/late.jpg'); });
it('discards a capture completed after app background and foreground', async () => {
  let change!: (state: import('react-native').AppStateStatus) => void;
  const subscription = jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => { change = listener; return { remove: jest.fn() }; });
  let finish!: (photo: unknown) => void; mockTake.mockReturnValue(new Promise(resolve => { finish = resolve; })); const captured = jest.fn();
  const view = await render(<AiMakeupCamera onClose={jest.fn()} onCaptured={captured} />);
  await fireEvent.press(screen.getByLabelText('Chụp ảnh selfie'));
  await act(async () => { change('background'); }); expect(screen.queryByTestId('front-camera')).toBeNull();
  await act(async () => { change('active'); });
  await act(async () => { finish({ uri: 'file:///cache/background.jpg' }); });
  expect(captured).not.toHaveBeenCalled(); expect(deleteAiPhoto).toHaveBeenCalledWith('file:///cache/background.jpg');
  await view.unmount(); subscription.mockRestore();
});
