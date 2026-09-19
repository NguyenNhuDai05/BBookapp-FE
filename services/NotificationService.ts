import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

const STORED_EXPO_PUSH_TOKEN_KEY = 'expo_push_token';

export const ANDROID_NOTIFICATION_CHANNELS = {
  default: 'default',
  bookingReminders: 'booking-reminders',
  chat: 'chat',
  payments: 'payments',
} as const;

type NotificationsModule = typeof import('expo-notifications');

let notificationHandlerConfigured = false;

/**
 * Remote notifications cannot even be imported in Expo Go on Android since
 * SDK 53. Load the native module lazily so the rest of the app can still run
 * in Expo Go; a development/production build continues to get full push
 * notification support.
 */
async function getNotifications(): Promise<NotificationsModule | null> {
  if (
    Platform.OS === 'web'
    || (Platform.OS === 'android'
      && Constants.executionEnvironment === ExecutionEnvironment.StoreClient)
  ) {
    return null;
  }

  const notifications = await import('expo-notifications');

  if (!notificationHandlerConfigured) {
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return notifications;
}

async function configureAndroidNotificationChannels(
  Notifications: NotificationsModule,
): Promise<void> {
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

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return null;

    await configureAndroidNotificationChannels(Notifications);

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

  static async addNavigationListener(
    onUrl: (url: string) => void,
  ): Promise<() => void> {
    try {
      const Notifications = await getNotifications();
      if (!Notifications) return () => undefined;

      const openNotification = (notification: import('expo-notifications').Notification) => {
        const url = notification.request.content.data?.url;
        if (typeof url === 'string') onUrl(url);
      };

      const lastResponse = Notifications.getLastNotificationResponse();
      if (lastResponse?.notification) openNotification(lastResponse.notification);

      const subscription = Notifications.addNotificationResponseReceivedListener(
        response => openNotification(response.notification),
      );

      return () => subscription.remove();
    } catch (error: unknown) {
      console.warn('Unable to listen for notification responses.', error);
      return () => undefined;
    }
  }
}
