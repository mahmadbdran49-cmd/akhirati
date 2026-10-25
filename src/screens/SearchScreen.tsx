import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Header, IconName, Screen, T } from '../components/ui';
import { CATEGORIES } from '../data/adhkar';
import { FEELINGS } from '../data/feelings';
import { NAMES } from '../data/names';
import { STORIES } from '../data/prophets';
import { VIDEOS } from '../data/videos';
import { Route, useNav } from '../navigation';
import { normalizeArabic, searchQuran, surahList } from '../quran';
import { ROW, TEXT_START } from '../rtl';
import { useStore } from '../store';
import { FONTS, toArabicDigits } from '../theme';

type Hit = { key: string; title: string; snippet?: string; route: Route; quran?: boolean };
type Group = { id: string; title: string; icon: IconName; hits: Hit[] };

function snippet(text: string, nq: string, len = 90): string {
  const t = text.replace(/\s+/g, ' ');
  if (t.length <= len) return t;
  // نقرّب موضع الكلمة في النص الأصلي بنسبة موضعها في النص المنظّف
  const nt = normalizeArabic(t);
  const i = nt.indexOf(nq);
  const start = i < 0 ? 0 : Math.max(0, Math.floor((i / Math.max(1, nt.length)) * t.length) - 25);
  return (start > 0 ? '…' : '') + t.slice(start, start + len) + (start + len < t.length ? '…' : '');
}

