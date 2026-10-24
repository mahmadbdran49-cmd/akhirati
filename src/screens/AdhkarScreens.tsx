import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Divider, Header, IconButton, IconName, ListRow, Screen, T, TabHeader } from '../components/ui';
import { CATEGORIES, Dhikr, findDhikr, getCategory } from '../data/adhkar';
import { ALL_FEELING_DUAS, FEELINGS } from '../data/feelings';
import { Route, useNav } from '../navigation';
import { ALIGN_START, ROW } from '../rtl';
import { useSharePost } from '../share';
import { useStore } from '../store';
import { FONTS, toArabicDigits } from '../theme';

export const CATEGORY_ICONS: Record<string, IconName> = {
  sun: 'sunny-outline',
  moon: 'moon-outline',
  bed: 'bed-outline',
  wake: 'alarm-outline',
  mosque: 'business-outline',
  home: 'home-outline',
  book: 'book-outline',
};

export function lookupAny(id: string): Dhikr | undefined {
  return findDhikr(id) ?? ALL_FEELING_DUAS.find((d) => d.id === id);
}

export function AdhkarListScreen() {
  const { push } = useNav();
  return (
    <Screen>
      <TabHeader title="الأذكار والأدعية" subtitle="من حصن المسلم والقرآن الكريم، مع ذكر المصدر" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, gap: 10 }}>
        {CATEGORIES.map((c, i) => (
          <ListRow
            key={c.id}
            icon={CATEGORY_ICONS[c.icon]}
            emerald={i % 2 === 1}
            title={c.title}
            subtitle={`${c.subtitle} · ${toArabicDigits(c.items.length)} أذكار`}
            onPress={() => push({ name: 'reader', source: 'category', id: c.id })}
          />
        ))}
        <ListRow icon="heart-half-outline" title="الدعاء حسب حالتك" subtitle="قلق، حزن، امتحان، مرض، سفر، استخارة…" onPress={() => push({ name: 'feelings' })} />
        <ListRow icon="heart-outline" emerald title="المفضلة" subtitle="ما حفظته من أذكار وأدعية" onPress={() => push({ name: 'favorites' })} />
      </ScrollView>
    </Screen>
  );
}

function timesLabel(n: number): string {
  if (n === 1) return 'مرة واحدة';
  if (n === 2) return 'مرتان';
  if (n === 3) return 'ثلاث مرات';
  if (n === 7) return 'سبع مرات';
  return `${toArabicDigits(n)} مرة`;
}

