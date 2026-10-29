import { loadCustomerAiAccess, requireCustomerAiAccess } from '../customerAiAccess';
import { api, getApiError } from '../api';
jest.mock('../api', () => ({ api: { get: jest.fn() }, getApiError: jest.fn((error: { status: number }) => error) }));
const originalFlag = process.env.EXPO_PUBLIC_CUSTOMER_AI_ENABLED;
beforeEach(() => { jest.clearAllMocks(); process.env.EXPO_PUBLIC_CUSTOMER_AI_ENABLED = 'true'; });
afterAll(() => { if (originalFlag === undefined) delete process.env.EXPO_PUBLIC_CUSTOMER_AI_ENABLED; else process.env.EXPO_PUBLIC_CUSTOMER_AI_ENABLED = originalFlag; });
it('keeps existing offline scans working without requesting the API while rollout is disabled', async () => {
  delete process.env.EXPO_PUBLIC_CUSTOMER_AI_ENABLED;
  await expect(requireCustomerAiAccess()).resolves.toBeUndefined();
  expect(api.get).not.toHaveBeenCalled();
});
it('retains the free scan flow with an older backend that has no access endpoint', async () => {
  jest.mocked(api.get).mockRejectedValue({ status: 404 });
  expect(await loadCustomerAiAccess()).toMatchObject({ hasAccess: true, purchased: false, enforcementEnabled: false });
  await expect(requireCustomerAiAccess()).resolves.toBeUndefined();
});
it.each([401, 403, 500])('does not treat an auth or server error as free access (%s)', async status => {
  jest.mocked(api.get).mockRejectedValue({ status });
  await expect(requireCustomerAiAccess()).rejects.toEqual({ status });
});
it('blocks a valid response when the backend requires a purchase', async () => {
  jest.mocked(api.get).mockResolvedValue({ data: { hasAccess: false, enforcementEnabled: true } });
  await expect(requireCustomerAiAccess()).rejects.toMatchObject({ code: 'E_AI_SUBSCRIPTION' });
});
