import { normalizeAccountHolder, VIETNAM_BANKS } from '../constants/banks';
import { normalizeMomoPhone } from '../utils/momoPhone';
import { financialMediaService } from './financialMediaService';
import { uploadBankQr } from './supabase';

export class UnsupportedQrBankError extends Error {}

// Both account forms use the same receiver checks and private MoMo upload.
export async function readReceivingQr(uri: string) {
  const decoded = await uploadBankQr(uri);
  const bank = VIETNAM_BANKS.find(b => decoded.method === 'MOMO' ? b.code === 'MOMO' : b.bin === decoded.bankBin);
  if (!bank) throw new UnsupportedQrBankError('Ngân hàng trong QR chưa được hỗ trợ.');
  if (decoded.method !== 'BANK' && decoded.method !== 'MOMO') throw new Error('Phương thức QR không hợp lệ.');
  if (decoded.method === 'BANK' && !/^\d{5,30}$/.test(decoded.accountNumber || '')) throw new Error('Số tài khoản trong QR không hợp lệ.');
  const financial = decoded.method === 'MOMO' ? await financialMediaService.uploadMomo(uri) : null;
  if (financial?.accountNumber && decoded.accountNumber && normalizeMomoPhone(financial.accountNumber) !== normalizeMomoPhone(decoded.accountNumber)) throw new Error('QR đã thay đổi.');
  return {
    bank,
    // A private MoMo QR is the receiving destination. Its opaque ID is never a phone.
    accountNumber: decoded.method === 'MOMO' ? '' : decoded.accountNumber!,
    holder: normalizeAccountHolder(decoded.accountName || financial?.accountName || ''),
    financialQrMediaId: financial?.financialQrMediaId || '',
    accountNameSource: decoded.accountNameSource,
  };
}