// بحث شامل: القرآن، الأذكار، الحالات، القصص، الأسماء، المقاطع
export default function SearchScreen({ initial }: { initial?: string }) {
  const { colors } = useStore();
  const { push } = useNav();
  const [q, setQ] = useState(initial ?? '');

  const groups = useMemo<Group[]>(() => {
    const nq = normalizeArabic(q);
    if (nq.length < 2) return [];
    const has = (x: string) => normalizeArabic(x).includes(nq);
    const surahs: Hit[] = surahList()
      .filter((s) => has(s.name) || s.translit.toLowerCase().includes(q.trim().toLowerCase()))
      .slice(0, 6)
      .map((s) => ({ key: `s${s.n}`, title: `سورة ${s.name}`, snippet: `${s.medinan ? 'مدنية' : 'مكية'} · ${toArabicDigits(s.count)} آية`, route: { name: 'surah', n: s.n } }));
    const ayat: Hit[] = searchQuran(q, 25).map((a) => ({
      key: `a${a.surah}-${a.ayah}`,
      title: `${a.name} · ${toArabicDigits(a.ayah)}`,
      snippet: snippet(a.text, nq, 110),
      route: { name: 'surah', n: a.surah, ayah: a.ayah },
      quran: true,
    }));
    const adhkar: Hit[] = [];
    for (const c of CATEGORIES) {
      if (has(c.title)) adhkar.push({ key: `c${c.id}`, title: c.title, snippet: c.subtitle, route: { name: 'reader', source: 'category', id: c.id } });
      c.items.forEach((d, i) => {
        if (adhkar.length < 20 && (has(d.text) || has(d.source))) adhkar.push({ key: d.id, title: c.title, snippet: snippet(d.text, nq), route: { name: 'reader', source: 'category', id: c.id, start: i } });
      });
    }
    const feelings: Hit[] = [];
    for (const f of FEELINGS) {
      if (has(f.label) || has(f.hint)) feelings.push({ key: `f${f.id}`, title: f.label, snippet: f.hint, route: { name: 'reader', source: 'feeling', id: f.id } });
      else
        f.duas.forEach((d, i) => {
          if (feelings.length < 12 && has(d.text)) feelings.push({ key: d.id, title: f.label, snippet: snippet(d.text, nq), route: { name: 'reader', source: 'feeling', id: f.id, start: i } });
        });
    }
    const stories: Hit[] = STORIES.filter((s) => has(s.name) || has(s.title) || s.paragraphs.some(has)).map((s) => ({
      key: `st${s.id}`,
      title: s.title,
      snippet: `قصة ${s.name}`,
      route: { name: 'story', id: s.id },
    }));
    const names: Hit[] = NAMES.filter(has).slice(0, 8).map((n) => ({ key: `n${n}`, title: n, snippet: 'من أسماء الله الحسنى', route: { name: 'names' } }));
    const videos: Hit[] = VIDEOS.filter((v) => has(v.title) || has(v.speaker)).map((v) => ({ key: `v${v.id}`, title: v.title, snippet: v.speaker, route: { name: 'video', id: v.id } }));
    return [
      { id: 'surahs', title: 'السور', icon: 'book-outline' as IconName, hits: surahs },
      { id: 'ayat', title: 'آيات القرآن', icon: 'book' as IconName, hits: ayat },
      { id: 'adhkar', title: 'الأذكار', icon: 'sparkles-outline' as IconName, hits: adhkar },
      { id: 'feelings', title: 'حسب حالتك', icon: 'heart-half-outline' as IconName, hits: feelings },
      { id: 'stories', title: 'قصص الأنبياء', icon: 'library-outline' as IconName, hits: stories },
      { id: 'names', title: 'أسماء الله الحسنى', icon: 'star-outline' as IconName, hits: names },
      { id: 'videos', title: 'المقاطع', icon: 'play-circle-outline' as IconName, hits: videos },
    ].filter((g) => g.hits.length);
  }, [q]);

  const total = groups.reduce((n, g) => n + g.hits.length, 0);
  const SUGGEST = ['الصبر', 'الرزق', 'الهم', 'يونس', 'الرحمن', 'النوم'];

  return (
    <Screen>
      <Header title="البحث" subtitle="في القرآن والأذكار والقصص والمقاطع" />
      <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={[st.row, st.box, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
          <Ionicons name="search" size={18} color={colors.gold} />
          <TextInput
            value={q}
            onChangeText={setQ}
            autoFocus
            placeholder="اكتب كلمة… مثلاً: الصبر"
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            style={{ flex: 1, color: colors.text, fontSize: 16, textAlign: TEXT_START, writingDirection: 'rtl' }}
            accessibilityLabel="ابحث"
          />
          {q ? (
            <Pressable onPress={() => setQ('')} accessibilityLabel="مسح" hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}>
        {normalizeArabic(q).length < 2 ? (
          <View style={{ gap: 10 }}>
            <T style={{ color: colors.muted }}>جرّب:</T>
            <View style={[st.row, { flexWrap: 'wrap', gap: 8 }]}>
              {SUGGEST.map((s) => (
                <Pressable key={s} onPress={() => setQ(s)} style={[st.chip, { borderColor: colors.border, backgroundColor: colors.goldSoft }]}>
                  <T style={{ color: colors.goldText, fontWeight: '600' }}>{s}</T>
                </Pressable>
              ))}
            </View>
          </View>
        ) : total === 0 ? (
          <T style={{ color: colors.muted, textAlign: 'center', marginTop: 30 }}>لا توجد نتائج لـ «{q}»</T>
        ) : (
          groups.map((g) => (
            <View key={g.id} style={{ gap: 8 }}>
              <View style={[st.row, { gap: 6 }]}>
                <Ionicons name={g.icon} size={16} color={colors.gold} />
                <T style={{ fontWeight: '700', color: colors.goldText }}>
                  {g.title} · {toArabicDigits(g.hits.length)}
                </T>
              </View>
              {g.hits.map((h) => (
                <Pressable
                  key={h.key}
                  onPress={() => push(h.route)}
                  accessibilityRole="button"
                  style={({ pressed }) => [st.hit, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
                >
                  <T style={{ fontWeight: '700', fontSize: 14 }}>{h.title}</T>
                  {h.snippet ? (
                    <T style={h.quran ? { fontFamily: FONTS.quran, fontSize: 18, lineHeight: 36 } : { fontSize: 13, color: colors.muted, lineHeight: 21 }} numberOfLines={3}>
                      {h.snippet}
                    </T>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: ROW, alignItems: 'center' },
  box: { gap: 8, height: 52, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14 },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, justifyContent: 'center' },
  hit: { borderRadius: 16, borderWidth: 1, padding: 12, gap: 4 },
});
