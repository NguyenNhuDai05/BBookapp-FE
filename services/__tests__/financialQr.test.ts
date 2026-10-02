jest.mock('../api', () => ({ api: { post: jest.fn() } }));
import { api } from '../api';
import { uploadBankQr } from '../supabase';

it('returns only decoded fields, discarding legacy public URLs and raw QR payload', async () => {
  (api.post as jest.Mock).mockResolvedValue({ data: {
    method: 'MOMO', bankBin: 'MOMO', accountNumber: '0912345678', accountName: null,
    requiresManualAccountName: true, requiresManualAccountNumber: false,
    url: 'https://test.invalid/storage/v1/object/public/images/old.png', rawPayload: 'private-test-payload',
  } });
  const decoded = await uploadBankQr('file:///test-qr.png');
  expect(api.post).toHaveBeenCalledWith('/Upload/bank-qr', expect.any(FormData));
  expect(decoded).toEqual({ method: 'MOMO', bankBin: 'MOMO', accountNumber: '0912345678', accountName: null, requiresManualAccountName: true, requiresManualAccountNumber: false });
  expect(JSON.stringify(decoded)).not.toMatch(/object\/public|rawPayload|private-test-payload/);
});