export function ReaderScreen({ route }: { route: Extract<Route, { name: 'reader' }> }) {
  const { colors, state, toggleFavorite, isFavorite, markTodayDone } = useStore();
  const share = useSharePost();
  const insets = useSafeAreaInsets();

  const { title, items } = useMemo(() => {
    if (route.source === 'favorites') return { title: 'المفضلة', items: state.favorites.map(lookupAny).filter(Boolean) as Dhikr[] };
    if (route.source === 'feeling') {
      const f = FEELINGS.find((x) => x.id === route.id);
      return { title: f?.label ?? '', items: f?.duas ?? [] };
    }
    const c = getCategory(route.id);
    return { title: c?.title ?? '', items: c?.items ?? [] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  const [index, setIndex] = useState(route.start ?? 0);
  const [counts, setCounts] = useState<number[]>(() => items.map(() => 0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (!items.length) {
    return (
      <Screen>
        <Header title={title} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <T style={{ textAlign: 'center', color: colors.muted }}>لا يوجد محتوى هنا بعد.</T>
        </View>
      </Screen>
    );
  }

  const item = items[index];
  const remaining = Math.max(item.count - counts[index], 0);
  const done = remaining === 0;
  const finished = counts.filter((c, i) => c >= items[i].count).length;
  const allDone = finished === items.length;
  const fav = isFavorite(item.id);
  const fs = 22 * state.adhkarScale;

  function tap() {
    if (done) return;
    const next = counts.slice();
    next[index] += 1;
    setCounts(next);
    if (next[index] >= item.count) {
      if (state.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const all = next.filter((c, i) => c >= items[i].count).length === items.length;
      if (all && route.source === 'category' && (route.id === 'morning' || route.id === 'evening')) markTodayDone();
      if (index < items.length - 1) {
        const at = index;
        timer.current = setTimeout(() => setIndex((cur) => (cur === at ? at + 1 : cur)), 650);
      }
    } else if (state.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }

  return (
    <Screen>
      <Header title={title} right={<T style={{ color: colors.muted, fontWeight: '600' }}>{toArabicDigits(index + 1)}/{toArabicDigits(items.length)}</T>} />
      <View style={[st.track, { backgroundColor: colors.border }]}>
        <View style={[st.fill, { backgroundColor: colors.gold, width: `${(finished / items.length) * 100}%` }]} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} style={{ flex: 1 }}>
        <Card style={{ gap: 12, paddingVertical: 20, alignItems: 'center' }}>
          <View style={[st.pill, { backgroundColor: colors.goldSoft, borderColor: colors.border }]}>
            <T style={{ color: colors.goldText, fontSize: 12, fontWeight: '700' }}>يُقال {timesLabel(item.count)}</T>
          </View>
          <T selectable style={{ fontFamily: FONTS.dhikr, fontSize: fs, lineHeight: fs * 1.95, textAlign: 'center' }}>{item.text}</T>
          {item.note ? <T style={{ color: colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 21 }}>{item.note}</T> : null}
          <Divider width={110} />
          <View style={[st.row, { alignSelf: 'stretch', justifyContent: 'space-between' }]}>
            <T style={{ color: colors.muted, fontSize: 12, flex: 1 }}>{item.source}</T>
            <IconButton name={fav ? 'heart' : 'heart-outline'} color={fav ? colors.danger : colors.goldText} label={fav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'} onPress={() => toggleFavorite(item.id)} />
            <IconButton name="share-outline" color={colors.goldText} label="مشاركة كبوست" onPress={() => share({ text: item.text, source: item.source, title })} />
          </View>
        </Card>

        <View style={{ alignItems: 'center' }}>
          <Pressable
            onPress={tap}
            accessibilityRole="button"
            accessibilityLabel={done ? 'تم' : `اضغط للعدّ، باقي ${remaining}`}
            style={({ pressed }) => [st.counter, { backgroundColor: colors.emerald, borderColor: colors.gold, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
          >
            {done ? (
              <>
                <Ionicons name="checkmark" size={44} color="#F6DFA4" />
                <T style={{ color: '#FFFFFF', fontWeight: '600', textAlign: 'center' }}>تمّ بحمد الله</T>
              </>
            ) : (
              <>
                <T style={{ color: '#FFFFFF', fontSize: 46, fontWeight: '700', textAlign: 'center', lineHeight: 56 }}>{toArabicDigits(remaining)}</T>
                <T style={{ color: colors.onEmeraldMuted, fontSize: 13, textAlign: 'center' }}>اضغط للعدّ</T>
              </>
            )}
          </Pressable>
        </View>

        {allDone ? (
          <Card style={{ backgroundColor: colors.successSoft, alignItems: 'center', gap: 4 }}>
            <T style={{ fontWeight: '700', color: colors.success, textAlign: 'center' }}>أحسنت! أتممت {title}</T>
            <T style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>تقبّل الله منك</T>
          </Card>
        ) : null}
      </ScrollView>
      <View style={[st.row, { gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 16 }]}>
        <Button title="السابق" variant="outline" style={{ flex: 1 }} onPress={() => setIndex((i) => Math.max(i - 1, 0))} />
        <Button title="التالي" style={{ flex: 1 }} onPress={() => setIndex((i) => Math.min(i + 1, items.length - 1))} />
      </View>
    </Screen>
  );
}

export function FeelingsScreen() {
  const { colors } = useStore();
  const { push } = useNav();
  return (
    <Screen>
      <Header title="الدعاء حسب حالتك" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 10, paddingTop: 4 }}>
        <T style={{ color: colors.muted, marginBottom: 4, lineHeight: 22 }}>كيف تشعر الآن؟ اختر حالتك، ونعرض لك أدعية مناسبة من القرآن والسنة.</T>
        {FEELINGS.map((f, i) => (
          <ListRow
            key={f.id}
            title={f.label}
            subtitle={f.hint}
            emerald={i % 2 === 1}
            icon="heart-half-outline"
            onPress={() => push({ name: 'reader', source: 'feeling', id: f.id })}
            right={
              <View style={[st.badge, { backgroundColor: colors.goldSoft }]}>
                <T style={{ color: colors.goldText, fontSize: 12, fontWeight: '600' }}>{toArabicDigits(f.duas.length)}</T>
              </View>
            }
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

export function FavoritesScreen() {
  const { colors, state, toggleFavorite } = useStore();
  const { push } = useNav();
  const items = state.favorites.map(lookupAny).filter(Boolean) as Dhikr[];
  return (
    <Screen>
      <Header title="المفضلة" />
      {items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 }}>
          <Ionicons name="heart-outline" size={44} color={colors.gold} />
          <T style={{ textAlign: 'center', color: colors.muted, lineHeight: 22 }}>لم تضف شيئاً بعد. اضغط على القلب بجانب أي ذكر أو دعاء ليظهر هنا.</T>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}>
          {items.map((d, i) => (
            <Pressable
              key={d.id}
              onPress={() => push({ name: 'reader', source: 'favorites', id: 'fav', start: i })}
              accessibilityRole="button"
              style={({ pressed }) => [st.favItem, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={{ flex: 1, gap: 6, alignItems: ALIGN_START }}>
                <T style={{ fontFamily: FONTS.dhikr, fontSize: 18, lineHeight: 34 }} numberOfLines={3}>{d.text}</T>
                <T style={{ fontSize: 12, color: colors.muted }}>{d.source}</T>
              </View>
              <IconButton name="heart" color={colors.danger} label="إزالة من المفضلة" onPress={() => toggleFavorite(d.id)} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: ROW, alignItems: 'center' },
  track: { height: 4, borderRadius: 2, marginHorizontal: 20, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, alignSelf: ALIGN_START },
  pill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  counter: {
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  badge: { minWidth: 30, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  favItem: { flexDirection: ROW, alignItems: 'flex-start', gap: 8, borderRadius: 18, borderWidth: 1, padding: 16 },
});
