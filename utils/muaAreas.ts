import data from '../data/vietnamAreas.json';

export const muaAreas = data;
export const normalizeAreaName = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
  .replace(/^(thanh pho|tinh|quan|huyen|thi xa|tp\.?|q\.?)\s*/g, '').replace(/\s+/g, ' ').trim();

export function matchMuaArea(region?: string | null, city?: string | null, district?: string | null) {
  const candidates = [region, city].filter((value): value is string => !!value).map(normalizeAreaName);
  const province = muaAreas.find(item => candidates.includes(normalizeAreaName(item.name)));
  const selectedDistrict = province?.districts.find(item => [district, city].some(value => value && normalizeAreaName(value) === normalizeAreaName(item.name)));
  return { province, district: selectedDistrict };
}

export const EXPERIENCE_LEVELS = [
  { value: 'BEGINNER', label: 'Mới bắt đầu' }, { value: 'UNDER_ONE', label: 'Dưới 1 năm' },
  { value: 'ONE_TO_THREE', label: '1–3 năm' }, { value: 'THREE_TO_FIVE', label: '3–5 năm' },
  { value: 'OVER_FIVE', label: 'Trên 5 năm' },
] as const;

export function getMuaExperienceLabel(level?: string, years = 0) {
  return EXPERIENCE_LEVELS.find(item => item.value === level)?.label || `${years} năm kinh nghiệm`;
}
