import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import { dark, light, Palette, todayKey } from './theme';
import type { Level } from './data/quiz';

export type ThemeMode = 'system' | 'light' | 'dark';

export type Reminder = { on: boolean; hour: number; minute: number };

export type AppState = {
  themeMode: ThemeMode;
  fontScale: number;
  favorites: string[];
  doneDays: string[];
  tasbih: { day: string; today: number; total: number };
  quizBest: Record<Level, number>;
  reminders: { morning: Reminder; evening: Reminder; sleep: Reminder };
};

const DEFAULT_STATE: AppState = {
  themeMode: 'system',
  fontScale: 1,
  favorites: [],
  doneDays: [],
  tasbih: { day: todayKey(), today: 0, total: 0 },
  quizBest: { easy: 0, medium: 0, hard: 0 },
  reminders: {
    morning: { on: false, hour: 7, minute: 0 },
    evening: { on: false, hour: 17, minute: 0 },
    sleep: { on: false, hour: 22, minute: 0 },
  },
};

const STORAGE_KEY = 'akhirati.state.v1';

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
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const scheme = useColorScheme();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as Partial<AppState>;
          setState({
            ...DEFAULT_STATE,
            ...saved,
            reminders: { ...DEFAULT_STATE.reminders, ...(saved.reminders ?? {}) },
            quizBest: { ...DEFAULT_STATE.quizBest, ...(saved.quizBest ?? {}) },
            tasbih: { ...DEFAULT_STATE.tasbih, ...(saved.tasbih ?? {}) },
          });
        }
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
      return { ...s, tasbih: { day: key, today: today + n, total: s.tasbih.total + n } };
    });
  }, []);

  const isDark = state.themeMode === 'dark' || (state.themeMode === 'system' && scheme === 'dark');

  const value = useMemo<Ctx>(
    () => ({
      ready,
      state,
      colors: isDark ? dark : light,
      isDark,
      update,
      toggleFavorite,
      isFavorite: (id: string) => state.favorites.includes(id),
      markTodayDone,
      addTasbih,
    }),
    [ready, state, isDark, update, toggleFavorite, markTodayDone, addTasbih]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

// عدد الأيام المتتالية التي أنهى فيها المستخدم أذكاره
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
