import { I18nManager } from 'react-native';

// التطبيق مكتوب للعربية. هذه القيم تضمن أن الترتيب من اليمين لليسار
// سواء كان الجهاز بوضع RTL أو لا (مثلاً داخل Expo Go بجهاز لغته إنجليزية).
export const IS_RTL = I18nManager.isRTL;
export const ROW = (IS_RTL ? 'row' : 'row-reverse') as 'row' | 'row-reverse';
// في وضع RTL تنعكس قيم textAlign، لذلك نحسب الاتجاه الصحيح
export const TEXT_START = (IS_RTL ? 'left' : 'right') as 'left' | 'right';
export const ALIGN_START = (IS_RTL ? 'flex-start' : 'flex-end') as 'flex-start' | 'flex-end';
export const ALIGN_END = (IS_RTL ? 'flex-end' : 'flex-start') as 'flex-start' | 'flex-end';
