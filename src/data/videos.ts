// مقاطع الدكتور ياسر الحزيمي التي اختارتها عبير.
// تُعرض داخل التطبيق بمشغّل يوتيوب الرسمي فقط (بدون تنزيل)، مع ذكر المصدر.
import raw from '../../content/videos.json';
import { todayKey } from '../theme';

export type Video = { id: string; title: string; speaker: string };

export const VIDEOS: Video[] = raw.videos.map((v) => ({ id: v.youtubeId, title: v.title, speaker: v.speaker }));

export const VIDEO_CREDIT = 'من قناة الدكتور ياسر الحزيمي على يوتيوب';

export function videoThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function videoEmbed(id: string): string {
  return `https://www.youtube.com/embed/${id}?playsinline=1&rel=0&modestbranding=1`;
}

// مقطع اليوم يتبدّل يومياً
export function videoOfTheDay(date = new Date()): Video {
  const k = todayKey(date).split('-').map(Number);
  const n = Math.floor(Date.UTC(k[0], k[1] - 1, k[2]) / 86400000);
  return VIDEOS[n % VIDEOS.length];
}

export function findVideo(id: string): Video | undefined {
  return VIDEOS.find((v) => v.id === id);
}
