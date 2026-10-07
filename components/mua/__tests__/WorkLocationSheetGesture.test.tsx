import 'react-native-gesture-handler/jestSetup';
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Animated } from 'react-native';
import { State } from 'react-native-gesture-handler';
import { OverlayProvider } from '../../ui/OverlayProvider';
import { WorkLocationFields } from '../WorkLocationFields';

jest.mock('../../../services/locationService', () => ({ getCurrentLocationCandidate: jest.fn(), reverseLocation: jest.fn() }));
let mockPanProps: { onHandlerStateChange: (event: any) => void };
jest.mock('react-native-gesture-handler', () => ({
  ...jest.requireActual('react-native-gesture-handler'),
  PanGestureHandler: ({ children, ...props }: any) => { mockPanProps = props; return children; },
}));
const changed = jest.fn();
const Wrapper = ({ children }: React.PropsWithChildren) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } }}><OverlayProvider>{children}</OverlayProvider></SafeAreaProvider>;
beforeEach(() => {
  jest.clearAllMocks();
  // Jest has no native animation completion event. Complete the animation,
  // while still dispatching real RNGH state/gesture events below.
  jest.spyOn(Animated, 'timing').mockImplementation(() => ({ start: callback => callback?.({ finished: true }), stop: jest.fn(), reset: jest.fn() }));
});
afterEach(() => jest.restoreAllMocks());
async function open() {
  await render(<WorkLocationFields value={{ city: 'City', workLocationAddress: 'Confirmed old address' }} onChange={changed} />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Thay đổi vị trí' }));
}
it.each(['X', 'Back', 'backdrop'])('dismisses by %s without committing edited manual draft', async close => {
  await open(); await fireEvent.press(screen.getByRole('button', { name: 'Nhập vị trí thủ công' }));
  await fireEvent.changeText(screen.getByLabelText('Địa chỉ hoạt động'), 'Unconfirmed new address');
  if (close === 'X') await fireEvent.press(screen.getByRole('button', { name: 'Đóng chọn vị trí' }));
  else if (close === 'Back') await fireEvent(screen.getByTestId('app-overlay-host'), 'requestClose', {});
  else await fireEvent.press(screen.getByTestId('sheet-backdrop'));
  expect(changed).not.toHaveBeenCalled();
  expect(screen.queryByLabelText('Địa chỉ hoạt động')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Thay đổi vị trí' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Nhập vị trí thủ công' }));
  expect(screen.getByLabelText('Địa chỉ hoạt động').props.value).toBe('Confirmed old address');
});
it('short drag snaps back, sufficient drag dismisses even while manual input is focused', async () => {
  await open(); await fireEvent.press(screen.getByRole('button', { name: 'Nhập vị trí thủ công' }));
  await fireEvent(screen.getByLabelText('Địa chỉ hoạt động'), 'focus');
  await drag(30);
  expect(screen.getByLabelText('Địa chỉ hoạt động')).toBeTruthy();
  await drag(200);
  expect(Animated.timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ duration: 180, useNativeDriver: true }));
  await waitFor(() => expect(screen.queryByLabelText('Địa chỉ hoạt động')).toBeNull()); expect(changed).not.toHaveBeenCalled();
});

async function drag(distance: number) {
  // Expo's Jest native adapter does not route native gesture events. Exercise
  // the actual registered RNGH callback; phone QA covers native recognition.
  for (const [state, oldState, translationY] of [[State.BEGAN, State.UNDETERMINED, 0], [State.ACTIVE, State.BEGAN, distance], [State.END, State.ACTIVE, distance]]) {
    await act(async () => { mockPanProps.onHandlerStateChange({ nativeEvent: { state, oldState, translationY, velocityY: 0 } }); });
  }
}
