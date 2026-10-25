export type Palette = {
  dark: boolean;
  bg: string;
  bg2: string;
  card: string;
  cardAlt: string;
  border: string;
  borderStrong: string;
  text: string;
  muted: string;
  gold: string;
  goldText: string;
  goldSoft: string;
  // اللون المميّز (بطاقة الصلاة، الأزرار الرئيسية…)
  emerald: string;
  emeraldDeep: string;
  onEmerald: string;
  onEmeraldMuted: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  paper: string;
  paperInk: string;
  paperFrame: string;
  pattern: string;
  waves: [string, string, string];
};

// الرئيسي: أسود دافئ مع نحاسي وذهبي (معتمد)
export const main: Palette = {
  dark: true,
  bg: '#0E0A07',
  bg2: '#1A110B',
  card: '#17100B',
  cardAlt: '#22160E',
  border: 'rgba(217,181,106,0.28)',
  borderStrong: 'rgba(232,200,120,0.6)',
  text: '#F4E9D2',
  muted: '#BCA684',
  gold: '#D4A853',
  goldText: '#E8C878',
  goldSoft: 'rgba(212,168,83,0.14)',
  emerald: '#8A4A26',
  emeraldDeep: '#5A2E16',
  onEmerald: '#FFFFFF',
  onEmeraldMuted: '#F1D9C4',
  success: '#7FD3A2',
  successSoft: 'rgba(127,211,162,0.13)',
  danger: '#F2A7A0',
  dangerSoft: 'rgba(242,167,160,0.13)',
  paper: '#FBF5E8',
  paperInk: '#2A1A10',
  paperFrame: '#B8893A',
  pattern: '#D4A853',
  waves: ['#8A4A26', '#3A1E0F', '#0E0A07'],
};

// الملكي: بني داكن وذهبي وأخضر زمردي
export const royal: Palette = {
  dark: true,
  bg: '#160E09',
  bg2: '#22160E',
  card: '#1F150E',
  cardAlt: '#2B1A10',
  border: 'rgba(201,164,92,0.30)',
  borderStrong: 'rgba(227,196,126,0.6)',
  text: '#F2E6CC',
  muted: '#B8A27A',
  gold: '#C9A45C',
  goldText: '#E3C47E',
  goldSoft: 'rgba(201,164,92,0.14)',
  emerald: '#145A45',
  emeraldDeep: '#0E3B2E',
  onEmerald: '#FFFFFF',
  onEmeraldMuted: '#CFE0D7',
  success: '#7FD3A2',
  successSoft: 'rgba(127,211,162,0.13)',
  danger: '#F2A7A0',
  dangerSoft: 'rgba(242,167,160,0.13)',
  paper: '#FBF5E8',
  paperInk: '#2A1A10',
  paperFrame: '#B8893A',
  pattern: '#C9A45C',
  waves: ['#145A45', '#0E3B2E', '#160E09'],
};

// الأسود: أسود فخم مع لمسات ذهبية
export const black: Palette = {
  dark: true,
  bg: '#050505',
  bg2: '#111111',
  card: '#141414',
  cardAlt: '#1C1C1C',
  border: 'rgba(217,181,106,0.24)',
  borderStrong: 'rgba(217,181,106,0.55)',
  text: '#F2F2F2',
  muted: '#A6A6A6',
  gold: '#D9B56A',
  goldText: '#E5C77F',
  goldSoft: 'rgba(217,181,106,0.12)',
  emerald: '#262626',
  emeraldDeep: '#1A1A1A',
  onEmerald: '#FFFFFF',
  onEmeraldMuted: '#C8C8C8',
  success: '#7FD3A2',
  successSoft: 'rgba(127,211,162,0.12)',
  danger: '#F2A7A0',
  dangerSoft: 'rgba(242,167,160,0.12)',
  paper: '#F7F3EA',
  paperInk: '#1A1A1A',
  paperFrame: '#B8893A',
  pattern: '#D9B56A',
  waves: ['#2A2A2A', '#161616', '#050505'],
};

// السماوي: أزرق سماوي هادئ
export const sky: Palette = {
  dark: false,
  bg: '#EEF7FC',
  bg2: '#D9EDF8',
  card: '#FFFFFF',
  cardAlt: '#E6F2FA',
  border: 'rgba(62,142,192,0.25)',
  borderStrong: 'rgba(62,142,192,0.5)',
  text: '#123247',
  muted: '#4B6F86',
  gold: '#A87B2E',
  goldText: '#86601F',
  goldSoft: 'rgba(168,123,46,0.12)',
  emerald: '#2F7FB0',
  emeraldDeep: '#1F5E85',
  onEmerald: '#FFFFFF',
  onEmeraldMuted: '#D9EDF8',
  success: '#1B6E45',
  successSoft: '#DDF1E5',
  danger: '#A8241C',
  dangerSoft: '#F9DEDC',
  paper: '#FFFFFF',
  paperInk: '#123247',
  paperFrame: '#A87B2E',
  pattern: '#3E8EC0',
  waves: ['#7DB9DD', '#B7DAEE', '#EEF7FC'],
};

export const THEMES = { main, royal, black, sky };
export type ThemeName = keyof typeof THEMES;
export const THEME_LABELS: Record<ThemeName, string> = { main: 'الرئيسي', royal: 'الملكي', black: 'الأسود', sky: 'السماوي' };

export const FONTS = {
  logo: 'ArefRuqaa_700Bold',
  dhikr: 'Amiri_400Regular',
  dhikrBold: 'Amiri_700Bold',
  quran: 'UthmanicHafs',
};

export function toArabicDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}

export function todayKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function daysBetween(fromKey: string, to = new Date()): number {
  const [y, m, d] = fromKey.split('-').map(Number);
  const a = new Date(y, m - 1, d).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / 86400000);
}

export function fmtTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const suffix = h < 12 ? 'ص' : 'م';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${toArabicDigits(hh)}:${toArabicDigits(String(m).padStart(2, '0'))} ${suffix}`;
}

export function fmtCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((x) => String(x).padStart(2, '0')).join(':');
}
