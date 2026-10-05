import { ApiMuaProfileRepository } from '../ApiMuaProfileRepository';
import { api } from '../../services/api';

jest.mock('../../services/api', () => ({ api: { get: jest.fn() } }));
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
