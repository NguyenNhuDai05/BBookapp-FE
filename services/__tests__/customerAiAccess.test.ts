import { loadCustomerAiAccess, requireCustomerAiAccess } from '../customerAiAccess';
import { api, getApiError } from '../api';
jest.mock('../api', () => ({ api: { get: jest.fn() }, getApiError: jest.fn((error: { status: number }) => error) }));
const originalFlag = process.env.EXPO_PUBLIC_CUSTOMER_AI_ENABLED;
beforeEach(() => { jest.clearAllMocks(); process.env.EXPO_PUBLIC_CUSTOMER_AI_ENABLED = 'true'; });
afterAll(() => { if (originalFlag === undefined) delete process.env.EXPO_PUBLIC_CUSTOMER_AI_ENABLED; else process.env.EXPO_PUBLIC_CUSTOMER_AI_ENABLED = originalFlag; });
it('does not grant access when the build rollout flag is missing', async () => {
  delete process.env.EXPO_PUBLIC_CUSTOMER_AI_ENABLED;
  jest.mocked(api.get).mockResolvedValue({ data: { hasAccess: true, purchased: false } });
  await expect(requireCustomerAiAccess()).rejects.toMatchObject({ code: 'E_AI_SUBSCRIPTION' });
  expect(api.get).toHaveBeenCalled();
});
it('does not grant free scans when the access endpoint is missing', async () => {
  jest.mocked(api.get).mockRejectedValue({ status: 404 });
  await expect(loadCustomerAiAccess()).rejects.toEqual({ status: 404 });
});
it('accepts only a confirmed purchase', async () => {
  jest.mocked(api.get).mockResolvedValue({ data: { hasAccess: true, purchased: true } });
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
