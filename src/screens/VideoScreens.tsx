import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Card, Header, IconButton, Screen, T } from '../components/ui';
import { VIDEO_CREDIT, VIDEOS, Video, findVideo, videoEmbed, videoOfTheDay, videoThumb } from '../data/videos';
import { useNav } from '../navigation';
import { ROW } from '../rtl';
import { useStore } from '../store';
import { FONTS } from '../theme';

// بطاقة مقطع اليوم في الرئيسية
export function DailyVideoCard() {
  const { colors, state } = useStore();
  const { push } = useNav();
  const v = videoOfTheDay();
  const seen = state.videos.watched.includes(v.id);
  return (
    <Pressable
      onPress={() => push({ name: 'video', id: v.id })}
      accessibilityRole="button"
      accessibilityLabel={`مقطع اليوم: ${v.title}`}
      style={({ pressed }) => [st.daily, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 }]}
    >
      <View style={st.dailyThumb}>
        <Image source={{ uri: videoThumb(v.id) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={st.playDot}>
          <Ionicons name="play" size={18} color="#1E130C" />
        </View>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <T style={{ fontSize: 12, color: colors.gold, fontWeight: '700' }}>مقطع اليوم {seen ? '· شاهدته ✓' : ''}</T>
        <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 17, lineHeight: 26 }} numberOfLines={2}>
          {v.title}
        </T>
        <T style={{ fontSize: 12, color: colors.muted }}>{v.speaker}</T>
      </View>
    </Pressable>
  );
}

function VideoRow({ v }: { v: Video }) {
  const { colors, state } = useStore();
  const { push } = useNav();
  const fav = state.videos.favorites.includes(v.id);
  const seen = state.videos.watched.includes(v.id);
  return (
    <Pressable
      onPress={() => push({ name: 'video', id: v.id })}
      accessibilityRole="button"
      style={({ pressed }) => [st.row, st.item, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 }]}
    >
      <View style={st.thumb}>
        <Image source={{ uri: videoThumb(v.id) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={[st.playDot, { width: 30, height: 30, borderRadius: 15 }]}>
          <Ionicons name="play" size={14} color="#1E130C" />
        </View>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 16, lineHeight: 25 }} numberOfLines={2}>
          {v.title}
        </T>
        <View style={[st.row, { gap: 8 }]}>
          <T style={{ fontSize: 12, color: colors.muted }}>{v.speaker}</T>
          {seen ? <Ionicons name="checkmark-circle" size={14} color={colors.success} /> : null}
          {fav ? <Ionicons name="heart" size={14} color={colors.gold} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function VideosScreen() {
  const { colors, state } = useStore();
  const [onlyFav, setOnlyFav] = useState(false);
  const list = onlyFav ? VIDEOS.filter((v) => state.videos.favorites.includes(v.id)) : VIDEOS;
  return (
    <Screen>
      <Header
        title="مكتبة المقاطع"
        subtitle="مقاطع مختارة للدكتور ياسر الحزيمي"
        right={<IconButton name={onlyFav ? 'heart' : 'heart-outline'} label="المفضلة فقط" color={colors.goldText} onPress={() => setOnlyFav((x) => !x)} />}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10 }}>
        {list.map((v) => (
          <VideoRow key={v.id} v={v} />
        ))}
        {list.length === 0 ? <T style={{ color: colors.muted, textAlign: 'center', marginTop: 30 }}>لم تضف مقاطع للمفضلة بعد</T> : null}
        <T style={{ fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 8 }}>{VIDEO_CREDIT}</T>
      </ScrollView>
    </Screen>
  );
}

