import { matchMuaArea, muaAreas, normalizeAreaName } from '../muaAreas';

describe('MUA operating areas', () => {
  it('matches geocoded city and district regardless of accents and prefixes', () => {
    const result = matchMuaArea('Ho Chi Minh', null, 'Binh Thanh');
    expect(result.province?.name).toBe('Thành phố Hồ Chí Minh');
    expect(result.district?.name).toBe('Quận Bình Thạnh');
  });
  it('does not guess a district when geocoding gives no matching result', () => {
    expect(matchMuaArea('Hà Nội', null, 'Unknown').district).toBeUndefined();
    expect(matchMuaArea('Unknown').province).toBeUndefined();
  });
  it('contains the full legacy region catalog with district lists', () => {
    expect(muaAreas).toHaveLength(63);
    expect(muaAreas.every(area => area.districts.length > 0)).toBe(true);
    expect(normalizeAreaName('TP. Hồ Chí Minh')).toBe('ho chi minh');
  });
});
