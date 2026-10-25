import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TreeBadge, treeState } from '../components/Tree';
import { Divider, IconName, IslamicPattern, RoundButton, T } from '../components/ui';
import Waves from '../components/Waves';
import { duaForDay, hijriLabel, occasionsFor, toHijri, WEEKDAYS } from '../hijri';
import { Route, Tab, useNav } from '../navigation';
import { getLocation, nextPrayer } from '../prayer';
import { surah } from '../quran';
import { ROW } from '../rtl';
import { useSharePost } from '../share';
import { streakCount, useStore } from '../store';
import { FONTS, fmtCountdown, fmtTime, toArabicDigits } from '../theme';
import { DailyVideoCard } from './VideoScreens';

type Tile = { label: string; icon: IconName; route?: Route; tab?: Tab; emerald?: boolean };

const TILES: Tile[] = [
  { label: 'أذكار الصباح', icon: 'sunny-outline', route: { name: 'reader', source: 'category', id: 'morning' } },
  { label: 'أذكار المساء', icon: 'moon-outline', route: { name: 'reader', source: 'category', id: 'evening' }, emerald: true },
  { label: 'أذكار النوم', icon: 'bed-outline', route: { name: 'reader', source: 'category', id: 'sleep' } },
  { label: 'بعد الصلاة', icon: 'business-outline', route: { name: 'reader', source: 'category', id: 'prayer' }, emerald: true },
  { label: 'حسب حالتك', icon: 'heart-half-outline', route: { name: 'feelings' } },
  { label: 'المسبحة', icon: 'ellipse-outline', route: { name: 'tasbih' }, emerald: true },
  { label: 'القبلة', icon: 'compass-outline', route: { name: 'qibla' } },
  { label: 'قصص الأنبياء', icon: 'library-outline', route: { name: 'stories' }, emerald: true },
  { label: 'أسماء الله الحسنى', icon: 'star-outline', route: { name: 'names' } },
  { label: 'اختبر معلوماتك', icon: 'trophy-outline', route: { name: 'quiz' }, emerald: true },
  { label: 'أدعية قرآنية', icon: 'book-outline', route: { name: 'reader', source: 'category', id: 'quran' } },
  { label: 'المفضلة', icon: 'heart-outline', route: { name: 'favorites' }, emerald: true },
  { label: 'مكتبة المقاطع', icon: 'play-circle-outline', route: { name: 'videos' } },
  { label: 'القرآن في الطريق', icon: 'car-outline', route: { name: 'listen' }, emerald: true },
  { label: 'شجرة عباداتك', icon: 'leaf-outline', route: { name: 'tree' } },
];

const QUICK = ['أستغفر الله', 'سبحان الله', 'الحمد لله'];

