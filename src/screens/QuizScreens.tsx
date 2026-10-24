import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Divider, Header, Screen, T } from '../components/ui';
import { dailyChallenge, DAILY_SIZE, HEARTS, Level, LEVELS, pickRound, Question } from '../data/quiz';
import { hijriLabel, toHijri } from '../hijri';
import { useNav } from '../navigation';
import { ALIGN_START, ROW } from '../rtl';
import { useSharePost } from '../share';
import { useStore } from '../store';
import { FONTS, toArabicDigits, todayKey } from '../theme';

export function QuizHomeScreen() {
  const { colors, state } = useStore();
  const { push } = useNav();
  const today = todayKey();
  const daily = state.quiz.daily?.day === today ? state.quiz.daily : null;

  return (
    <Screen>
      <Header title="اختبر معلوماتك" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 14 }}>
        <Pressable
          onPress={() => push({ name: 'quizPlay', mode: 'daily' })}
          accessibilityRole="button"
          style={[st.daily, { backgroundColor: colors.emerald, borderColor: colors.borderStrong }]}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <T style={{ color: '#F6DFA4', fontSize: 12, fontWeight: '700' }}>تحدّي اليوم · {hijriLabel(toHijri(new Date(), state.hijriOffset))}</T>
            <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 22, lineHeight: 34, color: '#FFFFFF' }}>خمسة أسئلة جديدة كل يوم</T>
            <T style={{ color: colors.onEmeraldMuted, fontSize: 13 }}>
              {daily ? `نتيجتك اليوم: ${toArabicDigits(daily.score)} من ${toArabicDigits(daily.total)} · عُد غداً` : 'نفس الأسئلة لك ولأصحابك، فتحدّاهم'}
            </T>
          </View>
          <View style={[st.dailyIcon, { borderColor: '#F6DFA4' }]}>
            <Ionicons name={daily ? 'checkmark' : 'calendar-outline'} size={24} color="#F6DFA4" />
          </View>
        </Pressable>

        <View style={{ alignItems: 'center', marginVertical: 2 }}>
          <Divider width={160} />
        </View>

        {LEVELS.map((l, i) => (
          <Pressable
            key={l.id}
            onPress={() => push({ name: 'quizPlay', mode: 'level', level: l.id })}
            accessibilityRole="button"
            style={({ pressed }) => [st.level, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={[st.levelNum, { borderColor: colors.gold }]}>
              <T style={{ color: colors.goldText, fontWeight: '700', textAlign: 'center' }}>{toArabicDigits(i + 1)}</T>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 20, lineHeight: 30 }}>{l.title}</T>
              <T style={{ fontSize: 13, color: colors.muted }}>{l.subtitle}</T>
            </View>
            <View style={{ alignItems: 'center' }}>
              <T style={{ fontSize: 11, color: colors.muted, textAlign: 'center' }}>أفضل نتيجة</T>
              <T style={{ fontWeight: '700', color: colors.goldText, textAlign: 'center' }}>{toArabicDigits(state.quiz.best[l.id])}/١٠</T>
            </View>
          </Pressable>
        ))}

        <Card alt style={{ gap: 6 }}>
          <T style={{ fontWeight: '700', color: colors.goldText }}>طريقة اللعب</T>
          <T style={{ color: colors.muted, fontSize: 13, lineHeight: 22 }}>
            لك ثلاثة قلوب، وكل خطأ أو انتهاء للوقت يُفقدك قلباً. بعد كل سؤال يظهر الدليل من القرآن أو السنة، ويمكنك فتح الآية في المصحف لتقرأها كاملة.
          </T>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Hearts({ n }: { n: number }) {
  const { colors } = useStore();
  return (
    <View style={{ flexDirection: ROW, gap: 4 }} accessibilityLabel={`${n} قلوب متبقية`}>
      {Array.from({ length: HEARTS }).map((_, i) => (
        <Ionicons key={i} name={i < n ? 'heart' : 'heart-outline'} size={20} color={i < n ? colors.danger : colors.muted} />
      ))}
    </View>
  );
}

