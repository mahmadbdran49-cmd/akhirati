import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Header, Screen, T } from '../components/ui';
import { Level, LEVELS, pickRound } from '../data/quiz';
import { useNav } from '../navigation';
import { ALIGN_START, ROW } from '../rtl';
import { useStore } from '../store';
import { toArabicDigits } from '../theme';

const LEVEL_ICON: Record<Level, 'leaf-outline' | 'flash-outline' | 'flame-outline'> = {
  easy: 'leaf-outline',
  medium: 'flash-outline',
  hard: 'flame-outline',
};

export function QuizHomeScreen() {
  const { colors, state } = useStore();
  const { push } = useNav();
  return (
    <Screen>
      <Header title="اختبر معلوماتك" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingTop: 4 }}>
        <T style={{ color: colors.muted }}>
          أسئلة دينية في ثلاثة مستويات. كل جولة ١٠ أسئلة، ومع كل جواب شرح قصير ومصدر.
        </T>
        {LEVELS.map((l) => {
          const best = state.quizBest[l.id];
          return (
            <Pressable
              key={l.id}
              onPress={() => push({ name: 'quizPlay', level: l.id })}
              accessibilityRole="button"
              style={({ pressed }) => [s.level, { backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={[s.levelIcon, { backgroundColor: l.id === 'hard' ? colors.goldSoft : colors.greenSoft }]}>
                <Ionicons name={LEVEL_ICON[l.id]} size={24} color={l.id === 'hard' ? colors.goldText : colors.success} />
              </View>
              <View style={{ flex: 1, alignItems: ALIGN_START, gap: 2 }}>
                <T style={{ fontSize: 18, fontWeight: '700' }}>{l.title}</T>
                <T style={{ fontSize: 13, color: colors.muted }}>{l.subtitle}</T>
              </View>
              <View style={{ alignItems: 'center' }}>
                <T style={{ fontSize: 11, color: colors.muted, textAlign: 'center' }}>أفضل نتيجة</T>
                <T style={{ fontWeight: '700', color: colors.goldText, textAlign: 'center' }}>{toArabicDigits(best)} / ١٠</T>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

export function QuizPlayScreen({ level }: { level: Level }) {
  const { colors, update, state } = useStore();
  const { back } = useNav();
  const insets = useSafeAreaInsets();
  const [seed, setSeed] = useState(0);
  const round = useMemo(() => pickRound(level), [level, seed]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const levelTitle = LEVELS.find((l) => l.id === level)!.title;

  function choose(k: number) {
    if (picked !== null) return;
    setPicked(k);
    const right = k === round[i].answer;
    if (right) setScore((x) => x + 1);
    Haptics.notificationAsync(right ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
  }

  function next() {
    if (i < round.length - 1) {
      setI(i + 1);
      setPicked(null);
    } else {
      setFinished(true);
      update((st) => ({ ...st, quizBest: { ...st.quizBest, [level]: Math.max(st.quizBest[level], score) } }));
    }
  }

  function restart() {
    setSeed((x) => x + 1);
    setI(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const pct = score / round.length;
    const msg = pct === 1 ? 'ما شاء الله! علامة كاملة' : pct >= 0.7 ? 'أحسنت! نتيجة ممتازة' : pct >= 0.4 ? 'جيد، واصل التعلّم' : 'لا بأس، جرّب مرة أخرى';
    return (
      <Screen>
        <Header title={`المستوى ${levelTitle}`} />
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 20 }}>
          <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 32 }}>
            <Ionicons name="trophy" size={56} color={colors.gold} />
            <T style={{ fontSize: 44, fontWeight: '700', textAlign: 'center', lineHeight: 56 }}>
              {toArabicDigits(score)} / {toArabicDigits(round.length)}
            </T>
            <T style={{ fontSize: 18, fontWeight: '600', textAlign: 'center' }}>{msg}</T>
            <T style={{ color: colors.muted, textAlign: 'center' }}>أفضل نتيجة لك: {toArabicDigits(Math.max(state.quizBest[level], score))} / ١٠</T>
          </Card>
          <Button title="جولة جديدة" onPress={restart} />
          <Button
            title="شارك نتيجتك"
            variant="outline"
            onPress={() => Share.share({ message: `حصلت على ${score} من ${round.length} في اختبار المستوى ${levelTitle} بتطبيق آخرتي. هل تستطيع أن تتفوق عليّ؟` })}
          />
          <Button title="رجوع للمستويات" variant="outline" onPress={back} />
        </View>
      </Screen>
    );
  }

  const q = round[i];
  return (
    <Screen>
      <Header
        title={`المستوى ${levelTitle}`}
        right={<T style={{ color: colors.muted, fontWeight: '600' }}>{toArabicDigits(i + 1)} / {toArabicDigits(round.length)}</T>}
      />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingTop: 4 }}>
        <Card style={{ paddingVertical: 22 }}>
          <T style={{ fontSize: 20, fontWeight: '700', lineHeight: 32 }}>{q.q}</T>
        </Card>
        {q.options.map((o, k) => {
          const isAnswer = k === q.answer;
          const isPicked = k === picked;
          const showRight = picked !== null && isAnswer;
          const showWrong = picked !== null && isPicked && !isAnswer;
          return (
            <Pressable
              key={o}
              onPress={() => choose(k)}
              accessibilityRole="button"
              accessibilityState={{ selected: isPicked }}
              style={[
                s.option,
                { backgroundColor: colors.card, borderColor: colors.border },
                showRight && { backgroundColor: colors.successSoft, borderColor: colors.success },
                showWrong && { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
              ]}
            >
              <T style={{ flex: 1, fontSize: 16, fontWeight: '500' }}>{o}</T>
              {showRight ? <Ionicons name="checkmark-circle" size={22} color={colors.success} /> : null}
              {showWrong ? <Ionicons name="close-circle" size={22} color={colors.danger} /> : null}
            </Pressable>
          );
        })}
        {picked !== null ? (
          <Card style={{ gap: 6, backgroundColor: picked === q.answer ? colors.successSoft : colors.goldSoft }}>
            <T style={{ fontWeight: '700', color: picked === q.answer ? colors.success : colors.goldText }}>
              {picked === q.answer ? 'إجابة صحيحة!' : `الإجابة الصحيحة: ${q.options[q.answer]}`}
            </T>
            <T style={{ lineHeight: 24 }}>{q.explain}</T>
          </Card>
        ) : null}
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 16 }}>
        <Button
          title={i < round.length - 1 ? 'السؤال التالي' : 'عرض النتيجة'}
          variant={picked === null ? 'outline' : 'primary'}
          onPress={() => (picked === null ? undefined : next())}
        />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  level: { flexDirection: ROW, alignItems: 'center', gap: 14, borderRadius: 20, padding: 16, minHeight: 84 },
  levelIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  option: { flexDirection: ROW, alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, minHeight: 58, paddingVertical: 12 },
});
