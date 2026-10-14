import {ensureScanAdmission,logMemoryCheckpoint} from '../faceAnalysis';
const mockNative={admissionDecision:jest.fn(),prepareMemoryGuard:jest.fn(),memoryDiagnostics:jest.fn(),analyze:jest.fn(),normalizeBounded:jest.fn()};
jest.mock('expo-modules-core',()=>({...jest.requireActual('expo-modules-core'),requireOptionalNativeModule:()=>({admissionDecision:()=>mockNative.admissionDecision(),memoryDiagnostics:()=>mockNative.memoryDiagnostics(),prepareMemoryGuard:()=>mockNative.prepareMemoryGuard(),analyze:()=>mockNative.analyze(),normalizeBounded:()=>mockNative.normalizeBounded()})}));
jest.mock('expo-image-manipulator',()=>({}));
jest.mock('expo-file-system/legacy',()=>({}));
beforeEach(()=>jest.clearAllMocks());
test.each([
 ['busy','E_BUSY'],['system_pressure','E_SYSTEM_MEMORY_PRESSURE'],
 ['insufficient_budget','E_MEMORY_BUDGET'],['cleanup_incomplete','E_CLEANUP_PENDING'],['unavailable','E_NATIVE_UNAVAILABLE'],
])('maps native reason %s without bypassing admission', (reason,code)=>{
 mockNative.admissionDecision.mockReturnValue({allowed:false,reason});
 expect(()=>ensureScanAdmission()).toThrow(expect.objectContaining({code}));
 expect(mockNative.prepareMemoryGuard).not.toHaveBeenCalled();
});
test('fresh allowed decision after pressure permits retry without a JS reset',()=>{
 mockNative.admissionDecision.mockReturnValueOnce({allowed:false,reason:'system_pressure'}).mockReturnValueOnce({allowed:true,reason:'allowed'});
 expect(()=>ensureScanAdmission()).toThrow();expect(()=>ensureScanAdmission()).not.toThrow();
});
test('legacy bridge remains fail closed when its guard rejects',()=>{
 mockNative.admissionDecision.mockReturnValue(undefined);mockNative.prepareMemoryGuard.mockReturnValue(false);
 expect(()=>ensureScanAdmission()).toThrow(expect.objectContaining({code:'E_ADVISOR_LIMIT'}));
});

test('memory diagnostics expose only fixed scalars, never unknown data or image paths',()=>{const info=jest.spyOn(console,'info').mockImplementation(()=>undefined);mockNative.memoryDiagnostics.mockReturnValue({checkpoint:'normalize_admission',reason:'insufficient_budget',pssKB:730000,limitKB:786432,uri:'file:///private/selfie.jpg',face:{x:9},token:'secret'});logMemoryCheckpoint();const payload=JSON.parse(info.mock.calls[0][1]);expect(payload).toEqual({pssKB:730000,limitKB:786432,checkpoint:'normalize_admission',reason:'insufficient_budget'});expect(JSON.stringify(payload)).not.toMatch(/selfie|secret|face/);info.mockRestore();});
