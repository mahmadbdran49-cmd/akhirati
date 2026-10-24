import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BackHandler } from 'react-native';

export type Tab = 'home' | 'adhkar' | 'tasbih' | 'favorites' | 'settings';

export type Route =
  | { name: 'tab'; tab: Tab }
  | { name: 'reader'; source: 'category' | 'feeling' | 'favorites'; id: string; start?: number }
  | { name: 'feelings' }
  | { name: 'quiz' }
  | { name: 'quizPlay'; level: 'easy' | 'medium' | 'hard' };

type Nav = {
  route: Route;
  tab: Tab;
  push: (r: Route) => void;
  back: () => void;
  setTab: (t: Tab) => void;
};

const NavContext = createContext<Nav | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [tab, setTabState] = useState<Tab>('home');
  const [stack, setStack] = useState<Route[]>([]);

  const push = useCallback((r: Route) => setStack((s) => [...s, r]), []);
  const back = useCallback(() => setStack((s) => s.slice(0, -1)), []);
  const setTab = useCallback((t: Tab) => {
    setStack([]);
    setTabState(t);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 0) {
        back();
        return true;
      }
      if (tab !== 'home') {
        setTabState('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, tab, back]);

  const route: Route = stack.length ? stack[stack.length - 1] : { name: 'tab', tab };

  const value = useMemo(() => ({ route, tab, push, back, setTab }), [route, tab, push, back, setTab]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): Nav {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used inside NavigationProvider');
  return ctx;
}