// مطر صغير فوق شعار الشجرة
function MiniRain({ trigger }: { trigger: number }) {
  const v = useRef(new Animated.Value(0)).current;
  const o = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!trigger) return;
    v.setValue(0);
    Animated.parallel([
      Animated.sequence([Animated.timing(o, { toValue: 1, duration: 120, useNativeDriver: true }), Animated.delay(900), Animated.timing(o, { toValue: 0, duration: 300, useNativeDriver: true })]),
      Animated.loop(Animated.timing(v, { toValue: 1, duration: 520, easing: Easing.linear, useNativeDriver: true }), { iterations: 3 }),
    ]).start();
  }, [trigger, v, o]);
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [-22, 46] });
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: o, overflow: 'hidden', borderRadius: 32 }]}>
      <Animated.View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10, transform: [{ translateY: y }] }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={{ width: 2.5, height: 9, borderRadius: 2, backgroundColor: '#A9D8F0', marginTop: (i % 2) * 8 }} />
        ))}
      </Animated.View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { colors, state, update, addTasbih } = useStore();
  const { push } = useNav();
  const [quick, setQuick] = useState(0);
  const [rain, setRain] = useState(0);
  const shine = useRef(new Animated.Value(0)).current;
  const tree = treeState(state.tree.lastCare);

  useEffect(() => {
    if (state.minimal) return;
    const loop = Animated.loop(
      Animated.sequence([Animated.timing(shine, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }), Animated.delay(3800)])
    );
    loop.start();
    return () => loop.stop();
  }, [shine, state.minimal]);

  function say() {
    addTasbih(1);
    const n = quick + 1;
    setQuick(n);
    if (state.haptics) Haptics.selectionAsync().catch(() => {});
    if (n % 10 === 0) setRain((r) => r + 1);
  }
  const share = useSharePost();
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = toHijri(now, state.hijriOffset);
  const next = nextPrayer(state, now);
  const occasions = occasionsFor(now, h);
  const dua = duaForDay(now);
  const streak = streakCount(state.doneDays);
  const last = state.lastRead;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={[st.hero, { paddingTop: insets.top + 14, backgroundColor: colors.bg2, borderColor: colors.border }]}>
        <IslamicPattern opacity={0.1} />
        <View style={[st.row, { justifyContent: 'space-between' }]}>
          <View style={[st.row, { gap: 12, flex: 1 }]}>
            <Pressable
              onPress={() => {
                if (!state.tipSeen) update((x) => ({ ...x, tipSeen: true }));
                push({ name: 'tree' });
              }}
              accessibilityRole="button"
              accessibilityLabel="شجرة عباداتك"
            >
              <TreeBadge state={tree} size={60} />
              <MiniRain trigger={rain} />
            </Pressable>
            <View style={{ flex: 1 }}>
              {/* الضغط المطوّل ثانيتين على اسم التطبيق يفتح دخول الإداري (مخفي عن المستخدمين) */}
              <Pressable onLongPress={() => push({ name: 'admin' })} delayLongPress={2000} accessibilityRole="text">
                <T style={{ fontFamily: FONTS.logo, fontSize: 34, lineHeight: 56, color: colors.goldText }}>آخرتي</T>
              </Pressable>
              <T style={{ fontSize: 12, color: colors.muted }} numberOfLines={1}>
                {WEEKDAYS[now.getDay()]} · {hijriLabel(h)}
              </T>
            </View>
          </View>
          <View style={[st.row, { gap: 8 }]}>
            {streak > 0 ? (
              <View style={[st.streak, { borderColor: colors.border }]}>
                <Ionicons name="flame" size={16} color={colors.gold} />
                <T style={{ color: colors.goldText, fontWeight: '700' }}>{toArabicDigits(streak)}</T>
              </View>
            ) : null}
            <RoundButton icon="search" label="البحث" onPress={() => push({ name: 'search' })} />
            <RoundButton icon="settings-outline" label="الإعدادات" onPress={() => push({ name: 'settings' })} />
          </View>
        </View>

        {!state.tipSeen ? (
          <Pressable onPress={() => update((x) => ({ ...x, tipSeen: true }))} style={[st.tip, { backgroundColor: colors.gold }]} accessibilityRole="button">
            <View style={[st.tipArrow, { borderBottomColor: colors.gold }]} />
            <T style={{ color: '#1E130C', fontSize: 13, fontWeight: '700', flex: 1 }}>هنا شجرة عباداتك 🌳 انظر إليها واعتنِ بها</T>
            <Ionicons name="close" size={16} color="#1E130C" />
          </Pressable>
        ) : null}

        <View style={[st.row, { gap: 8 }]}>
          {QUICK.map((d) => (
            <Pressable
              key={d}
              onPress={say}
              accessibilityRole="button"
              accessibilityLabel={d}
              style={({ pressed }) => [st.quick, { borderColor: colors.borderStrong, backgroundColor: pressed ? colors.gold : colors.goldSoft }]}
            >
              <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 15, lineHeight: 24, color: colors.goldText, textAlign: 'center' }}>{d}</T>
            </Pressable>
          ))}
        </View>
        {quick > 0 ? (
          <T style={{ fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: -6 }}>
            {toArabicDigits(quick)} ذكر الآن · كل ١٠ أذكار تمطر على شجرتك
          </T>
        ) : null}

        <Pressable
          onPress={() => push({ name: 'qibla' })}
          accessibilityRole="button"
          style={[st.next, { backgroundColor: colors.emerald, borderColor: colors.borderStrong }]}
        >
          {!state.minimal ? (
            <Animated.View
              pointerEvents="none"
              style={[st.shine, { transform: [{ translateX: shine.interpolate({ inputRange: [0, 1], outputRange: [-120, 520] }) }, { rotate: '18deg' }] }]}
            />
          ) : null}
          <View style={{ gap: 2 }}>
            <T style={{ fontSize: 12, color: colors.onEmeraldMuted }}>الصلاة القادمة · {getLocation(state).city}</T>
            <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 30, lineHeight: 44, color: '#FFFFFF' }}>{next.name}</T>
            <T style={{ fontSize: 13, color: '#F6DFA4' }}>{fmtTime(next.at)}</T>
          </View>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <T style={{ fontSize: 11, color: colors.onEmeraldMuted, textAlign: 'center' }}>متبقي</T>
            <T style={{ fontSize: 26, fontWeight: '700', color: '#F6DFA4', letterSpacing: 1, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
              {fmtCountdown(next.at.getTime() - now.getTime())}
            </T>
          </View>
        </Pressable>
        <Waves />
      </View>

      <View style={{ paddingHorizontal: 20, gap: 14, marginTop: 16 }}>
        {occasions.map((o) => (
          <View key={o.id} style={[st.occasion, { backgroundColor: colors.cardAlt, borderColor: colors.borderStrong }]}>
            <View style={[st.occIcon, { backgroundColor: colors.goldSoft }]}>
              <Ionicons name="sparkles-outline" size={20} color={colors.goldText} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <T style={{ fontWeight: '700', color: colors.goldText }}>{o.title}</T>
              <T style={{ fontSize: 13, color: colors.muted, lineHeight: 21 }}>{o.body}</T>
            </View>
            {o.action ? (
              <Pressable
                onPress={() => push({ name: 'surah', n: o.action!.surah })}
                accessibilityRole="button"
                style={[st.occBtn, { backgroundColor: colors.gold }]}
              >
                <T style={{ color: '#1E130C', fontWeight: '700', fontSize: 13, textAlign: 'center' }}>{o.action.label}</T>
              </Pressable>
            ) : null}
          </View>
        ))}

        <DailyVideoCard />

        <View style={[st.dua, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Divider width={120} />
          <T style={{ color: colors.gold, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>{dua.title}</T>
          <T style={{ fontFamily: FONTS.dhikr, fontSize: 21 * state.adhkarScale, lineHeight: 40 * state.adhkarScale, textAlign: 'center' }}>{dua.text}</T>
          <T style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>{dua.source}</T>
          <Pressable
            onPress={() => share({ text: dua.text, source: dua.source, title: dua.title })}
            accessibilityRole="button"
            style={[st.shareBtn, { borderColor: colors.borderStrong }]}
          >
            <Ionicons name="share-outline" size={16} color={colors.goldText} />
            <T style={{ color: colors.goldText, fontSize: 13, fontWeight: '600' }}>مشاركة كبوست</T>
          </Pressable>
        </View>

        <Pressable
          onPress={() => push({ name: 'surah', n: last?.surah ?? 1, ayah: last?.ayah })}
          accessibilityRole="button"
          style={[st.continue, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
        >
          <View style={[st.contIcon, { backgroundColor: colors.emerald }]}>
            <Ionicons name="book" size={22} color="#F6DFA4" />
          </View>
          <View style={{ flex: 1 }}>
            <T style={{ fontSize: 12, color: colors.muted }}>{last ? 'تابع القراءة' : 'ابدأ القراءة'}</T>
            <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 19, lineHeight: 30 }}>
              {last ? `سورة ${surah(last.surah).name} · الآية ${toArabicDigits(last.ayah)}` : 'سورة الفاتحة'}
            </T>
          </View>
          <Ionicons name="chevron-back" size={18} color={colors.gold} />
        </Pressable>

        <View style={[st.grid]}>
          {TILES.map((t) => (
            <Pressable
              key={t.label}
              onPress={() => (t.route ? push(t.route) : undefined)}
              accessibilityRole="button"
              accessibilityLabel={t.label}
              style={({ pressed }) => [st.tile, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={[st.tileIcon, { backgroundColor: t.emerald ? colors.emerald : colors.goldSoft }]}>
                <Ionicons name={t.icon} size={21} color={t.emerald ? '#BFE3D3' : colors.goldText} />
              </View>
              <T style={{ fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18 }}>{t.label}</T>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: ROW, alignItems: 'center' },
  hero: { paddingHorizontal: 20, paddingBottom: 62, overflow: 'hidden', gap: 14 },
  quick: { flex: 1, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tip: { flexDirection: ROW, alignItems: 'center', gap: 8, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12, marginTop: -4 },
  tipArrow: { position: 'absolute', top: -7, right: 24, width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderBottomWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  shine: { position: 'absolute', top: -30, bottom: -30, width: 40, backgroundColor: 'rgba(255,240,205,0.13)' },
  streak: { flexDirection: ROW, alignItems: 'center', gap: 4, height: 36, paddingHorizontal: 10, borderRadius: 18, borderWidth: 1 },
  next: { flexDirection: ROW, alignItems: 'center', justifyContent: 'space-between', borderRadius: 22, borderWidth: 1, padding: 16, overflow: 'hidden' },
  occasion: { flexDirection: ROW, alignItems: 'center', gap: 12, borderRadius: 20, borderWidth: 1, padding: 14 },
  occIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  occBtn: { height: 36, paddingHorizontal: 12, borderRadius: 10, justifyContent: 'center' },
  dua: { borderRadius: 22, borderWidth: 1, padding: 18, alignItems: 'center', gap: 8 },
  shareBtn: { flexDirection: ROW, alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, marginTop: 4 },
  continue: { flexDirection: ROW, alignItems: 'center', gap: 14, borderRadius: 20, borderWidth: 1, padding: 14 },
  contIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: ROW, flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  tile: { width: '31.5%', borderRadius: 18, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 4, alignItems: 'center', gap: 8, minHeight: 100 },
  tileIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
