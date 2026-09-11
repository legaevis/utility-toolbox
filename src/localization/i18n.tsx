import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { en, type LocaleShape } from './locales/en';
import { ru } from './locales/ru';
import type { AppLanguage } from '../storage/settings';

export const LOCALES: Record<AppLanguage, LocaleShape> = { en, ru };

/** Resolves "tools.case-converter.name" against a locale object. */
export function resolveKey(locale: LocaleShape, key: string): string | undefined {
  let node: unknown = locale;
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === 'string' ? node : undefined;
}

export type TFunction = (key: string, params?: Record<string, string | number>) => string;

interface I18nContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: TFunction;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLanguage,
  onLanguageChange,
  children,
}: {
  initialLanguage: AppLanguage;
  onLanguageChange?: (lang: AppLanguage) => void;
  children: ReactNode;
}) {
  const [language, setLanguageState] = useState<AppLanguage>(initialLanguage);

  const setLanguage = useCallback(
    (lang: AppLanguage) => {
      setLanguageState(lang);
      onLanguageChange?.(lang);
    },
    [onLanguageChange],
  );

  const t = useCallback<TFunction>(
    (key, params) => {
      // Fall back to English, then to the raw key — a missing translation
      // must never crash the UI.
      let text = resolveKey(LOCALES[language], key) ?? resolveKey(en, key) ?? key;
      if (params) {
        for (const [name, value] of Object.entries(params)) {
          text = text.replace(`{${name}}`, String(value));
        }
      }
      return text;
    },
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
