import { aiMakeupService } from '../aiMakeupService';
import { api } from '../api';
jest.mock('../api', () => ({ api: { get: jest.fn(), post: jest.fn() } }));
beforeEach(() => jest.clearAllMocks());
it('uses shared authenticated client and sends multipart consent without base64 JSON', async () => {
  jest.mocked(api.post).mockResolvedValue({ data: { imageStatus: 'valid' } });
  const append = jest.spyOn(FormData.prototype, 'append');
  const abort = new AbortController();
  await aiMakeupService.analyze({ uri: 'file:///cache/photo.jpg', width: 1000, height: 1000 }, 'makeup-v1', 'soft', 'party', abort.signal);
  expect(api.post).toHaveBeenCalledWith('/ai/makeup-recommendations', expect.any(FormData), expect.objectContaining({ signal: abort.signal, timeout: 70000 }));
  expect(append).toHaveBeenCalledWith('consentVersion', 'makeup-v1');
  expect(append).toHaveBeenCalledWith('consent', 'true');
  expect(append).toHaveBeenCalledWith('image', { uri: 'file:///cache/photo.jpg', name: 'selfie.jpg', type: 'image/jpeg' });
  append.mockRestore();
});
it('passes cancellation to capabilities query', async () => { jest.mocked(api.get).mockResolvedValue({ data: { enabled: false } }); const abort = new AbortController(); expect(await aiMakeupService.capabilities(abort.signal)).toEqual({ enabled: false }); expect(api.get).toHaveBeenCalledWith('/ai/makeup-recommendations/capabilities', { signal: abort.signal }); });
