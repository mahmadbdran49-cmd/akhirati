import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, Header, Screen, T } from '../components/ui';
import { videoThumb } from '../data/videos';
import { ROW, TEXT_START } from '../rtl';
import {
  adminAddVideo,
  adminDeleteVideo,
  adminListVideos,
  adminLogin,
  adminSetActive,
  adminStats,
  Creds,
  parseYoutubeId,
  ServerError,
  ServerVideo,
  Stats,
} from '../server';
import { useStore } from '../store';
import { FONTS, toArabicDigits } from '../theme';
import { useVideos } from '../videos';

function errText(e: unknown): string {
  if (e instanceof ServerError) {
    if (e.code === 'offline') return 'لا يوجد اتصال بالإنترنت';
    if (e.code === 'locked') return 'محاولات كثيرة خاطئة. حاول بعد ربع ساعة';
    if (e.code === 'unauthorized') return 'انتهت الجلسة، ادخل من جديد';
    if (e.message.includes('duplicate')) return 'هذا المقطع موجود مسبقاً';
  }
  return 'حدث خطأ، حاول مرة أخرى';
}

// لوحة الإدارة: تُفتح بالضغط المطوّل على اسم التطبيق في الرئيسية
export default function AdminScreen() {
  const { colors } = useStore();
  const [creds, setCreds] = useState<Creds | null>(null);
  return (
    <Screen>
      <Header title="لوحة الإدارة" subtitle={creds ? 'مرحباً بك' : 'للمسؤول فقط'} />
      {creds ? <Dashboard creds={creds} onLogout={() => setCreds(null)} /> : <Login onOk={setCreds} />}
      <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: colors.border }} />
    </Screen>
  );
}

function Field({ value, onChange, placeholder, secure, ltr }: { value: string; onChange: (s: string) => void; placeholder: string; secure?: boolean; ltr?: boolean }) {
  const { colors } = useStore();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      secureTextEntry={secure}
      autoCapitalize="none"
      autoCorrect={false}
      style={[st.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card, textAlign: ltr ? 'left' : TEXT_START, writingDirection: ltr ? 'ltr' : 'rtl' }]}
      accessibilityLabel={placeholder}
    />
  );
}

