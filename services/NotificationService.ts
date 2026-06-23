import * as Notifications from 'expo-notifications';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

// Set notification handler to show notification even when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async requestPermissions() {
    const { status: notifStatus } = await Notifications.requestPermissionsAsync();
    const { status: calStatus } = await Calendar.requestCalendarPermissionsAsync();
    return notifStatus === 'granted' && calStatus === 'granted';
  }

  static async getDefaultCalendarId(): Promise<string | null> {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    if (Platform.OS === 'ios') {
      const defaultCalendar = await Calendar.getDefaultCalendarAsync();
      return defaultCalendar.id;
    } else {
      // Android: find a primary calendar or the first one
      const primaryCalendar = calendars.find(c => c.isPrimary);
      return primaryCalendar ? primaryCalendar.id : (calendars.length > 0 ? calendars[0].id : null);
    }
  }

  static async scheduleBookingReminders(
    customerName: string, 
    bookingDate: string, 
    startTime: string,
    services: string
  ) {
    // 1. Parse date and time
    // bookingDate: "YYYY-MM-DD", startTime: "HH:mm:ss"
    const startDateTimeStr = `${bookingDate}T${startTime}`;
    const startDate = new Date(startDateTimeStr);
    
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1); // Mock 1 hour duration

    // 2. Schedule Push Notification (1 hour before)
    const notificationDate = new Date(startDate);
    notificationDate.setHours(notificationDate.getHours() - 1);

    if (notificationDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Sắp đến lịch hẹn Makeup! 💄",
          body: `Bạn có lịch hẹn với ${customerName} lúc ${startTime} hôm nay.`,
          data: { type: 'booking_reminder' },
        },
        trigger: notificationDate,
      });
    }

    // 3. Add to Device Calendar
    const calendarId = await this.getDefaultCalendarId();
    if (calendarId) {
      try {
        await Calendar.createEventAsync(calendarId, {
          title: `MakeUp: ${customerName}`,
          startDate,
          endDate,
          timeZone: 'Asia/Ho_Chi_Minh',
          notes: `Khách hàng: ${customerName}\nDịch vụ: ${services}`,
          alarms: [{ relativeOffset: -60 }] // Alert 60 mins before
        });
        console.log("Calendar event created successfully");
      } catch (e) {
        console.error("Failed to create calendar event", e);
      }
    }
  }
}
