import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Card, Chip, Divider, Header, IslamicPattern, ListRow, Screen, T, TabHeader } from '../components/ui';
import { NAMES } from '../data/names';
import { STORIES } from '../data/prophets';
import { useNav } from '../navigation';
import { ROW } from '../rtl';
import { useSharePost } from '../share';
import { useStore } from '../store';
import { FONTS, toArabicDigits, todayKey } from '../theme';

// ───────── المزيد ─────────
export function MoreScreen() {
  const { push } = useNav();
  return (
    <Screen>
      <TabHeader title="المزيد" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, gap: 10 }}>
        <ListRow icon="ellipse-outline" title="المسبحة" subtitle="عدّاد تسبيح مع اهتزاز خفيف" onPress={() => push({ name: 'tasbih' })} />
        <ListRow icon="compass-outline" emerald title="اتجاه القبلة" subtitle="بوصلة دقيقة حسب موقعك" onPress={() => push({ name: 'qibla' })} />
        <ListRow icon="trophy-outline" title="اختبر معلوماتك" subtitle="تحدّي اليوم وثلاثة مستويات" onPress={() => push({ name: 'quiz' })} />
        <ListRow icon="library-outline" emerald title="قصص الأنبياء" subtitle="كما وردت في القرآن الكريم" onPress={() => push({ name: 'stories' })} />
        <ListRow icon="star-outline" title="أسماء الله الحسنى" subtitle="تسعة وتسعون اسماً" onPress={() => push({ name: 'names' })} />
        <ListRow icon="heart-outline" emerald title="المفضلة" subtitle="ما حفظته من أذكار وأدعية" onPress={() => push({ name: 'favorites' })} />
        <ListRow icon="settings-outline" title="الإعدادات" subtitle="المظهر، الخط، القارئ، المواقيت والتنبيهات" onPress={() => push({ name: 'settings' })} />
      </ScrollView>
    </Screen>
  );
}

