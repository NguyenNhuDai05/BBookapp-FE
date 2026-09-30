export type BankVerificationStatus = 'PENDING_ADMIN' | 'APPROVED' | 'REJECTED' | string;

export interface BankUsability {
  isDefault?: boolean;
  verificationStatus: BankVerificationStatus;
  isActive?: boolean;
  activatedAt?: string | null;
  isCoolingDown: boolean;
  isUsable: boolean;
  canReceiveMoney: boolean;
  unavailableReason?: string | null;
}

export const getBankAccountPresentation = (account: BankUsability) => {
  if (account.isActive === false) return { label: 'Không hoạt động', selectable: false };
  if (account.verificationStatus === 'REJECTED') return { label: 'Đã bị từ chối', selectable: false };
  if (account.verificationStatus === 'PENDING_ADMIN') return { label: 'Đang chờ admin duyệt', selectable: false };
  if (account.verificationStatus === 'APPROVED' && account.isCoolingDown) {
    return {
      label: account.activatedAt
        ? `Đã duyệt — có thể sử dụng sau ${new Date(account.activatedAt).toLocaleString('vi-VN')}`
        : 'Đã duyệt — đang trong thời gian bảo vệ 24 giờ',
      selectable: false,
    };
  }
  if (account.isUsable && account.canReceiveMoney) return { label: 'Có thể nhận tiền', selectable: true };
  return { label: 'Chưa thể nhận tiền', selectable: false };
};

export const isBankAccountSelectable = (account?: BankUsability) =>
  Boolean(account?.isUsable && account.canReceiveMoney && account.isActive !== false);

export const isEffectiveBankDefault = (account?: BankUsability) =>
  Boolean(account?.isDefault && isBankAccountSelectable(account));

export const canOfferBankDefault = (account?: BankUsability) =>
  isBankAccountSelectable(account) && !isEffectiveBankDefault(account);

export const canChooseBankDefault = (editing: boolean, account?: BankUsability) =>
  editing && isBankAccountSelectable(account);

export const bankDefaultRequestValue = (editing: boolean, requested: boolean, account?: BankUsability) =>
  canChooseBankDefault(editing, account) && requested;

export const canSubmitWithdraw = (backendCanWithdraw: boolean, account?: BankUsability) =>
  backendCanWithdraw && isBankAccountSelectable(account);

const bankErrors: Record<string, string> = {
  SENSITIVE_AUTH_REQUIRED: 'Mật khẩu xác nhận không đúng.',
  BANK_ACCOUNT_PENDING_APPROVAL: 'Tài khoản nhận tiền đang chờ admin duyệt.',
  BANK_ACCOUNT_REJECTED: 'Tài khoản nhận tiền đã bị từ chối.',
  BANK_ACCOUNT_COOLDOWN: 'Tài khoản đã được duyệt nhưng vẫn đang trong thời gian bảo vệ 24 giờ.',
  BANK_ACCOUNT_NOT_FOUND: 'Không tìm thấy tài khoản nhận tiền đang hoạt động.',
  BANK_ACCOUNT_NOT_USABLE_AS_DEFAULT: 'Chỉ tài khoản đã được duyệt và hết thời gian bảo vệ mới có thể đặt làm mặc định.',
  BANK_REVIEW_NOT_ALLOWED: 'Tài khoản không còn chờ duyệt.',
};

export const getBankAccountErrorMessage = (code: string | undefined, fallback: string) =>
  (code && bankErrors[code]) || fallback;
