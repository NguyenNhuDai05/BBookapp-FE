import {removeExpiredAdvisorPhotos} from '../faceAnalysis';
import * as FS from 'expo-file-system/legacy';
jest.mock('expo-modules-core',()=>({...jest.requireActual('expo-modules-core'),requireOptionalNativeModule:()=>null}));
jest.mock('expo-image-manipulator',()=>({}));
jest.mock('expo-file-system/legacy',()=>({cacheDirectory:'file:///cache/',readDirectoryAsync:jest.fn(),getInfoAsync:jest.fn(),deleteAsync:jest.fn().mockResolvedValue(undefined)}));
beforeEach(()=>jest.clearAllMocks());
test('sweeps only expired advisor-owned JPEGs, preserving unrelated and recent cache',async()=>{
 jest.mocked(FS.readDirectoryAsync).mockResolvedValue(['bbook-normalized-old.jpg','bbook-normalized-recent.jpg','avatar.jpg','ImagePicker','../private.jpg']);
 jest.mocked(FS.getInfoAsync).mockImplementation(async uri=>({exists:true,isDirectory:false,uri,size:10,modificationTime:uri.includes('old')?1:9999}));
 await removeExpiredAdvisorPhotos(10000*1000);
 expect(FS.deleteAsync).toHaveBeenCalledTimes(1);expect(FS.deleteAsync).toHaveBeenCalledWith('file:///cache/bbook-normalized-old.jpg',{idempotent:true});
 expect(FS.getInfoAsync).toHaveBeenCalledTimes(2);
});
test('cache eviction failure does not block access',async()=>{
 jest.mocked(FS.readDirectoryAsync).mockRejectedValue(new Error('cache unavailable'));
 await expect(removeExpiredAdvisorPhotos()).resolves.toBeUndefined();
});
