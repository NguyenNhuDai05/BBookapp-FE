import { renderHook, act } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { useSessionRecovery } from '../useSessionRecovery';
import { useAuthStore } from '../../store/useAuthStore';

jest.mock('../../store/useAuthStore', () => ({
  useAuthStore: jest.requireActual('zustand').create(() => ({ sessionError: null, initialize: jest.fn() })),
}));
let onChange: (state: AppStateStatus) => void;
const remove = jest.fn();
const initialize = jest.fn();
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    onChange = listener; return { remove };
  });
  initialize.mockResolvedValue(false);
  useAuthStore.setState({ sessionError: 'unavailable', initialize });
});
afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

it('automatically retries repeated failures with a bounded delay and stops after recovery', async () => {
  const hook = await renderHook(() => useSessionRecovery());
  for (const delay of [3000, 6000, 12000, 15000, 15000]) {
    const before = initialize.mock.calls.length;
    await act(async () => { await jest.advanceTimersByTimeAsync(delay); });
    expect(initialize).toHaveBeenCalledTimes(before + 1);
  }
  initialize.mockImplementationOnce(async () => { useAuthStore.setState({ sessionError: null }); return true; });
  await act(async () => { await jest.advanceTimersByTimeAsync(15000); });
  expect(initialize).toHaveBeenCalledTimes(6);
  await act(async () => { await jest.advanceTimersByTimeAsync(60000); });
  expect(initialize).toHaveBeenCalledTimes(6);
  await hook.unmount();
});

it('pauses in background, retries immediately on resume and never overlaps a pending read', async () => {
  let finish!: (value: boolean) => void;
  initialize.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const hook = await renderHook(() => useSessionRecovery());
  await act(async () => { onChange('background'); await jest.advanceTimersByTimeAsync(60000); });
  expect(initialize).not.toHaveBeenCalled();
  await act(async () => { onChange('active'); onChange('background'); onChange('active'); await jest.advanceTimersByTimeAsync(60000); });
  expect(initialize).toHaveBeenCalledTimes(1);
  await act(async () => { finish(false); });
  await act(async () => { await jest.advanceTimersByTimeAsync(3000); });
  expect(initialize).toHaveBeenCalledTimes(2);
  await hook.unmount();
});

it('cleans up a pending retry on unmount even if the session read finishes later', async () => {
  let finish!: (value: boolean) => void;
  initialize.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const hook = await renderHook(() => useSessionRecovery());
  await act(async () => { await jest.advanceTimersByTimeAsync(3000); });
  await hook.unmount();
  finish(false);
  await jest.advanceTimersByTimeAsync(60000);
  expect(initialize).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledTimes(1);
});

it('starts recovery only after a session check fails', async () => {
  useAuthStore.setState({ sessionError: null });
  const hook = await renderHook(() => useSessionRecovery());
  await act(async () => { await jest.advanceTimersByTimeAsync(60000); });
  expect(initialize).not.toHaveBeenCalled();
  await act(async () => { useAuthStore.setState({ sessionError: 'offline' }); });
  await act(async () => { await jest.advanceTimersByTimeAsync(3000); });
  expect(initialize).toHaveBeenCalledTimes(1);
  await hook.unmount();
});
