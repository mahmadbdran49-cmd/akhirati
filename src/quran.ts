// نص القرآن الكريم بالرسم العثماني برواية حفص عن عاصم
// النص الرسمي لمجمع الملك فهد لطباعة المصحف الشريف (KFGQPC Uthmanic Hafs v22)
// ويُعرض بخط مجمع الملك فهد نفسه حتى تظهر كل علامات الضبط صحيحة
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

// ───────── الورد الذكي ─────────
// المصحف ٦٠٤ صفحة، ونقدّر قراءة الصفحة بدقيقتين تقريباً
export const MINUTES_PER_PAGE = 2;
let charsPerPage: number | null = null;
function perPage(): number {
  if (charsPerPage === null) {
    let total = 0;
    for (const s of data()) for (const v of s[3]) total += v.length;
    charsPerPage = total / 604;
  }
  return charsPerPage;
}

export type Pos = { surah: number; ayah: number };

// يحسب نهاية الورد بدءاً من موضع القراءة حسب الدقائق المتاحة
export function wirdEnd(start: Pos, minutes: number): Pos & { pages: number } {
  const pages = Math.max(0.5, minutes / MINUTES_PER_PAGE);
  let budget = pages * perPage();
  let s = start.surah;
  let a = start.ayah;
  const d = data();
  while (true) {
    budget -= d[s - 1][3][a - 1].length;
    if (budget <= 0) break;
    if (a < d[s - 1][3].length) a++;
    else if (s < 114) {
      s++;
      a = 1;
    } else break;
  }
  return { surah: s, ayah: a, pages };
}

// الموضع التالي بعد آية (للبدء بعد آخر قراءة)
export function nextPos(p: Pos): Pos {
  const d = data();
  if (p.ayah < d[p.surah - 1][3].length) return { surah: p.surah, ayah: p.ayah + 1 };
  if (p.surah < 114) return { surah: p.surah + 1, ayah: 1 };
  return { surah: 1, ayah: 1 };
}

// إزالة التشكيل وتوحيد الحروف للبحث
export function normalizeArabic(x: string): string {
  return x
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

let normCache: string[][] | null = null;
export function searchQuran(q: string, limit = 30): (Pos & { text: string; name: string })[] {
  const nq = normalizeArabic(q);
  if (nq.length < 2) return [];
  if (!normCache) normCache = data().map((s) => s[3].map(normalizeArabic));
  const out: (Pos & { text: string; name: string })[] = [];
  const d = data();
  for (let i = 0; i < normCache.length && out.length < limit; i++) {
    const vs = normCache[i];
    for (let j = 0; j < vs.length && out.length < limit; j++) {
      if (vs[j].includes(nq)) out.push({ surah: i + 1, ayah: j + 1, text: d[i][3][j], name: d[i][0] });
    }
  }
  return out;
}
