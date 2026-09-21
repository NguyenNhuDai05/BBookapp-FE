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

  return errors;
};
