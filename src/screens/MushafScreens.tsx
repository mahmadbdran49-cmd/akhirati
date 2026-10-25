import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { Chip, Header, IconButton, Screen, T, TabHeader } from '../components/ui';
import { useNav } from '../navigation';
import { ayahAudioUrl, nextPos, reciterName, surah, surahList, wirdEnd } from '../quran';
import { ROW, TEXT_START } from '../rtl';
import { useSharePost } from '../share';
import { useStore } from '../store';
import { FONTS, toArabicDigits } from '../theme';

// ───────── فهرس السور ─────────
export function MushafIndexScreen() {
  const { colors, state } = useStore();
  const { push } = useNav();
  const [q, setQ] = useState('');
  const list = useMemo(() => surahList(), []);
  const norm = (x: string) => x.replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا');
  const filtered = q.trim()
    ? list.filter((s) => norm(s.name).includes(norm(q.trim())) || s.translit.toLowerCase().includes(q.trim().toLowerCase()) || String(s.n) === q.trim())
    : list;

  return (
    <Screen>
      <TabHeader title="المصحف الشريف" subtitle="برواية حفص عن عاصم · بالرسم العثماني" />
      <View style={{ paddingHorizontal: 20, gap: 10, paddingBottom: 10 }}>
        <View style={[st.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="ابحث عن سورة"
            placeholderTextColor={colors.muted}
            style={{ flex: 1, color: colors.text, fontSize: 15, textAlign: TEXT_START, writingDirection: 'rtl' }}
            accessibilityLabel="ابحث عن سورة"
          />
        </View>
        {!q ? <SmartWird /> : null}
        {state.lastRead && !q ? (
          <Pressable
            onPress={() => push({ name: 'surah', n: state.lastRead!.surah, ayah: state.lastRead!.ayah })}
            accessibilityRole="button"
            style={[st.resume, { backgroundColor: colors.emerald, borderColor: colors.borderStrong }]}
          >
            <Ionicons name="bookmark" size={20} color="#F6DFA4" />
            <View style={{ flex: 1 }}>
              <T style={{ fontSize: 12, color: colors.onEmeraldMuted }}>آخر قراءة</T>
              <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 18, lineHeight: 28, color: '#FFFFFF' }}>
                سورة {surah(state.lastRead.surah).name} · الآية {toArabicDigits(state.lastRead.ayah)}
              </T>
            </View>
            <Ionicons name="chevron-back" size={18} color="#F6DFA4" />
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(s) => String(s.n)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 8 }}
        initialNumToRender={20}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => push({ name: 'surah', n: item.n })}
            accessibilityRole="button"
            accessibilityLabel={`سورة ${item.name}`}
            style={({ pressed }) => [st.surahRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={st.numWrap}>
              <Svg width={42} height={42} viewBox="0 0 42 42" style={StyleSheet.absoluteFill}>
                <Rect x={8} y={8} width={26} height={26} fill="none" stroke={colors.gold} strokeWidth={1.2} />
                <Rect x={8} y={8} width={26} height={26} fill="none" stroke={colors.gold} strokeWidth={1.2} transform="rotate(45 21 21)" />
              </Svg>
              <T style={{ fontSize: 13, fontWeight: '700', color: colors.goldText, textAlign: 'center' }}>{toArabicDigits(item.n)}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 20, lineHeight: 30 }}>سورة {item.name}</T>
              <T style={{ fontSize: 12, color: colors.muted }}>
                {item.medinan ? 'مدنية' : 'مكية'} · {toArabicDigits(item.count)} آية
              </T>
            </View>
            <T style={{ fontSize: 12, color: colors.muted }}>{item.translit}</T>
          </Pressable>
        )}
      />
    </Screen>
  );
}

