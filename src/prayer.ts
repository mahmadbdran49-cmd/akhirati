import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla } from 'adhan';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AppState, DEFAULT_LOCATION, PrayerKey } from './store';

export const PRAYERS: { key: PrayerKey | 'sunrise'; name: string }[] = [
  { key: 'fajr', name: 'الفجر' },
  { key: 'sunrise', name: 'الشروق' },
  { key: 'dhuhr', name: 'الظهر' },
  { key: 'asr', name: 'العصر' },
  { key: 'maghrib', name: 'المغرب' },
  { key: 'isha', name: 'العشاء' },
];

export const PRAYER_NAMES: Record<PrayerKey, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export const METHODS: { id: AppState['prayer']['method']; label: string }[] = [
  { id: 'Egyptian', label: 'الهيئة المصرية العامة للمساحة' },
  { id: 'MuslimWorldLeague', label: 'رابطة العالم الإسلامي' },
  { id: 'UmmAlQura', label: 'أم القرى – مكة المكرمة' },
  { id: 'Karachi', label: 'جامعة العلوم الإسلامية – كراتشي' },
  { id: 'Dubai', label: 'دبي' },
  { id: 'Kuwait', label: 'الكويت' },
  { id: 'Qatar', label: 'قطر' },
  { id: 'Turkey', label: 'تركيا – رئاسة الشؤون الدينية' },
  { id: 'NorthAmerica', label: 'أمريكا الشمالية (ISNA)' },
];

export function getLocation(state: AppState) {
  return state.location ?? DEFAULT_LOCATION;
}

export function computeTimes(state: AppState, date = new Date()): PrayerTimes {
  const loc = getLocation(state);
  const params = CalculationMethod[state.prayer.method]();
  params.madhab = state.prayer.hanafi ? Madhab.Hanafi : Madhab.Shafi;
  params.adjustments = { ...params.adjustments, ...state.prayer.offsets };
  return new PrayerTimes(new Coordinates(loc.lat, loc.lng), date, params);
}

export function timeOf(t: PrayerTimes, key: PrayerKey | 'sunrise'): Date {
  return t[key];
}

// الصلاة القادمة (وإن انتهت صلوات اليوم نحسب فجر الغد)
export function nextPrayer(state: AppState, now = new Date()): { key: PrayerKey; name: string; at: Date } {
  const today = computeTimes(state, now);
  for (const k of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerKey[]) {
    if (today[k] > now) return { key: k, name: PRAYER_NAMES[k], at: today[k] };
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const t = computeTimes(state, tomorrow);
  return { key: 'fajr', name: PRAYER_NAMES.fajr, at: t.fajr };
}

export function qiblaBearing(state: AppState): number {
  const loc = getLocation(state);
  return Qibla(new Coordinates(loc.lat, loc.lng));
}

// تحديد الموقع واسم المدينة
export async function detectLocation(): Promise<AppState['location'] | null> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) return null;
  const pos =
    (await Location.getLastKnownPositionAsync()) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  if (!pos) return null;
  let city = 'موقعك الحالي';
  try {
    const [addr] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    city = addr?.city || addr?.subregion || addr?.region || city;
  } catch {
    // اسم المدينة اختياري
  }
  return { lat: pos.coords.latitude, lng: pos.coords.longitude, city };
}

const PRAYER_CHANNEL = 'prayer-sound';
const SILENT_CHANNEL = 'prayer-silent';
const REMINDER_CHANNEL = 'reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(PRAYER_CHANNEL, {
    name: 'الأذان ومواقيت الصلاة',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
  await Notifications.setNotificationChannelAsync(SILENT_CHANNEL, {
    name: 'تنبيه صامت للصلاة',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
    enableVibrate: false,
  });
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
    name: 'تذكير الأذكار',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  await ensureChannels();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

const REMINDER_TEXT: Record<keyof AppState['reminders'], { title: string; body: string }> = {
  morning: { title: 'أذكار الصباح', body: 'ابدأ يومك بذكر الله، أذكار الصباح بانتظارك' },
  evening: { title: 'أذكار المساء', body: 'حان وقت أذكار المساء، دقائق تحفظك بإذن الله' },
  sleep: { title: 'أذكار النوم', body: 'قبل أن تنام، لا تنسَ أذكار النوم وآية الكرسي' },
  kahf: { title: 'جمعة مباركة', body: 'لا تنسَ قراءة سورة الكهف والصلاة على النبي ﷺ' },
};

// يعيد جدولة كل الإشعارات: الصلوات للأيام القادمة + تذكيرات الأذكار
export async function rescheduleAll(state: AppState): Promise<void> {
  if (Platform.OS === 'web') return;
  const ok = await ensureNotificationPermission();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!ok) return;

  const now = new Date();
  const days = 6; // حد iOS ٦٤ إشعاراً مجدولاً
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const t = computeTimes(state, date);
    for (const k of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerKey[]) {
      const mode = state.prayer.alerts[k];
      if (mode === 'off' || t[k] <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `حان الآن موعد صلاة ${PRAYER_NAMES[k]}`,
          body: k === 'fajr' ? 'الصلاة خير من النوم' : `${getLocation(state).city} · حيّ على الصلاة`,
          sound: mode === 'sound' ? 'default' : undefined,
          data: { screen: 'prayer' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: t[k],
          channelId: mode === 'sound' ? PRAYER_CHANNEL : SILENT_CHANNEL,
        },
      });
    }
  }

  for (const key of ['morning', 'evening', 'sleep'] as const) {
    const r = state.reminders[key];
    if (!r.on) continue;
    await Notifications.scheduleNotificationAsync({
      content: { ...REMINDER_TEXT[key], data: { screen: key } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: r.hour, minute: r.minute, channelId: REMINDER_CHANNEL },
    });
  }
  if (state.reminders.kahf.on) {
    await Notifications.scheduleNotificationAsync({
      content: { ...REMINDER_TEXT.kahf, data: { screen: 'kahf' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 6, // الجمعة (١ = الأحد)
        hour: state.reminders.kahf.hour,
        minute: state.reminders.kahf.minute,
        channelId: REMINDER_CHANNEL,
      },
    });
  }
}