// ───────── المسبحة ─────────
const PHRASES = ['سُبْحَانَ اللَّهِ', 'الْحَمْدُ لِلَّهِ', 'اللَّهُ أَكْبَرُ', 'لَا إِلَهَ إِلَّا اللَّهُ', 'أَسْتَغْفِرُ اللَّهَ', 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ'];
const LABELS = ['سبحان الله', 'الحمد لله', 'الله أكبر', 'لا إله إلا الله', 'أستغفر الله', 'الصلاة على النبي'];
const TARGETS = [33, 100, 1000];
const RING = 270;
const BEADS = 33;

export function TasbihScreen() {
  const { colors, state, addTasbih } = useStore();
  const [sel, setSel] = useState(0);
  const [target, setTarget] = useState(33);
  const [count, setCount] = useState(0);
  const [rounds, setRounds] = useState(0);
  const today = state.tasbih.day === todayKey() ? state.tasbih.today : 0;
  const lit = Math.round(((count % target) / target) * BEADS);

  function tap() {
    addTasbih(1);
    const c = count + 1;
    if (c >= target) {
      if (state.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCount(0);
      setRounds((r) => r + 1);
    } else {
      if (state.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setCount(c);
    }
  }

  return (
    <Screen>
      <Header
        title="المسبحة"
        right={
          <Pressable
            onPress={() => {
              setCount(0);
              setRounds(0);
            }}
            accessibilityRole="button"
            accessibilityLabel="تصفير"
            hitSlop={6}
          >
            <Ionicons name="refresh" size={22} color={colors.goldText} />
          </Pressable>
        }
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, flexDirection: ROW }} style={{ flexGrow: 0 }}>
        {LABELS.map((l, i) => (
          <Chip
            key={l}
            label={l}
            active={sel === i}
            onPress={() => {
              setSel(i);
              setCount(0);
              setRounds(0);
            }}
          />
        ))}
      </ScrollView>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 32, lineHeight: 56, textAlign: 'center', color: colors.goldText }}>{PHRASES[sel]}</T>
        <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
            {Array.from({ length: BEADS }).map((_, i) => {
              const a = (i / BEADS) * Math.PI * 2 - Math.PI / 2;
              const r = RING / 2 - 12;
              return <Circle key={i} cx={RING / 2 + Math.cos(a) * r} cy={RING / 2 + Math.sin(a) * r} r={7} fill={i < lit ? colors.gold : colors.goldSoft} stroke={colors.border} />;
            })}
          </Svg>
          <Pressable
            onPress={tap}
            accessibilityRole="button"
            accessibilityLabel="سبّح"
            style={({ pressed }) => [st.tap, { backgroundColor: colors.emerald, borderColor: colors.gold, transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          >
            <T style={{ color: '#FFFFFF', fontSize: 60, fontWeight: '700', lineHeight: 72, textAlign: 'center' }}>{toArabicDigits(count)}</T>
            <T style={{ color: colors.onEmeraldMuted, fontSize: 14, textAlign: 'center' }}>من {toArabicDigits(target)}</T>
          </Pressable>
        </View>
        <View style={{ flexDirection: ROW, gap: 8 }}>
          {TARGETS.map((t) => (
            <Chip
              key={t}
              label={toArabicDigits(t)}
              active={target === t}
              onPress={() => {
                setTarget(t);
                setCount(0);
              }}
            />
          ))}
        </View>
      </View>
      <View style={{ flexDirection: ROW, gap: 10, paddingHorizontal: 20, paddingBottom: 28 }}>
        {[
          ['الجولات', rounds],
          ['تسبيح اليوم', today],
          ['المجموع الكلي', state.tasbih.total],
        ].map(([l, v]) => (
          <Card key={l as string} style={{ flex: 1, padding: 12, gap: 2 }}>
            <T style={{ fontSize: 12, color: colors.muted }}>{l as string}</T>
            <T style={{ fontSize: 20, fontWeight: '700', color: colors.goldText }}>{toArabicDigits(v as number)}</T>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

// ───────── قصص الأنبياء ─────────
export function StoriesScreen() {
  const { push } = useNav();
  return (
    <Screen>
      <Header title="قصص الأنبياء" subtitle="كما وردت في القرآن الكريم" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, gap: 10 }}>
        {STORIES.map((s, i) => (
          <ListRow key={s.id} icon="library-outline" emerald={i % 2 === 1} title={s.name} subtitle={s.title} onPress={() => push({ name: 'story', id: s.id })} />
        ))}
      </ScrollView>
    </Screen>
  );
}

export function StoryScreen({ id }: { id: string }) {
  const { colors, state } = useStore();
  const { push } = useNav();
  const share = useSharePost();
  const s = STORIES.find((x) => x.id === id)!;
  const fs = 17 * state.adhkarScale;
  return (
    <Screen>
      <Header title={s.name} subtitle={s.title} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 14, paddingBottom: 32 }}>
        <View style={[st.verse, { backgroundColor: colors.emerald, borderColor: colors.borderStrong }]}>
          <IslamicPattern opacity={0.1} color="#E3C47E" />
          <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 21, lineHeight: 40, color: '#FFFFFF', textAlign: 'center' }}>﴿{s.verse.text}﴾</T>
          <T style={{ fontSize: 12, color: colors.onEmeraldMuted, textAlign: 'center' }}>{s.verse.source}</T>
          <View style={{ flexDirection: ROW, gap: 8, justifyContent: 'center' }}>
            <Pressable onPress={() => push({ name: 'surah', n: s.verse.surah, ayah: s.verse.ayah })} accessibilityRole="button" style={[st.small, { borderColor: '#E3C47E' }]}>
              <Ionicons name="book-outline" size={14} color="#F6DFA4" />
              <T style={{ color: '#F6DFA4', fontSize: 12, fontWeight: '600' }}>في المصحف</T>
            </Pressable>
            <Pressable onPress={() => share({ text: s.verse.text, source: s.verse.source, title: s.name })} accessibilityRole="button" style={[st.small, { borderColor: '#E3C47E' }]}>
              <Ionicons name="share-outline" size={14} color="#F6DFA4" />
              <T style={{ color: '#F6DFA4', fontSize: 12, fontWeight: '600' }}>مشاركة</T>
            </Pressable>
          </View>
        </View>
        {s.paragraphs.map((p, i) => (
          <T key={i} style={{ fontFamily: FONTS.dhikr, fontSize: fs, lineHeight: fs * 1.9 }}>
            {p}
          </T>
        ))}
        <View style={{ alignItems: 'center' }}>
          <Divider width={150} />
        </View>
        <Card alt style={{ gap: 6, borderColor: colors.borderStrong }}>
          <T style={{ fontWeight: '700', color: colors.goldText }}>العبرة من القصة</T>
          <T style={{ fontFamily: FONTS.dhikr, fontSize: fs, lineHeight: fs * 1.8 }}>{s.lesson}</T>
        </Card>
      </ScrollView>
    </Screen>
  );
}

// ───────── أسماء الله الحسنى ─────────
export function NamesScreen() {
  const { colors } = useStore();
  const share = useSharePost();
  return (
    <Screen>
      <Header title="أسماء الله الحسنى" subtitle="على رواية الترمذي" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 12, paddingBottom: 32 }}>
        <Card alt style={{ alignItems: 'center', gap: 6 }}>
          <T style={{ fontFamily: FONTS.dhikr, fontSize: 18, lineHeight: 34, textAlign: 'center' }}>
            «إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا، مِائَةً إِلَّا وَاحِدًا، مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ»
          </T>
          <T style={{ fontSize: 12, color: colors.muted }}>رواه البخاري ومسلم</T>
        </Card>
        <View style={{ flexDirection: ROW, flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 }}>
          {NAMES.map((n, i) => (
            <Pressable
              key={n}
              onLongPress={() => share({ text: n, source: 'من أسماء الله الحسنى', title: `الاسم ${toArabicDigits(i + 1)}` })}
              accessibilityRole="button"
              accessibilityHint="اضغط مطولاً للمشاركة"
              style={[st.name, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <T style={{ fontSize: 10, color: colors.muted, textAlign: 'center' }}>{toArabicDigits(i + 1)}</T>
              <T style={{ fontFamily: FONTS.dhikrBold, fontSize: n.length > 8 ? 15 : 19, lineHeight: 30, textAlign: 'center', color: colors.goldText }}>{n}</T>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  tap: { width: 196, height: 196, borderRadius: 98, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  verse: { borderRadius: 22, borderWidth: 1, padding: 18, gap: 8, overflow: 'hidden' },
  small: { flexDirection: ROW, alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1 },
  name: { width: '31.5%', borderRadius: 14, borderWidth: 1, paddingVertical: 10, alignItems: 'center', minHeight: 70, justifyContent: 'center' },
});