// ───────── الورد الذكي: كم دقيقة عندك؟ ─────────
const WIRD_MINUTES = [5, 10, 15, 20, 30];
function SmartWird() {
  const { colors, state, update } = useStore();
  const { push } = useNav();
  const start = state.lastRead ? nextPos(state.lastRead) : { surah: 1, ayah: 1 };
  const end = wirdEnd(start, state.wirdMinutes);
  const pagesLabel = end.pages < 1 ? 'نصف صفحة' : `${toArabicDigits(Math.round(end.pages))} ${end.pages >= 3 && end.pages <= 10 ? 'صفحات' : 'صفحة'}`;
  return (
    <View style={[st.wird, { backgroundColor: colors.cardAlt, borderColor: colors.borderStrong }]}>
      <View style={[st.row, { gap: 8 }]}>
        <Ionicons name="hourglass-outline" size={18} color={colors.goldText} />
        <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 17, lineHeight: 26, color: colors.goldText, flex: 1 }}>الورد الذكي · كم دقيقة عندك؟</T>
      </View>
      <View style={[st.row, { gap: 6, flexWrap: 'wrap' }]}>
        {WIRD_MINUTES.map((m) => (
          <Chip key={m} label={`${toArabicDigits(m)} د`} active={state.wirdMinutes === m} onPress={() => update((s0) => ({ ...s0, wirdMinutes: m }))} />
        ))}
      </View>
      <T style={{ fontSize: 13, color: colors.muted, lineHeight: 21 }}>
        حوالي {pagesLabel}: من سورة {surah(start.surah).name} ({toArabicDigits(start.ayah)}) إلى سورة {surah(end.surah).name} ({toArabicDigits(end.ayah)})
      </T>
      <Pressable
        onPress={() => push({ name: 'surah', n: start.surah, ayah: start.ayah, wird: { surah: end.surah, ayah: end.ayah } })}
        accessibilityRole="button"
        style={[st.wirdBtn, { backgroundColor: colors.gold }]}
      >
        <Ionicons name="play" size={15} color="#1E130C" />
        <Text style={{ color: '#1E130C', fontWeight: '700' }}>ابدأ وردك</Text>
      </Pressable>
    </View>
  );
}

// ───────── قراءة السورة ─────────
const BLOCK = 6;

