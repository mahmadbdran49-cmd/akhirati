import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Header, IconButton, Screen, T } from '../components/ui';
import { Dhikr, findDhikr, getCategory } from '../data/adhkar';
import { ALL_FEELING_DUAS, FEELINGS } from '../data/feelings';
import { Route } from '../navigation';
import { ALIGN_START, ROW } from '../rtl';
import { useStore } from '../store';
import { QURAN_FONT, toArabicDigits } from '../theme';

function timesLabel(n: number): string {
  if (n === 1) return 'مرة واحدة';
  if (n === 2) return 'مرتان';
  if (n === 3) return 'ثلاث مرات';
  if (n === 7) return 'سبع مرات';
  return `${toArabicDigits(n)} مرة`;
}

function resolve(route: Extract<Route, { name: 'reader' }>): { title: string; items: Dhikr[] } {
  if (route.source === 'category') {
    const c = getCategory(route.id);
    return { title: c?.title ?? '', items: c?.items ?? [] };
  }
  if (route.source === 'feeling') {
    const f = FEELINGS.find((x) => x.id === route.id);
    return { title: f?.label ?? '', items: f?.duas ?? [] };
  }
  return { title: 'المفضلة', items: [] };
}

export function lookupAny(id: string): Dhikr | undefined {
  return findDhikr(id) ?? ALL_FEELING_DUAS.find((d) => d.id === id);
}

export default function ReaderScreen({ route }: { route: Extract<Route, { name: 'reader' }> }) {
  const { colors, state, toggleFavorite, isFavorite, markTodayDone } = useStore();
  const insets = useSafeAreaInsets();

  const { title, items } = useMemo(() => {
    if (route.source === 'favorites') {
      return { title: 'المفضلة', items: state.favorites.map(lookupAny).filter(Boolean) as Dhikr[] };
    }
    return resolve(route);
    // المفضلة تُحسب مرة واحدة عند فتح الشاشة
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  const [index, setIndex] = useState(route.start ?? 0);
  const [counts, setCounts] = useState<number[]>(() => items.map(() => 0));
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

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
  const progress = finished / items.length;
  const fav = isFavorite(item.id);
  const fontSize = 22 * state.fontScale;

  function tap() {
    if (done) return;
    const next = counts.slice();
    next[index] += 1;
    setCounts(next);
    if (next[index] >= item.count) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const nowFinished = next.filter((c, i) => c >= items[i].count).length;
      if (nowFinished === items.length && (route.source === 'category' && ['morning', 'evening'].includes(route.id))) {
        markTodayDone();
      }
      if (index < items.length - 1) {
        const at = index;
        advanceTimer.current = setTimeout(() => setIndex((cur) => (cur === at ? at + 1 : cur)), 650);
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }

  return (
    <Screen>
      <Header
        title={title}
        right={
          <T style={{ color: colors.muted, fontWeight: '600' }}>
            {toArabicDigits(index + 1)} / {toArabicDigits(items.length)}
          </T>
        }
      />
      <View style={[s.track, { backgroundColor: colors.border }]}>
        <View style={[s.fill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 12 }} style={{ flex: 1 }}>
        <Card style={{ gap: 14, paddingVertical: 22 }}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <View style={[s.pill, { backgroundColor: colors.goldSoft }]}>
              <T style={{ color: colors.goldText, fontSize: 12, fontWeight: '600' }}>يُقال {timesLabel(item.count)}</T>
            </View>
          </View>
          <T style={{ fontFamily: QURAN_FONT, fontSize, lineHeight: fontSize * 1.95, textAlign: 'center' }}>{item.text}</T>
          {item.note ? <T style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>{item.note}</T> : null}
          <View style={[s.row, s.footer, { borderTopColor: colors.border }]}>
            <T style={{ color: colors.muted, fontSize: 12, flex: 1 }}>{item.source}</T>
            <IconButton
              name={fav ? 'heart' : 'heart-outline'}
              color={fav ? colors.danger : colors.muted}
              label={fav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              onPress={() => toggleFavorite(item.id)}
            />
            <IconButton
              name="share-social-outline"
              label="مشاركة"
              onPress={() => Share.share({ message: `${item.text}\n\n(${item.source})\n\nمن تطبيق آخرتي` })}
            />
          </View>
        </Card>

        <View style={{ alignItems: 'center' }}>
          <Pressable
            onPress={tap}
            accessibilityRole="button"
            accessibilityLabel={done ? 'تم' : `اضغط للعدّ، باقي ${remaining}`}
            style={({ pressed }) => [
              s.counter,
              { backgroundColor: colors.primary, borderColor: colors.gold, transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
          >
            {done ? (
              <>
                <Ionicons name="checkmark" size={44} color={colors.gold} />
                <T style={{ color: colors.onPrimary, fontWeight: '600', textAlign: 'center' }}>تمّ بحمد الله</T>
              </>
            ) : (
              <>
                <T style={{ color: colors.onPrimary, fontSize: 46, fontWeight: '700', textAlign: 'center', lineHeight: 56 }}>
                  {toArabicDigits(remaining)}
                </T>
                <T style={{ color: colors.onPrimaryMuted, fontSize: 13, textAlign: 'center' }}>اضغط للعدّ</T>
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

      <View style={[s.row, { gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="السابق"
          variant="outline"
          style={{ flex: 1 }}
          onPress={() => setIndex((i) => Math.max(i - 1, 0))}
        />
        <Button
          title="التالي"
          variant="dark"
          style={{ flex: 1 }}
          onPress={() => setIndex((i) => Math.min(i + 1, items.length - 1))}
        />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: ROW, alignItems: 'center' },
  track: { height: 6, borderRadius: 3, marginHorizontal: 16, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, alignSelf: ALIGN_START },
  pill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  footer: { borderTopWidth: 1, paddingTop: 8, gap: 2 },
  counter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    elevation: 6,
    shadowColor: '#0F3D2E',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
});