function Login({ onOk }: { onOk: (c: Creds) => void }) {
  const { colors } = useStore();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function go() {
    if (!user.trim() || !pass) return;
    setBusy(true);
    setErr('');
    try {
      const c = { user: user.trim(), pass };
      if (await adminLogin(c)) onOk(c);
      else setErr('اسم المستخدم أو كلمة السر غير صحيحة');
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <View style={{ alignItems: 'center', marginVertical: 10 }}>
        <View style={[st.lock, { backgroundColor: colors.goldSoft, borderColor: colors.borderStrong }]}>
          <Ionicons name="lock-closed" size={30} color={colors.goldText} />
        </View>
      </View>
      <Field value={user} onChange={setUser} placeholder="اسم المستخدم" ltr />
      <Field value={pass} onChange={setPass} placeholder="كلمة السر" secure ltr />
      {err ? <T style={{ color: colors.danger, textAlign: 'center' }}>{err}</T> : null}
      <Button title={busy ? 'جارٍ الدخول…' : 'دخول'} icon="log-in-outline" onPress={go} disabled={busy} />
    </View>
  );
}

function Dashboard({ creds, onLogout }: { creds: Creds; onLogout: () => void }) {
  const { colors } = useStore();
  const { refresh: refreshApp } = useVideos();
  const [stats, setStats] = useState<Stats | null>(null);
  const [list, setList] = useState<ServerVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('الدكتور ياسر الحزيمي');
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const [s, v] = await Promise.all([adminStats(creds), adminListVideos(creds)]);
      setStats(s);
      setList(v);
    } catch (e) {
      setErr(errText(e));
      if (e instanceof ServerError && e.code === 'unauthorized') onLogout();
    } finally {
      setLoading(false);
    }
  }, [creds, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    const id = parseYoutubeId(link);
    if (!id) return setErr('الرابط غير صحيح، انسخ رابط المقطع من يوتيوب');
    if (!title.trim()) return setErr('اكتب عنوان المقطع');
    setAdding(true);
    setErr('');
    try {
      await adminAddVideo(creds, id, title.trim(), speaker.trim());
      setLink('');
      setTitle('');
      setMsg('تمت الإضافة، وسيظهر المقطع للمستخدمين');
      await load();
      refreshApp();
    } catch (e) {
      setErr(errText(e));
    } finally {
      setAdding(false);
    }
  }

  async function toggle(v: ServerVideo) {
    try {
      await adminSetActive(creds, v.id, !v.active);
      setMsg(v.active ? 'تم إخفاء المقطع' : 'تم إظهار المقطع');
      await load();
      refreshApp();
    } catch (e) {
      setErr(errText(e));
    }
  }

  async function del(v: ServerVideo) {
    if (confirmDel !== v.id) return setConfirmDel(v.id);
    setConfirmDel(null);
    try {
      await adminDeleteVideo(creds, v.id);
      setMsg('تم حذف المقطع');
      await load();
      refreshApp();
    } catch (e) {
      setErr(errText(e));
    }
  }

  const n = (x?: number) => toArabicDigits(x ?? 0);
  const tiles: [string, number | undefined, keyof typeof Ionicons.glyphMap][] = [
    ['كل المستخدمين', stats?.total, 'people'],
    ['نشِطون اليوم', stats?.today, 'sunny-outline'],
    ['هذا الأسبوع', stats?.week, 'calendar-outline'],
    ['هذا الشهر', stats?.month, 'stats-chart-outline'],
    ['جدد هذا الأسبوع', stats?.new_week, 'person-add-outline'],
  ];

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled">
      <View style={[st.row, { justifyContent: 'space-between' }]}>
        <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 19, lineHeight: 30, color: colors.goldText }}>المستخدمون</T>
        <View style={[st.row, { gap: 8 }]}>
          <Pressable onPress={load} accessibilityRole="button" style={[st.small, { borderColor: colors.border }]}>
            <Ionicons name="refresh" size={16} color={colors.goldText} />
            <T style={{ color: colors.goldText, fontSize: 13 }}>تحديث</T>
          </Pressable>
          <Pressable onPress={onLogout} accessibilityRole="button" style={[st.small, { borderColor: colors.border }]}>
            <Ionicons name="log-out-outline" size={16} color={colors.muted} />
            <T style={{ color: colors.muted, fontSize: 13 }}>خروج</T>
          </Pressable>
        </View>
      </View>

      {loading && !stats ? <ActivityIndicator color={colors.gold} /> : null}
      <View style={[st.row, { flexWrap: 'wrap', gap: 10 }]}>
        {tiles.map(([k, v, icon], i) => (
          <Card key={k} style={[st.tile, i === 0 && { width: '100%', backgroundColor: colors.emerald, borderColor: colors.borderStrong }]}>
            <Ionicons name={icon} size={i === 0 ? 24 : 18} color={i === 0 ? '#F6DFA4' : colors.gold} />
            <T style={{ fontSize: i === 0 ? 34 : 24, fontWeight: '700', color: i === 0 ? '#FFFFFF' : colors.text, textAlign: 'center' }}>{n(v)}</T>
            <T style={{ fontSize: 12, color: i === 0 ? colors.onEmeraldMuted : colors.muted, textAlign: 'center' }}>{k}</T>
          </Card>
        ))}
      </View>
      <T style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>
        أندرويد {n(stats?.android)} · آيفون {n(stats?.ios)} · يُحسب كل جهاز مرة واحدة
      </T>

      {err ? <T style={{ color: colors.danger, textAlign: 'center' }}>{err}</T> : null}
      {msg && !err ? <T style={{ color: colors.success, textAlign: 'center' }}>{msg}</T> : null}

      <Card style={{ gap: 10 }}>
        <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 18, lineHeight: 28, color: colors.goldText }}>إضافة مقطع</T>
        <Field value={link} onChange={setLink} placeholder="رابط المقطع من يوتيوب" ltr />
        <Field value={title} onChange={setTitle} placeholder="عنوان المقطع" />
        <Field value={speaker} onChange={setSpeaker} placeholder="اسم الشيخ أو المتحدث" />
        {parseYoutubeId(link) ? (
          <Image source={{ uri: videoThumb(parseYoutubeId(link)!) }} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: '#000' }} />
        ) : null}
        <Button title={adding ? 'جارٍ الإضافة…' : 'أضف المقطع'} icon="add-circle-outline" onPress={add} disabled={adding} variant="gold" />
      </Card>

      <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 18, lineHeight: 28, color: colors.goldText }}>المقاطع ({n(list.length)})</T>
      {list.map((v) => (
        <View key={v.id} style={[st.row, st.item, { backgroundColor: colors.card, borderColor: colors.border, opacity: v.active ? 1 : 0.55 }]}>
          <Image source={{ uri: videoThumb(v.youtube_id) }} style={st.thumb} />
          <View style={{ flex: 1, gap: 2 }}>
            <T style={{ fontWeight: '700', fontSize: 14 }} numberOfLines={2}>
              {v.title}
            </T>
            <T style={{ fontSize: 12, color: colors.muted }} numberOfLines={1}>
              {v.speaker}
              {v.active ? '' : ' · مخفي'}
            </T>
          </View>
          <Pressable onPress={() => toggle(v)} accessibilityRole="button" accessibilityLabel={v.active ? 'إخفاء' : 'إظهار'} hitSlop={6} style={st.iconBtn}>
            <Ionicons name={v.active ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.goldText} />
          </Pressable>
          <Pressable onPress={() => del(v)} accessibilityRole="button" accessibilityLabel="حذف" hitSlop={6} style={[st.iconBtn, confirmDel === v.id && { backgroundColor: colors.dangerSoft, borderRadius: 10, width: 64 }]}>
            {confirmDel === v.id ? <T style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>تأكيد</T> : <Ionicons name="trash-outline" size={20} color={colors.danger} />}
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: ROW, alignItems: 'center' },
  input: { height: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  lock: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  small: { flexDirection: ROW, alignItems: 'center', gap: 4, height: 34, paddingHorizontal: 10, borderRadius: 17, borderWidth: 1 },
  tile: { width: '48%', flexGrow: 1, alignItems: 'center', gap: 2, paddingVertical: 14 },
  item: { gap: 10, borderRadius: 16, borderWidth: 1, padding: 8 },
  thumb: { width: 88, height: 50, borderRadius: 10, backgroundColor: '#000' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
