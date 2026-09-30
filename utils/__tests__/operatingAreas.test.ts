import { matchOperatingArea, operatingCatalog, restoreOperatingArea } from '../operatingAreas';

it('maps old province and district into a modern province without dropping the district', () => {
  const area = restoreOperatingArea({ city: 'Bình Dương', provinceCode: 74, districtCode: 718 });
  expect(area.operatingProvinceCode).toBe(79);
  expect(area.operatingAreaIds).toEqual(['legacy-district:718']);
});
it('does not resurrect a removed legacy district', () => {
  expect(restoreOperatingArea({ city: 'HCM', operatingProvinceCode: 79, districtCode: 765, operatingAreaIds: [] }).operatingAreaIds).toEqual([]);
});
it('has complete current provinces and all legacy districts under their merged provinces', () => {
  expect(operatingCatalog.provinces).toHaveLength(34);
  expect(new Set(operatingCatalog.provinces.flatMap(p => p.legacyProvinceCodes)).size).toBe(63);
  expect(operatingCatalog.provinces.find(p => p.code === 79)?.areas.some(a => a.name === 'Quận Bình Thạnh')).toBe(true);
});
it('matches accented legacy geocoding names to the new parent', () => {
  expect(matchOperatingArea(['Binh Duong Province', 'Thu Dau Mot']).province?.code).toBe(79);
  expect(matchOperatingArea(['Ho Chi Minh', 'Quan Binh Thanh']).area?.id).toBe('legacy-district:765');
  expect(matchOperatingArea(['Ho Chi Minh', 'Binh Thanh']).area).toBeUndefined();
});
