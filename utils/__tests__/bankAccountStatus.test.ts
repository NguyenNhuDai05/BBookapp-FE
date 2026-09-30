import { describe, expect, it } from '@jest/globals';
import { bankDefaultRequestValue, canChooseBankDefault, canOfferBankDefault, canSubmitWithdraw, getBankAccountErrorMessage, getBankAccountPresentation, isBankAccountSelectable, isEffectiveBankDefault } from '../bankAccountStatus';

const account = (overrides: Record<string, unknown> = {}) => ({
  verificationStatus: 'APPROVED', isActive: true, activatedAt: '2026-09-30T00:00:00Z',
  isCoolingDown: false, isUsable: true, canReceiveMoney: true, ...overrides,
});

describe('bank account status presentation', () => {
  it('maps pending status', () => expect(getBankAccountPresentation(account({ verificationStatus: 'PENDING_ADMIN', isUsable: false, canReceiveMoney: false })).label).toBe('Đang chờ admin duyệt'));
  it('maps rejected status', () => expect(getBankAccountPresentation(account({ verificationStatus: 'REJECTED', isUsable: false, canReceiveMoney: false })).label).toBe('Đã bị từ chối'));
  it('maps usable status', () => expect(getBankAccountPresentation(account()).label).toBe('Đã duyệt — Có thể sử dụng'));
  it('disables pending accounts', () => { expect(isBankAccountSelectable(account({ verificationStatus: 'PENDING_ADMIN', isUsable: false }))).toBe(false); });
  it('allows backend-confirmed usable account', () => expect(isBankAccountSelectable(account())).toBe(true));
  it('requires backend CanWithdraw for submit', () => { expect(canSubmitWithdraw(false, account())).toBe(false); expect(canSubmitWithdraw(true, account())).toBe(true); });
  it.each(['BANK_ACCOUNT_PENDING_APPROVAL','BANK_ACCOUNT_REJECTED','BANK_ACCOUNT_NOT_FOUND','OTP_INVALID_OR_EXPIRED','OTP_COOLDOWN','EMAIL_UNAVAILABLE'])('maps backend error %s', code => expect(getBankAccountErrorMessage(code, 'fallback')).not.toBe('fallback'));
  it('allows an approved account even when activatedAt is in the future if backend marks it usable', () => expect(isBankAccountSelectable(account({ activatedAt:'2099-01-01T00:00:00Z' }))).toBe(true));
  it('never requests default while creating', () => expect(bankDefaultRequestValue(false, true, account())).toBe(false));
  it.each([
    { verificationStatus:'PENDING_ADMIN', isUsable:false, canReceiveMoney:false },
    { verificationStatus:'REJECTED', isUsable:false, canReceiveMoney:false },
    { isActive:false, isUsable:false, canReceiveMoney:false },
  ])('hides a stale default badge for an unusable account', overrides => expect(isEffectiveBankDefault(account({ isDefault:true, ...overrides }))).toBe(false));
  it('shows default only for a usable account', () => expect(isEffectiveBankDefault(account({ isDefault:true }))).toBe(true));
  it('cannot choose pending as default', () => {
    expect(canChooseBankDefault(true, account({ verificationStatus:'PENDING_ADMIN', isUsable:false, canReceiveMoney:false }))).toBe(false);
  });
  it('maps the stable default eligibility error', () => expect(getBankAccountErrorMessage('BANK_ACCOUNT_NOT_USABLE_AS_DEFAULT','fallback')).toBe('Chỉ tài khoản đã được duyệt mới có thể đặt làm mặc định.'));
  it('offers set-default only for usable non-default accounts',()=>{expect(canOfferBankDefault(account({isDefault:false}))).toBe(true);expect(canOfferBankDefault(account({isDefault:true}))).toBe(false);expect(canOfferBankDefault(account({verificationStatus:'PENDING_ADMIN',isUsable:false,canReceiveMoney:false}))).toBe(false);});
  it('maps password and admin review errors',()=>{expect(getBankAccountErrorMessage('SENSITIVE_AUTH_REQUIRED','fallback')).toBe('Mật khẩu xác nhận không đúng.');expect(getBankAccountErrorMessage('BANK_REVIEW_NOT_ALLOWED','fallback')).toBe('Tài khoản không còn chờ duyệt.');});
});
