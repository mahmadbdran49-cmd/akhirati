import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Header, Screen, T } from '../components/ui';
import { FEELINGS } from '../data/feelings';
import { useNav } from '../navigation';
import { ALIGN_START, ROW } from '../rtl';
import { useStore } from '../store';
import { toArabicDigits } from '../theme';

export default function FeelingsScreen() {
  const { colors } = useStore();
  const { push } = useNav();
  return (
    <Screen>
      <Header title="الدعاء حسب حالتك" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingTop: 4 }}>
        <T style={{ color: colors.muted, marginBottom: 4 }}>كيف تشعر الآن؟ اختر حالتك ونعرض لك أدعية مناسبة من القرآن والسنة.</T>
        {FEELINGS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => push({ name: 'reader', source: 'feeling', id: f.id })}
            accessibilityRole="button"
            style={({ pressed }) => [s.item, { backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={{ flex: 1, alignItems: ALIGN_START, gap: 2 }}>
              <T style={{ fontSize: 16, fontWeight: '600' }}>{f.label}</T>
              <T style={{ fontSize: 13, color: colors.muted }}>{f.hint}</T>
            </View>
            <View style={[s.badge, { backgroundColor: colors.goldSoft }]}>
              <T style={{ color: colors.goldText, fontSize: 12, fontWeight: '600' }}>{toArabicDigits(f.duas.length)} أدعية</T>
            </View>
            <Ionicons name="chevron-back" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  item: { flexDirection: ROW, alignItems: 'center', gap: 12, borderRadius: 18, padding: 16, minHeight: 72 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
});
