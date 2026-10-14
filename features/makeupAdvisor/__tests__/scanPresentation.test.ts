import {INVALID_SCAN_PRESENTATION_MS,SCAN_PRESENTATION_MS,waitForScanPresentation} from '../scanPresentation';
beforeEach(()=>jest.useFakeTimers());
afterEach(()=>jest.useRealTimers());
test('valid and invalid scans have explicit 10s and 5s presentation windows',async()=>{
 expect(SCAN_PRESENTATION_MS).toBe(10000);expect(INVALID_SCAN_PRESENTATION_MS).toBe(5000);
 const done=jest.fn();const waiting=waitForScanPresentation(Date.now(),new AbortController().signal,INVALID_SCAN_PRESENTATION_MS).then(done);
 await jest.advanceTimersByTimeAsync(4999);expect(done).not.toHaveBeenCalled();
 await jest.advanceTimersByTimeAsync(1);await waiting;expect(done).toHaveBeenCalledTimes(1);
});
test('fast analysis retains presentation until minimum duration',async()=>{
 const start=Date.now();jest.advanceTimersByTime(100);
 const done=jest.fn();const waiting=waitForScanPresentation(start,new AbortController().signal).then(done);
 await jest.advanceTimersByTimeAsync(SCAN_PRESENTATION_MS-101);expect(done).not.toHaveBeenCalled();
 await jest.advanceTimersByTimeAsync(1);await waiting;expect(done).toHaveBeenCalledTimes(1);expect(jest.getTimerCount()).toBe(0);
});
test('slow analysis adds no extra delay',async()=>{
 const start=Date.now();jest.advanceTimersByTime(SCAN_PRESENTATION_MS+500);
 await waitForScanPresentation(start,new AbortController().signal);expect(jest.getTimerCount()).toBe(0);
});
test('reset/background cancellation ends wait and removes timer',async()=>{
 const controller=new AbortController();const waiting=waitForScanPresentation(Date.now(),controller.signal);
 controller.abort();await waiting;expect(jest.getTimerCount()).toBe(0);
 await waitForScanPresentation(Date.now(),controller.signal);expect(jest.getTimerCount()).toBe(0);
});
