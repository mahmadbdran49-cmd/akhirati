import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { TREE_MESSAGES, TreeArt, TreeHandle, treeState } from '../components/Tree';
import { Card, Header, Screen, T } from '../components/ui';
import { useNav } from '../navigation';
import { ROW } from '../rtl';
import { streakCount, useStore } from '../store';
import { FONTS, todayKey, toArabicDigits } from '../theme';

export const QUICK_DHIKR = ['أستغفر الله', 'سبحان الله', 'الحمد لله', 'لا إله إلا الله', 'الله أكبر'];

// شجرة العبادات كاملة: تزهر بالمداومة، وتمطر عليها مع كل عشرة أذكار
export default function TreeScreen() {
  const { colors, state, addTasbih, isDark } = useStore();
  const { push } = useNav();
  const { width } = useWindowDimensions();
  const ref = useRef<TreeHandle>(null);
  const [session, setSession] = useState(0);
  const ts = treeState(state.tree.lastCare);
  const today = state.tasbih.day === todayKey() ? state.tasbih.today : 0;
  const streak = streakCount(state.doneDays);
  const artW = Math.min(width - 24, 430);

  function say() {
    addTasbih(1);
    const n = session + 1;
    setSession(n);
    if (state.haptics) Haptics.selectionAsync().catch(() => {});
    if (n % 10 === 0) {
      ref.current?.rain();
      if (state.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }

  return (
    <Screen style={{ backgroundColor: isDark ? '#07110D' : colors.bg }}>
      <Header title="شجرة عباداتك" subtitle="تزهر بالمداومة على الذكر" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40, alignItems: 'center', gap: 14 }}>
        <Pressable onPress={() => ref.current?.sway()} accessibilityRole="image" accessibilityLabel={`الشجرة: ${TREE_MESSAGES[ts.stage]}`}>
          <TreeArt ref={ref} state={ts} width={artW} night={isDark} />
        </Pressable>

        <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 21, lineHeight: 34, color: colors.goldText, textAlign: 'center', paddingHorizontal: 24 }}>
          {TREE_MESSAGES[ts.stage]}
        </T>
        {ts.stage !== 'bloom' ? (
          <T style={{ fontSize: 13, color: colors.muted, textAlign: 'center', paddingHorizontal: 30, lineHeight: 21 }}>
            {ts.fallen ? 'لا بأس، اذكر الله الآن وستعود شجرتك للحياة من جديد' : 'كل ذكر يسقيها، وكل عشرة أذكار ينزل عليها المطر'}
          </T>
        ) : null}

        <View style={[st.row, { gap: 10, paddingHorizontal: 20, alignSelf: 'stretch' }]}>
          {[
            ['أيام المداومة', toArabicDigits(streak)],
            ['أذكار اليوم', toArabicDigits(today)],
            ['مرات السقاية', toArabicDigits(state.tree.waterings)],
          ].map(([k, v]) => (
            <Card key={k} style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 12, paddingHorizontal: 6 }}>
              <T style={{ fontSize: 22, fontWeight: '700', color: colors.goldText, textAlign: 'center' }}>{v}</T>
              <T style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>{k}</T>
            </Card>
          ))}
        </View>

        <View style={{ alignSelf: 'stretch', paddingHorizontal: 20, gap: 10 }}>
          <T style={{ fontWeight: '700', color: colors.goldText }}>اسقِ شجرتك بالذكر · {toArabicDigits(session % 10)} من ١٠</T>
          <View style={[st.row, { flexWrap: 'wrap', gap: 8 }]}>
            {QUICK_DHIKR.map((d) => (
              <Pressable
                key={d}
                onPress={say}
                accessibilityRole="button"
                style={({ pressed }) => [st.dhikr, { backgroundColor: pressed ? colors.gold : colors.goldSoft, borderColor: colors.borderStrong }]}
              >
                <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 16, lineHeight: 26, color: colors.goldText, textAlign: 'center' }}>{d}</T>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => push({ name: 'tasbih' })} accessibilityRole="button" style={[st.link, { borderColor: colors.border }]}>
            <T style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>افتح المسبحة الكاملة — كل تسبيحة فيها تسقي الشجرة أيضاً</T>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: ROW, alignItems: 'center' },
  dhikr: { flexGrow: 1, minWidth: '30%', height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  link: { borderWidth: 1, borderRadius: 14, padding: 12 },
});
