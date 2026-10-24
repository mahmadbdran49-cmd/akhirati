import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { AppState } from './store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const CHANNEL = 'reminders';

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'تذكيرات الأذكار',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

const TEXTS: Record<keyof AppState['reminders'], { title: string; body: string }> = {
  morning: { title: 'أذكار الصباح ☀', body: 'ابدأ يومك بذكر الله، أذكار الصباح بانتظارك' },
  evening: { title: 'أذكار المساء 🌙', body: 'حان وقت أذكار المساء، دقائق تحفظك بإذن الله' },
  sleep: { title: 'أذكار النوم', body: 'قبل أن تنام، لا تنسَ أذكار النوم' },
};

// يعيد جدولة كل التذكيرات حسب الإعدادات الحالية
export async function syncReminders(reminders: AppState['reminders']): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const anyOn = Object.values(reminders).some((r) => r.on);
  if (!anyOn) return;
  const ok = await ensurePermission();
  if (!ok) return;
  for (const key of Object.keys(reminders) as (keyof AppState['reminders'])[]) {
    const r = reminders[key];
    if (!r.on) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: TEXTS[key].title, body: TEXTS[key].body, data: { screen: key } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: r.hour,
        minute: r.minute,
        channelId: CHANNEL,
      },
    });
  }
}
