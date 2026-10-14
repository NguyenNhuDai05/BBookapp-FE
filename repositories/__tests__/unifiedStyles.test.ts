import { ApiMuaServicesRepository } from '../ApiMuaServicesRepository';
import { ApiMuaProfileRepository } from '../ApiMuaProfileRepository';
import { api } from '../../services/api';

jest.mock('../../services/api', () => ({ api: { get: jest.fn(), put: jest.fn(), post: jest.fn() } }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: { getState: () => ({ user: { id: 'mua-1' } }) } }));
beforeEach(() => jest.clearAllMocks());
it('reads service IDs, inactive history and legacy text from the accepted response', async () => {
  jest.mocked(api.get).mockResolvedValue({ data: [{ serviceId: 's', serviceName: 'Service', durationMinutes: 60, price: 100, tags: ['Occasion'], styleIds: [7], styleTags: [{ styleId: 7, name: 'Old', isActive: false }] }] });
  expect(await new ApiMuaServicesRepository().getServices('me')).toEqual([expect.objectContaining({ id: 's', tags: ['Occasion'], styleIds: [7], styleTags: [{ styleId: 7, name: 'Old', isActive: false }] })]);
});
it('passes ID create contract and stable requestId without injecting raw tags', async () => {
  jest.mocked(api.post).mockResolvedValue({ data: { service: { serviceId: 'request', durationMinutes: 60, price: 100, styleIds: [7, 8] } } });
  const payload = { serviceName: 'Service', durationMinutes: 60, price: 100, styleIds: [7], newStyleNames: ['New'], requestId: 'request' };
  await new ApiMuaServicesRepository().createService('me', payload);
  expect(api.post).toHaveBeenCalledWith('/Mua/mua-1/service', payload);
  expect(jest.mocked(api.post).mock.calls[0][1]).not.toHaveProperty('tags');
});
it('keeps omission different from explicit empty service styles', async () => {
  jest.mocked(api.put).mockResolvedValue({});
  const repository = new ApiMuaServicesRepository();
  const payload = { serviceName: 'Service', durationMinutes: 60, price: 100 };
  await repository.updateService('s', payload);
  expect(jest.mocked(api.put).mock.calls[0][1]).not.toHaveProperty('styleIds');
  await repository.updateService('s', { ...payload, styleIds: [] });
  expect(api.put).toHaveBeenLastCalledWith('/Mua/service/s', { ...payload, styleIds: [] });
});
it('saves profile IDs and draft names in the final profile request', async () => {
  jest.mocked(api.put).mockResolvedValue({});
  await new ApiMuaProfileRepository().updateProfile({ styleIds: [7], newStyleNames: ['New'] });
  expect(api.put).toHaveBeenCalledWith('/Mua/profile', { styleIds: [7], newStyleNames: ['New'] });
});
