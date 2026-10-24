// نص القرآن الكريم بالرسم العثماني (حفص)، من مشروع quran-json
// المصدر: موسوعة القرآن الكريم quranenc.com — الرخصة CC BY-SA 4.0
type RawSurah = [name: string, translit: string, medinan: 0 | 1, verses: string[]];

let cache: RawSurah[] | null = null;
function data(): RawSurah[] {
  if (!cache) cache = require('./data/quran.json') as RawSurah[];
  return cache;
}

export type SurahMeta = { n: number; name: string; translit: string; medinan: boolean; count: number };

export function surahList(): SurahMeta[] {
  return data().map((s, i) => ({ n: i + 1, name: s[0], translit: s[1], medinan: s[2] === 1, count: s[3].length }));
}

export function surah(n: number): SurahMeta & { verses: string[] } {
  const s = data()[n - 1];
  return { n, name: s[0], translit: s[1], medinan: s[2] === 1, count: s[3].length, verses: s[3] };
}

export function ayahText(s: number, a: number): string {
  return data()[s - 1]?.[3][a - 1] ?? '';
}

export const RECITERS: { id: string; name: string }[] = [
  { id: 'Alafasy_128kbps', name: 'مشاري راشد العفاسي' },
  { id: 'Abdul_Basit_Murattal_192kbps', name: 'عبد الباسط عبد الصمد (مرتّل)' },
  { id: 'Husary_128kbps', name: 'محمود خليل الحصري' },
  { id: 'Minshawy_Murattal_128kbps', name: 'محمد صديق المنشاوي (مرتّل)' },
  { id: 'Maher_AlMuaiqly_64kbps', name: 'ماهر المعيقلي' },
  { id: 'Saood_ash-Shuraym_128kbps', name: 'سعود الشريم' },
];

export function reciterName(id: string): string {
  return RECITERS.find((r) => r.id === id)?.name ?? RECITERS[0].name;
}

// ملفات التلاوة لكل آية من موقع everyayah.com (تحتاج إنترنت)
export function ayahAudioUrl(reciter: string, s: number, a: number): string {
  const p = (x: number) => String(x).padStart(3, '0');
  return `https://everyayah.com/data/${reciter}/${p(s)}${p(a)}.mp3`;
}
