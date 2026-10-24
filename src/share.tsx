import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import { Button, Divider, IslamicPattern, T } from './components/ui';
import { ROW } from './rtl';
import { useStore } from './store';
import { FONTS } from './theme';

export type SharePayload = { text: string; source: string; title?: string };

type Template = { id: string; label: string; bg: string; glow: string; gold: string; text: string; sub: string; pattern: number };

const TEMPLATES: Template[] = [
  { id: 'emerald', label: 'زمردي', bg: '#0B2E24', glow: '#145A45', gold: '#D9B56A', text: '#FBF3E0', sub: '#CFE0D7', pattern: 0.14 },
  { id: 'royal', label: 'ملكي', bg: '#1A100A', glow: '#3B2416', gold: '#D9B56A', text: '#F7ECD6', sub: '#C9B48E', pattern: 0.15 },
  { id: 'ivory', label: 'عاجي', bg: '#EFE2C6', glow: '#FFF9EC', gold: '#A0752A', text: '#2A1A10', sub: '#6E5636', pattern: 0.2 },
];

const W = 340;
const H = 425;

function PostCard({ p, t }: { p: SharePayload; t: Template }) {
  const long = p.text.length > 220;
  const veryLong = p.text.length > 420;
  const size = veryLong ? 15 : long ? 18 : 22;
  return (
    <View style={{ width: W, height: H, backgroundColor: t.bg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{ width: W * 1.1, height: W * 1.1, borderRadius: W, backgroundColor: t.glow, opacity: 0.55 }} />
      </View>
      <IslamicPattern opacity={t.pattern} color={t.gold} size={44} />
      <View style={[StyleSheet.absoluteFill, { margin: 16, borderWidth: 1.5, borderColor: t.gold, borderRadius: 6 }]} />
      <View style={[StyleSheet.absoluteFill, { margin: 22, borderWidth: 0.8, borderColor: t.gold, borderRadius: 4, opacity: 0.7 }]} />
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Path d={`M16 16 h20 l-20 20z M${W - 16} 16 h-20 l20 20z M16 ${H - 16} h20 l-20 -20z M${W - 16} ${H - 16} h-20 l20 -20z`} fill={t.gold} />
      </Svg>
      <View style={{ width: W - 80, alignItems: 'center', gap: 12 }}>
        <Divider width={120} color={t.gold} />
        {p.title ? <Text style={{ color: t.gold, fontSize: 13, fontWeight: '700', writingDirection: 'rtl' }}>{p.title}</Text> : null}
        <Text style={{ fontFamily: FONTS.dhikrBold, fontSize: size, lineHeight: size * 1.85, color: t.text, textAlign: 'center', writingDirection: 'rtl' }}>
          {p.text}
        </Text>
        <Text style={{ fontFamily: FONTS.dhikr, fontSize: 13, color: t.sub, textAlign: 'center', writingDirection: 'rtl' }}>{p.source}</Text>
      </View>
      <View style={{ position: 'absolute', bottom: 30, flexDirection: ROW, alignItems: 'center', gap: 8 }}>
        <Text style={{ fontFamily: FONTS.logo, fontSize: 19, color: t.gold }}>آخرتي</Text>
        <View style={{ width: 1, height: 13, backgroundColor: t.gold, opacity: 0.6 }} />
        <Text style={{ fontSize: 10, letterSpacing: 3, color: t.gold, fontWeight: '600' }}>AKHIRAH</Text>
      </View>
    </View>
  );
}

const ShareContext = createContext<(p: SharePayload) => void>(() => {});

export function ShareProvider({ children }: { children: ReactNode }) {
  const { colors } = useStore();
  const insets = useSafeAreaInsets();
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [tpl, setTpl] = useState(0);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);

  const open = useCallback((p: SharePayload) => {
    setCopied(false);
    setPayload(p);
  }, []);

  async function shareImage() {
    if (!payload || !ref.current) return;
    setBusy(true);
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1, width: 1080, height: 1350 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'مشاركة من آخرتي' });
      } else {
        await Share.share({ message: `${payload.text}\n\n${payload.source}\n— من تطبيق آخرتي` });
      }
    } catch {
      await Share.share({ message: `${payload.text}\n\n${payload.source}\n— من تطبيق آخرتي` });
    } finally {
      setBusy(false);
    }
  }

  async function copyText() {
    if (!payload) return;
    await Clipboard.setStringAsync(`${payload.text}\n\n${payload.source}`);
    setCopied(true);
  }

  return (
    <ShareContext.Provider value={open}>
      {children}
      <Modal visible={!!payload} transparent animationType="fade" onRequestClose={() => setPayload(null)}>
        <View style={[st.backdrop, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPayload(null)} accessibilityLabel="إغلاق" />
          {payload ? (
            <View style={{ alignItems: 'center', gap: 14 }}>
              <View ref={ref} collapsable={false} style={{ borderRadius: 4, overflow: 'hidden' }}>
                <PostCard p={payload} t={TEMPLATES[tpl]} />
              </View>
              <View style={[{ flexDirection: ROW, gap: 10 }]}>
                {TEMPLATES.map((t, i) => (
                  <Pressable
                    key={t.id}
                    onPress={() => setTpl(i)}
                    accessibilityRole="button"
                    accessibilityLabel={`قالب ${t.label}`}
                    accessibilityState={{ selected: tpl === i }}
                    style={[st.swatch, { backgroundColor: t.bg, borderColor: tpl === i ? colors.goldText : 'rgba(255,255,255,0.3)' }]}
                  >
                    <T style={{ color: t.gold, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>{t.label}</T>
                  </Pressable>
                ))}
              </View>
              <View style={{ flexDirection: ROW, gap: 10, width: W }}>
                <Button title={busy ? 'جارٍ التجهيز…' : 'مشاركة كصورة'} icon="share-social" variant="gold" style={{ flex: 1 }} onPress={shareImage} disabled={busy} />
                <Button title={copied ? 'تم النسخ' : 'نسخ النص'} icon={copied ? 'checkmark' : 'copy-outline'} variant="outline" style={{ flex: 0.7 }} onPress={copyText} />
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </ShareContext.Provider>
  );
}

export function useSharePost() {
  return useContext(ShareContext);
}

const st = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,5,3,0.88)', alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 64, height: 40, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
