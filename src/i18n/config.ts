export const locales = ['ko', 'en', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ko';

export const localeNames: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  zh: '中文'
};

export const currencyByLocale: Record<Locale, string> = {
  ko: 'KRW',
  en: 'SGD', // 싱가폴 달러
  zh: 'SGD'  // 싱가폴은 중국어권도 SGD 사용
};

export const currencySymbols: Record<string, string> = {
  KRW: '₩',
  SGD: 'S$',
  USD: '$',
  CNY: '¥'
};





