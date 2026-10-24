import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../components/ui';
import { ROW } from '../rtl';
import { useStore } from '../store';
import { QURAN_FONT_BOLD, toArabicDigits, todayKey } from '../theme';

const PHRASES = ['سُبْحَانَ اللَّهِ', 'الْحَمْدُ لِلَّهِ', 'اللَّهُ أَكْبَرُ', 'لَا إِلَهَ إِلَّا اللَّهُ', 'أَسْتَغْفِرُ اللَّهَ', 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ'];
const LABELS = ['سبحان الله', 'الحمد لله', 'الله أكبر', 'لا إله إلا الله', 'أستغفر الله', 'الصلاة على النبي'];
const TARGETS = [33, 100, 1000];
const RING = 260;
const BEADS = 33;

export default function TasbihScreen() {
  const { colors, state, addTasbih } = useStore();
  const insets = useSafeAreaInsets();
  const [sel, setSel] = useState(0);
  const [target, setTarget] = useState(33);
  const [count, setCount] = useState(0);
  const [rounds, setRounds] = useState(0);

  const today = state.tasbih.day === todayKey() ? state.tasbih.today : 0;
  const frac = (count % target) / target;
  const lit = Math.round(frac * BEADS);

  function tap() {
    const c = count + 1;
    addTasbih(1);
    if (c >= target) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCount(0);
      setRounds((r) => r + 1);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setCount(c);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary, paddingTop: insets.top + 12 }}>
      <View style={[s.row, { justifyContent: 'space-between', paddingHorizontal: 20 }]}>
        <T style={{ color: colors.onPrimary, fontSize: 22, fontWeight: '700' }}>المسبحة</T>
        <Pressable
          onPress={() => {
            setCount(0);
            setRounds(0);
          }}
          accessibilityRole="button"
          style={[s.reset, { borderColor: 'rgba(255,255,255,0.3)' }]}
        >
          <Ionicons name="refresh" size={16} color={colors.onPrimary} />
          <T style={{ color: colors.onPrimary, fontSize: 13, fontWeight: '600' }}>تصفير</T>
        </Pressable>
      </View>

      <View style={[s.row, s.chips]}>
        {LABELS.map((l, i) => (
          <Pressable
            key={l}
            onPress={() => {
              setSel(i);
              setCount(0);
              setRounds(0);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: sel === i }}
            style={[
              s.chip,
              sel === i
                ? { backgroundColor: colors.gold, borderColor: colors.gold }
                : { borderColor: 'rgba(255,255,255,0.3)' },
            ]}
          >
            <T style={{ color: sel === i ? '#1B1B18' : colors.onPrimary, fontWeight: '600', fontSize: 13 }}>{l}</T>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <T style={{ fontFamily: QURAN_FONT_BOLD, color: colors.onPrimary, fontSize: 32, lineHeight: 56, textAlign: 'center' }}>
          {PHRASES[sel]}
        </T>

        <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
          {Array.from({ length: BEADS }).map((_, i) => {
            const a = (i / BEADS) * Math.PI * 2 - Math.PI / 2;
            const r = RING / 2 - 10;
            return (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  left: RING / 2 - 7 - Math.cos(a) * r,
                  top: RING / 2 - 7 + Math.sin(a) * r,
                  backgroundColor: i < lit ? colors.gold : 'rgba(255,255,255,0.14)',
                }}
              />
            );
          })}
          <Pressable
            onPress={tap}
            accessibilityRole="button"
            accessibilityLabel="سبّح"
            style={({ pressed }) => [s.tap, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          >
            <T style={{ color: colors.onPrimary, fontSize: 60, fontWeight: '700', lineHeight: 72, textAlign: 'center' }}>
              {toArabicDigits(count)}
            </T>
            <T style={{ color: colors.onPrimaryMuted, fontSize: 14, textAlign: 'center' }}>من {toArabicDigits(target)}</T>
          </Pressable>
        </View>

        <View style={[s.row, { gap: 8 }]}>
          {TARGETS.map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                setTarget(t);
                setCount(0);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: target === t }}
              style={[
                s.target,
                target === t ? { backgroundColor: 'rgba(212,168,83,0.25)', borderColor: colors.gold } : { borderColor: 'rgba(255,255,255,0.25)' },
              ]}
            >
              <T style={{ color: colors.onPrimary, fontWeight: '600', textAlign: 'center' }}>{toArabicDigits(t)}</T>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[s.row, { gap: 12, paddingHorizontal: 20, paddingBottom: 16 }]}>
        <Stat label="الجولات" value={rounds} gold={colors.gold} muted={colors.onPrimaryMuted} />
        <Stat label="تسبيح اليوم" value={today} gold={colors.gold} muted={colors.onPrimaryMuted} />
        <Stat label="المجموع الكلي" value={state.tasbih.total} gold={colors.gold} muted={colors.onPrimaryMuted} />
      </View>
    </View>
  );
}

function Stat({ label, value, gold, muted }: { label: string; value: number; gold: string; muted: string }) {
  return (
    <View style={s.stat}>
      <T style={{ color: muted, fontSize: 12 }}>{label}</T>
      <T style={{ color: gold, fontSize: 20, fontWeight: '700' }}>{toArabicDigits(value)}</T>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: ROW, alignItems: 'center' },
  reset: { flexDirection: ROW, alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
  chips: { flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingTop: 14 },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, justifyContent: 'center' },
  tap: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  target: { minWidth: 64, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 12 },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 12, gap: 2 },
});
