import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

const STORED_EXPO_PUSH_TOKEN_KEY = 'expo_push_token';

export const ANDROID_NOTIFICATION_CHANNELS = {
  default: 'default',
  bookingReminders: 'booking-reminders',
  chat: 'chat',
  payments: 'payments',
} as const;

async function configureAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Promise.all([
    Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNELS.default, {
      name: 'Thông báo chung',
      importance: Notifications.AndroidImportance.HIGH,
    }),
    Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNELS.bookingReminders, {
      name: 'Nhắc lịch',
      importance: Notifications.AndroidImportance.HIGH,
    }),
    Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNELS.chat, {
      name: 'Tin nhắn',
      importance: Notifications.AndroidImportance.HIGH,
    }),
    Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNELS.payments, {
      name: 'Thanh toán',
      importance: Notifications.AndroidImportance.HIGH,
    }),
  ]);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    await configureAndroidNotificationChannels();

    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device.');
      return null;
    }

    const currentPermission = await Notifications.getPermissionsAsync();
    const finalPermission = currentPermission.status === 'granted'
      ? currentPermission
      : await Notifications.requestPermissionsAsync();

    if (finalPermission.status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId
      ?? Constants.easConfig?.projectId;

    if (!projectId) {
      console.error('EAS projectId is missing; push token registration was skipped.');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await AsyncStorage.setItem(STORED_EXPO_PUSH_TOKEN_KEY, token);
    return token;
  } catch (error: unknown) {
    console.warn('Unable to obtain an Expo push token.', error);
    return null;
  }
}

export class NotificationService {
  static async registerDevice(): Promise<string | null> {
    const token = await registerForPushNotificationsAsync();
    if (!token) return null;

    try {
      await api.post('/Notification/device-token', {
        expoPushToken: token,
        platform: Platform.OS,
        deviceName: Constants.deviceName ?? undefined,
      });
      return token;
    } catch (error: unknown) {
      console.warn('Unable to register the push token with BBook.', error);
      return null;
    }
  }

  static async unregisterDevice(): Promise<void> {
    const token = await AsyncStorage.getItem(STORED_EXPO_PUSH_TOKEN_KEY);
    if (!token) return;

    try {
      await api.delete('/Notification/device-token', {
        data: { expoPushToken: token },
      });
    } catch (error: unknown) {
      console.warn('Unable to deactivate the push token with BBook.', error);
    } finally {
      await AsyncStorage.removeItem(STORED_EXPO_PUSH_TOKEN_KEY);
    }
  }
}
