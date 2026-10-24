import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { Button, Card, Header, IconName, Screen, T, TabHeader } from '../components/ui';
import { hijriLabel, toHijri, WEEKDAYS } from '../hijri';
import { useNav } from '../navigation';
import { computeTimes, detectLocation, getLocation, nextPrayer, PRAYERS, qiblaBearing } from '../prayer';
import { ROW } from '../rtl';
import { AlertMode, PrayerKey, useStore } from '../store';
import { FONTS, fmtCountdown, fmtTime, toArabicDigits } from '../theme';

const MODE_LABEL: Record<AlertMode, string> = { sound: 'بصوت', silent: 'صامت', off: 'إيقاف' };
const MODE_ICON: Record<AlertMode, IconName> = { sound: 'volume-high-outline', silent: 'notifications-outline', off: 'notifications-off-outline' };
const ICONS: Record<string, IconName> = {
  fajr: 'moon-outline',
  sunrise: 'partly-sunny-outline',
  dhuhr: 'sunny-outline',
  asr: 'sunny-outline',
  maghrib: 'cloudy-night-outline',
  isha: 'moon-outline',
};

export function PrayerScreen() {
  const { colors, state, update } = useStore();
  const { push } = useNav();
  const [now, setNow] = useState(new Date());
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const times = computeTimes(state, now);
  const next = nextPrayer(state, now);
  const loc = getLocation(state);

  async function locate() {
    setLocating(true);
    setLocError(false);
    try {
      const l = await detectLocation();
      if (l) update((s) => ({ ...s, location: l }));
      else setLocError(true);
    } catch {
      setLocError(true);
    } finally {
      setLocating(false);
    }
  }

  function cycle(k: PrayerKey) {
    const order: AlertMode[] = ['sound', 'silent', 'off'];
    update((s) => {
      const cur = s.prayer.alerts[k];
      const nxt = order[(order.indexOf(cur) + 1) % order.length];
      return { ...s, prayer: { ...s.prayer, alerts: { ...s.prayer.alerts, [k]: nxt } } };
    });
    if (state.haptics) Haptics.selectionAsync().catch(() => {});
  }

  return (
    <Screen>
      <TabHeader title="مواقيت الصلاة" subtitle={`${WEEKDAYS[now.getDay()]} · ${hijriLabel(toHijri(now, state.hijriOffset))}`} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}>
        <Pressable onPress={locate} accessibilityRole="button" style={[st.locRow, { borderColor: colors.border, backgroundColor: colors.goldSoft }]}>
          {locating ? <ActivityIndicator size="small" color={colors.goldText} /> : <Ionicons name="location-outline" size={18} color={colors.goldText} />}
          <T style={{ flex: 1, color: colors.goldText, fontWeight: '600' }}>{loc.city}</T>
          <T style={{ fontSize: 12, color: colors.muted }}>{state.location ? 'تحديث الموقع' : 'حدّد موقعي'}</T>
        </Pressable>
        {locError ? (
          <T style={{ fontSize: 12, color: colors.danger }}>لم نتمكن من تحديد موقعك. اسمح للتطبيق باستخدام الموقع من إعدادات الهاتف، والمواقيت الآن حسب القدس.</T>
        ) : null}

        <View style={[st.nextCard, { backgroundColor: colors.emerald, borderColor: colors.borderStrong }]}>
          <View>
            <T style={{ fontSize: 12, color: colors.onEmeraldMuted }}>الصلاة القادمة</T>
            <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 30, lineHeight: 44, color: '#FFFFFF' }}>{next.name}</T>
          </View>
          <T style={{ fontSize: 28, fontWeight: '700', color: '#F6DFA4', fontVariant: ['tabular-nums'] }}>{fmtCountdown(next.at.getTime() - now.getTime())}</T>
        </View>

        <View style={[st.table, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {PRAYERS.map((p, i) => {
            const at = times[p.key];
            const isNext = p.key === next.key && at.getDate() === next.at.getDate();
            const mode = p.key === 'sunrise' ? null : state.prayer.alerts[p.key];
            return (
              <View
                key={p.key}
                style={[
                  st.prayerRow,
                  i < PRAYERS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  isNext && { backgroundColor: 'rgba(20,90,69,0.45)' },
                ]}
              >
                <View style={[st.pIcon, { backgroundColor: isNext ? colors.gold : colors.goldSoft }]}>
                  <Ionicons name={ICONS[p.key]} size={18} color={isNext ? '#1E130C' : colors.goldText} />
                </View>
                <T style={{ flex: 1, fontFamily: FONTS.dhikrBold, fontSize: 20, lineHeight: 30, color: isNext ? colors.goldText : colors.text }}>{p.name}</T>
                <T style={{ fontSize: 17, fontWeight: '600', color: isNext ? colors.goldText : colors.text }}>{fmtTime(at)}</T>
                {mode ? (
                  <Pressable
                    onPress={() => cycle(p.key as PrayerKey)}
                    accessibilityRole="button"
                    accessibilityLabel={`تنبيه ${p.name}: ${MODE_LABEL[mode]}`}
                    style={[st.modeBtn, { borderColor: colors.border, backgroundColor: colors.goldSoft }]}
                  >
                    <Ionicons name={MODE_ICON[mode]} size={14} color={mode === 'off' ? colors.muted : colors.goldText} />
                    <T style={{ fontSize: 12, fontWeight: '600', color: mode === 'off' ? colors.muted : colors.goldText }}>{MODE_LABEL[mode]}</T>
                  </Pressable>
                ) : (
                  <View style={{ width: 78 }} />
                )}
              </View>
            );
          })}
        </View>
        <T style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>اضغط على زر التنبيه بجانب كل صلاة لتختار: بصوت، صامت، أو إيقاف</T>

        <Pressable
          onPress={() => push({ name: 'qibla' })}
          accessibilityRole="button"
          style={[st.qiblaCard, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
        >
          <View style={[st.pIcon, { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.emerald }]}>
            <Ionicons name="compass" size={24} color="#F6DFA4" />
          </View>
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 20, lineHeight: 30 }}>اتجاه القبلة</T>
            <T style={{ fontSize: 13, color: colors.muted }}>{toArabicDigits(Math.round(qiblaBearing(state)))}° من الشمال</T>
          </View>
          <Ionicons name="chevron-back" size={18} color={colors.gold} />
        </Pressable>
        <Button title="إعدادات المواقيت وطريقة الحساب" variant="outline" icon="options-outline" onPress={() => push({ name: 'settings' })} />
      </ScrollView>
    </Screen>
  );
}

