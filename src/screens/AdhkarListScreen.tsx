import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { T, TabHeader } from '../components/ui';
import { CATEGORIES } from '../data/adhkar';
import { useNav } from '../navigation';
import { ALIGN_START, ROW } from '../rtl';
import { useStore } from '../store';
import { toArabicDigits } from '../theme';
import { CATEGORY_ICONS } from './HomeScreen';

export default function AdhkarListScreen() {
  const { colors, isDark } = useStore();
  const { push } = useNav();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TabHeader title="الأذكار" subtitle="من حصن المسلم، مع ذكر المصدر" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => push({ name: 'reader', source: 'category', id: c.id })}
            accessibilityRole="button"
            style={({ pressed }) => [s.item, { backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={[s.icon, { backgroundColor: colors.greenSoft }]}>
              <Ionicons name={CATEGORY_ICONS[c.icon]} size={22} color={isDark ? colors.onPrimaryMuted : colors.primary} />
            </View>
            <View style={{ flex: 1, alignItems: ALIGN_START, gap: 2 }}>
              <T style={{ fontSize: 16, fontWeight: '600' }}>{c.title}</T>
              <T style={{ fontSize: 13, color: colors.muted }}>
                {c.subtitle} · {toArabicDigits(c.items.length)} أذكار
              </T>
            </View>
            <Ionicons name="chevron-back" size={18} color={colors.muted} />
          </Pressable>
        ))}
        <Pressable
          onPress={() => push({ name: 'feelings' })}
          accessibilityRole="button"
          style={({ pressed }) => [s.item, { backgroundColor: colors.goldSoft, opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={[s.icon, { backgroundColor: colors.card }]}>
            <Ionicons name="heart-half-outline" size={22} color={colors.goldText} />
          </View>
          <View style={{ flex: 1, alignItems: ALIGN_START, gap: 2 }}>
            <T style={{ fontSize: 16, fontWeight: '600' }}>الدعاء حسب حالتك</T>
            <T style={{ fontSize: 13, color: colors.muted }}>قلق، حزن، امتحان، مرض، سفر…</T>
          </View>
          <Ionicons name="chevron-back" size={18} color={colors.muted} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  item: { flexDirection: ROW, alignItems: 'center', gap: 14, borderRadius: 18, padding: 14, minHeight: 72 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
