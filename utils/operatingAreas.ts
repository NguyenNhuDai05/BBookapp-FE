import raw from '../data/operatingAreas.json';
import type { OperatingArea, OperatingCatalog } from '../types/location';
import { normalizeAreaName } from './muaAreas';

export const operatingCatalog: OperatingCatalog = raw;
export function restoreOperatingArea(value: OperatingArea): OperatingArea {
  const province = operatingCatalog.provinces.find(p => value.operatingProvinceCode ? p.code === value.operatingProvinceCode : p.legacyProvinceCodes.includes(value.provinceCode ?? -1));
  return { ...value, operatingProvinceCode: province?.code, city: province?.name || value.city,
    operatingAreaIds: value.operatingAreaIds?.length || value.operatingProvinceCode != null ? value.operatingAreaIds || [] : value.districtCode ? [`legacy-district:${value.districtCode}`] : [] };
}
export function matchOperatingArea(names: (string | null | undefined)[]) {
  const values = names.filter((v): v is string => !!v).map(v => normalizeAreaName(v).replace(/^(phuong|xa|thi tran)\s+/,'').replace(/\s+(province|district|city)$/,''));
  const normalized = (v: string) => normalizeAreaName(v).replace(/^(phuong|xa|thi tran)\s+/,'');
  const province = operatingCatalog.provinces.find(p => values.includes(normalized(p.name)))
    || operatingCatalog.provinces.find(p => p.areas.some(a => a.legacyProvinceName && values.includes(normalized(a.legacyProvinceName))));
  const full = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g,'d').toLowerCase().trim();
  const originalNames = names.filter((v): v is string => !!v).map(full);
  const matches = province?.areas.filter(a => values.includes(normalized(a.name))) || [];
  const exact = matches.filter(a => originalNames.includes(full(a.name)));
  const area = exact.length === 1 ? exact[0] : matches.length === 1 ? matches[0] : undefined;
  return { province, area };
}
