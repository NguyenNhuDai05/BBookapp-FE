import type { MuaApplicationRequestDto } from '../types/onboarding';

export type MuaOnboardingForm = MuaApplicationRequestDto;

export const shouldUploadMuaAvatar = (uri: string): boolean =>
  /^(file|content|blob):/i.test(uri.trim());

export const validateMuaOnboarding = (
  form: MuaOnboardingForm,
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const phone = form.phoneNumber.trim();

  if (!form.avatarUrl.trim()) errors.avatarUrl = 'Vui lòng thêm ảnh đại diện.';
  if (form.displayName.trim().length < 2) errors.displayName = 'Tên hiển thị cần ít nhất 2 ký tự.';
  if (!/^\+?[0-9][0-9 .-]{7,19}$/.test(phone)) errors.phoneNumber = 'Số điện thoại không hợp lệ.';
  if (form.city.trim().length < 2) errors.city = 'Vui lòng nhập khu vực làm việc.';
  if (form.bio.trim().length < 10) errors.bio = 'Giới thiệu cần ít nhất 10 ký tự.';
  if (!form.styleIds.length) errors.styleIds = 'Hãy chọn ít nhất một chuyên môn.';
  if (form.address.trim().length < 5) errors.address = 'Vui lòng nhập địa chỉ đầy đủ.';
  if (!form.identityFrontUrl.trim()) errors.identityFrontUrl = 'Vui lòng tải ảnh mặt trước CCCD/CMND.';
  if (!form.identityBackUrl.trim()) errors.identityBackUrl = 'Vui lòng tải ảnh mặt sau CCCD/CMND.';
  if (!form.portraitUrl.trim()) errors.portraitUrl = 'Vui lòng tải ảnh chân dung.';
  if (!form.portfolioUrls.length) errors.portfolioUrls = 'Vui lòng thêm ít nhất một ảnh portfolio.';
  if (!form.services.length || form.services.some(item => item.name.trim().length < 2 || item.price < 0 || item.durationMinutes < 15)) errors.services = 'Vui lòng thêm ít nhất một dịch vụ hợp lệ.';
  if (form.bankAccount.bankCode.trim().length < 2) errors.bankCode = 'Vui lòng chọn ngân hàng.';
  if (!/^[A-Za-z0-9]{5,30}$/.test(form.bankAccount.accountNumber.trim())) errors.accountNumber = 'Số tài khoản không hợp lệ.';
  if (form.bankAccount.accountHolderName.trim().length < 2) errors.accountHolderName = 'Vui lòng nhập tên chủ tài khoản.';

  return errors;
};
