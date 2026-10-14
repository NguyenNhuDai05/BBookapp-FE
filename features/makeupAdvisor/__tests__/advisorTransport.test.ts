import {AxiosHeaders} from 'axios';
let mockExtra:Record<string,unknown>;
jest.mock('@react-native-async-storage/async-storage',()=>({__esModule:true,default:{getItem:jest.fn()}}));
jest.mock('expo-constants',()=>({__esModule:true,default:{get expoConfig(){return {extra:mockExtra};}}}));
jest.mock('../flags',()=>({advisorEnabled:true}));
beforeEach(()=>{jest.resetModules();jest.clearAllMocks();});
function client(){return require('../advisorTransport');}
test('local mode uses only loopback nonce and strips account token',async()=>{
 mockExtra={advisorTransport:'local',advisorReleaseEnvironment:'local',advisorLocalUrl:'http://127.0.0.1:5088/api',advisorLocalNonce:'A'.repeat(48)};
 const {advisorApi,advisorBackendConfigured}=client();expect(advisorBackendConfigured).toBe(true);
 const config=await advisorApi.interceptors.request.handlers[0].fulfilled({headers:new AxiosHeaders({Authorization:'Bearer stale'})});
 expect(config.headers.get('X-Advisor-Local')).toBe('A'.repeat(48));expect(config.headers.has('Authorization')).toBe(false);
});
test('HTTPS transport forwards actual login token but never nonce or global auth state',async()=>{
 mockExtra={advisorTransport:'https',advisorReleaseEnvironment:'closed-test',advisorBackendUrl:'https://advisor.example/api',advisorLocalNonce:'stale'};
 const storage=require('@react-native-async-storage/async-storage').default;storage.getItem.mockResolvedValue('fixture-account-jwt');
 const {advisorApi,advisorBackendConfigured}=client();expect(advisorBackendConfigured).toBe(true);
 const config=await advisorApi.interceptors.request.handlers[0].fulfilled({headers:new AxiosHeaders({'X-Advisor-Local':'stale'})});
 expect(config.headers.get('Authorization')).toBe('Bearer fixture-account-jwt');expect(config.headers.has('X-Advisor-Local')).toBe(false);expect(storage.getItem).toHaveBeenCalledWith('user_jwt_token');expect(advisorApi.interceptors.response.handlers).toHaveLength(0);
});
test('HTTPS requires login and invalid URL never sends',async()=>{
 mockExtra={advisorTransport:'https',advisorBackendUrl:'http://127.0.0.1:5088/api'};
 let c=client();expect(c.advisorBackendConfigured).toBe(false);await expect(c.advisorApi.interceptors.request.handlers[0].fulfilled({headers:new AxiosHeaders()})).rejects.toThrow('unavailable');
 jest.resetModules();mockExtra={advisorTransport:'https',advisorBackendUrl:'https://advisor.example/api'};const storage=require('@react-native-async-storage/async-storage').default;storage.getItem.mockResolvedValue(null);c=client();await expect(c.advisorApi.interceptors.request.handlers[0].fulfilled({headers:new AxiosHeaders()})).rejects.toThrow('requires login');
});
