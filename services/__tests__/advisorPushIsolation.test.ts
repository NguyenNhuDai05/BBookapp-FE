import {registerForPushNotificationsAsync,NotificationService} from '../NotificationService';
import {api} from '../api';
jest.mock('expo-constants',()=>({__esModule:true,default:{expoConfig:{extra:{advisorRemotePushEnabled:false}}},ExecutionEnvironment:{StoreClient:'storeClient'}}));
jest.mock('expo-device',()=>({isDevice:true}));
jest.mock('@react-native-async-storage/async-storage',()=>({setItem:jest.fn(),getItem:jest.fn(),removeItem:jest.fn()}));
jest.mock('../api',()=>({api:{post:jest.fn()}}));
test('separate preview without Firebase never requests or registers production push credentials',async()=>{
 expect(await registerForPushNotificationsAsync()).toBeNull();expect(await NotificationService.registerDevice()).toBeNull();
 const remove=await NotificationService.addPushTokenListener();remove();expect(api.post).not.toHaveBeenCalled();
});
