import { Ionicons } from '@expo/vector-icons';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Header, Screen, T } from '../components/ui';
import { ayahAudioUrl, reciterName, surah } from '../quran';
import { ROW } from '../rtl';
import { useStore } from '../store';
import { FONTS, toArabicDigits } from '../theme';

// القرآن في الطريق: أزرار كبيرة جداً، تلاوة متواصلة سورة بعد سورة، وتعمل والشاشة مقفلة
export default function ListenScreen() {
  const { colors, state, update } = useStore();
  const start = state.lastRead ?? { surah: 1, ayah: 1 };
  const [pos, setPos] = useState({ surah: start.surah, ayah: 1 });
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const playerRef = useRef<AudioPlayer | null>(null);
  const posRef = useRef(pos);
  posRef.current = pos;
  const playingRef = useRef(false);

  const load = useCallback(
    (s: number, a: number, autoplay = true) => {
      const p = playerRef.current;
      if (!p) return;
      setError(false);
      setPos({ surah: s, ayah: a });
      p.replace({ uri: ayahAudioUrl(state.reciter, s, a) });
      try {
        p.updateLockScreenMetadata({ title: `سورة ${surah(s).name} · الآية ${a}`, artist: reciterName(state.reciter), albumTitle: 'آخرتي' });
      } catch {}
      if (autoplay) {
        setLoading(true);
        p.play();
        playingRef.current = true;
        setPlaying(true);
      }
    },
    [state.reciter]
  );
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => {});
    const p = createAudioPlayer(null);
    playerRef.current = p;
    try {
      p.setActiveForLockScreen(true, { title: 'القرآن في الطريق', artist: reciterName(state.reciter), albumTitle: 'آخرتي' });
    } catch {}
    const sub = p.addListener('playbackStatusUpdate', (st0) => {
      if (st0.isLoaded && st0.playing) setLoading(false);
      if (st0.didJustFinish && playingRef.current) {
        const { surah: s, ayah: a } = posRef.current;
        if (a < surah(s).count) loadRef.current(s, a + 1);
        else loadRef.current(s < 114 ? s + 1 : 1, 1);
      }
    });
    return () => {
      sub.remove();
      try {
        p.setActiveForLockScreen(false);
      } catch {}
      p.remove();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      setLoading(false);
      setError(true);
    }, 12000);
    return () => clearTimeout(t);
  }, [loading, pos]);

  // نحفظ موضع الاستماع كآخر قراءة
  useEffect(() => {
    if (playing) update((s0) => ({ ...s0, lastRead: { surah: pos.surah, ayah: pos.ayah } }));
  }, [pos, playing, update]);

  function toggle() {
    const p = playerRef.current;
    if (!p) return;
    if (playing) {
      p.pause();
      playingRef.current = false;
      setPlaying(false);
      setLoading(false);
    } else if (p.isLoaded && p.currentTime > 0) {
      p.play();
      playingRef.current = true;
      setPlaying(true);
    } else load(pos.surah, pos.ayah);
  }

  const go = (d: number) => {
    const s = ((pos.surah - 1 + d + 114) % 114) + 1;
    load(s, 1, playing);
    if (!playing) setPos({ surah: s, ayah: 1 });
  };

  const cur = surah(pos.surah);
  return (
    <Screen style={{ backgroundColor: '#000' }}>
      <Header title="القرآن في الطريق" subtitle="استمع وأنت تقود · اترك الهاتف ولا تنشغل به" />
      <View style={st.body}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 40, lineHeight: 64, color: colors.goldText, textAlign: 'center' }}>سورة {cur.name}</T>
          <T style={{ fontSize: 18, color: '#D8C9A8', textAlign: 'center' }}>
            {error ? 'تعذّر التشغيل — تأكد من الإنترنت' : `الآية ${toArabicDigits(pos.ayah)} من ${toArabicDigits(cur.count)}`}
          </T>
          <T style={{ fontSize: 14, color: '#9C8C6E', textAlign: 'center' }}>{reciterName(state.reciter)}</T>
        </View>

        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'إيقاف' : 'تشغيل'}
          style={({ pressed }) => [st.big, { backgroundColor: colors.gold, opacity: pressed ? 0.85 : 1 }]}
        >
          {loading ? <ActivityIndicator size="large" color="#1E130C" /> : <Ionicons name={playing ? 'pause' : 'play'} size={86} color="#1E130C" />}
        </Pressable>

        <View style={[st.row, { gap: 16, alignSelf: 'stretch' }]}>
          <Pressable onPress={() => go(-1)} accessibilityRole="button" accessibilityLabel="السورة السابقة" style={[st.side, { borderColor: colors.borderStrong }]}>
            <Ionicons name="play-forward" size={34} color={colors.goldText} />
            <T style={{ color: colors.goldText, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>السابقة</T>
          </Pressable>
          <Pressable onPress={() => go(1)} accessibilityRole="button" accessibilityLabel="السورة التالية" style={[st.side, { borderColor: colors.borderStrong }]}>
            <Ionicons name="play-back" size={34} color={colors.goldText} />
            <T style={{ color: colors.goldText, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>التالية</T>
          </Pressable>
        </View>
        <T style={{ fontSize: 13, color: '#8A7B60', textAlign: 'center', lineHeight: 21 }}>
          التلاوة تستمر تلقائياً من سورة إلى التي بعدها، وتعمل والشاشة مقفلة. سلامتك أولاً: شغّلها قبل أن تنطلق.
        </T>
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: ROW, alignItems: 'center' },
  body: { flex: 1, paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center', justifyContent: 'space-evenly' },
  big: { width: 200, height: 200, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  side: { flex: 1, height: 110, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 6 },
});