export function QuizPlayScreen({ mode, level }: { mode: 'level' | 'daily'; level?: Level }) {
  const { colors, state, update } = useStore();
  const { push, back } = useNav();
  const share = useSharePost();
  const insets = useSafeAreaInsets();
  const today = todayKey();
  const alreadyDaily = mode === 'daily' && state.quiz.daily?.day === today;

  const [seed, setSeed] = useState(0);
  const round: Question[] = useMemo(
    () => (mode === 'daily' ? dailyChallenge(today) : pickRound(level ?? 'easy')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, level, seed]
  );
  const seconds = mode === 'daily' ? 20 : LEVELS.find((l) => l.id === level)!.seconds;
  const title = mode === 'daily' ? 'تحدّي اليوم' : `المستوى ${LEVELS.find((l) => l.id === level)!.title}`;

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(HEARTS);
  const [finished, setFinished] = useState(alreadyDaily);
  const timer = useRef(new Animated.Value(1)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  const answered = picked !== null || timedOut;
  const q = round[i];

  useEffect(() => {
    if (finished || answered) return;
    timer.setValue(1);
    anim.current = Animated.timing(timer, { toValue: 0, duration: seconds * 1000, easing: Easing.linear, useNativeDriver: false });
    anim.current.start(({ finished: f }) => {
      if (f) {
        setTimedOut(true);
        setHearts((h) => h - 1);
        if (state.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
    });
    return () => anim.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, finished, seed]);

  function choose(k: number) {
    if (answered) return;
    anim.current?.stop();
    setPicked(k);
    const right = k === q.answer;
    if (right) setScore((x) => x + 1);
    else setHearts((h) => h - 1);
    if (state.haptics) Haptics.notificationAsync(right ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
  }

  function finish(finalScore: number) {
    setFinished(true);
    update((s) => {
      if (mode === 'daily') return { ...s, quiz: { ...s.quiz, daily: { day: today, score: finalScore, total: round.length } } };
      const lv = level ?? 'easy';
      return { ...s, quiz: { ...s.quiz, best: { ...s.quiz.best, [lv]: Math.max(s.quiz.best[lv], finalScore) } } };
    });
  }

  function next() {
    if (hearts <= 0 || i >= round.length - 1) {
      finish(score);
      return;
    }
    setI(i + 1);
    setPicked(null);
    setTimedOut(false);
  }

  function restart() {
    setSeed((x) => x + 1);
    setI(0);
    setPicked(null);
    setTimedOut(false);
    setScore(0);
    setHearts(HEARTS);
    setFinished(false);
  }

  if (finished) {
    const s0 = alreadyDaily && state.quiz.daily ? state.quiz.daily.score : score;
    const total = alreadyDaily && state.quiz.daily ? state.quiz.daily.total : round.length;
    const pct = s0 / total;
    const msg = pct === 1 ? 'ما شاء الله، علامة كاملة' : pct >= 0.7 ? 'أحسنت، بارك الله فيك' : pct >= 0.4 ? 'جيد، وزادك الله علماً' : 'لا بأس، العلم بالتعلّم';
    return (
      <Screen>
        <Header title={title} />
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16, flexGrow: 1, justifyContent: 'center' }}>
          <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 30 }}>
            <Divider width={140} />
            <T style={{ fontSize: 46, fontWeight: '700', textAlign: 'center', lineHeight: 58, color: colors.goldText }}>
              {toArabicDigits(s0)} / {toArabicDigits(total)}
            </T>
            <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 22, lineHeight: 34, textAlign: 'center' }}>{msg}</T>
            {mode === 'daily' ? <T style={{ color: colors.muted, textAlign: 'center' }}>تحدٍّ جديد ينتظرك غداً بإذن الله</T> : null}
            <T style={{ fontFamily: FONTS.dhikr, color: colors.muted, textAlign: 'center', fontSize: 16, lineHeight: 30, marginTop: 6 }}>
              ﴿وَقُل رَّبِّ زِدْنِي عِلْمًا﴾
            </T>
          </Card>
          <Button
            title="شارك نتيجتك وتحدَّ أصحابك"
            icon="share-social"
            variant="gold"
            onPress={() =>
              share({
                title: title,
                text: `أجبتُ عن ${toArabicDigits(s0)} من ${toArabicDigits(total)} أسئلة في ${title} بتطبيق آخرتي.\nهل تستطيع أن تسبقني؟`,
                source: '﴿وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ﴾',
              })
            }
          />
          {mode === 'level' ? <Button title="جولة جديدة" onPress={restart} /> : null}
          <Button title="رجوع" variant="outline" onPress={back} />
        </ScrollView>
      </Screen>
    );
  }

  const barColor = timer.interpolate({ inputRange: [0, 0.3, 1], outputRange: [colors.danger, colors.gold, colors.gold] });
  const lost = hearts <= 0;

  return (
    <Screen>
      <Header title={title} right={<Hearts n={hearts} />} />
      <View style={{ paddingHorizontal: 20, gap: 6 }}>
        <View style={[st.row, { justifyContent: 'space-between' }]}>
          <T style={{ color: colors.muted, fontSize: 12 }}>السؤال {toArabicDigits(i + 1)} من {toArabicDigits(round.length)}</T>
          <T style={{ color: colors.goldText, fontSize: 12, fontWeight: '700' }}>{toArabicDigits(score)} إجابات صحيحة</T>
        </View>
        <View style={[st.timerTrack, { backgroundColor: colors.border }]}>
          <Animated.View style={[st.timerFill, { backgroundColor: barColor, width: timer.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
        <Card style={{ paddingVertical: 20 }}>
          <T style={{ fontSize: 18, fontWeight: '700', lineHeight: 30 }}>{q.q}</T>
        </Card>
        {q.options.map((o, k) => {
          const isAnswer = k === q.answer;
          const showRight = answered && isAnswer;
          const showWrong = picked === k && !isAnswer;
          return (
            <Pressable
              key={o}
              onPress={() => choose(k)}
              accessibilityRole="button"
              accessibilityState={{ selected: picked === k, disabled: answered }}
              style={[
                st.option,
                { backgroundColor: colors.card, borderColor: colors.border },
                showRight && { backgroundColor: colors.successSoft, borderColor: colors.success },
                showWrong && { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
                answered && !showRight && !showWrong && { opacity: 0.55 },
              ]}
            >
              <T style={{ flex: 1, fontSize: 15, fontWeight: '500', lineHeight: 24 }}>{o}</T>
              {showRight ? <Ionicons name="checkmark-circle" size={22} color={colors.success} /> : null}
              {showWrong ? <Ionicons name="close-circle" size={22} color={colors.danger} /> : null}
            </Pressable>
          );
        })}
        {answered ? (
          <Card alt style={{ gap: 8, borderColor: colors.borderStrong }}>
            <T style={{ fontWeight: '700', color: picked === q.answer ? colors.success : colors.goldText }}>
              {picked === q.answer ? 'أحسنت، إجابة صحيحة' : timedOut ? 'انتهى الوقت' : 'الإجابة الصحيحة موضّحة بالأخضر'}
            </T>
            <T style={{ fontFamily: FONTS.dhikr, fontSize: 18, lineHeight: 34 }}>{q.proof}</T>
            <T style={{ fontSize: 12, color: colors.muted }}>{q.proofSource}</T>
            {q.ref ? (
              <Pressable
                onPress={() => push({ name: 'surah', n: q.ref!.surah, ayah: q.ref!.ayah })}
                accessibilityRole="button"
                style={[st.readBtn, { borderColor: colors.borderStrong, alignSelf: ALIGN_START }]}
              >
                <Ionicons name="book-outline" size={16} color={colors.goldText} />
                <T style={{ color: colors.goldText, fontSize: 13, fontWeight: '600' }}>اقرأ الآية في المصحف</T>
              </Pressable>
            ) : null}
          </Card>
        ) : null}
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 16 }}>
        <Button
          title={!answered ? 'اختر إجابة' : lost ? 'انتهت القلوب · عرض النتيجة' : i < round.length - 1 ? 'السؤال التالي' : 'عرض النتيجة'}
          variant={answered ? 'primary' : 'outline'}
          disabled={!answered}
          onPress={next}
        />
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: ROW, alignItems: 'center' },
  daily: { flexDirection: ROW, alignItems: 'center', gap: 12, borderRadius: 22, borderWidth: 1, padding: 18 },
  dailyIcon: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  level: { flexDirection: ROW, alignItems: 'center', gap: 14, borderRadius: 20, borderWidth: 1, padding: 16 },
  levelNum: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  timerTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  timerFill: { height: 5, borderRadius: 3, alignSelf: ALIGN_START },
  option: { flexDirection: ROW, alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, minHeight: 56, paddingVertical: 12 },
  readBtn: { flexDirection: ROW, alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1 },
});
