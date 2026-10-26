import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Card, Divider, Header, IconName, IslamicPattern, Screen, T } from '../components/ui';
import { PLUS_SKU, PurchaseStatus, SUPPORT_SKUS, SupportSku, usePurchases } from '../purchases';
import { ROW } from '../rtl';
import { useStore } from '../store';
import { FONTS, THEMES, toArabicDigits } from '../theme';

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'color-palette-outline', title: 'ثلاثة ألوان فاخرة', body: 'الزمردي، والعاجي، والليلي' },
  { icon: 'images-outline', title: 'قوالب بوستات حصرية', body: 'تصاميم إضافية لمشاركة الآيات والأذكار' },
  { icon: 'leaf-outline', title: 'الشجرة الذهبية', body: 'أزهار ذهبية وفوانيس تضيء شجرة عباداتك' },
  { icon: 'create-outline', title: 'أذكارك الخاصة بالمسبحة', body: 'أضف أي ذكر تحبه واحفظه' },
  { icon: 'heart-outline', title: 'تدعم استمرار التطبيق', body: 'وتساعدنا نضيف محتوى جديد للجميع' },
];

const SUPPORT_LABELS: Record<SupportSku, { label: string; icon: IconName }> = {
  support_small: { label: 'دعم بسيط', icon: 'cafe-outline' },
  support_medium: { label: 'دعم متوسط', icon: 'gift-outline' },
  support_large: { label: 'دعم كبير', icon: 'diamond-outline' },
};

const MESSAGES: Partial<Record<PurchaseStatus, string>> = {
  pending: 'الدفع قيد المعالجة، وسيتفعّل فور اكتماله',
  'thanks-plus': 'جزاك الله خيراً! تم تفعيل آخرتي بلس ✦',
  'thanks-support': 'جزاك الله خيراً على دعمك، وجعله في ميزان حسناتك',
  restored: 'تم استرجاع آخرتي بلس',
  nothing: 'لا توجد مشتريات سابقة على هذا الحساب',
  error: 'لم تكتمل العملية، حاول مرة أخرى',
  unavailable: 'الشراء متاح بعد تنزيل التطبيق من المتجر',
};

export default function PlusScreen() {
  const { colors, state } = useStore();
  const { plus, price, buyPlus, support, restore, status } = usePurchases();
  const busy = status === 'busy';
  const msg = MESSAGES[status];
  const good = status === 'thanks-plus' || status === 'thanks-support' || status === 'restored';

  return (
    <Screen>
      <Header title="آخرتي بلس" subtitle="القرآن والأذكار مجانية للجميع دائماً" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}>
        <View style={[st.hero, { borderColor: colors.borderStrong }]}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#3B2416" />
                <Stop offset="0.5" stopColor="#8A4A26" />
                <Stop offset="1" stopColor="#1A110B" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#pg)" />
          </Svg>
          <IslamicPattern opacity={0.1} color="#E8C878" size={40} force />
          <Ionicons name="sparkles" size={34} color="#F6DFA4" />
          <T style={{ fontFamily: FONTS.logo, fontSize: 40, lineHeight: 64, color: '#F6DFA4', textAlign: 'center' }}>آخرتي بلس</T>
          <T style={{ color: '#F1D9C4', textAlign: 'center', fontSize: 14 }}>{plus ? 'مفعّل على هذا الجهاز، جزاك الله خيراً' : 'دفعة واحدة فقط، وتبقى معك للأبد'}</T>
        </View>

        <Card style={{ gap: 14 }}>
          {FEATURES.map((f) => (
            <View key={f.title} style={[st.row, { gap: 12 }]}>
              <View style={[st.ficon, { backgroundColor: colors.goldSoft }]}>
                <Ionicons name={f.icon} size={20} color={colors.goldText} />
              </View>
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: '700' }}>{f.title}</T>
                <T style={{ fontSize: 13, color: colors.muted }}>{f.body}</T>
              </View>
              {plus ? <Ionicons name="checkmark-circle" size={20} color={colors.success} /> : null}
            </View>
          ))}
          <View style={[st.row, { gap: 6, justifyContent: 'center' }]}>
            {(['emerald', 'ivory', 'night'] as const).map((k) => (
              <View key={k} style={[st.dot, { backgroundColor: THEMES[k].bg, borderColor: THEMES[k].gold }]} />
            ))}
          </View>
        </Card>

        {msg ? <T style={{ textAlign: 'center', color: good ? colors.success : status === 'error' ? colors.danger : colors.muted }}>{msg}</T> : null}

        {!plus ? (
          <Pressable onPress={buyPlus} disabled={busy} accessibilityRole="button" style={({ pressed }) => [st.buy, { backgroundColor: colors.gold, opacity: pressed || busy ? 0.85 : 1 }]}>
            {busy ? <ActivityIndicator color="#1E130C" /> : <Ionicons name="sparkles" size={18} color="#1E130C" />}
            <T style={{ color: '#1E130C', fontWeight: '800', fontSize: 17, textAlign: 'center' }}>
              فعّل آخرتي بلس{price(PLUS_SKU) ? ` · ${price(PLUS_SKU)}` : ''}
            </T>
          </Pressable>
        ) : null}
        <Pressable onPress={restore} disabled={busy} accessibilityRole="button" style={{ alignSelf: 'center', padding: 6 }}>
          <T style={{ color: colors.muted, fontSize: 13, textDecorationLine: 'underline' }}>استرجاع مشترياتي السابقة</T>
        </Pressable>

        <View style={{ alignItems: 'center' }}>
          <Divider width={140} />
        </View>

        <View style={{ gap: 10 }}>
          <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 20, lineHeight: 32, color: colors.goldText, textAlign: 'center' }}>ادعم آخرتي</T>
          <T style={{ fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 21 }}>
            دعمك يبقي التطبيق مجانياً ونظيفاً من الإعلانات، ويساعدنا نضيف محتوى نافعاً للجميع
          </T>
          <View style={[st.row, { gap: 10 }]}>
            {SUPPORT_SKUS.map((sku) => (
              <Pressable
                key={sku}
                onPress={() => support(sku)}
                disabled={busy}
                accessibilityRole="button"
                style={({ pressed }) => [st.sup, { backgroundColor: colors.card, borderColor: colors.borderStrong, opacity: pressed ? 0.85 : 1 }]}
              >
                <Ionicons name={SUPPORT_LABELS[sku].icon} size={22} color={colors.goldText} />
                <T style={{ fontWeight: '700', fontSize: 13, textAlign: 'center' }}>{SUPPORT_LABELS[sku].label}</T>
                <T style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>{price(sku) ?? '—'}</T>
              </Pressable>
            ))}
          </View>
          {state.supportCount > 0 ? (
            <T style={{ fontSize: 12, color: colors.success, textAlign: 'center' }}>دعمتنا {toArabicDigits(state.supportCount)} مرة، جزاك الله خيراً</T>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: ROW, alignItems: 'center' },
  hero: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', alignItems: 'center', paddingVertical: 26, paddingHorizontal: 16, gap: 4 },
  ficon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2 },
  buy: { height: 58, borderRadius: 18, flexDirection: ROW, alignItems: 'center', justifyContent: 'center', gap: 8 },
  sup: { flex: 1, borderRadius: 18, borderWidth: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
});
