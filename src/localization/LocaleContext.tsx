import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatTime,
  resolveLocale,
  type RegionId,
} from './localeService';

/**
 * React access point for LocaleService. The region comes from Settings
 * (Region & Format); individual tools may override it locally by calling
 * localeService functions with their own locale — but the default for
 * every tool is this context.
 */

export interface LocaleContextValue {
  region: RegionId;
  customLocale: string;
  /** Resolved BCP-47 tag, e.g. "ru-RU". */
  locale: string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatTime: (ts: number, timeZone?: string) => string;
  formatDate: (ts: number, timeZone?: string) => string;
  formatDateTime: (ts: number, timeZone?: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  region,
  customLocale,
  children,
}: {
  region: RegionId;
  customLocale: string;
  children: ReactNode;
}) {
  const value = useMemo<LocaleContextValue>(() => {
    const locale = resolveLocale(region, customLocale);
    return {
      region,
      customLocale,
      locale,
      formatNumber: (v, o) => formatNumber(v, locale, o),
      formatTime: (ts, tz) => formatTime(ts, locale, tz),
      formatDate: (ts, tz) => formatDate(ts, locale, tz),
      formatDateTime: (ts, tz) => formatDateTime(ts, locale, tz),
    };
  }, [region, customLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside LocaleProvider');
  return ctx;
}
