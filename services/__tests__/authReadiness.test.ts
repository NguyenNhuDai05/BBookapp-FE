import axios,{AxiosError,type InternalAxiosRequestConfig} from 'axios';
import {api,ensureApiReady} from '../api';
jest.mock('@react-native-async-storage/async-storage',()=>jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('../sessionCredentials',()=>({sessionCredentials:{get:jest.fn(),save:jest.fn(),clear:jest.fn()}}));
let epoch=1_000_000;
beforeEach(()=>{jest.restoreAllMocks();jest.useFakeTimers();epoch+=100_000;jest.setSystemTime(epoch);});
afterEach(()=>jest.useRealTimers());
it('coalesces readiness checks and caches a successful check',async()=>{
 const probe=jest.spyOn(axios,'get').mockResolvedValue({data:{status:'Healthy'}});
 await Promise.all([ensureApiReady(),ensureApiReady()]);await ensureApiReady();expect(probe).toHaveBeenCalledTimes(1);
});
it('waits through a waking-server timeout before submitting one OTP request',async()=>{
 const probe=jest.spyOn(axios,'get').mockRejectedValueOnce(new AxiosError('timeout','ECONNABORTED')).mockResolvedValue({data:{status:'Healthy'}});
 const adapter=jest.fn(async (config:InternalAxiosRequestConfig)=>({status:200,statusText:'OK',headers:{},data:{},config}));api.defaults.adapter=adapter;
 const pending=api.post('/Auth/register/request-otp',{email:'test@example.test'});await jest.runAllTimersAsync();await pending;
 expect(probe).toHaveBeenCalledTimes(2);expect(adapter).toHaveBeenCalledTimes(1);
});
it('fails fast on an offline network instead of polling for a minute',async()=>{
 const probe=jest.spyOn(axios,'get').mockRejectedValue(new AxiosError('Network Error','ERR_NETWORK'));
 await expect(ensureApiReady()).rejects.toThrow('Network Error');expect(probe).toHaveBeenCalledTimes(1);
});
it('never repeats a mutation when its own response times out',async()=>{
 jest.spyOn(axios,'get').mockResolvedValue({data:{status:'Healthy'}});
 const adapter=jest.fn(async()=>{throw new AxiosError('timeout','ECONNABORTED');});api.defaults.adapter=adapter;
 await expect(api.post('/Auth/register',{email:'test@example.test'})).rejects.toThrow('timeout');expect(adapter).toHaveBeenCalledTimes(1);
});
