import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// سيرفر التطبيق (Supabase). المفتاح هنا مفتاح عام مخصّص للتطبيقات، والحماية في السيرفر نفسه:
// المستخدم العادي يقرأ المقاطع فقط، وكل عمليات الإدارة تحتاج اسم المستخدم وكلمة السر (محفوظة مشفّرة على السيرفر فقط).
const URL = 'https://kxjftknhzlkblzmybeao.supabase.co';
const KEY = 'sb_publishable_G-Bf32--BAwEHj15Zf5oXA_48s3Xn2z';
const TIMEOUT = 10000;

export class ServerError extends Error {
  constructor(public code: 'offline' | 'locked' | 'unauthorized' | 'server', message?: string) {
    super(message ?? code);
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  let res: Response;
  try {
    res = await fetch(`${URL}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });
  } catch {
    throw new ServerError('offline');
  } finally {
    clearTimeout(t);
  }
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = String(body?.message ?? '');
    if (msg.includes('locked')) throw new ServerError('locked');
    throw new ServerError('server', msg);
  }
  return body as T;
}

function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  return call<T>(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) });
}

// ───────── المقاطع ─────────
export type ServerVideo = { id: string; youtube_id: string; title: string; speaker: string; sort: number; active: boolean };

export function fetchVideos(): Promise<ServerVideo[]> {
  return call<ServerVideo[]>('/rest/v1/videos?select=id,youtube_id,title,speaker,sort,active&order=sort.asc,created_at.asc');
}

// ───────── عدّاد المستخدمين (معرّف عشوائي فقط، بدون أي معلومات شخصية) ─────────
const DEVICE_KEY = 'akhirah.device.v1';
function uuid4(): string {
  const h = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) s += '-';
    else if (i === 14) s += '4';
    else if (i === 19) s += h[8 + ((Math.random() * 4) | 0)];
    else s += h[(Math.random() * 16) | 0];
  }
  return s;
}

export async function registerDevice(): Promise<void> {
  if (Platform.OS === 'web') return;
  let id = await AsyncStorage.getItem(DEVICE_KEY).catch(() => null);
  if (!id) {
    id = uuid4();
    await AsyncStorage.setItem(DEVICE_KEY, id).catch(() => {});
  }
  await rpc('register_device', { p_id: id, p_platform: Platform.OS, p_version: Constants.expoConfig?.version ?? null });
}

// ───────── الإدارة ─────────
export type Creds = { user: string; pass: string };
export type Stats = { total: number; today: number; week: number; month: number; new_week: number; android: number; ios: number };

export async function adminLogin(c: Creds): Promise<boolean> {
  return rpc<boolean>('admin_login', { p_user: c.user, p_pass: c.pass });
}

export async function adminStats(c: Creds): Promise<Stats> {
  const r = await rpc<Stats & { error?: string }>('admin_stats', { p_user: c.user, p_pass: c.pass });
  if (r?.error) throw new ServerError('unauthorized');
  return r;
}

export function adminListVideos(c: Creds): Promise<ServerVideo[]> {
  return rpc<ServerVideo[]>('admin_list_videos', { p_user: c.user, p_pass: c.pass });
}

export async function adminAddVideo(c: Creds, youtubeId: string, title: string, speaker: string): Promise<ServerVideo> {
  const r = await rpc<ServerVideo | null>('admin_add_video', { p_user: c.user, p_pass: c.pass, p_youtube_id: youtubeId, p_title: title, p_speaker: speaker });
  if (!r || !r.id) throw new ServerError('unauthorized');
  return r;
}

export async function adminSetActive(c: Creds, id: string, active: boolean): Promise<void> {
  const ok = await rpc<boolean>('admin_set_video_active', { p_user: c.user, p_pass: c.pass, p_id: id, p_active: active });
  if (!ok) throw new ServerError('unauthorized');
}

export async function adminDeleteVideo(c: Creds, id: string): Promise<void> {
  const ok = await rpc<boolean>('admin_delete_video', { p_user: c.user, p_pass: c.pass, p_id: id });
  if (!ok) throw new ServerError('unauthorized');
}

// يستخرج معرّف المقطع من أي رابط يوتيوب (عادي، مختصر، شورتس، أو المعرّف نفسه)
export function parseYoutubeId(input: string): string | null {
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
