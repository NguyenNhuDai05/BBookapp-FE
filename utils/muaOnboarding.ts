import type { MuaApplicationRequestDto } from '../types/onboarding';
import { validateWorkLocation } from './workLocation';

export type MuaOnboardingForm = MuaApplicationRequestDto;

export const shouldUploadMuaAvatar = (uri: string): boolean =>
  /^(file|content|blob):/i.test(uri.trim());

export const validateMuaOnboarding = (
  form: MuaOnboardingForm,
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const locationError = validateWorkLocation(form);
  if (locationError) errors.workLocation = locationError;
  const phone = form.phoneNumber?.trim();

  if (!form.avatarUrl.trim()) errors.avatarUrl = 'Vui lòng thêm ảnh đại diện.';
  if (form.displayName.trim().length < 2) errors.displayName = 'Tên hiển thị cần ít nhất 2 ký tự.';
  if (phone && !/^\+?[0-9][0-9 .-]{7,19}$/.test(phone)) errors.phoneNumber = 'Số điện thoại không hợp lệ.';
  if (form.city.trim().length < 2) errors.city = 'Vui lòng nhập khu vực làm việc.';
  if (form.bio.length > 500) errors.bio = 'Giới thiệu tối đa 500 ký tự.';
  const count = new Set(form.styleIds).size + new Set((form.newStyleNames || []).map(name => name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase())).size;
  if (!count) errors.styleIds = 'Hãy chọn ít nhất một chuyên môn.';
  if (count > 20) errors.styleIds = 'Chỉ được chọn tối đa 20 phong cách.';
  return errors;
};