export function SurahScreen({ n, ayah, wird }: { n: number; ayah?: number; wird?: { surah: number; ayah: number } }) {
  const { colors, state, update } = useStore();
  const { replace } = useNav();
  const share = useSharePost();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => surah(n), [n]);
  const blocks = useMemo(() => {
    const out: number[][] = [];
    for (let i = 0; i < s.count; i += BLOCK) out.push(Array.from({ length: Math.min(BLOCK, s.count - i) }, (_, k) => i + k + 1));
    return out;
  }, [s]);

  const [sel, setSel] = useState<number | null>(ayah ?? null);
  const [playing, setPlaying] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [continuous, setContinuous] = useState(true);
  const [copied, setCopied] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const listRef = useRef<FlatList<number[]>>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const playingRef = useRef<number | null>(null);
  const continuousRef = useRef(continuous);
  continuousRef.current = continuous;

  const fontSize = 23 * state.quranScale;
  const bookmarked = sel !== null && state.bookmarks.some((b) => b.surah === n && b.ayah === sel);

  const saveLast = useCallback((a: number) => update((st0) => ({ ...st0, lastRead: { surah: n, ayah: a } })), [n, update]);

  const playAyah = useCallback(
    (a: number) => {
      const p = playerRef.current;
      if (!p) return;
      setAudioError(false);
      setLoading(true);
      p.replace({ uri: ayahAudioUrl(state.reciter, n, a) });
      p.play();
      playingRef.current = a;
      setPlaying(a);
      setSel(a);
      saveLast(a);
      const idx = Math.floor((a - 1) / BLOCK);
      listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.2 });
    },
    [n, state.reciter, saveLast]
  );

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
    const p = createAudioPlayer(null);
    playerRef.current = p;
    const sub = p.addListener('playbackStatusUpdate', (st0) => {
      if (st0.isLoaded && st0.playing) setLoading(false);
      if (st0.didJustFinish) {
        const cur = playingRef.current;
        if (cur !== null && continuousRef.current && cur < s.count) {
          playAyahRef.current(cur + 1);
        } else {
          playingRef.current = null;
          setPlaying(null);
          setLoading(false);
        }
      }
    });
    return () => {
      sub.remove();
      p.remove();
      playerRef.current = null;
    };
  }, [s.count]);

  const playAyahRef = useRef(playAyah);
  playAyahRef.current = playAyah;

  // علامة انقطاع الصوت (مثلاً بدون إنترنت)
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setAudioError(true);
      }
    }, 12000);
    return () => clearTimeout(t);
  }, [loading]);

  function stop() {
    playerRef.current?.pause();
    playingRef.current = null;
    setPlaying(null);
    setLoading(false);
  }

  function toggleBookmark() {
    if (sel === null) return;
    update((st0) => {
      const has = st0.bookmarks.some((b) => b.surah === n && b.ayah === sel);
      return {
        ...st0,
        bookmarks: has ? st0.bookmarks.filter((b) => !(b.surah === n && b.ayah === sel)) : [{ surah: n, ayah: sel }, ...st0.bookmarks].slice(0, 50),
      };
    });
  }

  const onViewable = useRef(({ viewableItems }: { viewableItems: { item: unknown }[] }) => {
    const first = viewableItems[0]?.item as number[] | undefined;
    if (first && playingRef.current === null) lastVisible.current = first[0];
  }).current;
  const lastVisible = useRef<number>(ayah ?? 1);
  useEffect(() => () => {
    if (lastVisible.current) update((st0) => ({ ...st0, lastRead: st0.lastRead?.surah === n && st0.lastRead.ayah > lastVisible.current ? st0.lastRead : { surah: n, ayah: lastVisible.current } }));
  }, [n, update]);

  const initialIndex = ayah ? Math.floor((ayah - 1) / BLOCK) : 0;
  useEffect(() => {
    if (!initialIndex) return;
    const t = setTimeout(() => listRef.current?.scrollToIndex({ index: initialIndex, animated: false, viewPosition: 0.1 }), 300);
    return () => clearTimeout(t);
  }, [initialIndex]);

  const wirdHere = wird && wird.surah === n;
  const wirdDone = wird && (wird.surah < n);
  const header = (
    <View style={{ gap: 6, marginBottom: 6 }}>
      {wird ? (
        <View style={[st.wirdBanner, { borderColor: colors.paperFrame }]}>
          <Ionicons name={wirdDone ? 'checkmark-circle' : 'flag-outline'} size={16} color={colors.paperFrame} />
          <Text style={{ color: colors.paperInk, fontSize: 13, fontWeight: '600', flex: 1, textAlign: TEXT_START }}>
            {wirdDone ? 'أتممت وردك، تقبّل الله منك' : `وردك ينتهي عند سورة ${surah(wird.surah).name} · الآية ${toArabicDigits(wird.ayah)}`}
          </Text>
        </View>
      ) : null}
      <View style={st.banner}>
        <Svg width="100%" height={58} viewBox="0 0 320 58" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
          <Rect x={2} y={6} width={316} height={46} rx={6} fill="#0E3B2E" stroke={colors.paperFrame} strokeWidth={2} />
          <Rect x={8} y={11} width={304} height={36} rx={4} fill="none" stroke="#E3C47E" strokeWidth={0.8} />
          <Path d="M18 29 L28 19 L38 29 L28 39 Z M282 29 L292 19 L302 29 L292 39 Z" fill="#C9A45C" />
        </Svg>
        <Text style={{ fontFamily: FONTS.dhikrBold, fontSize: 22, color: '#F6DFA4' }}>سُورَةُ {s.name}</Text>
      </View>
      {n !== 1 && n !== 9 ? (
        <Text style={{ fontFamily: FONTS.quran, fontSize: fontSize, lineHeight: fontSize * 2, textAlign: 'center', color: colors.paperInk }}>
          بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
        </Text>
      ) : null}
    </View>
  );

  const footer = (
    <View style={[st.row, { justifyContent: 'space-between', marginTop: 14, gap: 10 }]}>
      {n > 1 ? (
        <Pressable onPress={() => replace({ name: 'surah', n: n - 1, wird })} accessibilityRole="button" style={[st.navBtn, { borderColor: colors.paperFrame }]}>
          <Ionicons name="chevron-forward" size={16} color={colors.paperFrame} />
          <Text style={{ color: colors.paperInk, fontWeight: '600' }}>{surah(n - 1).name}</Text>
        </Pressable>
      ) : <View />}
      {n < 114 ? (
        <Pressable onPress={() => replace({ name: 'surah', n: n + 1, wird })} accessibilityRole="button" style={[st.navBtn, { borderColor: colors.paperFrame }]}>
          <Text style={{ color: colors.paperInk, fontWeight: '600' }}>{surah(n + 1).name}</Text>
          <Ionicons name="chevron-back" size={16} color={colors.paperFrame} />
        </Pressable>
      ) : <View />}
    </View>
  );

  return (
    <Screen>
      <Header title={`سورة ${s.name}`} subtitle={`${s.medinan ? 'مدنية' : 'مكية'} · ${toArabicDigits(s.count)} آية · ${reciterName(state.reciter)}`} />
      <View style={[st.page, { backgroundColor: colors.paper, borderColor: colors.paperFrame }]}>
        <View style={[st.pageInner, { borderColor: colors.paperFrame }]}>
          <FlatList
            ref={listRef}
            data={blocks}
            keyExtractor={(b) => String(b[0])}
            onScrollToIndexFailed={(info) => setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: false }), 250)}
            ListHeaderComponent={header}
            ListFooterComponent={footer}
            onViewableItemsChanged={onViewable}
            contentContainerStyle={{ padding: 14, paddingBottom: 140 }}
            renderItem={({ item }) => (
              <Text style={{ fontFamily: FONTS.quran, fontSize, lineHeight: fontSize * 2.15, color: colors.paperInk, textAlign: 'justify', writingDirection: 'rtl' }}>
                {item.map((a) => {
                  const isSel = sel === a;
                  const isPlay = playing === a;
                  return (
                    <Text
                      key={a}
                      onPress={() => {
                        setCopied(false);
                        setSel(isSel ? null : a);
                      }}
                      style={isPlay ? { backgroundColor: 'rgba(20,90,69,0.18)' } : isSel ? { backgroundColor: 'rgba(201,164,92,0.32)' } : undefined}
                    >
                      {s.verses[a - 1]}
                      <Text style={{ color: colors.paperFrame, fontFamily: FONTS.dhikr }}>{` ﴿${toArabicDigits(a)}﴾ `}</Text>
                      {wirdHere && wird!.ayah === a ? <Text style={{ color: colors.paperFrame, fontWeight: '700', fontSize: 14 }}>{' ◆ نهاية الورد ◆ '}</Text> : null}
                    </Text>
                  );
                })}
              </Text>
            )}
          />
        </View>
      </View>

      {sel !== null ? (
        <View style={[st.actionBar, { bottom: insets.bottom + 86, backgroundColor: '#1E130C', borderColor: colors.gold }]}>
          <Pressable
            onPress={() => (playing === sel ? stop() : playAyah(sel))}
            accessibilityRole="button"
            style={[st.playBtn, { backgroundColor: colors.emerald }]}
          >
            {loading && playing === sel ? <ActivityIndicator size="small" color="#F6DFA4" /> : <Ionicons name={playing === sel ? 'pause' : 'play'} size={16} color="#F6DFA4" />}
            <Text style={{ color: '#F6DFA4', fontWeight: '700', fontSize: 13 }}>{playing === sel ? 'إيقاف' : `استمع للآية ${toArabicDigits(sel)}`}</Text>
          </Pressable>
          <IconButton name={bookmarked ? 'bookmark' : 'bookmark-outline'} label="علامة" color="#E3C47E" onPress={toggleBookmark} />
          <IconButton
            name="share-outline"
            label="مشاركة كبوست"
            color="#E3C47E"
            onPress={() => share({ text: s.verses[sel - 1], source: `سورة ${s.name} · ${toArabicDigits(sel)}` })}
          />
          <IconButton
            name={copied ? 'checkmark' : 'copy-outline'}
            label="نسخ"
            color="#E3C47E"
            onPress={() => {
              Clipboard.setStringAsync(`${s.verses[sel - 1]} ﴿${toArabicDigits(sel)}﴾\n[${s.name}]`);
              setCopied(true);
            }}
          />
          <IconButton name="close" label="إغلاق" color="#B8A27A" onPress={() => setSel(null)} />
        </View>
      ) : null}

      <View style={[st.player, { paddingBottom: insets.bottom + 12, backgroundColor: colors.bg2, borderColor: colors.border }]}>
        <Pressable
          onPress={() => (playing !== null ? stop() : playAyah(sel ?? lastVisible.current ?? 1))}
          accessibilityRole="button"
          accessibilityLabel={playing !== null ? 'إيقاف التلاوة' : 'تشغيل التلاوة'}
          style={[st.bigPlay, { backgroundColor: colors.emerald }]}
        >
          {loading ? <ActivityIndicator color="#F6DFA4" /> : <Ionicons name={playing !== null ? 'pause' : 'play'} size={20} color="#F6DFA4" />}
        </Pressable>
        <View style={{ flex: 1 }}>
          <T style={{ fontWeight: '600', fontSize: 13 }}>
            {audioError ? 'تعذّر تشغيل الصوت — تأكد من الاتصال بالإنترنت' : playing !== null ? `يتلو الآن: الآية ${toArabicDigits(playing)}` : 'اضغط على أي آية للاستماع'}
          </T>
          <T style={{ fontSize: 12, color: colors.muted }}>{reciterName(state.reciter)}</T>
        </View>
        <Pressable
          onPress={() => setContinuous((c) => !c)}
          accessibilityRole="switch"
          accessibilityState={{ checked: continuous }}
          accessibilityLabel="تشغيل متتابع"
          style={[st.contBtn, { borderColor: continuous ? colors.gold : colors.border, backgroundColor: continuous ? colors.goldSoft : 'transparent' }]}
        >
          <Ionicons name="repeat" size={16} color={continuous ? colors.goldText : colors.muted} />
          <T style={{ fontSize: 12, color: continuous ? colors.goldText : colors.muted }}>متتابع</T>
        </Pressable>
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: ROW, alignItems: 'center' },
  search: { flexDirection: ROW, alignItems: 'center', gap: 8, height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  wird: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10 },
  wirdBtn: { flexDirection: ROW, alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, borderRadius: 12 },
  wirdBanner: { flexDirection: ROW, alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10 },
  resume: { flexDirection: ROW, alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, padding: 14 },
  surahRow: { flexDirection: ROW, alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12 },
  numWrap: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  page: { flex: 1, marginHorizontal: 12, borderRadius: 10, borderWidth: 2, padding: 3 },
  pageInner: { flex: 1, borderRadius: 6, borderWidth: 1, overflow: 'hidden' },
  banner: { height: 58, alignItems: 'center', justifyContent: 'center' },
  navBtn: { flexDirection: ROW, alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
  actionBar: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: ROW,
    alignItems: 'center',
    gap: 2,
    borderRadius: 16,
    borderWidth: 1,
    padding: 5,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  playBtn: { flexDirection: ROW, alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 12, borderRadius: 11 },
  player: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: ROW, alignItems: 'center', gap: 12, paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1 },
  bigPlay: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  contBtn: { flexDirection: ROW, alignItems: 'center', gap: 4, height: 34, paddingHorizontal: 10, borderRadius: 17, borderWidth: 1 },
});
