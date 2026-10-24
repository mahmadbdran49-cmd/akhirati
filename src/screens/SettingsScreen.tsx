import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Card, IconButton, T, TabHeader } from '../components/ui';
import { syncReminders } from '../notifications';
import { ALIGN_START, ROW } from '../rtl';
import { AppState, ThemeMode, useStore } from '../store';
import { toArabicDigits } from '../theme';

const THEMES: { id: ThemeMode; label: string }[] = [
  { id: 'system', label: 'تلقائي' },
  { id: 'light', label: 'فاتح' },
  { id: 'dark', label: 'داكن' },
];
const SIZES = [
  { v: 0.9, label: 'صغير' },
  { v: 1, label: 'عادي' },
  { v: 1.2, label: 'كبير' },
  { v: 1.4, label: 'كبير جداً' },
];
const REMINDERS: { key: keyof AppState['reminders']; label: string }[] = [
  { key: 'morning', label: 'أذكار الصباح' },
  { key: 'evening', label: 'أذكار المساء' },
  { key: 'sleep', label: 'أذكار النوم' },
];

function fmtTime(h: number, m: number): string {
  const suffix = h < 12 ? 'ص' : 'م';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${toArabicDigits(hh)}:${toArabicDigits(String(m).padStart(2, '0'))} ${suffix}`;
}

export default function SettingsScreen() {
  const { colors, state, update } = useStore();

  function setReminders(fn: (r: AppState['reminders']) => AppState['reminders']) {
    const next = fn(state.reminders);
    update((s) => ({ ...s, reminders: next }));
    syncReminders(next).catch(() => {});
  }

  function shift(key: keyof AppState['reminders'], minutes: number) {
    setReminders((r) => {
      const total = (r[key].hour * 60 + r[key].minute + minutes + 1440) % 1440;
      return { ...r, [key]: { ...r[key], hour: Math.floor(total / 60), minute: total % 60 } };
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TabHeader title="الإعدادات" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}>
        <Card style={{ gap: 12 }}>
          <T style={s.section}>التذكيرات اليومية</T>
          {REMINDERS.map((r) => {
            const rem = state.reminders[r.key];
            return (
              <View key={r.key} style={[s.row, { justifyContent: 'space-between', gap: 8 }]}>
                <View style={{ flex: 1, alignItems: ALIGN_START }}>
                  <T style={{ fontWeight: '600' }}>{r.label}</T>
                  <View style={[s.row, { gap: 2 }]}>
                    <IconButton name="remove-circle-outline" label="قبل نصف ساعة" size={20} onPress={() => shift(r.key, -30)} />
                    <T style={{ color: colors.muted, minWidth: 70, textAlign: 'center' }}>{fmtTime(rem.hour, rem.minute)}</T>
                    <IconButton name="add-circle-outline" label="بعد نصف ساعة" size={20} onPress={() => shift(r.key, 30)} />
                  </View>
                </View>
                <Switch
                  value={rem.on}
                  onValueChange={(on) => setReminders((all) => ({ ...all, [r.key]: { ...all[r.key], on } }))}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor={rem.on ? colors.gold : '#f4f3f4'}
                  accessibilityLabel={`تذكير ${r.label}`}
                />
              </View>
            );
          })}
        </Card>

        <Card style={{ gap: 12 }}>
          <T style={s.section}>المظهر</T>
          <View style={[s.row, { gap: 8 }]}>
            {THEMES.map((t) => (
              <Seg key={t.id} label={t.label} active={state.themeMode === t.id} onPress={() => update((s) => ({ ...s, themeMode: t.id }))} />
            ))}
          </View>
          <T style={{ fontWeight: '600', marginTop: 4 }}>حجم خط الأذكار</T>
          <View style={[s.row, { gap: 8 }]}>
            {SIZES.map((z) => (
              <Seg key={z.v} label={z.label} active={state.fontScale === z.v} onPress={() => update((s) => ({ ...s, fontScale: z.v }))} />
            ))}
          </View>
        </Card>

        <Card style={{ gap: 8 }}>
          <T style={s.section}>عن التطبيق</T>
          <View style={[s.row, { gap: 10 }]}>
            <Ionicons name="book-outline" size={20} color={colors.goldText} />
            <T style={{ flex: 1, color: colors.muted, lineHeight: 22 }}>
              الأذكار من كتاب «حصن المسلم» ومن القرآن الكريم، مع ذكر المصدر لكل ذكر.
            </T>
          </View>
          <View style={[s.row, { gap: 10 }]}>
            <Ionicons name="cloud-offline-outline" size={20} color={colors.goldText} />
            <T style={{ flex: 1, color: colors.muted, lineHeight: 22 }}>يعمل التطبيق بدون إنترنت، وبدون إعلانات.</T>
          </View>
          <T style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>آخرتي · الإصدار ١٫٠٫٠</T>
        </Card>
      </ScrollView>
    </View>
  );
}

function Seg({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useStore();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        s.seg,
        { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent' },
      ]}
    >
      <T style={{ color: active ? colors.onPrimary : colors.text, fontWeight: '600', fontSize: 13, textAlign: 'center' }}>{label}</T>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: ROW, alignItems: 'center' },
  section: { fontSize: 16, fontWeight: '700' },
  seg: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
});
