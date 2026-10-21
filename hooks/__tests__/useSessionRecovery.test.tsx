import { renderHook, act } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { useSessionRecovery } from '../useSessionRecovery';
import { useAuthStore } from '../../store/useAuthStore';

jest.mock('../../store/useAuthStore', () => ({ useAuthStore: { getState: jest.fn() } }));

it('retries failed startup once on foreground and removes the listener on unmount', async () => {
  let onChange!: (state: AppStateStatus) => void;
  const remove = jest.fn();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    onChange = listener;
    return { remove };
  });
  const initialize = jest.fn().mockResolvedValue(false);
  jest.mocked(useAuthStore.getState).mockReturnValue({ sessionError: 'unavailable', initialize } as unknown as ReturnType<typeof useAuthStore.getState>);
  const hook = await renderHook(() => useSessionRecovery());
  await act(async () => { onChange('background'); onChange('active'); onChange('active'); });
  expect(initialize).toHaveBeenCalledTimes(1);
  jest.mocked(useAuthStore.getState).mockReturnValue({ sessionError: null, initialize } as unknown as ReturnType<typeof useAuthStore.getState>);
  await act(async () => { onChange('background'); onChange('active'); });
  expect(initialize).toHaveBeenCalledTimes(1);
  await hook.unmount(); expect(remove).toHaveBeenCalledTimes(1);
  jest.restoreAllMocks();
});
