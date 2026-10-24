export type Palette = {
  bg: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  onPrimary: string;
  onPrimaryMuted: string;
  gold: string;
  goldText: string;
  goldSoft: string;
  greenSoft: string;
  success: string;
  danger: string;
  dangerSoft: string;
  successSoft: string;
};

export const light: Palette = {
  bg: '#F6F3EA',
  card: '#FFFFFF',
  text: '#1B1B18',
  muted: '#5C5A52',
  border: '#E7E2D3',
  primary: '#0F3D2E',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#D9E4DE',
  gold: '#D4A853',
  goldText: '#8A6420',
  goldSoft: '#FBF1DC',
  greenSoft: '#E3ECE7',
  success: '#1F7A4D',
  successSoft: '#DDF1E5',
  danger: '#B3261E',
  dangerSoft: '#F9DEDC',
};

export const dark: Palette = {
  bg: '#0E1512',
  card: '#17211D',
  text: '#F1EEE4',
  muted: '#A9B2AC',
  border: '#26332D',
  primary: '#13503B',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#CFE0D7',
  gold: '#D4A853',
  goldText: '#E2BE73',
  goldSoft: '#2E2715',
  greenSoft: '#1D2E27',
  success: '#5BC48B',
  successSoft: '#173326',
  danger: '#F2B8B5',
  dangerSoft: '#3B1D1B',
};

export const QURAN_FONT = 'Amiri_400Regular';
export const QURAN_FONT_BOLD = 'Amiri_700Bold';

export function toArabicDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}

export function todayKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
