import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { AmiriQuran_400Regular } from '@expo-google-fonts/amiri-quran';
import { ArefRuqaa_700Bold } from '@expo-google-fonts/aref-ruqaa';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState as RNAppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Splash from './src/components/Splash';
import { IconName } from './src/components/ui';
import { NavigationProvider, Route, Tab, useNav } from './src/navigation';
import { detectLocation, rescheduleAll } from './src/prayer';
import { ROW } from './src/rtl';
import { AdhkarListScreen, FavoritesScreen, FeelingsScreen, ReaderScreen } from './src/screens/AdhkarScreens';
import HomeScreen from './src/screens/HomeScreen';
import { MoreScreen, NamesScreen, StoriesScreen, StoryScreen, TasbihScreen } from './src/screens/MoreScreens';
import { MushafIndexScreen, SurahScreen } from './src/screens/MushafScreens';
import { PrayerScreen, QiblaScreen } from './src/screens/PrayerScreens';
import { QuizHomeScreen, QuizPlayScreen } from './src/screens/QuizScreens';
import SettingsScreen from './src/screens/SettingsScreen';
import { ShareProvider } from './src/share';
import { StoreProvider, useStore } from './src/store';

SplashScreen.preventAutoHideAsync().catch(() => {});

const TABS: { id: Tab; label: string; icon: IconName; iconActive: IconName }[] = [
  { id: 'home', label: 'الرئيسية', icon: 'home-outline', iconActive: 'home' },
  { id: 'mushaf', label: 'المصحف', icon: 'book-outline', iconActive: 'book' },
  { id: 'prayer', label: 'الصلاة', icon: 'time-outline', iconActive: 'time' },
  { id: 'adhkar', label: 'الأذكار', icon: 'sparkles-outline', iconActive: 'sparkles' },
  { id: 'more', label: 'المزيد', icon: 'grid-outline', iconActive: 'grid' },
];

function TabBar() {
  const { colors } = useStore();
  const { tab, setTab } = useNav();
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.tabbar, { backgroundColor: colors.bg2, borderTopColor: colors.border, paddingBottom: insets.bottom + 6 }]}>
      {TABS.map((t) => {
        const active = tab === t.id;
        const color = active ? colors.goldText : colors.muted;
        return (
          <Pressable key={t.id} onPress={() => setTab(t.id)} accessibilityRole="tab" accessibilityState={{ selected: active }} style={st.tab}>
            <View style={[st.dot, { backgroundColor: active ? colors.gold : 'transparent' }]} />
            <Ionicons name={active ? t.iconActive : t.icon} size={22} color={color} />
            <Text style={{ color, fontSize: 11, fontWeight: active ? '700' : '500' }}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function renderRoute(r: Route, tab: Tab) {
  switch (r.name) {
    case 'reader':
      return <ReaderScreen route={r} />;
    case 'surah':
      return <SurahScreen n={r.n} ayah={r.ayah} />;
    case 'feelings':
      return <FeelingsScreen />;
    case 'quiz':
      return <QuizHomeScreen />;
    case 'quizPlay':
      return <QuizPlayScreen mode={r.mode} level={r.level} />;
    case 'qibla':
      return <QiblaScreen />;
    case 'tasbih':
      return <TasbihScreen />;
    case 'stories':
      return <StoriesScreen />;
    case 'story':
      return <StoryScreen id={r.id} />;
    case 'names':
      return <NamesScreen />;
    case 'favorites':
      return <FavoritesScreen />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return tab === 'home' ? <HomeScreen /> : tab === 'mushaf' ? <MushafIndexScreen /> : tab === 'prayer' ? <PrayerScreen /> : tab === 'adhkar' ? <AdhkarListScreen /> : <MoreScreen />;
  }
}

function routeKey(r: Route, i: number): string {
  return `${i}-${JSON.stringify(r)}`;
}

// يعيد جدولة الإشعارات كلما تغيّرت الإعدادات أو عاد المستخدم للتطبيق
function NotificationsSync() {
  const { state, ready, update } = useStore();
  const askedLocation = useRef(false);
  const key = JSON.stringify([state.location, state.prayer, state.reminders]);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => rescheduleAll(stateRef.current).catch(() => {}), 1500);
    return () => clearTimeout(t);
  }, [key, ready]);

  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s === 'active') rescheduleAll(stateRef.current).catch(() => {});
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!ready || state.location || askedLocation.current) return;
    askedLocation.current = true;
    const t = setTimeout(() => {
      detectLocation()
        .then((l) => l && update((s) => ({ ...s, location: l })))
        .catch(() => {});
    }, 3200);
    return () => clearTimeout(t);
  }, [ready, state.location, update]);
  return null;
}

function Router() {
  const { stack, tab } = useNav();
  const { ready, colors, isDark } = useStore();
  if (!ready) return <View style={{ flex: 1, backgroundColor: '#1E130C' }} />;
  const layers: Route[] = [{ name: 'tab', tab }, ...stack];
  const showTabs = stack.length === 0;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NotificationsSync />
      <View style={{ flex: 1 }}>
        {layers.map((r, i) => {
          const top = i === layers.length - 1;
          return (
            <View key={i === 0 ? `tab-${tab}` : routeKey(r, i)} style={[StyleSheet.absoluteFill, { display: top ? 'flex' : 'none' }]}>
              {renderRoute(r, tab)}
            </View>
          );
        })}
      </View>
      {showTabs ? <TabBar /> : null}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Amiri_400Regular, Amiri_700Bold, AmiriQuran_400Regular, ArefRuqaa_700Bold });
  const [splashDone, setSplashDone] = useState(false);
  const onDone = useCallback(() => setSplashDone(true), []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#1E130C' }} />;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ShareProvider>
          <NavigationProvider>
            <Router />
          </NavigationProvider>
        </ShareProvider>
        {!splashDone ? <Splash onDone={onDone} /> : null}
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  tabbar: { flexDirection: ROW, borderTopWidth: 1, paddingTop: 4 },
  tab: { flex: 1, alignItems: 'center', gap: 2, minHeight: 52, justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3, marginBottom: 2 },
});
