import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Divider, IconName, IslamicPattern, RoundButton, T } from '../components/ui';
import { duaForDay, hijriLabel, occasionsFor, toHijri, WEEKDAYS } from '../hijri';
import { Route, Tab, useNav } from '../navigation';
import { getLocation, nextPrayer } from '../prayer';
import { surah } from '../quran';
import { ROW } from '../rtl';
import { useSharePost } from '../share';
import { streakCount, useStore } from '../store';
import { FONTS, fmtCountdown, fmtTime, toArabicDigits } from '../theme';

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
];

export default function HomeScreen() {
  const { colors, state } = useStore();
  const { push } = useNav();
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
          <View>
            <T style={{ fontFamily: FONTS.logo, fontSize: 34, lineHeight: 56, color: colors.goldText }}>آخرتي</T>
            <T style={{ fontSize: 12, color: colors.muted }}>
              {WEEKDAYS[now.getDay()]} · {hijriLabel(h)}
            </T>
          </View>
          <View style={[st.row, { gap: 8 }]}>
            {streak > 0 ? (
              <View style={[st.streak, { borderColor: colors.border }]}>
                <Ionicons name="flame" size={16} color={colors.gold} />
                <T style={{ color: colors.goldText, fontWeight: '700' }}>{toArabicDigits(streak)}</T>
              </View>
            ) : null}
            <RoundButton icon="settings-outline" label="الإعدادات" onPress={() => push({ name: 'settings' })} />
          </View>
        </View>

        <Pressable
          onPress={() => push({ name: 'qibla' })}
          accessibilityRole="button"
          style={[st.next, { backgroundColor: colors.emerald, borderColor: colors.borderStrong }]}
        >
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
  hero: { paddingHorizontal: 20, paddingBottom: 18, borderBottomWidth: 1, overflow: 'hidden', gap: 14 },
  streak: { flexDirection: ROW, alignItems: 'center', gap: 4, height: 36, paddingHorizontal: 10, borderRadius: 18, borderWidth: 1 },
  next: { flexDirection: ROW, alignItems: 'center', justifyContent: 'space-between', borderRadius: 22, borderWidth: 1, padding: 16 },
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
