import { Amiri_400Regular, Amiri_700Bold, useFonts } from '@expo-google-fonts/amiri';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconName } from './src/components/ui';
import { NavigationProvider, Tab, useNav } from './src/navigation';
import { ROW } from './src/rtl';
import AdhkarListScreen from './src/screens/AdhkarListScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import FeelingsScreen from './src/screens/FeelingsScreen';
import HomeScreen from './src/screens/HomeScreen';
import { QuizHomeScreen, QuizPlayScreen } from './src/screens/QuizScreens';
import ReaderScreen from './src/screens/ReaderScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TasbihScreen from './src/screens/TasbihScreen';
import { StoreProvider, useStore } from './src/store';
import './src/notifications';

const TABS: { id: Tab; label: string; icon: IconName; iconActive: IconName }[] = [
  { id: 'home', label: 'الرئيسية', icon: 'home-outline', iconActive: 'home' },
  { id: 'adhkar', label: 'الأذكار', icon: 'book-outline', iconActive: 'book' },
  { id: 'tasbih', label: 'المسبحة', icon: 'ellipse-outline', iconActive: 'ellipse' },
  { id: 'favorites', label: 'المفضلة', icon: 'heart-outline', iconActive: 'heart' },
  { id: 'settings', label: 'الإعدادات', icon: 'settings-outline', iconActive: 'settings' },
];

function TabBar() {
  const { colors, isDark } = useStore();
  const { tab, setTab } = useNav();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.tabbar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 6 }]}>
      {TABS.map((t) => {
        const active = tab === t.id;
        const color = active ? (isDark ? colors.gold : colors.primary) : colors.muted;
        return (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={s.tab}
          >
            <Ionicons name={active ? t.iconActive : t.icon} size={22} color={color} />
            <Text style={{ color, fontSize: 11, fontWeight: active ? '700' : '400' }}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Router() {
  const { route, tab } = useNav();
  const { ready, colors, isDark } = useStore();

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.primary }} />;

  let body;
  let showTabs = false;
  switch (route.name) {
    case 'reader':
      body = <ReaderScreen key={`${route.source}-${route.id}`} route={route} />;
      break;
    case 'feelings':
      body = <FeelingsScreen />;
      break;
    case 'quiz':
      body = <QuizHomeScreen />;
      break;
    case 'quizPlay':
      body = <QuizPlayScreen level={route.level} />;
      break;
    default:
      showTabs = true;
      body =
        tab === 'home' ? <HomeScreen /> :
        tab === 'adhkar' ? <AdhkarListScreen /> :
        tab === 'tasbih' ? <TasbihScreen /> :
        tab === 'favorites' ? <FavoritesScreen /> :
        <SettingsScreen />;
  }

  const lightContent = showTabs && (tab === 'home' || tab === 'tasbih');
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={lightContent || isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>{body}</View>
      {showTabs ? <TabBar /> : null}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Amiri_400Regular, Amiri_700Bold });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#0F3D2E' }} />;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <NavigationProvider>
          <Router />
        </NavigationProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  tabbar: { flexDirection: ROW, borderTopWidth: 1, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', gap: 3, minHeight: 48, justifyContent: 'center' },
});
