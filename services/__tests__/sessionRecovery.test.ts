import axios, {AxiosError, type InternalAxiosRequestConfig} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {withSessionStorage} from '../sessionStorageLock';
import {api, setUnauthorizedHandler} from '../api';
import {sessionCredentials} from '../sessionCredentials';
jest.mock('@react-native-async-storage/async-storage',()=>jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('../sessionCredentials',()=>({sessionCredentials:{get:jest.fn(),save:jest.fn(),clear:jest.fn()}}));
const expired=(config:InternalAxiosRequestConfig,status=401)=>new AxiosError('request rejected','ERR_BAD_RESPONSE',config,undefined,{status,statusText:'error',headers:{},data:{},config});
const ok=(config:InternalAxiosRequestConfig)=>({status:200,statusText:'OK',headers:{},data:{ok:true},config});
const unauthorized=jest.fn(async()=>{await AsyncStorage.removeItem('user_jwt_token');await sessionCredentials.clear();});
beforeEach(async()=>{jest.restoreAllMocks();jest.clearAllMocks();await AsyncStorage.clear();await AsyncStorage.setItem('user_jwt_token','old');setUnauthorizedHandler(unauthorized);jest.mocked(sessionCredentials.get).mockResolvedValue('refresh');});
it('rotates once for simultaneous 401s and replays with the new access token',async()=>{
 const rotate=jest.spyOn(axios,'post').mockResolvedValue({data:{token:'new',refreshToken:'next-refresh'}});
 api.defaults.adapter=async config=>{if(config.headers.Authorization==='Bearer old')throw expired(config);return ok(config);};
 await Promise.all([api.get('/User/profile'),api.get('/Feed')]);
 expect(rotate).toHaveBeenCalledTimes(1);expect(sessionCredentials.save).toHaveBeenCalledWith('next-refresh');expect(await AsyncStorage.getItem('user_jwt_token')).toBe('new');expect(unauthorized).not.toHaveBeenCalled();
});
it('keeps the stored session when the refresh server is unavailable',async()=>{
 jest.spyOn(axios,'post').mockRejectedValue(new AxiosError('timeout','ECONNABORTED'));
 api.defaults.adapter=async config=>{throw expired(config);};
 await expect(api.get('/User/profile')).rejects.toThrow('timeout');
 expect(await AsyncStorage.getItem('user_jwt_token')).toBe('old');expect(unauthorized).not.toHaveBeenCalled();expect(sessionCredentials.clear).not.toHaveBeenCalled();
});
it('expires only when refresh credentials are rejected',async()=>{
 jest.spyOn(axios,'post').mockRejectedValue(new AxiosError('expired','ERR_BAD_RESPONSE',undefined,undefined,{status:401,statusText:'error',headers:{},data:{},config:{} as InternalAxiosRequestConfig}));
 api.defaults.adapter=async config=>{throw expired(config);};await expect(api.get('/User/profile')).rejects.toThrow();expect(unauthorized).toHaveBeenCalledTimes(1);expect(await AsyncStorage.getItem('user_jwt_token')).toBeNull();
});
it('does not let a delayed 401 clear a newer login',async()=>{
 const rotate=jest.spyOn(axios,'post');let reject!:()=>void;
 api.defaults.adapter=config=>config.headers.Authorization==='Bearer old'?new Promise((_,fail)=>{reject=()=>fail(expired(config));}):Promise.resolve(ok(config));
 const pending=api.get('/User/profile');while(!reject)await Promise.resolve();await AsyncStorage.setItem('user_jwt_token','new-login');reject();await pending;
 expect(rotate).not.toHaveBeenCalled();expect(unauthorized).not.toHaveBeenCalled();expect(await AsyncStorage.getItem('user_jwt_token')).toBe('new-login');
});
it('never restores credentials when logout occurs during rotation',async()=>{
 let finish!:(value:unknown)=>void;jest.spyOn(axios,'post').mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
 api.defaults.adapter=async config=>{throw expired(config);};const pending=api.get('/User/profile');while(!finish)await Promise.resolve();await AsyncStorage.removeItem('user_jwt_token');finish({data:{token:'new',refreshToken:'next'}});await expect(pending).rejects.toThrow();expect(sessionCredentials.save).not.toHaveBeenCalled();expect(await AsyncStorage.getItem('user_jwt_token')).toBeNull();
});
it('wrong login credentials do not expire the current account',async()=>{
 jest.spyOn(axios,'get').mockResolvedValue({data:{status:'Healthy'}});
 const rotate=jest.spyOn(axios,'post');api.defaults.adapter=async config=>{throw expired(config);};
 await expect(api.post('/Auth/login',{email:'test@example.test',password:'wrong'})).rejects.toThrow();expect(rotate).not.toHaveBeenCalled();expect(unauthorized).not.toHaveBeenCalled();expect(await AsyncStorage.getItem('user_jwt_token')).toBe('old');
});

it('does not mix a new login token with an older refresh credential during slow storage',async()=>{
 let release!:(value:string)=>void;jest.mocked(sessionCredentials.get).mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));
 jest.spyOn(axios,'post').mockResolvedValue({data:{token:'wrong-account',refreshToken:'wrong-refresh'}});
 api.defaults.adapter=async config=>{throw expired(config);};const pending=api.get('/User/profile');while(!release)await Promise.resolve();
 const loginCommit=withSessionStorage(async()=>{await sessionCredentials.save('new-login-refresh');await AsyncStorage.setItem('user_jwt_token','new-login');});release('old-refresh');
 await loginCommit;await expect(pending).rejects.toThrow();expect(await AsyncStorage.getItem('user_jwt_token')).toBe('new-login');expect(sessionCredentials.save).not.toHaveBeenCalledWith('wrong-refresh');expect(unauthorized).not.toHaveBeenCalled();
});
