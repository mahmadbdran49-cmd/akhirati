import { toArabicDigits } from './theme';

export const HIJRI_MONTHS = [
  'محرّم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوّال', 'ذو القعدة', 'ذو الحجة',
];

export const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export type Hijri = { day: number; month: number; year: number };

// التقويم الهجري الحسابي (الخوارزمية الكويتية). قد يختلف يوماً عن الرؤية،
// لذلك يمكن للمستخدم تعديله من الإعدادات.
export function toHijri(date: Date, offsetDays = 0): Hijri {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offsetDays);
  let day = d.getDate();
  let month = d.getMonth();
  let year = d.getFullYear();
  let m = month + 1;
  let y = year;
  if (m < 3) {
    y -= 1;
    m += 12;
  }
  let a = Math.floor(y / 100);
  let b = 2 - a + Math.floor(a / 4);
  if (y < 1583) b = 0;
  if (y === 1582) {
    if (m > 10) b = -10;
    if (m === 10) {
      b = 0;
      if (day > 4) b = -10;
    }
  }
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;
  const iyear = 10631 / 30;
  const epochastro = 1948084;
  const shift1 = 8.01 / 60;
  let z = jd - epochastro;
  const cyc = Math.floor(z / 10631);
  z = z - 10631 * cyc;
  const j = Math.floor((z - shift1) / iyear);
  const iy = 30 * cyc + j;
  z = z - Math.floor(j * iyear + shift1);
  let im = Math.floor((z + 28.5001) / 29.5);
  if (im === 13) im = 12;
  const id = z - Math.floor(29.5001 * im - 29);
  return { day: id, month: im, year: iy };
}

export function hijriLabel(h: Hijri): string {
  return `${toArabicDigits(h.day)} ${HIJRI_MONTHS[h.month - 1]} ${toArabicDigits(h.year)} هـ`;
}

export type Occasion = { id: string; title: string; body: string; action?: { label: string; surah: number } };

// المناسبات التي يعرفها التطبيق ويغيّر محتواه بحسبها
export function occasionsFor(date: Date, h: Hijri): Occasion[] {
  const list: Occasion[] = [];
  const wd = date.getDay();
  if (wd === 5) {
    list.push({
      id: 'friday',
      title: 'جمعة مباركة',
      body: 'اقرأ سورة الكهف، وأكثِر من الصلاة على النبي ﷺ، وتحرَّ ساعة الإجابة آخر ساعة من العصر.',
      action: { label: 'الكهف', surah: 18 },
    });
  }
  if (wd === 4 && date.getHours() >= 18) {
    list.push({
      id: 'friday-eve',
      title: 'ليلة الجمعة',
      body: 'أكثِروا من الصلاة على النبي ﷺ ليلة الجمعة ويومها.',
      action: { label: 'الكهف', surah: 18 },
    });
  }
  if (h.month === 9) {
    list.push({
      id: 'ramadan',
      title: h.day >= 21 ? 'العشر الأواخر من رمضان' : 'رمضان كريم',
      body:
        h.day >= 21
          ? 'تحرَّ ليلة القدر، وأكثِر من: اللهم إنك عفوٌّ تحب العفو فاعفُ عني.'
          : 'شهر القرآن، اجعل لك ورداً يومياً من المصحف.',
    });
  }
  if (h.month === 12 && h.day <= 10) {
    list.push({
      id: 'dhulhijja',
      title: h.day === 9 ? 'يوم عرفة' : 'العشر من ذي الحجة',
      body:
        h.day === 9
          ? 'خير الدعاء دعاء يوم عرفة: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.'
          : 'أيام يحب الله فيها العمل الصالح، فأكثِر من التكبير والتهليل والتحميد.',
    });
  }
  if (h.month === 1 && (h.day === 9 || h.day === 10)) {
    list.push({ id: 'ashura', title: 'عاشوراء', body: 'صيام يوم عاشوراء يكفّر السنة التي قبله، ويُستحب صيام التاسع معه.' });
  }
  if (h.day >= 13 && h.day <= 15 && h.month !== 9) {
    list.push({ id: 'white', title: 'الأيام البيض', body: 'يُستحب صيام الأيام البيض: ١٣ و١٤ و١٥ من كل شهر هجري.' });
  }
  if ((wd === 0 || wd === 3) && list.length === 0) {
    list.push({ id: 'monthu', title: 'صيام الاثنين والخميس', body: 'غداً من الأيام التي يُستحب صيامها، تُعرض فيها الأعمال على الله.' });
  }
  return list;
}

// دعاء خاص بكل يوم من أيام الأسبوع
const DAY_DUAS: { text: string; source: string }[] = [
  { text: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', source: 'البقرة: ٢٠١' },
  { text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا', source: 'رواه ابن ماجه' },
  { text: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ', source: 'رواه الترمذي' },
  { text: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ، وَشُكْرِكَ، وَحُسْنِ عِبَادَتِكَ', source: 'رواه أبو داود والنسائي' },
  { text: 'رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي', source: 'طه: ٢٥–٢٦' },
  { text: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ', source: 'رواه البخاري ومسلم' },
  { text: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ زَوَالِ نِعْمَتِكَ، وَتَحَوُّلِ عَافِيَتِكَ، وَفُجَاءَةِ نِقْمَتِكَ، وَجَمِيعِ سَخَطِكَ', source: 'رواه مسلم' },
];

export function duaForDay(date: Date): { title: string; text: string; source: string } {
  const wd = date.getDay();
  const d = DAY_DUAS[wd];
  return { title: `دعاء يوم ${WEEKDAYS[wd]}`, ...d };
}
