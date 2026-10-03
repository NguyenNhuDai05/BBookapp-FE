import { normalizeMomoPhone, isMomoPhone } from '../momoPhone';
describe('MoMo Vietnamese phone identity',()=>{
 it.each(['0300000000','84300000000','+84300000000'])('canonicalizes %s',value=>{expect(normalizeMomoPhone(value)).toBe('0300000000');expect(isMomoPhone(value)).toBe(true);});
 it.each(['+15555555555','0000000000','849123456789'])('rejects %s',value=>expect(isMomoPhone(value)).toBe(false));
});
