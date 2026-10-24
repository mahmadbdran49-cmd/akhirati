import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, IconButton, IconName, T } from '../components/ui';
import { CATEGORIES, duaOfTheDay } from '../data/adhkar';
import { useNav } from '../navigation';
import { ALIGN_START, ROW } from '../rtl';
import { streakCount, useStore } from '../store';
import { QURAN_FONT, toArabicDigits, todayKey } from '../theme';

const DAY_NAMES = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export const CATEGORY_ICONS: Record<string, IconName> = {
  sun: 'sunny-outline',
  moon: 'moon-outline',
  bed: 'bed-outline',
  wake: 'alarm-outline',
  mosque: 'business-outline',
  home: 'home-outline',
  book: 'book-outline',
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'صباح الخير، تقبّل الله طاعتك';
  if (h < 18) return 'مساء النور، لا تنسَ أذكارك';
  return 'مساء الخير، ختام يومك بذكر الله';
}

export default function HomeScreen() {
  const { colors, state, isDark } = useStore();
  const { push, setTab } = useNav();
  const insets = useSafeAreaInsets();
  const dua = duaOfTheDay();
  const streak = streakCount(state.doneDays);

  // آخر ٧ أيام
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: todayKey(d), label: i === 6 ? 'اليوم' : DAY_NAMES[d.getDay()] };
  });
  const doneThisWeek = week.filter((w) => state.doneDays.includes(w.key)).length;

  const hour = new Date().getHours();
  const suggested = hour >= 4 && hour < 12 ? 'morning' : hour >= 12 && hour < 20 ? 'evening' : 'sleep';
  const suggestedCat = CATEGORIES.find((c) => c.id === suggested)!;

  const tiles: { title: string; subtitle: string; icon: IconName; gold?: boolean; onPress: () => void }[] = [
    ...CATEGORIES.map((c, i) => ({
      title: c.title,
      subtitle: c.subtitle,
      icon: CATEGORY_ICONS[c.icon],
      gold: i % 3 === 0,
      onPress: () => push({ name: 'reader', source: 'category', id: c.id }),
    })),
    { title: 'حسب حالتك', subtitle: 'دعاء لكل شعور', icon: 'heart-half-outline', gold: true, onPress: () => push({ name: 'feelings' }) },
    { title: 'اختبر معلوماتك', subtitle: 'سهل، متوسط، صعب', icon: 'trophy-outline', onPress: () => push({ name: 'quiz' }) },
    { title: 'المسبحة', subtitle: 'عدّاد التسبيح', icon: 'ellipse-outline', onPress: () => setTab('tasbih') },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={[s.hero, { backgroundColor: colors.primary, paddingTop: insets.top + 20 }]}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <View style={{ alignItems: ALIGN_START }}>
            <T style={[s.brand, { color: colors.onPrimary }]}>آخرتي</T>
            <T style={{ color: colors.onPrimaryMuted, fontSize: 14 }}>{greeting()}</T>
          </View>
          <View style={[s.streak, { borderColor: 'rgba(212,168,83,0.6)' }]}>
            <Ionicons name="flame" size={18} color={colors.gold} />
            <T style={{ color: colors.onPrimary, fontWeight: '700' }}>{toArabicDigits(streak)}</T>
          </View>
        </View>

        <View style={[s.duaCard, { borderColor: 'rgba(212,168,83,0.45)' }]}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <T style={{ color: colors.gold, fontWeight: '600', fontSize: 13 }}>دعاء اليوم</T>
            <IconButton
              name="share-social-outline"
              label="مشاركة الدعاء"
              color={colors.onPrimaryMuted}
              onPress={() => Share.share({ message: `${dua.text}\n\n﴿${dua.source}﴾\n\nمن تطبيق آخرتي` })}
            />
          </View>
          <T style={[s.duaText, { color: colors.onPrimary }]}>{dua.text}</T>
          <T style={{ color: colors.onPrimaryMuted, fontSize: 12 }}>{dua.source}</T>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 16, marginTop: 20 }}>
        <Pressable
          onPress={() => push({ name: 'reader', source: 'category', id: suggestedCat.id })}
          accessibilityRole="button"
          style={({ pressed }) => [s.now, { backgroundColor: colors.goldSoft, opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name={CATEGORY_ICONS[suggestedCat.icon]} size={26} color={colors.goldText} />
          <View style={{ flex: 1, alignItems: ALIGN_START }}>
            <T style={{ fontSize: 13, color: colors.goldText }}>المناسب لهذا الوقت</T>
            <T style={{ fontSize: 17, fontWeight: '700' }}>{suggestedCat.title}</T>
          </View>
          <Ionicons name="chevron-back" size={20} color={colors.goldText} />
        </Pressable>

        <Card style={{ gap: 12 }}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <T style={{ fontWeight: '600' }}>مواظبتك هذا الأسبوع</T>
            <T style={{ fontWeight: '600', color: colors.goldText, fontSize: 13 }}>
              {toArabicDigits(doneThisWeek)} من ٧ أيام
            </T>
          </View>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            {week.map((w, i) => {
              const done = state.doneDays.includes(w.key);
              const isToday = i === 6;
              return (
                <View key={w.key} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
                  <View
                    style={[
                      s.dot,
                      { backgroundColor: done ? colors.primary : isDark ? colors.border : '#E7E2D3' },
                      isToday && !done && { backgroundColor: 'transparent', borderWidth: 2, borderStyle: 'dashed', borderColor: colors.gold },
                    ]}
                  >
                    {done ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                  </View>
                  <T style={{ fontSize: 11, color: isToday ? colors.goldText : colors.muted, textAlign: 'center' }}>{w.label}</T>
                </View>
              );
            })}
          </View>
        </Card>

        <T style={{ fontSize: 17, fontWeight: '700', marginTop: 4 }}>الأذكار والأدعية</T>
        <View style={[s.grid]}>
          {tiles.map((t) => (
            <Pressable
              key={t.title}
              onPress={t.onPress}
              accessibilityRole="button"
              accessibilityLabel={t.title}
              style={({ pressed }) => [s.tile, { backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={[s.tileIcon, { backgroundColor: t.gold ? colors.goldSoft : colors.greenSoft }]}>
                <Ionicons name={t.icon} size={22} color={t.gold ? colors.goldText : isDark ? colors.onPrimaryMuted : colors.primary} />
              </View>
              <T style={{ fontWeight: '600' }}>{t.title}</T>
              <T style={{ fontSize: 12, color: colors.muted }}>{t.subtitle}</T>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: ROW, alignItems: 'center' },
  hero: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, gap: 18 },
  brand: { fontFamily: 'Amiri_700Bold', fontSize: 34, lineHeight: 48 },
  streak: { flexDirection: ROW, alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, height: 36 },
  duaCard: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderRadius: 20, padding: 16, gap: 6 },
  duaText: { fontFamily: QURAN_FONT, fontSize: 21, lineHeight: 40 },
  now: { flexDirection: ROW, alignItems: 'center', gap: 14, borderRadius: 18, padding: 16 },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: ROW, flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47.8%',
    borderRadius: 18,
    padding: 16,
    gap: 8,
    minHeight: 112,
    alignItems: ALIGN_START,
    shadowColor: '#0F3D2E',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
