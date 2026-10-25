import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { daysBetween, Palette, ThemeName, THEMES, todayKey } from './theme';
import type { Level } from './data/quiz';

export type { ThemeName } from './theme';
export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type AlertMode = 'sound' | 'silent' | 'off';
export type CalcMethod = 'Egyptian' | 'MuslimWorldLeague' | 'UmmAlQura' | 'Karachi' | 'Dubai' | 'Kuwait' | 'Qatar' | 'Turkey' | 'NorthAmerica';
export type Reminder = { on: boolean; hour: number; minute: number };

export type AppState = {
  theme: ThemeName;
  minimal: boolean;
  tree: { lastCare: string; waterings: number };
  tipSeen: boolean;
  videos: { watched: string[]; favorites: string[] };
  wirdMinutes: number;
  quranScale: number;
  adhkarScale: number;
  haptics: boolean;
  hijriOffset: number;
  reciter: string;
  favorites: string[];
  doneDays: string[];
  tasbih: { day: string; today: number; total: number };
  quiz: { best: Record<Level, number>; daily: { day: string; score: number; total: number } | null };
  lastRead: { surah: number; ayah: number } | null;
  bookmarks: { surah: number; ayah: number }[];
  location: { lat: number; lng: number; city: string } | null;
  prayer: {
    method: CalcMethod;
    hanafi: boolean;
    offsets: Record<PrayerKey, number>;
    alerts: Record<PrayerKey, AlertMode>;
  };
  reminders: { morning: Reminder; evening: Reminder; sleep: Reminder; kahf: Reminder };
};

// القدس افتراضياً حتى يسمح المستخدم بتحديد موقعه
export const DEFAULT_LOCATION = { lat: 31.7683, lng: 35.2137, city: 'القدس' };

const DEFAULT_STATE: AppState = {
  theme: 'main',
  minimal: false,
  tree: { lastCare: todayKey(), waterings: 0 },
  tipSeen: false,
  videos: { watched: [], favorites: [] },
  wirdMinutes: 10,
  quranScale: 1,
  adhkarScale: 1,
  haptics: true,
  hijriOffset: 0,
  reciter: 'Alafasy_128kbps',
  favorites: [],
  doneDays: [],
  tasbih: { day: todayKey(), today: 0, total: 0 },
  quiz: { best: { easy: 0, medium: 0, hard: 0 }, daily: null },
  lastRead: null,
  bookmarks: [],
  location: null,
  prayer: {
    method: 'Egyptian',
    hanafi: false,
    offsets: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    alerts: { fajr: 'sound', dhuhr: 'sound', asr: 'sound', maghrib: 'sound', isha: 'sound' },
  },
  reminders: {
    morning: { on: true, hour: 7, minute: 0 },
    evening: { on: true, hour: 16, minute: 30 },
    sleep: { on: false, hour: 22, minute: 0 },
    kahf: { on: true, hour: 10, minute: 0 },
  },
};

const STORAGE_KEY = 'akhirah.state.v2';

// حالة الشجرة حسب آخر عناية
export function treeDaysAway(lastCare: string): number {
  return Math.max(0, daysBetween(lastCare));
}

type Ctx = {
  ready: boolean;
  state: AppState;
  colors: Palette;
  isDark: boolean;
  update: (fn: (s: AppState) => AppState) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  markTodayDone: () => void;
  addTasbih: (n?: number) => void;
  waterTree: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

function merge(saved: Partial<AppState>): AppState {
  return {
    ...DEFAULT_STATE,
    ...saved,
    tasbih: { ...DEFAULT_STATE.tasbih, ...(saved.tasbih ?? {}) },
    quiz: { ...DEFAULT_STATE.quiz, ...(saved.quiz ?? {}), best: { ...DEFAULT_STATE.quiz.best, ...(saved.quiz?.best ?? {}) } },
    prayer: {
      ...DEFAULT_STATE.prayer,
      ...(saved.prayer ?? {}),
      offsets: { ...DEFAULT_STATE.prayer.offsets, ...(saved.prayer?.offsets ?? {}) },
      alerts: { ...DEFAULT_STATE.prayer.alerts, ...(saved.prayer?.alerts ?? {}) },
    },
    reminders: { ...DEFAULT_STATE.reminders, ...(saved.reminders ?? {}) },
    tree: { ...DEFAULT_STATE.tree, ...(saved.tree ?? {}) },
    videos: { ...DEFAULT_STATE.videos, ...(saved.videos ?? {}) },
    theme: saved.theme && saved.theme in THEMES ? saved.theme : DEFAULT_STATE.theme,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        let st = raw ? merge(JSON.parse(raw)) : DEFAULT_STATE;
        // فتح التطبيق يومياً يحافظ على الشجرة، أما الغياب أكثر من يوم فيجعلها تذبل حتى يسقيها بالذكر
        if (treeDaysAway(st.tree.lastCare) <= 1) st = { ...st, tree: { ...st.tree, lastCare: todayKey() } };
        setState(st);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }, 300);
  }, [state, ready]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);

  const toggleFavorite = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [id, ...s.favorites],
      })),
    []
  );

  const markTodayDone = useCallback(() => {
    const key = todayKey();
    setState((s) => (s.doneDays.includes(key) ? s : { ...s, doneDays: [...s.doneDays, key].slice(-400) }));
  }, []);

  const addTasbih = useCallback((n = 1) => {
    const key = todayKey();
    setState((s) => {
      const today = s.tasbih.day === key ? s.tasbih.today : 0;
      // كل ذكر يسقي الشجرة، وكل عشرة أذكار تُحسب سقية كاملة
      const drops = Math.floor((s.tasbih.total + n) / 10) - Math.floor(s.tasbih.total / 10);
      return {
        ...s,
        tasbih: { day: key, today: today + n, total: s.tasbih.total + n },
        tree: { lastCare: key, waterings: s.tree.waterings + drops },
      };
    });
  }, []);

  const waterTree = useCallback(() => {
    setState((s) => ({ ...s, tree: { lastCare: todayKey(), waterings: s.tree.waterings + 1 } }));
  }, []);

  const palette = THEMES[state.theme] ?? THEMES.main;
  const isDark = palette.dark;

  const value = useMemo<Ctx>(
    () => ({
      ready,
      state,
      colors: palette,
      isDark,
      update,
      toggleFavorite,
      isFavorite: (id: string) => state.favorites.includes(id),
      markTodayDone,
      addTasbih,
      waterTree,
    }),
    [ready, state, palette, isDark, update, toggleFavorite, markTodayDone, addTasbih, waterTree]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export function streakCount(doneDays: string[]): number {
  const set = new Set(doneDays);
  let n = 0;
  const d = new Date();
  if (!set.has(todayKey(d))) d.setDate(d.getDate() - 1);
  while (set.has(todayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