export function VideoScreen({ id }: { id: string }) {
  const { colors, state, update } = useStore();
  const { replace } = useNav();
  const { width } = useWindowDimensions();
  const v = findVideo(id) ?? VIDEOS[0];
  const [loading, setLoading] = useState(true);
  const fav = state.videos.favorites.includes(v.id);
  const h = Math.round(((width - 24) * 9) / 16);

  useEffect(() => {
    update((s) => (s.videos.watched.includes(v.id) ? s : { ...s, videos: { ...s.videos, watched: [...s.videos.watched, v.id] } }));
  }, [v.id, update]);

  const toggleFav = () =>
    update((s) => ({
      ...s,
      videos: { ...s.videos, favorites: fav ? s.videos.favorites.filter((x) => x !== v.id) : [v.id, ...s.videos.favorites] },
    }));

  const others = VIDEOS.filter((x) => x.id !== v.id);

  return (
    <Screen>
      <Header title={v.title} subtitle={v.speaker} right={<IconButton name={fav ? 'heart' : 'heart-outline'} label="المفضلة" color={colors.goldText} onPress={toggleFav} />} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40, gap: 14 }}>
        <View style={[st.player, { height: h, borderColor: colors.borderStrong }]}>
          {Platform.OS === 'web' ? (
            <iframe src={videoEmbed(v.id)} style={{ width: '100%', height: '100%', border: 0 }} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          ) : (
            <WebView
              source={{ uri: videoEmbed(v.id) }}
              style={{ flex: 1, backgroundColor: '#000' }}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              onLoadEnd={() => setLoading(false)}
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
              onShouldStartLoadWithRequest={(req) => {
                // أي رابط خارج المشغّل يفتح في يوتيوب نفسه
                if (req.url.startsWith('https://www.youtube.com/embed/') || req.url.startsWith('about:')) return true;
                if (req.url.includes('youtube.com/watch') || req.url.includes('youtu.be/')) {
                  Linking.openURL(req.url).catch(() => {});
                  return false;
                }
                return true;
              }}
            />
          )}
          {loading && Platform.OS !== 'web' ? (
            <View style={[StyleSheet.absoluteFill, st.center]}>
              <ActivityIndicator color={colors.gold} />
            </View>
          ) : null}
        </View>

        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 22, lineHeight: 34, color: colors.goldText }}>{v.title}</T>
          <View style={[st.row, { gap: 6 }]}>
            <Ionicons name="logo-youtube" size={16} color={colors.muted} />
            <T style={{ fontSize: 12, color: colors.muted, flex: 1 }}>{VIDEO_CREDIT}</T>
          </View>
          <Pressable
            onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${v.id}`).catch(() => {})}
            accessibilityRole="link"
            style={[st.row, st.ytBtn, { borderColor: colors.border }]}
          >
            <Ionicons name="open-outline" size={16} color={colors.goldText} />
            <T style={{ color: colors.goldText, fontWeight: '600', fontSize: 13 }}>افتحه في يوتيوب</T>
          </Pressable>

          <Card style={{ gap: 10 }}>
            <T style={{ fontWeight: '700', color: colors.goldText }}>مقاطع أخرى</T>
            {others.map((o) => (
              <Pressable key={o.id} onPress={() => replace({ name: 'video', id: o.id })} accessibilityRole="button" style={[st.row, { gap: 10 }]}>
                <View style={[st.thumb, { width: 96, height: 54 }]}>
                  <Image source={{ uri: videoThumb(o.id) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                </View>
                <T style={{ flex: 1, fontSize: 14, fontWeight: '600' }} numberOfLines={2}>
                  {o.title}
                </T>
              </Pressable>
            ))}
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: ROW, alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  daily: { flexDirection: ROW, alignItems: 'center', gap: 12, borderRadius: 20, borderWidth: 1, padding: 10 },
  dailyThumb: { width: 128, height: 74, borderRadius: 14, overflow: 'hidden', backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  thumb: { width: 120, height: 68, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  playDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(233,207,146,0.92)', alignItems: 'center', justifyContent: 'center' },
  item: { gap: 12, borderRadius: 18, borderWidth: 1, padding: 10 },
  player: { marginHorizontal: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, backgroundColor: '#000' },
  ytBtn: { gap: 6, alignSelf: 'flex-start', height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1 },
});
