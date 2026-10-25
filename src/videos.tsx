import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { Video, VIDEOS } from './data/videos';
import { fetchVideos, registerDevice } from './server';

const CACHE_KEY = 'akhirah.videos.v1';
type Ctx = { videos: Video[]; refresh: () => Promise<void> };
const VideosContext = createContext<Ctx>({ videos: VIDEOS, refresh: async () => {} });

// قائمة المقاطع: من السيرفر، مع نسخة محفوظة للعمل بدون إنترنت، والقائمة المدمجة كاحتياط أخير
export function VideosProvider({ children }: { children: ReactNode }) {
  const [videos, setVideos] = useState<Video[]>(VIDEOS);

  const refresh = useCallback(async () => {
    try {
      const rows = await fetchVideos();
      const list = rows.filter((r) => r.active).map((r) => ({ id: r.youtube_id, title: r.title, speaker: r.speaker }));
      setVideos(list.length ? list : VIDEOS);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(list)).catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        const list = raw ? (JSON.parse(raw) as Video[]) : null;
        if (list && list.length) setVideos(list);
      })
      .catch(() => {})
      .finally(() => {
        refresh();
        registerDevice().catch(() => {});
      });
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        refresh();
        registerDevice().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [refresh]);

  const value = useMemo(() => ({ videos, refresh }), [videos, refresh]);
  return <VideosContext.Provider value={value}>{children}</VideosContext.Provider>;
}

export function useVideos(): Ctx {
  return useContext(VideosContext);
}
