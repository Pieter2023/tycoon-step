import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './translations/en.json';
import es from './translations/es.json';

export type Locale = 'en' | 'es';

type TranslationValue = string | Record<string, string>;

type Translations = Record<string, TranslationValue>;

const translations: Record<Locale, Translations> = {
  en,
  es
};

const DEFAULT_LOCALE: Locale = 'en';
const STORAGE_KEY = 'tycoon_locale';
let currentLocale: Locale = DEFAULT_LOCALE;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatCurrency: (value: number, opts?: Intl.NumberFormatOptions) => string;
  formatCurrencyCompact: (value: number) => string;
  formatNumber: (value: number) => string;
  formatPercent: (value: number, digits?: number) => string;
  formatDateTime: (timestampMs: number) => string;
};

export const I18nContext = createContext<I18nContextValue | null>(null);

const interpolate = (template: string, params?: Record<string, string | number>) => {
  if (!params) return template;
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template
  );
};

const resolveTranslation = (locale: Locale, key: string): TranslationValue | undefined => {
  return translations[locale]?.[key] ?? translations[DEFAULT_LOCALE]?.[key];
};

const translate = (locale: Locale, key: string, params?: Record<string, string | number>) => {
  const value = resolveTranslation(locale, key);
  if (!value) return key;
  if (typeof value === 'string') return interpolate(value, params);
  const count = typeof params?.count === 'number' ? params?.count : 0;
  const rule = new Intl.PluralRules(locale).select(count);
  const pluralValue = value[rule] ?? value.other ?? value.one ?? '';
  return interpolate(pluralValue, params);
};

const getStoredLocale = (): Locale => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch (e) {
    console.warn('Failed to read locale from storage:', e);
  }
  return DEFAULT_LOCALE;
};

export const getLocale = () => currentLocale;

export const formatCurrencyValue = (value: number, opts?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(currentLocale, { style: 'currency', currency: 'USD', ...opts }).format(value);

export const formatCurrencyCompactValue = (value: number) =>
  new Intl.NumberFormat(currentLocale, {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);

export const formatNumberValue = (value: number) =>
  new Intl.NumberFormat(currentLocale).format(value);

export const formatPercentValue = (value: number, digits: number = 1) =>
  new Intl.NumberFormat(currentLocale, { style: 'percent', maximumFractionDigits: digits }).format(value);

export const formatDateTimeValue = (timestampMs: number) =>
  new Intl.DateTimeFormat(currentLocale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestampMs));

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    currentLocale = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      console.warn('Failed to store locale:', e);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next;
    }
  }, []);

  useEffect(() => {
    currentLocale = locale;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale]
  );

  const formatCurrency = useCallback(
    (value: number, opts?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', ...opts }).format(value),
    [locale]
  );

  const formatCurrencyCompact = useCallback(
    (value: number) =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(value),
    [locale]
  );

  const formatNumber = useCallback(
    (value: number) => new Intl.NumberFormat(locale).format(value),
    [locale]
  );

  const formatPercent = useCallback(
    (value: number, digits: number = 1) =>
      new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: digits }).format(value),
    [locale]
  );

  const formatDateTime = useCallback(
    (timestampMs: number) =>
      new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestampMs)),
    [locale]
  );

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t,
    formatCurrency,
    formatCurrencyCompact,
    formatNumber,
    formatPercent,
    formatDateTime
  }), [locale, setLocale, t, formatCurrency, formatCurrencyCompact, formatNumber, formatPercent, formatDateTime]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
};
