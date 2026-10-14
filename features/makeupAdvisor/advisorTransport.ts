import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {advisorEnabled} from './flags';
import {isHttpsAdvisorUrl} from './backendUrl';
const extra=Constants.expoConfig?.extra;
const local=extra?.advisorTransport==='local'&&extra?.advisorReleaseEnvironment==='local';
const localConfigured=local&&extra?.advisorLocalUrl==='http://127.0.0.1:5088/api'&&typeof extra?.advisorLocalNonce==='string'&&/^[a-f0-9]{48}$/i.test(extra.advisorLocalNonce);
export const advisorBackendConfigured=advisorEnabled&&(localConfigured||(!local&&extra?.advisorTransport==='https'&&isHttpsAdvisorUrl(extra?.advisorBackendUrl)));
// Separate client preserves global Explore/auth/booking and their 401 behavior.
// Only approved HTTPS backend receives the existing account Bearer token.
export const advisorApi=axios.create({baseURL:advisorBackendConfigured?(local?extra?.advisorLocalUrl:extra?.advisorBackendUrl):undefined,timeout:20000,maxRedirects:0});
advisorApi.interceptors.request.use(async config=>{
 if(!advisorBackendConfigured)throw new Error('Advisor backend unavailable');
 if(local){config.headers.set('X-Advisor-Local',extra?.advisorLocalNonce);config.headers.delete('Authorization');}
 else{config.headers.delete('X-Advisor-Local');const token=await AsyncStorage.getItem('user_jwt_token');if(!token)throw new Error('Advisor requires login');config.headers.set('Authorization',`Bearer ${token}`);}
 return config;
});
