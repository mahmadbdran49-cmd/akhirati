import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, T, TabHeader } from '../components/ui';
import { Dhikr } from '../data/adhkar';
import { useNav } from '../navigation';
import { ROW } from '../rtl';
import { useStore } from '../store';
import { QURAN_FONT } from '../theme';
import { lookupAny } from './ReaderScreen';

export default function FavoritesScreen() {
  const { colors, state, toggleFavorite } = useStore();
  const { push } = useNav();
  const items = state.favorites.map(lookupAny).filter(Boolean) as Dhikr[];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TabHeader title="المفضلة" subtitle="الأذكار والأدعية التي حفظتها" />
      {items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 }}>
          <Ionicons name="heart-outline" size={44} color={colors.muted} />
          <T style={{ textAlign: 'center', color: colors.muted }}>
            لم تضف شيئاً بعد. اضغط على القلب بجانب أي ذكر أو دعاء ليظهر هنا.
          </T>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}>
          {items.map((d, i) => (
            <Pressable
              key={d.id}
              onPress={() => push({ name: 'reader', source: 'favorites', id: 'fav', start: i })}
              accessibilityRole="button"
              style={({ pressed }) => [s.item, { backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={{ flex: 1, gap: 6 }}>
                <T style={{ fontFamily: QURAN_FONT, fontSize: 18, lineHeight: 34 }} numberOfLines={3}>
                  {d.text}
                </T>
                <T style={{ fontSize: 12, color: colors.muted }}>{d.source}</T>
              </View>
              <IconButton name="heart" color={colors.danger} label="إزالة من المفضلة" onPress={() => toggleFavorite(d.id)} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  item: { flexDirection: ROW, alignItems: 'flex-start', gap: 8, borderRadius: 18, padding: 16 },
});
