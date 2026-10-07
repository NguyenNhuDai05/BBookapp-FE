import { ApiMuaProfileRepository } from '../ApiMuaProfileRepository';
import { api } from '../../services/api';

jest.mock('../../services/api', () => ({ api: { get: jest.fn(), put: jest.fn() } }));
jest.mock('../../store/useAuthStore', () => ({ useAuthStore: { getState: () => ({ user: { id: 'mua-1' } }) } }));

it.each([
  ['Listed', 'Approved', 'LISTED', 'APPROVED'],
  ['Draft', 'Approved', 'DRAFT', 'APPROVED'],
  ['Draft', 'PendingReview', 'DRAFT', 'PENDINGREVIEW'],
])('keeps listing %s separate from verification %s', async (status, verificationStatus, listing, verification) => {
  jest.mocked(api.get).mockResolvedValueOnce({ data: { fullName: 'MUA', avatarUrl: 'https://example.com/avatar.jpg', muaProfile: { muaId: 'mua-1', status, verificationStatus } } });
  const result = await new ApiMuaProfileRepository().getProfile('me');
  expect(result).toMatchObject({ avatarUrl: 'https://example.com/avatar.jpg', verificationStatus: verification, profileStatus: listing });
});

it('saves private operating coordinates without workplace fields or consent', async () => {
  jest.mocked(api.put).mockReset().mockResolvedValue({});
  await new ApiMuaProfileRepository().updateProfile({ latitude: 10.78, longitude: 106.7, operatingLocationConfirmed: true, allowCustomerVisit: false, operatingLocationLabel: 'Phường Bến Thành' });
  const payload = jest.mocked(api.put).mock.calls[0][1] as any;
  expect(payload.latitude).toBe(10.78); expect(payload.operatingLocationLabel).toBe('Phường Bến Thành');
  for (const field of ['workLocationAddress', 'workLocationName', 'allowCustomerVisit', 'clearWorkLocation']) expect(Object.hasOwn(payload, field)).toBe(false);
});
it('clears a workplace then saves a private point with existing contracts', async () => {
  jest.mocked(api.put).mockReset().mockResolvedValue({});
  await new ApiMuaProfileRepository().updateProfile({ clearWorkLocation: true, latitude: 10.78, longitude: 106.7, operatingLocationConfirmed: true, allowCustomerVisit: false });
  expect(api.put).toHaveBeenNthCalledWith(1, '/Mua/profile', { clearWorkLocation: true });
  expect(api.put).toHaveBeenNthCalledWith(2, '/Mua/profile', { latitude: 10.78, longitude: 106.7, operatingLocationConfirmed: true, publicMeetingPoint: false });
});
it('reports a partial write clearly and can retry without false success', async () => {
  jest.mocked(api.put).mockReset().mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('network'));
  const repository = new ApiMuaProfileRepository();
  const data = { clearWorkLocation: true, latitude: 10.78, longitude: 106.7, operatingLocationConfirmed: true, allowCustomerVisit: false };
  await expect(repository.updateProfile(data)).rejects.toThrow('chưa lưu vị trí mới');
  jest.mocked(api.put).mockResolvedValue({}); await expect(repository.updateProfile(data)).resolves.toBeUndefined();
  expect(api.put).toHaveBeenCalledTimes(4);
});
it('does not attempt the second write if clearing failed', async () => {
  jest.mocked(api.put).mockReset().mockRejectedValueOnce(new Error('clear failed'));
  await expect(new ApiMuaProfileRepository().updateProfile({ clearWorkLocation: true, latitude: 10.78, longitude: 106.7, operatingLocationConfirmed: true })).rejects.toThrow('clear failed');
  expect(api.put).toHaveBeenCalledTimes(1);
});
it('legacy owner address and coordinates are read without triggering geocoding or publication', async () => {
  jest.mocked(api.get).mockResolvedValueOnce({ data: { muaProfile: { latitude: 10.78, longitude: 106.7, operatingLocationConfirmed: true, workLocationAddress: 'Private legacy', allowCustomerVisit: false } } });
  expect(await new ApiMuaProfileRepository().getProfile('me')).toMatchObject({ latitude: 10.78, longitude: 106.7, workLocationAddress: 'Private legacy', allowCustomerVisit: false });
});
