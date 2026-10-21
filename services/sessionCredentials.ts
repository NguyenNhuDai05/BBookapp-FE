import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
const key = 'bbook_refresh_session';
// Web keeps its existing short-lived access-token behavior. Never persist a
// long-lived refresh credential in localStorage/AsyncStorage.
export const sessionCredentials = {
  get: async (): Promise<string | null> => Platform.OS === 'web' ? null : SecureStore.getItemAsync(key),
  save: async (token?: string): Promise<void> => {
    if (Platform.OS === 'web') return;
    if (token) await SecureStore.setItemAsync(key, token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    else await SecureStore.deleteItemAsync(key);
  },
  clear: async (): Promise<void> => { if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(key); },
};