// ───────── بوصلة القبلة ─────────
export function QiblaScreen() {
  const { colors, state } = useStore();
  const [heading, setHeading] = useState<number | null>(null);
  const [denied, setDenied] = useState(false);
  const rot = useRef(new Animated.Value(0)).current;
  const lastRot = useRef(0);
  const qibla = qiblaBearing(state);
  const aligned = heading !== null && Math.abs(((qibla - heading + 540) % 360) - 180) < 4;
  const wasAligned = useRef(false);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setDenied(true);
        return;
      }
      sub = await Location.watchHeadingAsync((h) => {
        const v = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
        setHeading(v);
      });
    })().catch(() => setDenied(true));
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    if (heading === null) return;
    // ندوّر قرص البوصلة بعكس اتجاه الهاتف، بأقصر طريق
    const target = -heading;
    let delta = ((target - lastRot.current + 540) % 360) - 180;
    const next = lastRot.current + delta;
    lastRot.current = next;
    Animated.timing(rot, { toValue: next, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [heading, rot]);

  useEffect(() => {
    if (aligned && !wasAligned.current && state.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    wasAligned.current = aligned;
  }, [aligned, state.haptics]);

  const spin = rot.interpolate({ inputRange: [-3600, 3600], outputRange: ['-3600deg', '3600deg'] });
  const SIZE = 290;
  const c = SIZE / 2;

  return (
    <Screen>
      <Header title="اتجاه القبلة" subtitle={getLocation(state).city} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22, padding: 20 }}>
        <View style={{ alignItems: 'center' }}>
          <Ionicons name="caret-down" size={26} color={aligned ? colors.success : colors.goldText} />
        </View>
        <Animated.View style={{ width: SIZE, height: SIZE, transform: [{ rotate: spin }] }}>
          <Svg width={SIZE} height={SIZE}>
            <Circle cx={c} cy={c} r={c - 4} fill={colors.emeraldDeep} stroke={colors.gold} strokeWidth={2} />
            <Circle cx={c} cy={c} r={c - 18} fill="none" stroke="rgba(227,196,126,0.35)" strokeDasharray="2 6" />
            {Array.from({ length: 72 }).map((_, i) => {
              const a = (i * 5 * Math.PI) / 180;
              const r1 = c - 6;
              const r2 = i % 18 === 0 ? c - 20 : i % 2 === 0 ? c - 13 : c - 10;
              return (
                <Path
                  key={i}
                  d={`M${c + r1 * Math.sin(a)} ${c - r1 * Math.cos(a)} L${c + r2 * Math.sin(a)} ${c - r2 * Math.cos(a)}`}
                  stroke="rgba(227,196,126,0.7)"
                  strokeWidth={i % 18 === 0 ? 2 : 1}
                />
              );
            })}
            {[
              ['ش', 0],
              ['شر', 90],
              ['ج', 180],
              ['غ', 270],
            ].map(([l, deg]) => {
              const a = ((deg as number) * Math.PI) / 180;
              const r = c - 36;
              return (
                <SvgText key={l as string} x={c + r * Math.sin(a)} y={c - r * Math.cos(a) + 5} fontSize={14} fill="#E3C47E" textAnchor="middle" fontWeight="bold">
                  {l as string}
                </SvgText>
              );
            })}
            <G rotation={qibla} origin={`${c}, ${c}`}>
              <Path d={`M${c} ${30} L${c + 12} ${c} L${c} ${c - 10} L${c - 12} ${c} Z`} fill={colors.gold} />
              <Path d={`M${c} ${SIZE - 30} L${c + 12} ${c} L${c} ${c + 10} L${c - 12} ${c} Z`} fill="rgba(227,196,126,0.25)" />
              <Path d={`M${c - 11} ${12} h22 v16 h-22 z`} fill="#1E130C" stroke={colors.gold} strokeWidth={1.5} />
              <Path d={`M${c - 11} ${17} h22`} stroke={colors.gold} strokeWidth={1.5} />
            </G>
            <Circle cx={c} cy={c} r={6} fill="#F6DFA4" />
          </Svg>
        </Animated.View>
        <Card style={{ alignSelf: 'stretch', alignItems: 'center', gap: 4, backgroundColor: aligned ? colors.successSoft : colors.card }}>
          {denied ? (
            <T style={{ textAlign: 'center', color: colors.muted }}>اسمح للتطبيق باستخدام الموقع حتى تعمل البوصلة.</T>
          ) : heading === null ? (
            <T style={{ textAlign: 'center', color: colors.muted }}>جارٍ تشغيل البوصلة…</T>
          ) : (
            <>
              <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 22, lineHeight: 34, textAlign: 'center', color: aligned ? colors.success : colors.goldText }}>
                {aligned ? 'أنت باتجاه القبلة' : 'أدِر الهاتف حتى يصبح رمز الكعبة في الأعلى'}
              </T>
              <T style={{ fontSize: 13, color: colors.muted, textAlign: 'center' }}>
                القبلة {toArabicDigits(Math.round(qibla))}° · اتجاه هاتفك {toArabicDigits(Math.round(heading))}°
              </T>
            </>
          )}
        </Card>
        <T style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>ضع الهاتف بشكل مسطّح، وابتعد عن المعادن والأجهزة الكهربائية لدقة أفضل.</T>
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  locRow: { flexDirection: ROW, alignItems: 'center', gap: 8, height: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  nextCard: { flexDirection: ROW, alignItems: 'center', justifyContent: 'space-between', borderRadius: 22, borderWidth: 1, padding: 16 },
  table: { borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  prayerRow: { flexDirection: ROW, alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12 },
  pIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modeBtn: { flexDirection: ROW, alignItems: 'center', justifyContent: 'center', gap: 4, width: 78, height: 34, borderRadius: 17, borderWidth: 1 },
  qiblaCard: { flexDirection: ROW, alignItems: 'center', gap: 14, borderRadius: 20, borderWidth: 1, padding: 14 },
});
