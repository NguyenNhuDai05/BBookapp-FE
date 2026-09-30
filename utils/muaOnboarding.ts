import type { MuaApplicationRequestDto } from '../types/onboarding';

export type MuaOnboardingForm = MuaApplicationRequestDto;

export const shouldUploadMuaAvatar = (uri: string): boolean =>
  /^(file|content|blob):/i.test(uri.trim());

export const validateMuaOnboarding = (
  form: MuaOnboardingForm,
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const phone = form.phoneNumber?.trim();

  if (!form.avatarUrl.trim()) errors.avatarUrl = 'Vui lòng thêm ảnh đại diện.';
  if (form.displayName.trim().length < 2) errors.displayName = 'Tên hiển thị cần ít nhất 2 ký tự.';
  if (phone && !/^\+?[0-9][0-9 .-]{7,19}$/.test(phone)) errors.phoneNumber = 'Số điện thoại không hợp lệ.';
  if (form.city.trim().length < 2) errors.city = 'Vui lòng nhập khu vực làm việc.';
  if (form.bio.length > 500) errors.bio = 'Giới thiệu tối đa 500 ký tự.';
  if (!form.styleIds.length) errors.styleIds = 'Hãy chọn ít nhất một chuyên môn.';
  if (form.styleIds.length > 5) errors.styleIds = 'Chỉ được chọn tối đa 5 phong cách.';
  return errors;
};
