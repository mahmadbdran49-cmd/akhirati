export type Palette = {
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
};

// الثيم الملكي: بني داكن وذهبي وأخضر زمردي
export const royal: Palette = {
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
};

// الثيم العاجي: فاتح بلمسات ذهبية
export const ivory: Palette = {
  bg: '#F5EEDF',
  bg2: '#EADFC6',
  card: '#FFFBF2',
  cardAlt: '#F1E7D2',
  border: 'rgba(138,100,32,0.24)',
  borderStrong: 'rgba(138,100,32,0.5)',
  text: '#2A1A10',
  muted: '#6B5434',
  gold: '#A87B2E',
  goldText: '#7E5A1C',
  goldSoft: 'rgba(168,123,46,0.12)',
  emerald: '#145A45',
  emeraldDeep: '#0E3B2E',
  onEmerald: '#FFFFFF',
  onEmeraldMuted: '#CFE0D7',
  success: '#1B6E45',
  successSoft: '#DDF1E5',
  danger: '#A8241C',
  dangerSoft: '#F9DEDC',
  paper: '#FFF9EC',
  paperInk: '#2A1A10',
  paperFrame: '#A87B2E',
  pattern: '#A87B2E',
};

export const FONTS = {
  logo: 'ArefRuqaa_700Bold',
  dhikr: 'Amiri_400Regular',
  dhikrBold: 'Amiri_700Bold',
  quran: 'AmiriQuran_400Regular',
};

export function toArabicDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}

export function todayKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
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
