import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Card, Chip, Header, IconButton, Screen, T } from '../components/ui';
import { hijriLabel, toHijri } from '../hijri';
import { detectLocation, getLocation, METHODS, PRAYER_NAMES } from '../prayer';
import { RECITERS } from '../quran';
import { ROW } from '../rtl';
import { AlertMode, AppState, PrayerKey, useStore } from '../store';
import { FONTS, THEME_LABELS, ThemeName, THEMES, toArabicDigits } from '../theme';

const SIZES = [
  { v: 0.85, label: 'صغير' },
  { v: 1, label: 'عادي' },
  { v: 1.2, label: 'كبير' },
  { v: 1.4, label: 'أكبر' },
];
const MODES: { id: AlertMode; label: string }[] = [
  { id: 'sound', label: 'بصوت' },
  { id: 'silent', label: 'صامت' },
  { id: 'off', label: 'إيقاف' },
];
const REMINDERS: { key: keyof AppState['reminders']; label: string }[] = [
  { key: 'morning', label: 'أذكار الصباح' },
  { key: 'evening', label: 'أذكار المساء' },
  { key: 'sleep', label: 'أذكار النوم' },
  { key: 'kahf', label: 'سورة الكهف (يوم الجمعة)' },
];

function fmt(h: number, m: number) {
  const suffix = h < 12 ? 'ص' : 'م';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${toArabicDigits(hh)}:${toArabicDigits(String(m).padStart(2, '0'))} ${suffix}`;
}

function Section({ title, icon, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; children: ReactNode }) {
  const { colors } = useStore();
  return (
    <Card style={{ gap: 14 }}>
      <View style={[st.row, { gap: 8 }]}>
        <Ionicons name={icon} size={18} color={colors.goldText} />
        <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 18, lineHeight: 28, color: colors.goldText }}>{title}</T>
      </View>
      {children}
    </Card>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <T style={{ fontWeight: '600', fontSize: 14 }}>{children}</T>;
}

function Stepper({ value, onMinus, onPlus, width = 84 }: { value: string; onMinus: () => void; onPlus: () => void; width?: number }) {
  const { colors } = useStore();
  return (
    <View style={[st.row, { gap: 0 }]}>
      <IconButton name="remove-circle-outline" label="إنقاص" size={22} color={colors.goldText} onPress={onMinus} />
      <T style={{ minWidth: width, textAlign: 'center', fontWeight: '600', color: colors.text }}>{value}</T>
      <IconButton name="add-circle-outline" label="زيادة" size={22} color={colors.goldText} onPress={onPlus} />
    </View>
  );
}

export default function SettingsScreen() {
  const { colors, state, update } = useStore();
  const [locating, setLocating] = useState(false);
  const set = (fn: (s: AppState) => AppState) => update(fn);
  const sw = { true: colors.emerald, false: colors.border };

  return (
    <Screen>
      <Header title="الإعدادات" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 14 }}>
        <Section title="المظهر" icon="color-palette-outline">
          <View style={[st.row, { gap: 8, flexWrap: 'wrap' }]}>
            {(Object.keys(THEMES) as ThemeName[]).map((id) => {
              const p = THEMES[id];
              const on = state.theme === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => set((s) => ({ ...s, theme: id }))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[st.themeCard, { backgroundColor: p.bg, borderColor: on ? colors.goldText : colors.border }]}
                >
                  <View style={[st.row, { gap: 4, marginBottom: 2 }]}>
                    <View style={[st.swatch, { backgroundColor: p.emerald }]} />
                    <View style={[st.swatch, { backgroundColor: p.gold }]} />
                  </View>
                  <T style={{ fontFamily: FONTS.logo, fontSize: 20, lineHeight: 32, color: p.goldText, textAlign: 'center' }}>آخرتي</T>
                  <T style={{ fontSize: 12, fontWeight: '700', color: p.goldText, textAlign: 'center' }}>{THEME_LABELS[id]}</T>
                  {on ? <Ionicons name="checkmark-circle" size={16} color={p.gold} style={{ position: 'absolute', top: 6, left: 6 }} /> : null}
                </Pressable>
              );
            })}
          </View>
          <View style={[st.row, { justifyContent: 'space-between', gap: 10 }]}>
            <View style={{ flex: 1 }}>
              <Label>الوضع الهادئ</Label>
              <T style={{ fontSize: 12, color: colors.muted, lineHeight: 19 }}>يخفي الزخارف والحركات ويُبقي النص فقط، للتركيز والخشوع</T>
            </View>
            <Switch value={state.minimal} onValueChange={(v) => set((s) => ({ ...s, minimal: v }))} trackColor={sw} thumbColor={state.minimal ? colors.gold : '#f4f3f4'} />
          </View>
          <Label>حجم خط المصحف</Label>
          <View style={[st.row, { gap: 6, flexWrap: 'wrap' }]}>
            {SIZES.map((z) => (
              <Chip key={z.v} label={z.label} active={state.quranScale === z.v} onPress={() => set((s) => ({ ...s, quranScale: z.v }))} />
            ))}
          </View>
          <Label>حجم خط الأذكار والقصص</Label>
          <View style={[st.row, { gap: 6, flexWrap: 'wrap' }]}>
            {SIZES.map((z) => (
              <Chip key={z.v} label={z.label} active={state.adhkarScale === z.v} onPress={() => set((s) => ({ ...s, adhkarScale: z.v }))} />
            ))}
          </View>
          <View style={[st.row, { justifyContent: 'space-between' }]}>
            <Label>الاهتزاز عند العدّ والتنبيه</Label>
            <Switch value={state.haptics} onValueChange={(v) => set((s) => ({ ...s, haptics: v }))} trackColor={sw} thumbColor={state.haptics ? colors.gold : '#f4f3f4'} />
          </View>
        </Section>

        <Section title="القارئ" icon="mic-outline">
          {RECITERS.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => set((s) => ({ ...s, reciter: r.id }))}
              accessibilityRole="radio"
              accessibilityState={{ checked: state.reciter === r.id }}
              style={[st.row, st.option, { borderColor: state.reciter === r.id ? colors.gold : colors.border, backgroundColor: state.reciter === r.id ? colors.goldSoft : 'transparent' }]}
            >
              <Ionicons name={state.reciter === r.id ? 'radio-button-on' : 'radio-button-off'} size={18} color={colors.goldText} />
              <T style={{ flex: 1 }}>{r.name}</T>
            </Pressable>
          ))}
          <T style={{ fontSize: 12, color: colors.muted }}>تشغيل التلاوة يحتاج اتصالاً بالإنترنت.</T>
        </Section>

        <Section title="الموقع ومواقيت الصلاة" icon="location-outline">
          <Pressable
            onPress={async () => {
              setLocating(true);
              const l = await detectLocation().catch(() => null);
              if (l) set((s) => ({ ...s, location: l }));
              setLocating(false);
            }}
            accessibilityRole="button"
            style={[st.row, st.option, { borderColor: colors.border }]}
          >
            {locating ? <ActivityIndicator size="small" color={colors.goldText} /> : <Ionicons name="navigate-outline" size={18} color={colors.goldText} />}
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: '600' }}>{getLocation(state).city}</T>
              <T style={{ fontSize: 12, color: colors.muted }}>اضغط لتحديد موقعك تلقائياً</T>
            </View>
          </Pressable>
          <Label>طريقة الحساب</Label>
          {METHODS.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => set((s) => ({ ...s, prayer: { ...s.prayer, method: m.id } }))}
              accessibilityRole="radio"
              accessibilityState={{ checked: state.prayer.method === m.id }}
              style={[st.row, st.optionSm, { borderColor: state.prayer.method === m.id ? colors.gold : colors.border, backgroundColor: state.prayer.method === m.id ? colors.goldSoft : 'transparent' }]}
            >
              <Ionicons name={state.prayer.method === m.id ? 'radio-button-on' : 'radio-button-off'} size={16} color={colors.goldText} />
              <T style={{ flex: 1, fontSize: 14 }}>{m.label}</T>
            </Pressable>
          ))}
          <Label>حساب وقت العصر</Label>
          <View style={[st.row, { gap: 8, flexWrap: 'wrap' }]}>
            <Chip label="الجمهور (شافعي، مالكي، حنبلي)" active={!state.prayer.hanafi} onPress={() => set((s) => ({ ...s, prayer: { ...s.prayer, hanafi: false } }))} />
            <Chip label="حنفي" active={state.prayer.hanafi} onPress={() => set((s) => ({ ...s, prayer: { ...s.prayer, hanafi: true } }))} />
          </View>
          <Label>تعديل الدقائق يدوياً</Label>
          {(Object.keys(PRAYER_NAMES) as PrayerKey[]).map((k) => {
            const v = state.prayer.offsets[k];
            const change = (d: number) => set((s) => ({ ...s, prayer: { ...s.prayer, offsets: { ...s.prayer.offsets, [k]: Math.max(-30, Math.min(30, s.prayer.offsets[k] + d)) } } }));
            return (
              <View key={k} style={[st.row, { justifyContent: 'space-between' }]}>
                <T>{PRAYER_NAMES[k]}</T>
                <Stepper value={v === 0 ? 'بدون تعديل' : `${v > 0 ? '+' : '−'}${toArabicDigits(Math.abs(v))} د`} onMinus={() => change(-1)} onPlus={() => change(1)} width={92} />
              </View>
            );
          })}
        </Section>

        <Section title="تنبيهات الصلاة" icon="notifications-outline">
          {(Object.keys(PRAYER_NAMES) as PrayerKey[]).map((k) => (
            <View key={k} style={{ gap: 6 }}>
              <T style={{ fontWeight: '600' }}>{PRAYER_NAMES[k]}</T>
              <View style={[st.row, { gap: 6 }]}>
                {MODES.map((m) => (
                  <Chip key={m.id} label={m.label} active={state.prayer.alerts[k] === m.id} onPress={() => set((s) => ({ ...s, prayer: { ...s.prayer, alerts: { ...s.prayer.alerts, [k]: m.id } } }))} />
                ))}
              </View>
            </View>
          ))}
        </Section>

        <Section title="تذكيرات الأذكار" icon="alarm-outline">
          {REMINDERS.map((r) => {
            const rem = state.reminders[r.key];
            const shift = (d: number) =>
              set((s) => {
                const cur = s.reminders[r.key];
                const total = (cur.hour * 60 + cur.minute + d + 1440) % 1440;
                return { ...s, reminders: { ...s.reminders, [r.key]: { ...cur, hour: Math.floor(total / 60), minute: total % 60 } } };
              });
            return (
              <View key={r.key} style={[st.row, { justifyContent: 'space-between', gap: 6 }]}>
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: '600' }}>{r.label}</T>
                  <Stepper value={fmt(rem.hour, rem.minute)} onMinus={() => shift(-30)} onPlus={() => shift(30)} />
                </View>
                <Switch
                  value={rem.on}
                  onValueChange={(on) => set((s) => ({ ...s, reminders: { ...s.reminders, [r.key]: { ...s.reminders[r.key], on } } }))}
                  trackColor={sw}
                  thumbColor={rem.on ? colors.gold : '#f4f3f4'}
                  accessibilityLabel={`تذكير ${r.label}`}
                />
              </View>
            );
          })}
        </Section>

        <Section title="التاريخ الهجري" icon="calendar-outline">
          <T style={{ color: colors.muted, fontSize: 13, lineHeight: 21 }}>التاريخ محسوب فلكياً، وقد يختلف يوماً عن رؤية الهلال في بلدك. عدّله هنا إن لزم.</T>
          <View style={[st.row, { justifyContent: 'space-between' }]}>
            <T style={{ fontWeight: '600', color: colors.goldText }}>{hijriLabel(toHijri(new Date(), state.hijriOffset))}</T>
            <Stepper
              value={state.hijriOffset === 0 ? '٠' : `${state.hijriOffset > 0 ? '+' : '−'}${toArabicDigits(Math.abs(state.hijriOffset))}`}
              onMinus={() => set((s) => ({ ...s, hijriOffset: Math.max(-2, s.hijriOffset - 1) }))}
              onPlus={() => set((s) => ({ ...s, hijriOffset: Math.min(2, s.hijriOffset + 1) }))}
              width={36}
            />
          </View>
        </Section>

        <Section title="عن التطبيق" icon="information-circle-outline">
          <T style={{ color: colors.muted, fontSize: 13, lineHeight: 22 }}>
            نص القرآن الكريم بالرسم العثماني برواية حفص من «موسوعة القرآن الكريم» (quranenc.com) برخصة CC BY-SA 4.0.{'\n'}
            التلاوات من موقع everyayah.com.{'\n'}
            الأذكار من كتاب «حصن المسلم» مع ذكر مصدر كل ذكر.{'\n'}
            مواقيت الصلاة محسوبة على الجهاز بمكتبة Adhan.
          </T>
          <T style={{ fontSize: 12, color: colors.muted }}>آخرتي · Akhirah · الإصدار ٢٫٠</T>
        </Section>
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: ROW, alignItems: 'center' },
  themeCard: { width: '48%', height: 96, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 14, height: 14, borderRadius: 7 },
  option: { gap: 10, minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12 },
  optionSm: { gap: 8, minHeight: 42, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12 },
});
